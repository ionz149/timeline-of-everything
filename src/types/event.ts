export type EventCategory =
  | "warfare"
  | "science"
  | "politics"
  | "culture"
  | "economy"
  | "technology"
  | "empires"
  | "wonders"
  | "other";

export interface TimelineEvent {
  id: string;
  title: string;
  startYear: number;
  endYear: number;
  category: EventCategory;
  region?: string;

  // optional per-event color
  color?: string;
}