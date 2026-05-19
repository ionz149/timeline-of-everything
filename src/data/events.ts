import type { TimelineEvent } from "../types/event";

export const events: TimelineEvent[] = [
	{
		id: "egyptian-empire",
		title: "Egyptian Empire",
		startYear: -3100,
		endYear: -30,
		category: "empires",
		region: "egypt",			
	},

	{
		id: "norte-chico-empire",
		title: "Norte Chico Empire",
		startYear: -3000,
		endYear: -1800,
		category: "empires",
		region: "Unknown",
	},	

	{
		id: "babylonian-empire",
		title: "Babylonian Empire",
		startYear: -1792,
		endYear: -1595,
		category: "empires",
		region: "Mesopotamia",
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