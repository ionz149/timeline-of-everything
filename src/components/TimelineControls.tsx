import {
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  ArrowRight,
  SquareSquare,
  ChevronsDown,
  ChevronsUp
} from "lucide-react";

interface TimelineControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onCenter: () => void;
  onToggleLanes: () => void;
  areAllLanesOpen: boolean;
}

export default function TimelineControls({
  onZoomIn,
  onZoomOut,
  onPanLeft,
  onPanRight,
  onCenter,
  onToggleLanes,
  areAllLanesOpen
}: TimelineControlsProps) {
  return (
    <div className="flex flex-row gap-2">
      <button
        onClick={onZoomIn}
        className="bg-zinc-800 text-white px-3 py-2 rounded"
      >
        <ZoomIn size={20} color="white" strokeWidth={2} />
        <span className="sr-only">Zoom In</span>
      </button>

      <button
        onClick={onZoomOut}
        className="bg-zinc-800 text-white px-3 py-2 rounded"
      >
        <ZoomOut size={20} color="white" strokeWidth={2} />
        <span className="sr-only">Zoom Out</span>
      </button>

      <button
        onClick={onPanLeft}
        className="bg-zinc-800 text-white px-3 py-2 rounded"
      >
        <ArrowLeft size={20} color="white" strokeWidth={2} />
        <span className="sr-only">Left</span>
      </button>

      <button
        onClick={onCenter}
        className="bg-blue-600 text-white px-3 py-2 rounded"
      >
        <SquareSquare size={20} color="white" strokeWidth={2} />
        <span className="sr-only">Center</span>
      </button>

      <button
        onClick={onPanRight}
        className="bg-zinc-800 text-white px-3 py-2 rounded"
      >
        <ArrowRight size={20} color="white" strokeWidth={2} />
        <span className="sr-only">Right</span>
      </button>

      <button
        onClick={onToggleLanes}
        className="bg-zinc-800 text-white px-3 py-2 rounded"
      >
        {areAllLanesOpen ? (
          <ChevronsUp
            size={20}
            color="white"
            strokeWidth={2}
          />
        ) : (
          <ChevronsDown
            size={20}
            color="white"
            strokeWidth={2}
          />
        )}

        <span className="sr-only">
          {areAllLanesOpen
            ? "Close All"
            : "Open All"}
        </span>
      </button>
    </div>
  );
}