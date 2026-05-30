import { lanes } from "../config/lanes";

export type Category = (typeof lanes)[number]["id"];

export interface TimelineEvent {
  id: string;
  title: string;
  startYear: number;
  endYear: number;
  category: EventCategory;
  region?: string;
  color?: string;
}