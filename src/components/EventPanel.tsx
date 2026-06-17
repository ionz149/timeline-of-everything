import type { TimelineEvent } from "../types/event";
import { formatYear } from "../utils/formatYear";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface EventPanelProps {
  event: TimelineEvent;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export default function EventPanel({
  event,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: EventPanelProps) {
  return (
    <div
      className="absolute right-0 top-0 h-full w-100 bg-zinc-900 border-l border-zinc-700 z-40 p-6 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white"
        >
          <X size={20} color="white" strokeWidth={2} />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="bg-zinc-800 text-white px-3 py-2 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} color="white" strokeWidth={2} />
            <span className="sr-only">Previous Event</span>
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="bg-zinc-800 text-white px-3 py-2 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} color="white" strokeWidth={2} />
            <span className="sr-only">Next Event</span>
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">
        {event.title}
      </h2>

      <div className="text-zinc-400 mb-4">
        {formatYear(event.startYear)}
        {" – "}
        {formatYear(event.endYear)}
      </div>

      {event.region && (
        <div className="text-zinc-300 mb-4">
          {event.region}
        </div>
      )}

      {event.description && (
        <div className="text-zinc-300">
          {event.description}
        </div>
      )}
    </div>
  );
}