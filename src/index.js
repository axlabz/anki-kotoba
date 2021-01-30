const { toHiragana } = require('wanakana')
const fetch = require('node-fetch')

const CORE_DECK = 'Data::Core 6K'
const YOMICHAN_DECK = 'Data::Yomichan'

const json = (data) => console.log(JSON.stringify(data, null, '    '))

main().catch((err) => console.error(err))

async function main() {
	// const cards = await queryCards({ deck: CORE_DECK, words: ['食べる'] })
	const core = await getCoreEntry({ word: '食べる' })
	json(core)

	const word = await getYomichanEntry({})
	json(word)

	const jisho = await queryWord({ word: 'gin' })
	json(jisho)
}

async function getYomichanEntry({ word, reading, onlyNew }) {
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
		text: it.fields['glossary'].value,
		tags: it.fields['tags'].value
			.split(/\s*,\s*/)
			.filter((x) => !/JMnedict|JMdict|KireiCake/i.test(x))
			.join(','),
		furigana_text: it.fields['furigana-plain'].value,
		furigana_html: it.fields['furigana'].value,
		sentence: it.fields['sentence'].value,
		frequency: it.fields['frequencies'].value,
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
}

/**
 * Get an entry from the core deck.
 */
async function getCoreEntry({ word, reading }) {
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
