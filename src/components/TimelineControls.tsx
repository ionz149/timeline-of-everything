import {
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  ArrowRight,
  SquareSquare
} from "lucide-react";

interface TimelineControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onCenter: () => void;
}

export default function TimelineControls({
  onZoomIn,
  onZoomOut,
  onPanLeft,
  onPanRight,
  onCenter
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
    </div>
  );
}