const fs = require('fs')
const fetch = require('node-fetch')

// spell-checker: disable

const CLR_HIGH = '#ffd154'
const CLR_GREY = '#c0c0c0'

const STATS = [
	`<div style="position: absolute; top: 10px; right: 10px; color: ${CLR_GREY}; opacity: 0.5; font-size: 0.4em">`,
	`{{#core-index}}&nbsp;#{{core-index}}{{/core-index}}`,
	`{{#core-order}}&nbsp;/&nbsp;{{core-order}}{{/core-order}}`,
	`{{#frequency}}&nbsp;({{frequency}}){{/frequency}}`,
	`</div>`,
].join('')

const MODEL = {
	name: (deckName) => `${deckName}_model`,

	tagsNew: ['new'],

	cardName: 'Card',
	fields: [
		'key',
		'expression',
		'expression-alt',
		'reading',
		'furigana',
		'frequency',
		'audio',
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

	front: `
		<h1 class="reading">{{furigana}}</h1>
		{{#expression-alt}}<h2 class="reading">({{expression-alt}})</h2>{{/expression-alt}}
		${STATS}

		{{#example-read}}
		<hr><span class="reading">{{example-read}}</span>
		{{/example-read}}

		<script>
		%SCRIPT%</script>
	`,

	back: `
		<h1 class="reading">
		{{furigana}}
		<span class="audio">{{audio}} {{^audio}}{{tts ja_JP:expression}}{{/audio}}</span>
		</h1>
		{{#expression-alt}}<h2 class="reading">({{expression-alt}})</h2>{{/expression-alt}}
		${STATS}

		{{#example-read}}
		<div style="position: relative">
		<hr>
		<span class="reading" title="{{example-text}}">{{example-read}}</span>
		<span class="audio">{{example-audio}}</span>
		</div>
		{{/example-read}}

		<hr>
		{{#reading}}
		<div style="font-size: 0.5em; font-family: Japanese-alt; color: ${CLR_GREY}; opacity: 0.7">{{reading}}</div>
		{{/reading}}
		<div class="glossary">{{glossary}}</div>
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
			font-size: 5vw;
			text-align: center;
			font-family:
				Main, Japanese,
				'ヒラギノ角ゴ ProN', 'Hiragino Kaku Gothic ProN', '游ゴシック', '游ゴシック体',
				YuGothic, 'Yu Gothic', 'メイリオ', Meiryo, 'ＭＳ ゴシック', 'MS Gothic',
				HiraKakuProN-W3, 'TakaoExゴシック', TakaoExGothic, 'MotoyaLCedar',
				'Droid Sans Japanese',
				"calibri", "Candara", "Segoe", "Segoe UI", "Optima", Arial, sans-serif;
		}

		h1, h2       { font-weight: normal; font-size: 1.5em; position: relative; }
		h2           { font-size: 1.1em;  }
		h1 + h2      { margin-top: -0.3em; }
		h1 rt, h2 rt { font-size: 0.3em;  }

		a, a:visited, a:hover { color: #bfdfff !important; text-decoration: none; }

		rt { color: ${CLR_HIGH}; visibility: hidden; font-family: Japanese-alt; }
		.reading { cursor: pointer; }

		.audio { display: inline-block; position: absolute; right: 10px; transform: scale(0.5); margin-top: -0.15em; }

		.radical { font-family: Radicals, Japanese; }
		.stroke  { font-family: Stroke; }

		.glossary { font-size: 0.5em; display: inline-block; text-align: left; max-width: 70%; }
		.glossary em { display: inline-block; margin-left: 20px; font-size: 0.9em; font-style: normal; color: ${CLR_HIGH}; float: right; }

		/*
		.toolbar {
			position: absolute;
			top: 10px;
			right: 10px;
		}

		i {
			color: #00c8ff;
			display: none;
			font-size: 0.5em;
		}

		.glossary {
			font-size: 0.5em;
			display: inline-block;

		}

		.tags {
			font-size: 0.4em;
			opacity: 0.4;
		}

		.toolbar button {
			width: 30px;
			height: 30px;
		}

		img {
			max-width: 350px;
		}

		.search-radical {
			font-size: 16px;
		}

		.toolbar-bottom {
			position: fixed;
			bottom: 10px;
			width: 100%;
			opacity: 0;
			transition: opacity 0.5s;
		}

		.toolbar-bottom:hover {
			opacity: 1;
		}
		*/
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

	const front = text(MODEL.front).replace('%SCRIPT%', fs.readFileSync('./src/model-script.js'))
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
	fields['reading'] = v(note.reading)
	fields['furigana'] = v(note.furigana)
	fields['frequency'] = v(note.frequency)
	fields['audio'] = v(note.audio)
	fields['radicals'] = v(note.radicals)
	fields['notes'] = v(note.notes)
	fields['kanji'] = v(note.kanji)
	fields['glossary'] = v(note.glossary)
	fields['image'] = v(note.image)
	fields['example-main'] = v(note.example_main)
	fields['example-text'] = v(note.example_text)
	fields['example-read'] = v(note.example_read)
	fields['example-audio'] = v(note.example_audio)
	fields['example-image'] = v(note.example_image)
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
				tags: MODEL.tagsNew,
			},
		})
		if (id) {
			console.log(`Added note ${id} for ${note.key}`)
		} else {
			console.log(`Could not add note for ${note.key}`)
		}
	} else {
		await queryAnki('updateNoteFields', {
			note: {
				id: id,
				fields: fields,
			},
		})
		console.log(`Updated note ${id} for ${note.key}`)
	}
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
