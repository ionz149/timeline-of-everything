import type { TimelineEvent } from "../types/event";

export const events: TimelineEvent[] = [
	{
		id: "pyramids",
		title: "Great Pyramid of Giza",
		startYear: -2580,
		endYear: -2560,
		category: "wonders",
		region: "egypt",			
	},

	{
		id: "roman-empire",
		title: "Roman Empire",
		startYear: -27,
		endYear: 476,
		category: "empires",
		region: "rome",		
	},

	{
		id: "american-revolution",
		title: "American Revolution",
		startYear: 1765,
		endYear: 1783,
		category: "warfare",
		region: "united-states",
	},  	
	{
		id: "ww1",
		title: "World War I",
		startYear: 1914,
		endYear: 1918,
		category: "warfare",
		region: "global",
	},
	{
		id: "ww2",
		title: "World War II",
		startYear: 1939,
		endYear: 1945,
		category: "warfare",
		region: "global",
	},
	{
		id: "einstein_relativity",
		title: "General Relativity Published",
		startYear: 1915,
		endYear: 1915,
		category: "science",
	},
	{
		id: "apollo_11",
		title: "Apollo 11 Moon Landing",
		startYear: 1969,
		endYear: 1969,
		category: "science",
	},
];