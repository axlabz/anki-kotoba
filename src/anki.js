const fs = require('fs')
const fetch = require('node-fetch')

// spell-checker: disable

const C_HIGH = '#ffd154'
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

const MODEL = {
	name: (deckName) => `${deckName}_model`,

	tagsNew: ['new'],

	cardName: 'Card',
	fields: [
		/* [X] */ 'key',
		/* [X] */ 'expression',
		/* [X] */ 'expression-alt',
		/* [X] */ 'reading',
		/* [X] */ 'furigana',
		/* [X] */ 'frequency',
		/* [X] */ 'audio',
		/* [X] */ 'audio-alt',
		/* [ ] */ 'radicals',
		/* [X] */ 'notes',
		/* [X] */ 'kanji',
		/* [X] */ 'glossary',
		/* [X] */ 'image',
		/* [X] */ 'example-main',
		/* [X] */ 'example-text',
		/* [X] */ 'example-read',
		/* [X] */ 'example-audio',
		/* [X] */ 'example-image',
		/* [X] */ 'yomichan-id',
		/* [X] */ 'yomichan-audio',
		/* [X] */ 'yomichan-glossary',
		/* [X] */ 'yomichan-sentence',
		/* [X] */ 'core-id',
		/* [X] */ 'core-index',
		/* [X] */ 'core-order',
		/* [X] */ 'core-audio',
		/* [X] */ 'core-sentence-read',
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
		<h1>
		<span class="reading">{{furigana}}</span>
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
		{{#reading}}
		<div style="font-size: 0.5em; font-family: Japanese-alt; color: ${C_GREY}; opacity: 0.7">{{reading}}</div>
		{{/reading}}
		<div class="glossary">{{glossary}}</div>

		<div style="font-size: 0.4em">
		<a class="button" title="forvo.com (pronunciation)" href="https://forvo.com/search/{{text:expression}}/">🔊</a>
		<a class="button" title="jisho.org (word)" href="https://jisho.org/search/{{text:expression}}">🔎</a>
		<a class="button" title="tatoeba.org (sentences)" href='https://tatoeba.org/eng/sentences/search?query="{{text:expression}}"&from=jpn&to=und'>💬</a>
		<a class="button" title="jisho.org (kanji)" href="https://jisho.org/search/{{text:expression}}%23kanji">🈁</a>
		</div>

		{{#image}}<hr>{{image}}{{/image}}

		{{#radicals}}<hr><div class="radical-container" data-radicals="{{text:radicals}}"></div>{{/radicals}}

		{{#kanji}}
		<hr><div class="kanji">{{kanji}}</div>
		{{/kanji}}

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

		.button { color: ${C_GREY}; cursor: pointer; opacity: 0.3; transition-property: opacity, color; transition-duration: 0.5s; }
		.button:hover { color: ${C_LINK}; opacity: 1.0; }

		.reading { cursor: pointer; }

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
		}

		.radical-container {
			font-family: Radicals, Japanese-alt, ${JP_FONTS};
			font-size: 0.5em;
			display: inline-block;
		}
		.radical-char      { color: ${C_HIGH}; }
		.radical-stroke    { color: ${C_GREY}; font-size: 12px; padding: 0 3px 0 3px; }
		.radical-meaning   { padding-left: 5px; }

		.kanji { max-width: 70%; display: inline-block; text-align: left; }
		.kanji > span {
			display: flex;
			flex-wrap: nowrap;
			flex-direction: row;
			justify-content: start;
			align-items: center;
			align-content: start
		}
		.kanji > span > *  { flex: 1 1 auto; }
		.kanji > span > ul { margin: 0; padding: 0; list-style-type: none; }
		.kanji > span li   { display: inline; font-size: 0.5em}
		.kanji > span li:after { content: ', ' }
		.kanji > span li:last-child:after { content: '' }

		.kanji > span > em {
			width: 1.2em;
			flex: 0 0 auto;
			font-style: normal;
			font-family: Stroke, Japanese-alt;
			font-size: 3em;
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
			return false
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
