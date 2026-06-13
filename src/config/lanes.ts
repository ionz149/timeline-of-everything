import {Crown, Swords, FlaskConical, Earth, Drama, ChartLine, Bot, Landmark, CircleQuestionMark} from "lucide-react";

export const lanes = [
    {
        id: "empires",
        label: "Empires",
        color: "#CB1010",
        icon: Crown,
        description: "The rise, expansion, governance, and collapse of kingdoms, empires, dynasties, and civilizations.",
        enabled: true
    },
    {
        id: "warfare",
        label: "Warfare",
        color: "#107ACB",
        icon: Swords,
        description: "Armed conflicts, military campaigns, battles, revolutions, and major developments in warfare.",
        enabled: true
    },
    {
        id: "science",
        label: "Science",
        color: "#0EA222",
        icon: FlaskConical,
        description: "Discoveries, theories, research breakthroughs, and advances in understanding the natural world.",
        enabled: true
    },
    {
        id: "politics",
        label: "Politics",
        color: "#8626ED",
        icon: Earth,
        description: "Governments, laws, political movements, diplomacy, elections, treaties, and statecraft.",
        enabled: true
    },
    {
        id: "culture",
        label: "Culture",
        color: "#CB9310",
        icon: Drama,
        description: "Art, literature, religion, philosophy, language, entertainment, and social movements.",
        enabled: true
    },
    {
        id: "economy",
        label: "Economy",
        color: "#FFA100",
        icon: ChartLine,
        description: "Trade, finance, markets, industry, economic systems, and major shifts in wealth and commerce.",
        enabled: true
    },
    {
        id: "technology",
        label: "Technology",
        color: "",
        icon: Bot,
        description: "Inventions, engineering achievements, tools, machines, computing, and technological innovation.",
        enabled: true
    },
    {
        id: "wonders",
        label: "Wonders",
        color: "#EAED26",
        icon: Landmark,
        description: "Extraordinary monuments, architectural achievements, natural wonders, and iconic landmarks.",
        enabled: true
    },
    {
        id: "other",
        label: "Other",
        color: "",
        icon: CircleQuestionMark,
        description: "Significant events that do not clearly fit within another category.",
        enabled: true
    },
] as const;

export const laneHeight = 60;