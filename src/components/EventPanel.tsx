import type { TimelineEvent } from "../types/event";
import { formatYear } from "../utils/formatYear";
import { X } from 'lucide-react';

interface EventPanelProps {
    event: TimelineEvent;
    onClose: () => void;
}

// TO DO:
// event images
// sources
// Wikipedia links
// related events
// previous/next buttons
// category badges
// map locations
// external references

export default function EventPanel({
    event,
    onClose,
}: EventPanelProps) {
    return (
        <div
        className="absolute right-0 top-0 h-full w-[400px] bg-zinc-900 border-l border-zinc-700 z-40 p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={onClose}
                className="mb-4 text-zinc-400 hover:text-white"
            >
                <X size={20} color="white" strokeWidth={2} />
                <span className="sr-only">Close</span>
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">
                {event.title}
            </h2>

            <div className="text-zinc-400 mb-4">
                {formatYear(event.startYear)}
                {" – "}
                {formatYear(event.endYear)}
            </div>

            {event.region && (
                <div className="text-zinc-300">
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