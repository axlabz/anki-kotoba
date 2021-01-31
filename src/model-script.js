// model-script.js - the content of this file is included in the model template

const TOOLTIP_SHOW_DELAY = 500
const TOOLTIP_HIDE_DELAY = 200

init()

function init() {
	const card = document.querySelector('.card')
	if (!card) {
		setTimeout(init, 10)
		return
	}

	initRubyTooltips(card)
	installTooltips(card)
	on(card, 'click', onClick)
}

function onAnswer() {
	const card = document.querySelector('.card')
	setTimeout(() => installTooltips(card), 0)
	initRubyTooltips(card)

	const button = (text, fn) => {
		const btn = document.createElement('span')
		btn.textContent = text
		btn.classList.add('button', 'ui-text')
		btn.addEventListener('click', fn)
		return btn
	}

	card.querySelectorAll('i').forEach((el) => {
		const btn = button('🛈', () => {
			el.style.display = 'inline'
			btn.style.display = 'none'
		})
		btn.title = el.textContent
		btn.style.fontSize = '0.8em'
		btn.style.padding = '2px 5px 0 5px'
		el.parentNode.insertBefore(btn, el)
	})

	card.querySelectorAll('.notes').forEach((el) => {
		const btn = button('❕', () => toggleFurigana(el))
		btn.style.display = 'inline-block'
		btn.style.position = 'absolute'
		btn.style.top = '0px'
		btn.style.left = '-32px'
		btn.style.fontSize = '0.7em'
		btn.title = 'Toggle furigana'
		el.appendChild(btn)
	})
}

function on(node, ev, fn) {
	let evs = (window.myEvents = window.myEvents || {})
	evs[fn.name] = evs[fn.name] || fn

	let callback = evs[fn.name]
	node.removeEventListener(ev, callback)
	node.addEventListener(ev, callback)
}

function onClick(ev) {
	toggleFurigana(ev.target && ev.target.closest('.reading'))
}

function toggleFurigana(node) {
	if (node) {
		for (const it of node.querySelectorAll('rt')) {
			const visibility = window.getComputedStyle(it).visibility
			it.style.visibility = visibility == 'hidden' ? 'visible' : 'hidden'
		}
	}
}

function installTooltips(root) {
	const getTT = () => root.querySelector('.tooltip')
	if (!getTT()) {
		const tt = document.createElement('span')
		tt.textContent = 'TOOLTIP'
		tt.classList.add('tooltip')
		root.appendChild(tt)
	}

	;(function () {
		const layoutAttr = 'data-has-layout'
		const tt = getTT()
		if (!tt.getAttribute(layoutAttr)) {
			tt.setAttribute(layoutAttr, '1')
			window.requestAnimationFrame(doLayout)
			function doLayout() {
				try {
					let parent = tt.curParent
					if (parent) {
						const offset = 15
						const margin = 10
						const width = window.innerWidth || document.documentElement.clientWidth
						const ttRect = tt.getBoundingClientRect()
						const pRect = parent.getBoundingClientRect()

						let x = (pRect.left + pRect.right) / 2 - ttRect.width / 2
						let y = pRect.top - ttRect.height - offset
						if (y - ttRect.height < margin) {
							y = pRect.bottom + offset
						}
						if (x + ttRect.width > width - margin) {
							x = width - margin - ttRect.width
						} else if (x < margin) {
							x = margin
						}
						tt.style.top = `${y}px`
						tt.style.left = `${x}px`
					}
				} catch (e) {}
				if (getTT() === tt) {
					window.requestAnimationFrame(doLayout)
				}
			}
		}
	})()

	const timeout = (fn, delay) => {
		const tt = getTT()
		const to = parseInt(tt.getAttribute('data-timeout') || '0', 10)
		clearTimeout(to)
		const newTo = setTimeout(fn, delay)
		tt.setAttribute('data-timeout', newTo.toString())
	}

	const show = (parent, text) => {
		const tt = getTT()
		tt.textContent = text
		tt.curParent = parent

		timeout(() => {
			tt.style.visibility = 'visible'
			tt.style.opacity = 1
		}, TOOLTIP_SHOW_DELAY)
	}

	const hide = () => {
		const tt = getTT()
		timeout(() => {
			tt.style.opacity = 0
			timeout(() => {
				tt.curParent = null
				tt.style.visibility = 'hidden'
			}, 500)
		}, TOOLTIP_HIDE_DELAY)
	}

	root.querySelectorAll('[title]').forEach((el) => {
		const title = el.title
		if (title) {
			el.title = ''
			el.addEventListener('mouseover', (ev) => {
				ev.stopPropagation()
				show(el, title)
			})
			el.addEventListener('mouseout', (ev) => {
				ev.stopPropagation()
				hide()
			})
		}
	})
	hide()
}

function initRubyTooltips(root) {
	root.querySelectorAll('ruby').forEach((el) => {
		const read = []
		el.querySelectorAll('rt').forEach((rt) => read.push(rt.textContent))
		el.title = read.join('')
	})
}
