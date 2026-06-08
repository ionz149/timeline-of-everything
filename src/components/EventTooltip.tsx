import type { TimelineEvent } from "../types/events";
import { formatYear } from "../utils/formatYear";

interface EventTooltipProps {
  event: TimelineEvent;
}

export default function EventTooltip({
  event,
}: EventTooltipProps) {
  return (
    <div className="pointer-events-none absolute z-50 left-6 bottom-6 max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
      <h3 className="text-white font-bold">
        {event.title}
      </h3>

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