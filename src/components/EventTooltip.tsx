import type { TimelineEvent } from "../types/event";
import { formatYear } from "../utils/formatYear";

interface EventTooltipProps {
  event: TimelineEvent;
}

export default function EventTooltip({
  event,
}: EventTooltipProps) {
  return (
    <div className="event-tooltip">
      <h3 className="text-white font-bold">{event.title}</h3>
      <p className="text-zinc-400 text-sm mt-1">
        {formatYear(event.startYear)}
        {" – "}
        {formatYear(event.endYear)}
      </p>
      <p className="text-zinc-300 text-sm mt-2 line-clamp-4">
        {event.description}
      </p>
    </div>
  );
}