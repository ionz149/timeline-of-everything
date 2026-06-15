import EventSearch from "./EventSearch";
import LaneFilters from "./LaneFilters";
import TimelineControls from "./TimelineControls";

interface TimelineHeaderProps {
  visibleLanes: string[];
  setVisibleLanes: React.Dispatch<
    React.SetStateAction<string[]>
  >;

  onSelectEvent: (eventId: string) => void;

  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onCenter: () => void;
  onToggleLanes: () => void;
  areAllLanesOpen: boolean;
}

export default function TimelineHeader({
  visibleLanes,
  setVisibleLanes,
  onSelectEvent,
  onZoomIn,
  onZoomOut,
  onPanLeft,
  onPanRight,
  onCenter,
  onToggleLanes,
  areAllLanesOpen
}: TimelineHeaderProps) {
  return (
    <div
      className="absolute top-4 left-0 z-30 flex justify-between gap-2 w-full px-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h1 className="text-white text-2xl font-bold flex flex-row gap-2 items-center">
        Timeline of Everything
      </h1>

      <EventSearch
        onSelectEvent={onSelectEvent}
      />

      <LaneFilters
        visibleLanes={visibleLanes}
        setVisibleLanes={setVisibleLanes}
      />

      <TimelineControls
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onPanLeft={onPanLeft}
        onPanRight={onPanRight}
        onCenter={onCenter}
        onToggleLanes={onToggleLanes}
        areAllLanesOpen={areAllLanesOpen}
      />
    </div>
  );
}