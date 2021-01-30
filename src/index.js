const { toHiragana } = require('wanakana')
const fetch = require('node-fetch')
const domino = require('domino')

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
	const core = await listCoreEntry({ word: '食べる' })
	json(core)

	const word = await listYomichanEntries({})
	json(word)

	const jisho = await queryWord({ word: 'gin' })
	json(jisho)
}

/**
 * List Yomichan entries from Anki.
 */
async function listYomichanEntries({ word, reading, onlyNew }) {
	const keywords = []
	word && keywords.push(word)
	reading && keywords.push(reading)

	const tags = []
	onlyNew && tags.push('yomichan-new')

	const ls = await queryNotes({ deck: YOMICHAN_DECK, keywords, tags })
	const output = ls.map((it) => ({
		key: it.fields['furigana-plain'].value,
		word: it.fields['expression'].value,
		read: it.fields['reading'].value,
		text: parseGlossary(it.fields['glossary'].value),
		tags: it.fields['tags'].value
			.split(/\s*,\s*/)
			.filter((x) => !DICT_TAGS.test(x))
			.join(','),
		furigana_text: it.fields['furigana-plain'].value,
		furigana_html: it.fields['furigana'].value,

		// Yomichan sometimes parses random text from around an entry as the
		// sentence, so we try to filter those out.
		sentence: it.fields['sentence'].value
			.replace(/[\u{0021}-\u{00FF}]/gu, '')
			.replace(/^\s+|\s+$/g, '')
			.replace(/\s\s+/, ' '),
		frequency: parseFrequency(it.fields['frequencies'].value),
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
			const tags = () => node.tags.length && out.push(`<em class='tags'>(${node.tags.join(', ')})</em>`)
			if (node.text.every((x) => typeof x == 'string' && x.length < 20)) {
				tags()
				out.push(' ')
				out.push(node.text.join(', '))
			} else {
				const tag = first ? 'ol' : 'ul'
				tags()
				out.push(`<${tag}>`)
				node.text.forEach((x) => {
					out.push('<li>')
					if (typeof x == 'string') {
						out.push(x)
					} else {
						out.push(renderNode(x))
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
 * Send a request to Anki (depends on the anki-connect plugin being installed).
 */
async function queryAnki(action, params) {
	const args = {
		method: 'POST',
		body: JSON.stringify({
			action: action,
			version: 6,
			params: params,
		}),
	}
	const data = await fetch('http://127.0.0.1:8765/', args).then((data) => data.json())
	if (data.error) {
		throw new Error(`failed to connect to anki: ${data.error}`)
	}
	return data.result
}

/**
 * Query Jisho for a word definition.
 */
function queryWord({ word, reading, exact }) {
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

function dom(html) {
	const window = domino.createWindow(html)
	return window.document.body
}
