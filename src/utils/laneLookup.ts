import { lanes } from "../config/lanes";

export const laneMap = Object.fromEntries(
  lanes.map(lane => [lane.id, lane])
);