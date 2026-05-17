import { useRef, useState, useEffect } from "react";
import { events } from "../data/events";
import { yearToX } from "../utils/timelineScale";
import { formatYear } from "../utils/formatYear";

const HEIGHT = 600;
const VIEWPORT_WIDTH = 1400;

export default function Timeline() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);

  // =========================
  // 🖱️ DRAG STATE (NEW)
  // =========================
  const [isDragging, setIsDragging] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [velocityX, setVelocityX] = useState(0);

  const centerOnZero = () => {
    const worldZeroX = yearToX(0);
    const centerScreen = VIEWPORT_WIDTH / 2;

    setPanX(centerScreen - worldZeroX * zoom);
  };

  // =========================
  // 🎯 WHEEL ZOOM (CURSOR-BASED)
  // =========================
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();

    const zoomFactor = 1.1;
    const direction = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;

    const newZoom = Math.max(0.2, Math.min(10, zoom * direction));

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;

    const worldX = (mouseX - panX) / zoom;

    const newPanX = mouseX - worldX * newZoom;

    setZoom(newZoom);
    setPanX(newPanX);
  };

  // =========================
  // 🖱️ DRAG HANDLERS (NEW)
  // =========================
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setLastX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastX;

    setPanX(prev => prev + deltaX);
    setVelocityX(deltaX);

    setLastX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // =========================
  // ⚡ MOMENTUM / INERTIA LOOP (NEW)
  // =========================
  useEffect(() => {
    if (isDragging) return;
    if (Math.abs(velocityX) < 0.1) return;

    const frame = requestAnimationFrame(() => {
      setPanX(prev => prev + velocityX);
      setVelocityX(v => v * 0.92); // friction
    });

    return () => cancelAnimationFrame(frame);
  }, [isDragging, velocityX]);

  // =========================
  // 📏 DYNAMIC TICK DENSITY
  // =========================
  const getTickStep = (z: number) => {
    if (z < 0.4) return 1000;
    if (z < 0.8) return 500;
    if (z < 1.5) return 250;
    if (z < 3) return 100;
    return 50;
  };

  const step = getTickStep(zoom);

  const ticksSet = new Set<number>();

  for (let y = -3000; y <= 2025; y += step) {
    ticksSet.add(y);
  }

  ticksSet.add(0); // force year 0

  const ticks = Array.from(ticksSet).sort((a, b) => a - b);

  // FIXED AXIS RANGE
  const axisStart = yearToX(-3000);
  const axisEnd = yearToX(2025);

  return (
    <div className="relative w-screen h-screen bg-zinc-950 overflow-hidden">

      {/* controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">

        <button onClick={() => setZoom(z => z * 1.2)} className="bg-zinc-800 text-white px-3 py-2 rounded">
          Zoom In
        </button>

        <button onClick={() => setZoom(z => z / 1.2)} className="bg-zinc-800 text-white px-3 py-2 rounded">
          Zoom Out
        </button>

        <button onClick={() => setPanX(x => x - 200)} className="bg-zinc-800 text-white px-3 py-2 rounded">
          Left
        </button>

        <button onClick={() => setPanX(x => x + 200)} className="bg-zinc-800 text-white px-3 py-2 rounded">
          Right
        </button>

        <button onClick={centerOnZero} className="bg-blue-600 text-white px-3 py-2 rounded">
          Center
        </button>

      </div>

      {/* SVG VIEWPORT */}
      <svg
        ref={svgRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        width={VIEWPORT_WIDTH}
        height={HEIGHT}
        className={`bg-zinc-900 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      >

        <g transform={`translate(${panX},0) scale(${zoom},1)`}>

          {/* AXIS */}
          <line
            x1={axisStart}
            y1={120}
            x2={axisEnd}
            y2={120}
            stroke="#666"
          />

          {/* TICKS */}
          {ticks.map(year => {
            const x = yearToX(year);
            const isZero = year === 0;

            return (
              <g key={year}>
                <line
                  x1={x}
                  y1={isZero ? 90 : 110}
                  x2={x}
                  y2={130}
                  stroke={isZero ? "#ff0000" : "#888"}
                  strokeWidth={isZero ? 3 : 1}
                />

                <text
                  x={x + 6}
                  y={isZero ? 85 : 105}
                  fill={isZero ? "#ff0000" : "#aaa"}
                  fontSize={isZero ? 14 : 10}
                  fontWeight={isZero ? "bold" : "normal"}
                >
                  {isZero ? "YEAR 0 (ANCHOR)" : formatYear(year)}
                </text>
              </g>
            );
          })}

          {/* EVENTS */}
          {events.map((event, i) => {
            const x = yearToX(event.startYear);
            const x2 = yearToX(event.endYear);

            const width = x2 - x;

            return (
              <g key={event.id} transform={`translate(${x}, ${160 + i * 60})`}>
                <rect
                  width={width}
                  height={24}
                  fill="#3b82f6"
                  rx={4}
                />

                <text
                  x={8}
                  y={16}
                  fill="white"
                  fontSize={12}
                >
                  {event.title}
                </text>
              </g>
            );
          })}

        </g>
      </svg>
    </div>
  );
}