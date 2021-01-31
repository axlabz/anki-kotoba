function radicals(txt) {
	const ls = split(radicalsList(), ['stroke', 'radical', 'position', 'meaning', 'notes', 'important']).map((x) => {
		return x
	})
	if (txt) {
		const out = []
		for (const chr of txt) {
			const rad = ls.filter((x) => x.radical == chr)
			if (rad.length) {
				out.push(rad[0])
			} else {
				if (out.length && out[out.length - 1].raw_text) {
					out[out.length - 1].raw_text += chr
				} else {
					out.push({ raw_text: chr })
				}
			}
		}
		return out
	}
	return ls
}

function split(s, fields) {
	return s
		.trim()
		.split(/\r\n?|\n/)
		.filter((x) => !!x.trim())
		.map((x) => x.trimLeft().split('\t'))
		.map((x) => {
			const out = {}
			for (let i = 0; i < fields.length; i++) {
				out[fields[i]] = x[i] || ''
			}
			return out
		})
}

// Based on https://kanjialive.com/214-traditional-kanji-radicals/
function radicalsList() {
	// spell-checker: ignore hito
	return `
		1	⼀		one
		1	⼁		pipe	vertical
		1	⼂		dot	drop
		1	⼃		no	line, drop, diagonal sweeping stroke
		1		top	tick	a variant of ⼃（の）
		1	⼄		hook
		1	⺃		fishing-hook	a variant of ⼄（おつ）
		1	⼅		barb	vertical hook
		2	⼆		two	ni
		2	⼇	top	lid	hat	Important
		2	⼈		person	man, hito
		2	⺅	left	person	man, hito, a variant of ⼈（ひと）	Important
		2	𠆢	top	person hat	man, hito, roof, a variant of ⼈（ひと）	Important
		2	⼉	bottom	human legs	person, man, hito	Important
		2	⼊		enter
		2	⼋		big eight
		2			animal legs	legs, eight, a variant of ⼋（はち）
		2	⼌	wrap	hood	box
		2	⼍	top	crown	roof	Important
		2	⼎	left	ice
		2	⼏	right	table
		2	⺇	top	wind	a variant of ⼏（きにょう）
		2	⼐	base	open box
		2	⼑		sword
		2	⺉	right	sword	knife, a variant of sword ⼑（かたな）	Important
		2	⼒		power	force
		2	⼓	wrap	poncho	to wrap
		2	⼔	right	spoon, sit
		2	⼕	wrap	side-box
		2	⼖	wrap	hiding-box	hide
		2	⼗		cross	ten
		2	⼘		divination	rod, to, fortune-telling
		2	⼙	right	stamp
		2	⼚	hang	cliff	hill, mount	Important
		2	⼛		private	private, myself, me
		2	⼜		crotch	or again, right hand
		2	⟝		rifle	pistol, fun, person, weapon		rifle
		2	マ		arm	biceps,ma
		3	⼝		mouth
		3		left	hanging-mouth	a variant of ⼝（くち）	Important
		3	⼞	wrap	border	box	Important
		3	⼟		soil	earth, ground, floor, dirt
		3		left	gutter	a variant of earth, ground, floor, dirt ⼟（つち）	Important
		3	⼠		samurai	man, general, officer
		3		top	samurai	man, general, officer, a variant of ⼠（さむらい）
		3	⼡		late	to follow
		3	⼢	bottom	slowly
		3	⼣		evening
		3	⼤		big	large
		3	⼥		woman	girl
		3		left	woman	a variant of woman, girl ⼥（おんな）	Important
		3	⼦		child	kid
		3		left	child	child, kid, a variant of ⼦（こ）	Important
		3	⼧	roof		Important
		3	⼨		length	inch, length, measure
		3		right	inch	inch, length, measure, a variant of ⼨（すん）
		3	⼩		small	tiny
		3	⺌	top	tiny	small, tiny, a variant of ⼩（しょう）
		3	⺐	right	lame leg
		3	⼫	hang	awning	roof, flag, door
		3	⼬		sprout	grass, plant, flower
		3	⼭		mountain
		3		left	side mountain	a variant of ⼭（やま）
		3		top	mountain top	a variant of ⼭（やま）
		3	⼮		winding river	stream
		3	川		river	stream, a variant of ⼮（まがりがわ）
		3	⼯		carpenter	skill
		3		left	carpenter	skill, a variant of ⼯（たくみ）
		3	⼰		self	myself, oneself
		3	⼱		cloth	towel
		3		left	hanging cloth	towel, a variant of ⼱（はば）
		3	⼲		clothesline	dry
		3	⺓		thread	silk
		3	⼴	hang	slanting roof	cliff	Important
		3	⼵	base	stretched road	path
		3	⼶	bottom	pray hands	folded hands
		3	⼷		javelin	weapon
		3	⼸		bow	weapon
		3		left	long bow	weapon, a variant of ⼸（ゆみ）
		3	⼹		pig’s head	brush
		3	⺕		brush	(pig’s head) a variant of ⼹（けいがしら）, brush
		3	⺔		pig's leg	(pig’s head) a variant of ⼹（けいがしら）, brush
		3	⼺	right	light rays	three, hair, fur
		3	⼻	left	going	journey	Important
		3	⺾	top	grass	plant, flower, a variant of ⾋（くさ）, plant	Important
		3	⻌	base	road	path, walk, a variant of ⾡（しんにょう）	Important
		3	⻏	right	village	a variant of ⾢（むら）	Important
		3	⻖	left	hill	a variant of ⾩（こざと）	Important
		3	⺍	top	tuft	grass, plant, flower, three
		3	⺖	left	stretched heart	a variant of ⼼（こころ）	Important
		3	⺘	left	finger	hand, a variant of ⼿（て）	Important
		3	⺡	left	water	(water) a variant of ⽔（みず）	Important
		3	⺨	left	beast	animal, dog, wolf, a variant of ⽝（いぬ）	Important
		3	亡		deceased	death, die, busy
		4	⼼		heart
		4	⺗	bottom	squished heart	a variant of ⼼（こころ）
		4	⼽		spear	weapon
		4	⼾		door	return, roof
		4		hang	door	a variant of ⼾（と）
		4	⼿		hand
		4	⽀		to bear	crotch, branch, legs
		4	⽁	right	hit	crotch, legs
		4	⺙	right	chair-walk	walk, legs, chair, crotch, a variant of ⽁（ぼくづくり） 	Important
		4	⽂		sentence	crotch, legs, walk
		4	⽃	right	big dipper	fee
		4	⽄	right	axe	mount, hill
		4	⽅		flag	direction
		4		left	flag	direction, a variant of ⽅（ほう）
		4	⽆		not
		4	⽇		sun	day
		4		left	sunrise	day, a variant of ⽇（ひ）	Important
		4	⽈		to say	talk
		4	⽉		moon	night
		4	⺝	left	crescent moon	night, a variant of ⽉（つき）
		4			flesh	a variant of meat ⾁（にく）	Important
		4	⽊		tree	wood
		4		left	tree	wood, a variant of ⽊（き）	Important
		4	⽋		yawn	to lack, yawn
		4	⽌		stop	quit, step
		4	⽍		death
		4		left	death	a variant of ⽍（がつ）
		4	⽎	right	lance shaft	lance shaft, action, weapon
		4	⽏		mother	mama
		4	⽐		to compare	spoon, sit
		4	⽑		hair
		4	⽒		clan	family, lineage
		4	⽓	wrap	steam	air
		4	⽔		water
		4	⽕		fire
		4		left	fire	a variant of ⽕（ひ）	Important
		4	⺣	bottom	fire	a variant of ⽕（ひ）	Important
		4	⽖		claw	nail
		4	⺤	top	bird claw	nail, a variant of ⽖（つめ）
		4	爫	top	nail	claw, a variant of ⽖（つめ）
		4	⽗		father	papa
		4	⽘		to mix
		4	⽙	left	one-sided	left, split wood, chop
		4	⽚		karate chop	right, one-sided, chop, split wood
		4		left	split wood	right, one-sided, chop, karate, a variant of ⽚（かた）
		4			fang	trunk, fang, canine tooth
		4	⽜		cow	animal
		4		left	cow	animal a variant of ⽜（うし）
		4	⽝		dog	animal
		4		left	jeweled king	a variant of ⽟（たま）	Important
		4	⺭	left	altar	a variant of ⽰（しめす）	Important
		4	㓁		net	a variant of ⽹（あみ）
		4	⺹	top	old-age	a variant of ⽼（おいかんむり）
		4	野		thin halberd	weapon		thin_halberd
		4	旅		hitchhiker	person,man		hitchhiker
		4	也		scorpion	also, to be
		4	少		few	little
		4	勿		must not	thing
		5	⽞		darkness
		5	⽟		jewelry
		5			melon
		5	⽡		tile
		5	⽢		sweet
		5	⽣		birth
		5	⽤		equip	use
		5	⽥		rice paddy
		5		left	small paddy	a variant of ⽥（た）
		5	⽦		bolt of cloth
		5	⺪	left	hanging bolt of cloth	a variant of ⽦（ひき）
		5	⽧	hang	sickness		Important
		5	⽨	top	departure
		5	⽩		white
		5		left	whiteness	a variant of ⽩（しろ）
		5	⽪		skin	hide
		5	⽫		plate	dish
		5	⽬		eye	see
		5		left	eye	see, a variant of ⽬（め）	Important
		5		top	watchful eye	see, a variant of ⽬（め）
		5	⽭		halberd
		5		left	halberd	weapon, a variant of ⽭（ほこ）
		5	⽮		dart	weapon
		5		left	dart	weapon, a variant of ⽮（や）
		5	⽯		stone
		5		left	stone	a variant of ⽯（いし）
		5	⽰		altar	altar, festival, religious service
		5	⽱		footprint	hang
		5	⽲	left	grain	plant	Important
		5	⽳		hole
		5		top	hole	a variant of ⽳（あな）	Important
		5	⽴		stand
		5		left	stand	a variant of ⽴（たつ）
		5			fang	elephant trunk, a variant of （きば）
		5		left	fang	elephant trunk, a variant of ⽛（きば）
		5	氺		water	a variant of ⽔（みず）
		5	⺫	top	net	a variant of ⽹（あみ）
		5	𦉰		net	a variant of ⽹（あみ）
		5	⻂	left	clothing	a variant of ⾐（ころも）	Important
		5	⺛		not	a variant of ⽆（むにょう）
		5	台		pedestal	stand, me, private, mouth
		5	古		tomb	old
		6	⽵		bamboo
		6	⺮	top	bamboo hat	a variant of ⽵（たけ）	Important
		6	⽶		rice
		6		left	rice	a variant of ⽶（こめ）	Important
		6	⽷		spider-man	silk, thread
		6		left	spider-man	silk, thread, a variant of ⽷（いと）	Important
		6	⽸		earthen jar	cow
		6	⽹		big net
		6	⽺		sheep hide
		6	⺷		sheep	a variant of ⽺（ひつじ）
		6	羽		wings	feather
		6	⽻		feathered wings	a variant of 羽（はね）
		6	⽼		old
		6	⽽		comb	and also
		6	⽾	left	plant, plow
		6	⽿		ear
		6		left	ear	a variant of ⽿（みみ）
		6	⾀		writing brush
		6	⾁		meat	flesh
		6	⾂		retainer	attend
		6	⾃		self	me, myself
		6	⾄		reach
		6		left	reach	a variant of ⾄（いたる）
		6	⾅		mortar
		6	⾆		tongue
		6	⾇		misfortune	cow
		6	⾈		boat	ship
		6		left	boat	ship, a variant of ⾈（ふね）
		6	⾉		boundary
		6	⾊		color
		6	⾋		tall grass	plant
		6	⾌	top	tiger	animal
		6	⾍		insect	bug, animal
		6		left	insect	bug, a variant of ⾍（むし）	Important
		6	⾎		blood	dish
		6	⾏	wrap	journey	going	Important
		6	⾐		cloak	clothes, hat
		6	⾑		west	cover, west
		6	⻃		west	cover, west, a variant of ⾑（にし）
		6	⽠		melon	a variant of ⽠（うり）
		6	艮		good	silver
		7	⾒		see	eye
		7	⾓		corner
		7		left	corner	a variant of ⾓（つの）
		7	⾔		words	say
		7		left	words	say, a variant of ⾔（げん）	Important
		7	⾕		valley
		7		left	valley	a variant of ⾕（たに）
		7	⾖		bean	mouth
		7		left	bean	mouth, a variant of ⾖（まめ）
		7	⾗		pig
		7	⾘	left	badger	pig
		7	⾙		shell	see, eye
		7		left	shell	see, eye, a variant of ⾙（かい）	Important
		7	⾚		red
		7	⾛		run
		7		base	run	a variant of ⾛（はしる）	Important
		7	⾜		leg	foot, feet
		7	⻊	left	leg	foot, feet, a variant of ⾜（あし）	Important
		7	⾝		body
		7		left	body	a variant of ⾝（み）
		7	⾞		car
		7		left	car	a variant of ⾞（くるま）	Important
		7	⾟		spicy	bitter
		7	⾠		dragon sign
		7	⾡		move ahead
		7	⾢		community
		7	⾣		sake	bird
		7		left	sake	bird, a variant of ⾣（ひよみのとり）
		7	⾤		divide	rice, plant
		7		left	divide	rice, plant, a variant of ⾤（のごめ）
		7	⾥		village	city, logic
		7		left	village	city, logic, a variant of ⾥（さと）
		7	⾂		retainer	a variant of ⾂（しん）
		7			misfortune	cow, a variant of ⾇（まいあし）
		7	⻨		wheat	plant, a variant of ⿆（むぎ）
		7	束		bundle	tree, plant, mouth
		7	売		sell	legs, soil, crown
		8	⾦		gold	metal
		8		left	gold	metal, a variant of ⾦（かね）	Important
		8	⻑		long
		8	⾨	wrap	gate		Important
		8	⾩		hill	mound, mount
		8	⾪	right	to capture
		8	⾫		small bird
		8	⾬		rain
		8	⻗	rain	a variant of ⾬（あめ）	Important
		8	⾭		blue	green
		8	⻘		blue	green, a variant of ⾭（あお）
		8	⾮		wrong
		8	⻟	left	food	eat, a variant of ⾷（しょく）
		8	⻫		alike	a variant of ⿑（せい）
		9	⾯		face	mask
		9	⾰		leather
		9			leather
		9	⾲		leek	plant
		9	⾳		sound
		9	⾴	right	page	head	Important
		9	⾵		wind
		9	⾶		fly
		9	⾷		food	eat
		9	⾸		head
		9	⾹		scent
		9	要		need
		10	⾺		horse	animal
		10		left	horse	a variant of ⾺（うま）
		10	⾻		bone
		10		left	bone	a variant of ⾻（ほね）
		10	⾼		high
		10	⾽	top	long hair
		10	⾾	wrap	fighting
		10	⾿		herbs
		10	⿀		tripod
		10	⿁		demon
		10	⾱		leather	a variant of （なめしがわ）
		11	⿂		fish	animal
		11		left	fish	a variant of ⿂（うお）	Important
		11	⿃		bird	animal
		11	⿄		salt
		11	⿅		deer	animal
		11	⿆		wheat	plant
		11	⿇		hemp	plant
		11		top	hemp	plant, a variant of ⿇（あさ）
		11	⻩		yellow	a variant of ⿈（き）
		11	黒		black	a variant of ⿊（くろ）
		11	⻲		turtle	animal, a variant of ⿔（かめ）
		12	⿈		yellow
		12	⿉		millet
		12	⿊		black	logic
		12	⿋		embroider
		12	⻭		tooth	teeth, a variant of ⿒（は）
		13	⿌		frog	animal
		13	⿍		tripod
		13	⿎		drum
		13	⿏		mouse	animal
		14	⿐		nose
		14	⿑		alike
		15	⿒		tooth	teeth
		16	⿓		dragon	animal
		16	⿔		turtle	animal
		17	⿕		flute`
}
