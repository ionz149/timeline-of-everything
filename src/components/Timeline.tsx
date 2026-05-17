import { useState } from "react";
import { events } from "../data/events";
import { yearToX } from "../utils/timelineScale";
import { formatYear } from "../utils/formatYear";

const HEIGHT = 600;
const VIEWPORT_WIDTH = 1400;

export default function Timeline() {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);

  const centerOnZero = () => {
    const worldZeroX = yearToX(0);
    const centerScreen = VIEWPORT_WIDTH / 2;

    setPanX(centerScreen - worldZeroX * zoom);
  };

  // ✅ FORCE ticks AND guarantee 0 exists
  const ticksSet = new Set<number>();

  for (let y = -3000; y <= 2025; y += 250) {
    ticksSet.add(y);
  }

  // 🔴 HARD GUARANTEE YEAR 0 EXISTS
  ticksSet.add(0);

  const ticks = Array.from(ticksSet).sort((a, b) => a - b);

  // FIXED AXIS RANGE
  const axisStart = yearToX(-3000);
  const axisEnd = yearToX(2025);

  return (
    <div className="relative w-screen h-screen bg-zinc-950 overflow-hidden">

      {/* controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">

        <button
          onClick={() => setZoom(z => z * 1.2)}
          className="bg-zinc-800 text-white px-3 py-2 rounded"
        >
          Zoom In
        </button>

        <button
          onClick={() => setZoom(z => z / 1.2)}
          className="bg-zinc-800 text-white px-3 py-2 rounded"
        >
          Zoom Out
        </button>

        <button
          onClick={() => setPanX(x => x - 200)}
          className="bg-zinc-800 text-white px-3 py-2 rounded"
        >
          Left
        </button>

        <button
          onClick={() => setPanX(x => x + 200)}
          className="bg-zinc-800 text-white px-3 py-2 rounded"
        >
          Right
        </button>

        <button
          onClick={centerOnZero}
          className="bg-blue-600 text-white px-3 py-2 rounded"
        >
          Center
        </button>

      </div>

      <svg width={VIEWPORT_WIDTH} height={HEIGHT} className="bg-zinc-900">

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
                {/* tick line */}
                <line
                  x1={x}
                  y1={isZero ? 90 : 110}
                  x2={x}
                  y2={130}
                  stroke={isZero ? "#ff0000" : "#888"}
                  strokeWidth={isZero ? 3 : 1}
                />

                {/* label */}
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