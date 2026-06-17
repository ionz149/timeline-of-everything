import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import EventSearch from "./EventSearch";
import LaneFilters from "./LaneFilters";

interface TimelineHeaderProps {
  visibleLanes: string[];

  setVisibleLanes: React.Dispatch<
    React.SetStateAction<string[]>
  >;

  onSelectEvent: (eventId: string) => void;
  onFocusSearch: () => void;
}

export default function TimelineHeader({
  visibleLanes,
  setVisibleLanes,
  onSelectEvent,
  onFocusSearch,
}: TimelineHeaderProps) {
  const [showLaneFilters, setShowLaneFilters] =
    useState(false);

  const filtersRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        filtersRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }

      setShowLaneFilters(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="timeline-header bg-zinc-900 border-b-zinc-500 border absolute top-0 left-0 z-30 w-full px-6 py-4">
      <div className="flex items-start justify-between gap-2 w-full">
        <h1 className="text-white text-2xl font-bold flex flex-row gap-2 items-center m-0">
          Timeline of Everything
        </h1>

        <EventSearch
          onSelectEvent={onSelectEvent}
          onFocusSearch={onFocusSearch}
        />

        <button
          ref={buttonRef}
          onClick={() =>
            setShowLaneFilters(prev => !prev)
          }
          className="bg-zinc-800 text-white px-3 py-2 rounded flex items-center gap-2"
        >
          <SlidersHorizontal
            size={20}
            color="white"
            strokeWidth={2}
          />

          {/* <span>
            {showLaneFilters
              ? "Hide Filters"
              : "Show Filters"}
          </span> */}
        </button>
      </div>

      <div ref={filtersRef} className={`absolute right-0  overflow-hidden top-full  p-4 flex transition-transform duration-300 ease-in-out ${
            showLaneFilters
              ? "translate-x-0"
              : "translate-x-full"
          }`}>
        <div
          className="bg-zinc-800 rounded-md p-4"
        >
          <LaneFilters
            visibleLanes={visibleLanes}
            setVisibleLanes={setVisibleLanes}
          />
        </div>
      </div>
    </div>
  );
}