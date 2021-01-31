const fs = require('fs')

const tagMap = {}

;['jmdict', 'jmnedict'].forEach((name) => {
	const data = JSON.parse(fs.readFileSync(`./data/tags/tags_${name}.json`))
	data.forEach(([name, category, order, description, score]) => {
		tagMap[name] = {
			// Name for the tag, as it appears on entries.
			name,
			// General category that group related tags.
			category,
			// Sorting term for tags on an entry.
			order,
			// Description for the tag.
			description,
			// Score for terms with this tag. Can be used to sort terms with
			// higher scores first.
			score,
		}
	})
})

module.exports = (name) => tagMap[name] || { name: name, category: '', order: 0, score: 0, description: '' }
