// model-script.js - the content of this file is included in the model template

init()

function init() {
	const card = document.querySelector('.card')
	if (!card) {
		setTimeout(init, 10)
		return
	}

	on(card, 'click', onClick)
}

function on(node, ev, fn) {
	let evs = (window.myEvents = window.myEvents || {})
	evs[fn.name] = evs[fn.name] || fn

	let callback = evs[fn.name]
	node.removeEventListener(ev, callback)
	node.addEventListener(ev, callback)
}

function onClick(ev) {
	const node = ev.target && ev.target.closest('.reading')
	if (node) {
		for (const it of node.querySelectorAll('rt')) {
			const visibility = window.getComputedStyle(it).visibility
			it.style.visibility = visibility == 'hidden' ? 'visible' : 'hidden'
		}
	}
}
