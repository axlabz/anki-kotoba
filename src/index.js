const { toHiragana } = require('wanakana')
const fetch = require('node-fetch')
const domino = require('domino')
const fs = require('fs')

const kanji = require('./kanji')
const tag = require('./tag')
const { initAnki, addNote, queryAnki } = require('./anki')

/**
 * Tag added to new entries by Yomichan.
 */
const TAG_YOMICHAN_NEW = 'yomichan-new'

/**
 * Yomichan tag to ignore from notes.
 */
const TAG_YOMICHAN = 'yomichan'

/**
 * The main deck to which vocabulary notes will be generated.
 */
const MAIN_DECK = 'Japanese::Vocabulary'

/**
 * The deck containing the Core 6K entries. We use those mainly for the audio
 * and sample sentences.
 */
const CORE_DECK = 'Data::Core 6K'

/**
 * The deck containing the Yomichan entries. Those are used as the master to
 * add new entries to the main vocabulary deck.
 */
const YOMICHAN_DECK = 'Data::Yomichan'

/**
 * Tags to filter out.
 */
const DICT_TAGS = /JMnedict|JMdict|KireiCake/i

// Helper to dump JSON to the console.
const json = (data) => console.log(JSON.stringify(data, null, '    '))

// Runs the asynchronous main.
main().catch((err) => console.error(err))

/**
 * Main function for this script.
 */
async function main() {
	await initAnki(MAIN_DECK)

	// Write the radical index HTML files to the media folder.
	const base64 = (txt) => Buffer.from(txt).toString('base64')
	const radicalsHTML = fs.readFileSync('./radicals.html').toString().replace('src/radicals.js', '_radicals-index.js')
	const radicalsJS = fs.readFileSync('./src/radicals.js')
	await queryAnki('storeMediaFile', {
		filename: '_radicals-index.html',
		data: base64(radicalsHTML),
	})
	await queryAnki('storeMediaFile', {
		filename: '_radicals-index.js',
		data: base64(radicalsJS),
	})

	const list = await listNewNotes()
	for (const it of list) {
		const ok = await addNote(MAIN_DECK, it)
		if (ok) {
			await queryAnki('removeTags', {
				notes: [it.yomichan_id],
				tags: TAG_YOMICHAN_NEW,
			})
		}
	}
}

/**
 * Returns a list of new notes to add to the main Anki deck. This function
 * will query new Yomichan entries in Anki and compile their data alongside
 * fields from the Core 6K deck and kanji data.
 */
async function listNewNotes() {
	const output = []
	const newEntries = await listYomichanEntries({ onlyNew: true })
	for (const it of newEntries) {
		const entry = {
			key: it.key, // Plain furigana, we use this as key for its uniqueness.
			expression: it.word, // Entry expression.
			reading: it.read, // Entry reading.
			furigana: it.furigana_html, // Entry with furigana (HTML).
			glossary: it.text, // Vocabulary in english (HTML).
			frequency: it.frequency, // Frequency (number of usages in corpus text).
			audio: '',

			note_tags: it.note_tags, // Additional note tags in Anki

			kanji: ((kanji) => {
				const output = kanji.map((k) => {
					return []
						.concat(
							[
								`<span>\n`,
								`    <em data-on="${k.on.join(',')}" data-kun="${k.kun.join(',')}" title="${k.on
									.concat(k.kun)
									.join(' ')}">${k.kanji}</em>\n`,
								`    <ul>`,
							],
							k.meanings.map((it) => `<li>${it}</li>`),
							[`</ul>\n`, `</span>`],
						)
						.join('')
				})
				return output.join('\n')
			})(it.kanji),

			pitch_accents: it.pitch_accents,
			pitch_accent_graphs: it.pitch_accent_graphs,
			pitch_accent_positions: it.pitch_accent_positions,

			yomichan_id: it.id, // ID of the source Yomichan note.
			yomichan_audio: it.audio, // Audio from Yomichan.
			yomichan_glossary: it.glossary, // Original glossary (for reference and comparison).
			yomichan_sentence: it.sentence, // Parsed sentence from Yomichan.
		}

		// Try to load additional data from Core 6K
		const [coreWord] = await listCoreEntry({ word: entry.expression, reading: entry.reading })
		const [coreRead] = await listCoreEntry({ word: entry.reading, reading: entry.reading })
		const core = coreWord || coreRead
		if (core) {
			entry.core_id = core.id
			entry.core_index = core.core
			entry.core_order = core.index
			entry.core_audio = core.audio
			entry.example_main = core.sentence_main
			entry.example_text = core.sentence_text
			entry.example_read = renderFurigana(core.sentence_read)
			entry.example_audio = core.sentence_audio
			entry.example_image = core.sentence_image
			entry.core_sentence_read = core.sentence_read
		}

		entry.audio = entry.core_audio || entry.yomichan_audio
		entry.audio_alt = entry.core_audio ? entry.yomichan_audio : ''

		output.push(entry)
	}
	return output
}

/**
 * List Yomichan entries from Anki.
 */
async function listYomichanEntries({ word, reading, onlyNew }) {
	const keywords = []
	word && keywords.push(word)
	reading && keywords.push(reading)

	const tags = []
	onlyNew && tags.push(TAG_YOMICHAN_NEW)

	const ls = await queryNotes({ deck: YOMICHAN_DECK, keywords, tags })

	const pitchValue = (v) => (v.toLowerCase() == 'no pitch accent data' ? '' : v)
	const output = ls.map((it) => ({
		id: it.noteId,
		key: it.fields['furigana-plain'].value,
		word: it.fields['expression'].value,
		read: it.fields['reading'].value || '',
		text: parseGlossary(it.fields['glossary'].value),
		tags: it.fields['tags'].value
			.split(/\s*,\s*/)
			.filter((x) => !DICT_TAGS.test(x))
			.join(','),
		furigana_text: it.fields['furigana-plain'].value,
		furigana_html: it.fields['furigana'].value,

		note_tags: (it.tags || []).filter((x) => x != TAG_YOMICHAN && x != TAG_YOMICHAN_NEW),

		audio: it.fields['audio'].value,

		kanji: kanji.list(it.fields['expression'].value),

		// Yomichan sometimes parses random text from around an entry as the
		// sentence, so we try to filter those out.
		sentence: it.fields['sentence'].value
			.replace(/[\u{0021}-\u{00FF}]/gu, '')
			.replace(/^\s+|\s+$/g, '')
			.replace(/\s\s+/, ' '),
		frequency: parseFrequency(it.fields['frequencies'].value),

		// Keep a copy of the original glossary for reference.
		glossary: it.fields['glossary'].value,

		pitch_accents: pitchValue(it.fields['pitch-accents'].value),
		pitch_accent_graphs: pitchValue(it.fields['pitch-accent-graphs'].value),
		pitch_accent_positions: pitchValue(it.fields['pitch-accent-positions'].value),
	}))

	return output.filter((it) => {
		if (word && it.word != word) {
			return false
		}
		if (reading && it.read != reading) {
			return false
		}
		return true
	})

	/** Parse the glossary of an Yomichan entry. */
	function parseGlossary(glossary) {
		const body = dom(glossary)

		// Parse the content of an <i> tag containing a tag listing.
		const parseTags = (txt) =>
			txt
				.trim()
				.replace(/^\s*\(|\)\s*$/g, '')
				.split(/\s*,\s*/)
				.filter((x) => !DICT_TAGS.test(x))

		// Parse a DOM node and extract the raw definition data.
		const parseNode = (el) => {
			switch (el.tagName) {
				case 'UL':
				case 'OL':
					return Array.from(el.children).map(parseNode)
				case 'I':
					return { tags: parseTags(el.textContent) }
				default:
					if (el.tagName) {
						return Array.from(el.childNodes).map(parseNode)
					} else {
						return { text: el.textContent }
					}
			}
		}

		// Merges the raw definition data into a cohesive and compact format.
		const mergeNode = (parent) => {
			// leaf node
			if (!Array.isArray(parent)) {
				const txt = (parent.text || '').trim()
				if (txt || (parent.tags && parent.tags.length)) {
					return { tags: parent.tags || [], text: txt ? [txt] : [], list: [] }
				}
				return null
			}

			// recursively merge nodes
			const main = parent.map(mergeNode).filter((x) => !!x)
			if (parent.length == 0) {
				return null
			} else if (parent.length == 1) {
				return main[0]
			}

			// merge text and tags, recursive nodes are added to `list`
			const list = []
			const tags = []
			const text = []
			for (const node of main) {
				if (node.tags.length && node.text.length) {
					list.push(node)
				} else {
					for (const tag of node.tags) {
						if (tags.indexOf(tag) < 0) {
							tags.push(tag)
						}
					}
					for (const txt of node.text) {
						if (txt && text.indexOf(txt) < 0) {
							text.push(txt)
						}
					}
				}
			}

			// Add all tags and text as an additional node in list so that we
			// can merge everything.
			if (text.length) {
				list.unshift({ tags, text })
			}

			const subset = (a, b) => a.length && a.every((x) => b.indexOf(x) >= 0)
			const same = (a, b) => subset(a, b) || subset(b, a)
			const merge = (a, b) => b.forEach((x) => a.indexOf(x) < 0 && a.push(x))
			const can_merge = (a, b) => {
				if (a.tags.length + b.tags.length == 0 || same(a.tags, b.tags)) {
					return true
				}
				return same(a.text, b.text)
			}

			// Try to merge all nodes in the list
			for (let src = list.length - 1; src > 0; src--) {
				for (let dst = src - 1; dst >= 0; dst--) {
					if (can_merge(list[src], list[dst])) {
						merge(list[dst].tags, list[src].tags)
						merge(list[dst].text, list[src].text)
						list.splice(src, 1)
						break
					}
				}
			}

			switch (list.length) {
				case 0:
					return null
				case 1:
					return list[0]
				default:
					return { tags: [], text: list }
			}
		}

		const merged = mergeNode(parseNode(body))

		const renderNode = (node, first) => {
			const out = []

			const tagList = [...node.tags]
			tagList.sort((a, b) => {
				const tagA = tag(a)
				const tagB = tag(b)
				if (tagA.order != tagB.order) {
					return tagA.order - tagB.order
				} else {
					return tagA.name.localeCompare(tagB.name)
				}
			})

			const tags = () =>
				node.tags.length &&
				out.push(
					`<em class='tags'>(${tagList
						.map((name) => {
							const tagInfo = tag(name)
							if (tagInfo.description) {
								return `<span title="${tagInfo.description}">${tagInfo.name}</span>`
							}
							return tagInfo.name
						})
						.join(', ')})</em>`,
				)
			if (node.text.every((x) => typeof x == 'string' && x.length < 20)) {
				out.push(node.text.join(', '))
				out.push(' ')
				tags()
			} else {
				const tag = first ? 'ol' : 'ul'
				out.push(`<${tag}>`)
				node.text.forEach((x, i) => {
					out.push('<li>')
					if (typeof x == 'string') {
						out.push(x)
					} else {
						out.push(renderNode(x))
					}
					if (i == 0) {
						tags()
					}
					out.push('</li>')
				})
				out.push(`</${tag}>`)
			}
			return out.join('')
		}

		return renderNode(merged, true)
	}

	/** Parse the frequency of an Yomichan entry. */
	function parseFrequency(frequency) {
		const el = dom(frequency)
		const m = /Corpus:\s*(\d+)/gi.exec(el.textContent)
		if (m && m.length) {
			return m[1]
		}
		return ''
	}
}

/**
 * Get an entry from the core deck.
 */
async function listCoreEntry({ word, reading }) {
	if (!word) {
		return []
	}
	const ls = await queryNotes({ deck: CORE_DECK, keywords: [word] })
	const output = ls.map((it) => ({
		id: it.noteId,
		word: it.fields['Vocabulary-Kanji'].value,
		read: it.fields['Vocabulary-Kana'].value,
		text: it.fields['Vocabulary-English'].value,
		core: it.fields['Core-Index'].value,
		index: it.fields['Optimized-Voc-Index'].value,
		audio: it.fields['Vocabulary-Audio'].value,
		furigana: it.fields['Vocabulary-Furigana'].value,
		sentence_main: it.fields['Expression'].value,
		sentence_read: it.fields['Reading'].value,
		sentence_text: it.fields['Sentence-English'].value,
		sentence_audio: it.fields['Sentence-Audio'].value,
		sentence_image: it.fields['Sentence-Image'].value,
		caution: it.fields['Caution'].value,
	}))
	return output.filter((it) => it.word == word && (!reading || it.read == reading))
}

/**
 * Query Anki notes by deck/tag and keywords.
 */
async function queryNotes({ deck, tags, keywords, predicates }) {
	const esc = (x) => x.replace(/[_*]/g, (x) => '\\' + x)
	const query = []
	deck && query.push(`"deck:${esc(deck)}"`)
	tags && (Array.isArray(tags) ? tags : [tags]).forEach((tag) => query.push(`"tag:${esc(tag)}"`))
	query.push(...(keywords || []).map((x) => `"${esc(x)}"`))
	query.push(...(predicates || []))

	const notes = await queryAnki('findNotes', { query: query.join(' ') })
	return await queryAnki('notesInfo', { notes })
}

/**
 * Query Jisho for a word definition.
 */
function queryJisho({ word, reading, exact }) {
	const hiraganaWord = toHiragana(word)
	const hiraganaRead = (reading && toHiragana(reading)) || ''
	const output = fetch(`https://jisho.org/api/v1/search/words?keyword=${word}`)
		.then((data) => data.json())
		.then(parseJisho)
		.then((list) =>
			// filter by exact reading if provided
			!reading ? list : list.filter((it) => it.read == reading || it.read == hiraganaRead),
		)
		.then((list) =>
			// filter by the exact word if specified
			!exact ? list : list.filter((it) => it.word == word || it.word == hiraganaWord),
		)
	return output
}

function parseJisho({ data }) {
	return data.flatMap((it) => {
		if (!it.attribution.jmdict) {
			return []
		}

		const jp = it.japanese.map((x) => ({
			word: x.word,
			read: x.reading || '',
		}))

		const en = it.senses
			.map((x) => ({
				text: x.english_definitions.join(', '),
				part: x.parts_of_speech.map(mapJishoTag).join(', '),
			}))
			.filter((x) => x.part != 'wikipedia')
		const out = {
			...jp.shift(),
			also: jp.map((x) => (x.read ? `${x.word} (${x.read})` : x.word)),
			text: en,
			jlpt: it.jlpt,
			common: !!it.is_common,
			related: it.see_also,
		}
		return [out]
	})
}

function mapJishoTag(tag) {
	const mapping = {
		'wikipedia definition': 'wikipedia',
		'usually written using kana alone': 'kana',
	}
	return mapping[tag.toLowerCase()] || tag.toLowerCase()
}

function renderFurigana(text) {
	const window = domino.createWindow(text)
	const document = window.document
	mapFurigana(document.body, document)
	return document.body.innerHTML
}

function mapFurigana(el, document) {
	if (el.tagName) {
		for (const it of el.childNodes) {
			mapFurigana(it, document)
		}
	} else {
		const STA = '<ruby>'
		const END = '</ruby>'
		const ruby = []
		let input = el.textContent
		let rubySta = 0
		let rubyEnd = 0
		while (input.length) {
			const spc = input.indexOf(' ') // spaces are used to break up sections
			const brk = input.indexOf('[') // brackets delimit the reading

			// push a literal (non-furigana) text to the output
			const lit = (txt) => {
				// is there a ruby tag open?
				if (rubySta > rubyEnd) {
					ruby.push(END) // if yes then close it
					rubyEnd++
				}
				if (txt) {
					ruby.push(txt) // push the literal text
				}
			}
			if (spc >= 0 && spc < brk) {
				lit(input.slice(0, spc))
				input = input.slice(spc + 1)
			} else if (brk >= 0) {
				const text = input.slice(0, brk) // main text block
				input = input.slice(brk + 1)
				const end = input.indexOf(']') // the end delimiter for the reading
				if (end >= 0) {
					const read = input.slice(0, end)
					input = input.slice(end + 1)
					// is there a ruby tag open?
					if (rubySta == rubyEnd) {
						ruby.push(STA) // if not then open it
						rubySta++
					}
					// push the text and its reading
					ruby.push(text, '<rt>', read, '</rt>')
				} else {
					lit(text + '[') // invalid markup, push the literal text
				}
			} else {
				// no delimiters, just push the entire text
				lit(input)
				input = ''
			}
		}
		// close any ruby left open
		if (rubySta > rubyEnd) {
			ruby.push(END)
			rubyEnd++
		}

		if (rubySta > 0) {
			// unless we have a single ruby tag, wrap everything in a span.
			if (rubySta > 1 || ruby[0] != STA || ruby[ruby.length - 1] != END) {
				if (el.parentNode.childNodes.length > 1) {
					ruby.unshift('<span>')
					ruby.push('</span>')
				}
			}
			// replace with the ruby
			if (el.parentNode.childNodes.length > 1) {
				const span = document.createElement('span')
				span.innerHTML = ruby.join('')
				el.replaceWith(span.children[0])
			} else {
				el.parentNode.innerHTML = ruby.join('')
			}
		}
	}
}

function dom(html) {
	const window = domino.createWindow(html)
	return window.document.body
}
