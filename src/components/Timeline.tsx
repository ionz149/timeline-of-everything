import { useRef, useState, useEffect } from "react";
import { events } from "../data/events";
import { yearToX } from "../utils/timelineScale";
import { formatYear } from "../utils/formatYear";
import { laneMap } from "../utils/laneLookup";
import { lanes, laneHeight } from "../config/lanes";
import { packLaneEvents } from "../utils/packLaneEvents";
import { laneBackground } from "../utils/laneStyle";
import TimelineHeader from "./TimelineHeader";
import EventPanel from "./EventPanel";
import { useTimelineCamera } from "../hooks/useTimelineCamera";


const VIEWPORT_WIDTH = 1400;

export default function Timeline() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  // const [zoom, setZoom] = useState(1);
  // const [panX, setPanX] = useState(0);
  const {
    zoom,
    setZoom,
    panX,
    setPanX,
    animateToPan,
  } = useTimelineCamera();

  const [selectedEventId, setSelectedEventId] =
    useState<string | null>(null);

  const selectedEvent = events.find(
    e => e.id === selectedEventId
  );

  // =========================
  // FILTERS
  // =========================
  const [visibleLanes, setVisibleLanes] = useState<string[]>(
    lanes.map(lane => lane.id)
  );

  const packed = packLaneEvents(events);

  const visibleLaneDefinitions = lanes.filter(lane =>
    visibleLanes.includes(lane.id)
  );

  // =========================
  // LAYOUT CONFIG
  // =========================
  const HEADER_HEIGHT = 50;
  const ROW_HEIGHT = 35;
  const BASE_PADDING = 40;

  // number of rows per lane (from packing)
  const laneRowCounts: Record<string, number> = {};

  visibleLaneDefinitions.forEach(lane => {
    laneRowCounts[lane.id] = packed[lane.id]?.length ?? 0;
  });

  // compute lane start positions + total heights
  const laneStartY: Record<string, number> = {};
  const laneHeights: Record<string, number> = {};

  let currentY = 160;

  visibleLaneDefinitions.forEach(lane => {
    const rows = laneRowCounts[lane.id] ?? 0;

    const height = Math.max(
      laneHeight,
      HEADER_HEIGHT +
      rows * ROW_HEIGHT +
      BASE_PADDING
    );

    laneStartY[lane.id] = currentY;
    laneHeights[lane.id] = height;

    currentY += height;
  });

  const getLaneY = (laneId: string) => laneStartY[laneId] ?? 160;

  // =========================
  // INTERACTION STATE
  // =========================
  const [isDragging, setIsDragging] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [velocityX, setVelocityX] = useState(0);

  const centerOnZero = () => {
    const worldZeroX = yearToX(0);
    const centerScreen = VIEWPORT_WIDTH / 2;
    setPanX(centerScreen - worldZeroX * zoom);
  };

  const jumpToEvent = (eventId: string) => {
    const event = events.find(
      e => e.id === eventId
    );

    if (!event) return;

    const eventX =
      worldToScreen(event.startYear);

    const centerScreen =
      VIEWPORT_WIDTH / 2;

    const focusOffset = -250;

    const targetPan =
      centerScreen +
      focusOffset -
      eventX;

    animateToPan(
      targetPan,
      600,
      () => {
        setSelectedEventId(event.id);
      }
    );
  };

  // =========================
  // WHEEL ZOOM
  // =========================
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();

    const zoomIntensity = 0.0015;

    const direction = Math.exp(-e.deltaY * zoomIntensity);

    const newZoom = Math.max(0.02, Math.min(6, zoom * direction));

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
  // DRAG
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

  // inertia
  useEffect(() => {
    if (isDragging) return;
    if (Math.abs(velocityX) < 0.1) return;

    const frame = requestAnimationFrame(() => {
      setPanX(prev => prev + velocityX);
      setVelocityX(v => v * 0.92);
    });

    return () => cancelAnimationFrame(frame);
  }, [isDragging, velocityX]);

  // =========================
  // TICKS
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

  for (let y = -3400; y <= 2025; y += step) {
    ticksSet.add(y);
  }

  ticksSet.add(0);

  const ticks = Array.from(ticksSet).sort((a, b) => a - b);

  const worldToScreen = (year: number) => yearToX(year) * zoom;

  const scaledFontSize = () =>
    Math.max(10, Math.min(18, 10 + zoom * 2));

  const axisStart = worldToScreen(-3400);
  const axisEnd = worldToScreen(2025);

  // =========================
  // RENDER
  // =========================
  return (
    <div
      className="fixed inset-0 bg-zinc-950 overflow-hidden select-none"
      onClick={() => setSelectedEventId(null)}
    >

      {selectedEvent && (
        <EventPanel
          event={selectedEvent}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      <TimelineHeader
        visibleLanes={visibleLanes}
        setVisibleLanes={setVisibleLanes}
        onSelectEvent={jumpToEvent}
        onZoomIn={() => setZoom(z => z * 1.2)}
        onZoomOut={() => setZoom(z => z / 1.2)}
        onPanLeft={() => setPanX(x => x - 200)}
        onPanRight={() => setPanX(x => x + 200)}
        onCenter={centerOnZero}
      />

      {/* SVG */}
      <svg
        ref={svgRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        width={VIEWPORT_WIDTH}
        height="100%"
        // height={currentY + 200}
        className={`w-full h-full relative z-10 bg-zinc-900 select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <g transform={`translate(${panX},0)`}>

          {/* AXIS */}
          <line x1={axisStart} y1={120} x2={axisEnd} y2={120} stroke="#666" />

          {/* TICKS */}
          {ticks.map(year => {
            const x = worldToScreen(year);
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
                  fontSize={isZero ? scaledFontSize() + 2 : scaledFontSize()}
                  fontWeight={isZero ? "bold" : "normal"}
                >
                  {isZero ? "YEAR 0 (ANCHOR)" : formatYear(year)}
                </text>
              </g>
            );
          })}

          {/* LANES */}
          {visibleLaneDefinitions.map(lane => {
            const Icon = lane.icon;
            return (
            <g key={lane.id}>
              <rect
                x={axisStart}
                y={getLaneY(lane.id) - 30}
                width={axisEnd - axisStart}
                height={laneHeights[lane.id]}
                fill={laneBackground(lane.color)}
                // stroke={lane.color ?? "#333"}
                // strokeOpacity={0.5}
              />

              <foreignObject
                x={axisStart + 20}
                y={getLaneY(lane.id) - 18}
                width={20}
                height={20}
              >
                <Icon size={20} color="white" strokeWidth={2} />
              </foreignObject>
              <text
                x={axisStart + 50}
                y={getLaneY(lane.id)}
                fill="#888"
                fontSize={18}
                fontWeight="bold"
              >
                {/* {lane.icon}  */}
                {lane.label.toUpperCase()}
              </text>
              <text
                x={axisStart + 20}
                y={getLaneY(lane.id) + 24}
                fill="#888"
                fontSize={16}
              >
                {lane.description}
              </text>
            </g>
            )
          })}

          {/* EVENTS */}
          {visibleLaneDefinitions.map(lane => {
            const rows = packed[lane.id] ?? [];

            return rows.map((row, rowIndex) =>
              row.map(event => {
                const x = worldToScreen(event.startYear);
                const x2 = worldToScreen(event.endYear);
                const width = x2 - x;
                const y =
                  getLaneY(lane.id) +
                  HEADER_HEIGHT +
                  rowIndex * ROW_HEIGHT;

                return (
                  <g
                    key={event.id}
                    transform={`translate(${x}, ${y})`}
                    // onClick={() => setSelectedEventId(event.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      jumpToEvent(event.id);
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      width={width}
                      height={24}
                      fill={
                        event.color ??
                        laneMap[event.category]?.color ??
                        "#888888"
                      }
                      rx={4}
                    />
                    <text x={8} y={16} fill="white" fontSize={scaledFontSize()}>
                      {event.title}
                    </text>
                  </g>
                );
              })
            );
          })}

        </g>
      </svg>
    </div>
  );
}