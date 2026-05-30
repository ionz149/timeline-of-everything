import type { TimelineEvent } from "../types/event";

/**
 * Packs events into non-overlapping rows per lane.
 */
export function packLaneEvents(events: TimelineEvent[]) {
  const lanes: Record<string, TimelineEvent[][]> = {};

  const isOverlap = (a: TimelineEvent, b: TimelineEvent) => {
    return !(a.endYear < b.startYear || b.endYear < a.startYear);
  };

  for (const event of events) {
    const lane = event.category;

    if (!lanes[lane]) {
      lanes[lane] = [];
    }

    let placed = false;

    for (const row of lanes[lane]) {
      const overlap = row.some(e => isOverlap(e, event));

      if (!overlap) {
        row.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) {
      lanes[lane].push([event]);
    }
  }

  return lanes;
}