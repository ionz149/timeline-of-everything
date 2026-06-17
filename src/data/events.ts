import type { TimelineEvent } from "../types/event";

export const events: TimelineEvent[] = [
	{
		id: "egyptian-empire",
		title: "Egyptian Empire",
		startYear: -3100,
		endYear: -30,
		categories: ["empires", "warfare"],
		region: "Africa",
		// color: "#991b1b",
		teaser: "One of the world’s earliest great civilizations, built along the Nile. Famous for pharaohs, pyramids, and a deeply religious society centered on the afterlife.",
		description: "Ancient Egypt was one of the world’s earliest and longest-lasting civilizations, centered along the Nile River. It developed a highly organized state ruled by pharaohs, with strong religious and political integration. Known for monumental architecture such as pyramids and temples, it also made major advances in writing (hieroglyphs), engineering, agriculture, and centralized administration. Egyptian society was deeply religious, with beliefs centered on the afterlife and divine kingship."
	},

	{
		id: "norte-chico-empire",
		title: "Norte Chico Empire",
		startYear: -3000,
		endYear: -1800,
		categories: ["empires"],
		region: "South America",
		color: "#2563eb",
		teaser: "An early Andean civilization that built massive ceremonial sites without pottery or writing. A mysterious, highly organized river-and-coast society.",
		description: "The Norte Chico civilization was one of the earliest known complex societies in the Americas, located on the central coast of present-day Peru. It is notable for developing large urban settlements and monumental architecture without evidence of pottery or extensive warfare. Its economy was based heavily on agriculture supported by irrigation and fishing resources. It is often considered a foundational civilization in Andean cultural development."
	},

	{
		id: "babylonian-empire",
		title: "Babylonian Empire",
		startYear: -1792,
		endYear: -1595,
		categories: ["empires"],
		region: "Mesopotamia",
		color: "#7c3aed",
		teaser: "A powerful Mesopotamian culture known for Babylon, the Code of Hammurabi, and advances in law, math, and astronomy.",
		description: "The Babylonian Empire was a major Mesopotamian civilization centered in the city of Babylon. It is best known for its legal code tradition, particularly the Code of Hammurabi, one of the earliest written legal systems. Babylon became a cultural and intellectual hub, advancing mathematics, astronomy, and literature. The empire’s authority fluctuated over time but remained highly influential in the ancient Near East."
	},

	{
		id: "shang-dynasty",
		title: "Shang Dynasty",
		startYear: -1751,
		endYear: -1111,
		categories: ["empires"],
		region: "China",
		teaser: "China’s earliest confirmed dynasty. Known for bronze work, oracle bone writing, and ritual-based royal power.",
		description: "The Shang Dynasty is the earliest Chinese dynasty with clear archaeological and written evidence. It was characterized by a stratified society ruled by kings who controlled regional settlements through kinship and military power. The Shang are known for advanced bronze casting, early Chinese writing (oracle bone script), and complex ritual practices. Their political system laid the foundation for later Chinese dynasties."
	},

	{
		id: "zhou-dynasty",
		title: "Zhou Dynasty",
		startYear: -1000,
		endYear: -800,
		categories: ["empires"],
		region: "China",
		teaser: "A long-lasting dynasty that introduced the Mandate of Heaven. Later fragmented into competing states that shaped Chinese philosophy.",
		description: "The Zhou Dynasty succeeded the Shang and is known for introducing the Mandate of Heaven, a political philosophy that justified dynastic rule based on moral legitimacy. It developed a feudal-like system where power was distributed among regional lords. Over time, central authority weakened, leading to fragmentation and philosophical development during the later Eastern Zhou period. This era produced major schools of thought, including Confucianism and Daoism."
	},

	{
		id: "tang-dynasty",
		title: "T'ang Dynasty",
		startYear: 618,
		endYear: 906,
		categories: ["empires"],
		region: "China",
		teaser: "A golden age of Chinese culture and power. Cosmopolitan cities, Silk Road trade, and major advances in poetry and governance.",
		description: "The Tang Dynasty is often considered a golden age of Chinese civilization, marked by cultural flourishing, political stability, and extensive trade along the Silk Road. It developed a strong centralized bureaucracy and expanded China’s influence across East Asia. Poetry, art, and cosmopolitan urban life thrived during this period. The dynasty also saw significant religious diversity, including Buddhism, Daoism, and foreign influences."
	},

	{
		id: "sung-dynasty",
		title: "Sung Dynasty",
		startYear: 906,
		endYear: 1278,
		categories: ["empires"],
		region: "China",
		teaser: "An era of major innovation and commerce. Printing, paper money, and rapid urban growth despite weaker military strength.",
		description: "The Song Dynasty is known for remarkable economic growth, technological innovation, and cultural achievement. It saw the expansion of commerce, urbanization, and the use of paper money. Advances in engineering, navigation, and printing transformed Chinese society. Although militarily less dominant than earlier dynasties, the Song period is considered one of the most intellectually and economically dynamic eras in Chinese history."
	},

	{
		id: "roman-empire",
		title: "Roman Empire",
		startYear: -27,
		endYear: 476,
		categories: ["empires"],
		region: "Rome",
		teaser: "A vast empire spanning Europe, North Africa, and the Near East. Known for law, roads, engineering, and lasting cultural influence.",
		description: "The Roman Empire was one of the largest and most influential civilizations in world history, spanning Europe, North Africa, and the Middle East. It developed sophisticated systems of law, engineering, governance, and military organization. Roman culture spread widely through Latin language, infrastructure such as roads and aqueducts, and urbanization. The empire eventually split into eastern and western halves, with the Western Roman Empire collapsing in the 5th century."
	},

	{
		id: "american-revolution",
		title: "American Revolution",
		startYear: 1765,
		endYear: 1783,
		categories: ["warfare"],
		region: "united-states",
	},

	{
		id: "ww1",
		title: "World War I",
		startYear: 1914,
		endYear: 1918,
		categories: ["warfare"],
		region: "global",
	},

	{
		id: "ww2",
		title: "World War II",
		startYear: 1939,
		endYear: 1945,
		categories: ["warfare"],
		region: "global",
	},

	{
		id: "einstein_relativity",
		title: "General Relativity Published",
		startYear: 1915,
		endYear: 1915,
		categories: ["science"],
	},

	{
		id: "apollo_11",
		title: "Apollo 11 Moon Landing",
		startYear: 1969,
		endYear: 1969,
		categories: ["science"],
	},
];