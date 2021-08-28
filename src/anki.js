const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

// spell-checker: disable

const C_HIGH = '#ffd154'
const C_EMPHASIS = '#ffe396'
const C_GREY = '#c0c0c0'
const C_LINK = '#00c3ff'
const C_SECONDARY = '#0092bf'

const STATS = [
	`<div style="position: absolute; top: 10px; right: 10px; color: ${C_GREY}; opacity: 0.4; font-size: 0.3em">`,
	`{{#core-index}}&nbsp;#{{core-index}}{{/core-index}}`,
	`{{#core-order}}&nbsp;/&nbsp;{{core-order}}{{/core-order}}`,
	`{{#frequency}}&nbsp;({{frequency}}){{/frequency}}`,
	`</div>`,
].join('')

const JP_FONTS = [
	`'ヒラギノ角ゴ ProN', 'Hiragino Kaku Gothic ProN', '游ゴシック', '游ゴシック体'`,
	`YuGothic, 'Yu Gothic', 'メイリオ', Meiryo, 'ＭＳ ゴシック', 'MS Gothic'`,
	`HiraKakuProN-W3, 'TakaoExゴシック', TakaoExGothic, 'MotoyaLCedar'`,
	`'Droid Sans Japanese'`,
	`"calibri", "Candara", "Segoe", "Segoe UI", "Optima", Arial, sans-serif`,
].join(', ')

const UI_FONTS = [
	`-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto"`,
	`"Oxygen", "Ubuntu", "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji"`,
	`"Segoe UI Emoji", "Segoe UI Symbol"`,
].join(', ')

const INCLUDE_SENTENCES_FRONT = false

const MODEL = {
	name: (deckName) => `${deckName}_model`,

	tagsNew: ['new'],

	cardName: 'Card',
	fields: [
		'key',
		'expression',
		'expression-alt',
		'reading',
		'hint',
		'furigana',
		'frequency',
		'audio',
		'audio-alt',
		'radicals',
		'notes',
		'kanji',
		'glossary',
		'image',
		'example-main',
		'example-text',
		'example-read',
		'example-audio',
		'example-image',
		'pitch-accents',
		'pitch-accent-graphs',
		'pitch-accent-positions',
		'yomichan-id',
		'yomichan-audio',
		'yomichan-glossary',
		'yomichan-sentence',
		'core-id',
		'core-index',
		'core-order',
		'core-audio',
		'core-sentence-read',
	],

	front:
		`
		<h1 class="reading">{{furigana}}</h1>
		{{#expression-alt}}<h2 class="reading">({{expression-alt}})</h2>{{/expression-alt}}
		${STATS}

		{{#hint}}({{hint}}){{/hint}}

		` +
		(INCLUDE_SENTENCES_FRONT
			? `
		<hr>

		{{#yomichan-sentence}}
		<div class="sentence">{{yomichan-sentence}}</div>
		{{/yomichan-sentence}}
		{{#example-main}}
		<div class="sentence">{{example-main}}</div>
		{{/example-main}}
		`
			: ``) +
		`
		<script>
		%SCRIPT%</script>
	`,

	back: `
		<h1>
		<span class="reading">{{furigana}}</span>

		{{#reading}}
		<div style="font-size: 0.3em; font-family: Japanese-alt; color: ${C_GREY}; opacity: 0.7">{{reading}}</div>
		{{/reading}}

		<span class="audio">
			{{audio}}{{audio-alt}}
			{{^audio}}
				{{#reading}}{{tts ja_JP:reading}}{{/reading}}
				{{^reading}}{{tts ja_JP:expression}}{{/reading}}
			{{/audio}}
		</span>
		</h1>
		{{#expression-alt}}<h2 class="reading">({{expression-alt}})</h2>{{/expression-alt}}
		${STATS}

		{{#hint}}({{hint}}){{/hint}}

		{{#example-read}}
		<div style="position: relative">
		<hr>
		<span class="reading" title="{{example-text}}">{{example-read}}</span>
		<span class="audio">{{example-audio}}</span>
		</div>
		{{/example-read}}

		{{#notes}}
		<hr>
		<div class="notes japanese-alt">{{notes}}</div>
		{{/notes}}

		<hr>
		<div class="glossary">{{glossary}}</div>

		<div style="font-size: 0.4em">
		<a class="button" title="forvo.com (pronunciation)" href="https://forvo.com/search/{{text:expression}}/">🔊</a>
		<a class="button" title="jisho.org (word)" href="https://jisho.org/search/{{text:expression}}">🔎</a>
		<a class="button" title="tatoeba.org (sentences)" href='https://tatoeba.org/eng/sentences/search?query="{{text:expression}}"&from=jpn&to=und'>💬</a>
		<a class="button" title="jisho.org (kanji)" href="https://jisho.org/search/{{text:expression}}%23kanji">🈁</a>
		<a class="button" title="radicals list" href="_radicals-index.html">🧩</a>
		</div>

		{{#image}}<hr>{{image}}{{/image}}

		{{#radicals}}<hr><div class="radical-container" data-radicals="{{text:radicals}}"></div>{{/radicals}}

		{{#kanji}}
		<hr><div class="kanji-container"><div class="kanji">{{kanji}}</div></div>
		{{/kanji}}

		{{#pitch-accents}}
			<hr>
			<div class="pitch">
			{{pitch-accents}}
			{{pitch-accent-graphs}}
			</div>
		{{/pitch-accents}}

		<hr>
		<div style="font-size: 0.7em">
		<div style="font-size: 0.5em; opacity: 0.5; text-align: left">Source:</div>
		{{yomichan-sentence}}
		</div>

		<script>onAnswer()</script>
	`,

	css: `
		@font-face {
			font-family: Stroke;
			src: url("_stroke.ttf");
		}

		@font-face {
			font-family: Main;
			src: url("_Roboto-Light.ttf")
		}

		@font-face {
			font-family: Japanese;
			src: url("_HGSKyokashotai.ttf");
			xsrc: url("_epkaisho.ttf");
			xsrc: url("_NotoSansCJKjp-Thin.otf");
		}

		@font-face {
			font-family: Japanese-alt;
			src: url("_NotoSansCJKjp-Thin.otf");
		}

		@font-face {
			font-family: Radicals;
			src: url("_JapaneseRadicals-Regular.ttf")
		}

		.card {
			font-size: 40px;
			text-align: center;
			font-family: Main, Japanese, ${JP_FONTS};
		}

		.sentence {
			font-size: 70%;
			padding-top: 20px;
			opacity: 0.7;
		}

		.japanese-alt { font-family: Main, Japanese-alt, ${JP_FONTS}; }
		.ui-text      { font-family: Japanese-alt, ${UI_FONTS}; }

		h1, h2       { font-weight: normal; font-size: 1.5em; position: relative; margin-right: 0; margin-left: 0; padding: 0; }
		h2           { font-size: 1.1em;  }
		h1 + h2      { margin-top: -0.3em; }
		h1 rt, h2 rt { font-size: 0.25em;  }

		rt { color: ${C_HIGH}; visibility: hidden; font-family: Japanese-alt; font-size: 12px; }

		i { display: none; color: ${C_SECONDARY}; font-style: normal; font-size: 0.8em; }

		a, a:visited, a:hover { color: ${C_LINK} !important; text-decoration: none; }

		img { max-width: 350px; }

		.button { color: ${C_GREY}; cursor: pointer; opacity: 0.2; transition-property: opacity, color; transition-duration: 0.5s; }
		.button:hover { color: ${C_LINK}; opacity: 1.0; }

		.reading   { cursor: pointer; }
		.reading b { font-weight: normal; color: ${C_EMPHASIS}; }

		.audio { display: inline-block; position: absolute; right: 10px; transform: scale(0.5); margin-top: -0.15em; }

		.stroke  { font-family: Stroke, Japanese-alt; }

		.notes {
			display: inline-block;
			position: relative;
			max-width: 70%;
			margin: auto;
			font-size: 0.5em;
			opacity: 0.7;
			text-align: left;
			font-family: Main, Japanese-alt, ${JP_FONTS};
		}

		.glossary { font-size: 0.5em; display: inline-block; text-align: left; max-width: 70%; }
		.glossary em {
			display: inline-block;
			margin-left: 20px;
			font-size: 0.7em;
			margin-top: 0.3em;
			font-style: normal;
			color: ${C_HIGH};
			float: right;
			cursor: default;
		}

		.radical-container {
			font-family: Radicals, Japanese-alt, ${JP_FONTS};
			font-size: 0.5em;
			display: inline-block;
		}
		.radical-char      { color: ${C_HIGH}; }
		.radical-stroke    { color: ${C_GREY}; font-size: 12px; padding: 0 3px 0 3px; }
		.radical-meaning   { padding-left: 5px; }

		.kanji-container {
			display: inline-block;
		}

		.kanji {
			display: flex;
			flex-wrap: wrap;
			flex-direction: row;
			justify-content: center;
			align-items: auto;
			align-content: center;
		}

		.kanji > span {
			flex: 1 1 auto;
			display: flex;
			flex-wrap: nowrap;
			flex-direction: row;
			justify-content: start;
			align-items: center;
			align-content: start;
		}
		.kanji > span > *  { flex: 1 1 auto; }
		.kanji > span > ul {
			margin: 0;
			padding: 0;
			list-style-type: none;
			display: flex;
			flex-wrap: nowrap;
			flex-direction: column;
			justify-content: start;
			align-items: start;
			align-content: start;
		}
		.kanji > span li {
			font-size: 0.4em;
			flex: 0 0 auto;
		}
		.kanjix > span li:after { content: ', ' }
		.kanjix > span li:last-child:after { content: '' }

		.kanji > span > em {
			width: 1.2em;
			flex: 0 0 auto;
			font-style: normal;
			font-family: Stroke, Japanese-alt;
			font-size: 3em;
		}

		.pitch {
			font-family: Radicals, Japanese-alt, ${JP_FONTS};
			font-size: 0.5em;
			display: flex;
			flex-wrap: wrap;
			flex-direction: row;
			justify-content: center;
			align-items: auto;
			align-content: start
		}

		.pitch > * {
			flex: 0 0 auto;
			margin: 10px;
		}

		.pitch svg path, .pitch svg circle {
			stroke: #E0E0E0 !important;
		}

		.tooltip {
			font-family: Main, Japanese-alt, ${JP_FONTS};
			display: block;
			background-color: black;
			color: #e0e0e0;
			font-size: 14px;
			line-height: 20px;
			position: fixed;
			padding: 10px;
			z-index: 10000;
			transition: opacity 0.3s;
			top: 10px; left: 10px;
			min-width: 100px;
			text-align: center;
			opacity: 0;
			visibility: hidden;
		}
	`,
}

// spell-checker: enable

/**
 * Initializes the deck and models in Anki.
 */
async function initAnki(mainDeck) {
	const deck = await queryAnki('createDeck', { deck: mainDeck })
	console.log(`Deck ${mainDeck} is ${deck}`)

	const modelName = MODEL.name(mainDeck)
	const hasModel = (await queryAnki('modelNames')).indexOf(modelName) >= 0

	const front = text(MODEL.front)
		.replace('%SCRIPT%', fs.readFileSync('./src/model-script.js'))
		.replace('// {{radicals.js}}', '// radicals.js\n\n' + fs.readFileSync('./src/radicals.js'))
	const back = text(MODEL.back)
	const css = text(MODEL.css)

	if (!hasModel) {
		await queryAnki('createModel', {
			modelName: modelName,
			inOrderFields: MODEL.fields,
			css: css,
			cardTemplates: [
				{
					Name: MODEL.cardName,
					Front: front,
					Back: back,
				},
			],
		})
	} else {
		await queryAnki('updateModelTemplates', {
			model: {
				name: modelName,
				templates: {
					[MODEL.cardName]: {
						Front: front,
						Back: back,
					},
				},
			},
		})
		await queryAnki('updateModelStyling', {
			model: {
				name: modelName,
				css: css,
			},
		})
	}
}

/**
 * Add a note to the main Anki deck.
 */
async function addNote(mainDeck, note) {
	const [id] = await queryAnki('findNotes', {
		query: `"deck:${mainDeck}" "key:${note.key}"`,
	})

	const v = (v) => (v == null ? '' : v.toString())

	const isNew = !id
	const fields = {}
	fields['key'] = v(note.key)
	fields['expression'] = v(note.expression)
	if (note.expression_alt) {
		fields['expression-alt'] = v(note.expression_alt)
	}
	fields['reading'] = v(note.reading)
	fields['furigana'] = v(note.furigana)
	fields['frequency'] = v(note.frequency)
	fields['audio'] = v(note.audio)
	fields['audio-alt'] = v(note.audio_alt)
	fields['kanji'] = v(note.kanji)
	fields['glossary'] = v(note.glossary)
	fields['example-main'] = v(note.example_main)
	fields['example-text'] = v(note.example_text)
	fields['example-read'] = v(note.example_read)
	fields['example-audio'] = v(note.example_audio)
	fields['example-image'] = v(note.example_image)

	fields['pitch-accents'] = v(note.pitch_accents)
	fields['pitch-accent-graphs'] = v(note.pitch_accent_graphs)
	fields['pitch-accent-positions'] = v(note.pitch_accent_positions)

	fields['yomichan-id'] = v(note.yomichan_id)
	fields['yomichan-audio'] = v(note.yomichan_audio)
	fields['yomichan-glossary'] = v(note.yomichan_glossary)
	fields['yomichan-sentence'] = v(note.yomichan_sentence)
	fields['core-id'] = v(note.core_id)
	fields['core-index'] = v(note.core_index)
	fields['core-order'] = v(note.core_order)
	fields['core-audio'] = v(note.core_audio)
	fields['core-sentence-read'] = v(note.core_sentence_read)

	if (isNew) {
		const id = await queryAnki('addNote', {
			note: {
				deckName: mainDeck,
				modelName: MODEL.name(mainDeck),
				fields: fields,
				options: {
					allowDuplicate: false,
					duplicateScope: 'deck',
				},
				tags: [].concat(MODEL.tagsNew, note.note_tags),
			},
		})
		if (id) {
			console.log(`Added note ${id} for ${note.key}`)
		} else {
			console.log(`Could not add note for ${note.key}`)
			return false
		}
	} else {
		await queryAnki('updateNoteFields', {
			note: {
				id: id,
				fields: fields,
			},
		})
		for (const tag of note.note_tags) {
			await queryAnki('addTags', {
				notes: [id],
				tags: tag,
			})
		}
		console.log(`Updated note ${id} for ${note.key}`)
	}
	return true
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
		console.error('Command failed:', action, JSON.stringify(params, null, '    '))
		throw new Error(`anki ${action} failed: ${data.error}`)
	}
	return data.result
}

function text(txt) {
	const lines = txt.split(/\r\n?|\n/)
	if (!lines[0].trim()) {
		lines.shift()
	}
	if (lines.length && !lines[lines.length - 1].trim()) {
		lines.length--
	}

	const tab = (() => {
		const m = /^\s+/.exec(lines.filter((x) => !!x.trim())[0] || '')
		return (m && m[0]) || ''
	})()
	const output = lines.map((it) => {
		const line = (it.startsWith(tab) ? it.slice(tab.length) : it).trimEnd()
		return line.replace(/\t/g, '    ')
	})
	return output.join('\n')
}

module.exports = {
	initAnki,
	addNote,
	queryAnki,
}
