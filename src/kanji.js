const fs = require('fs')

const DIR = './data/kanji'

const tags = JSON.parse(fs.readFileSync(`${DIR}/tag_bank_1.json`))
const kanji1 = JSON.parse(fs.readFileSync(`${DIR}/kanji_bank_1.json`))
const kanji2 = JSON.parse(fs.readFileSync(`${DIR}/kanji_bank_2.json`))

const tagMap = {}
tags.forEach(([tag, kind, score, description]) => {
	tagMap[tag] = { tag, kind, score, description }
})

const kanjiMap = {}
kanji1.concat(kanji2).forEach(([kanji, on, kun, tags, meanings, info]) => {
	const split = (txt) => txt.split(/[,;]|\s+/)
	kanjiMap[kanji] = {
		kanji: kanji,
		meanings: meanings,
		on: split(on),
		kun: split(kun),
		tags: split(tags),
		info: info,
	}
})

module.exports = {
	get(kanji) {
		return kanjiMap[kanji]
	},

	getTag(tag) {
		return tagMap[tag] || { tag }
	},

	list(str) {
		const has = {}
		const out = []
		for (const chr of str) {
			if (has[chr]) {
				continue
			}
			const kanji = kanjiMap[chr]
			if (kanji) {
				has[chr] = true
				out.push(kanji)
			}
		}
		return out
	},
}
