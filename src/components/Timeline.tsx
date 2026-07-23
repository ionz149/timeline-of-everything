import { useRef, useState, useEffect } from "react";
import { events } from "../data/events";
import { yearToX } from "../utils/timelineScale";
import { formatYear } from "../utils/formatYear";
import { laneMap } from "../utils/laneLookup";
import { lanes, laneHeight } from "../config/lanes";
import { packLaneEvents } from "../utils/packLaneEvents";
import { laneBackground } from "../utils/laneStyle";
import TimelineHeader from "./TimelineHeader";
import TimelineControls from "./TimelineControls";
import EventPanel from "./EventPanel";
import EventTooltip from "./EventTooltip";
import { useTimelineCamera } from "../hooks/useTimelineCamera";

const VIEWPORT_WIDTH = 1400;
const DRAG_THRESHOLD = 6;
const MIN_YEAR = -3400;
const MAX_YEAR = new Date().getFullYear();
const MAX_ZOOM = 30;
const AXIS_LABEL_FONT_SIZE = 12;
const MIN_TICK_LABEL_SPACING = 90;

const clamp = (
  value: number,
  min: number,
  max: number
) => Math.min(Math.max(value, min), max);

export default function Timeline() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  // const [zoom, setZoom] = useState(1);
  // const [panX, setPanX] = useState(0);
  const {
    zoom,
    setZoom,
    panX,
    setPanX,
    panY,
    setPanY,
    animateToPan,
    cancelCameraAnimation,
  } = useTimelineCamera();

  const [selectedEventId, setSelectedEventId] =
    useState<string | null>(null);

  const [hoveredEventId, setHoveredEventId] =
    useState<string | null>(null);

  const [highlightedLaneId, setHighlightedLaneId] =
    useState<string | null>(null);

  const selectedEvent = events.find(
    e => e.id === selectedEventId
  );

  const hoveredEvent = events.find(
    e => e.id === hoveredEventId
  );

  // =========================
  // FILTERS
  // =========================
  const [visibleLanes, setVisibleLanes] = useState<string[]>(lanes.map(lane => lane.id));
  // const [collapsedLanes, setCollapsedLanes] =  useState<string[]>([]);
  const [collapsedLanes, setCollapsedLanes] =
  useState<string[]>(
    lanes
      .slice(1)
      .map(lane => lane.id)
  );
  const packed = packLaneEvents(events);
  const isLaneCollapsed = (laneId: string) => collapsedLanes.includes(laneId);
  const revealLane = (laneId: string) => {
    setVisibleLanes(prev =>
      prev.includes(laneId)
        ? prev
        : [...prev, laneId]
    );

    setCollapsedLanes(prev =>
      prev.filter(id => id !== laneId)
    );

    setHighlightedLaneId(laneId);

    setTimeout(() => {
      setHighlightedLaneId(null);
    }, 2000);

  };

const visibleEvents = events
  .filter(event =>
    event.categories.some(category =>
      visibleLanes.includes(category)
    )
  )
  .sort((a, b) => a.startYear - b.startYear);

  const selectedEventIndex = visibleEvents.findIndex(
    event => event.id === selectedEventId
  );

  const hasPreviousEvent = selectedEventIndex > 0;

  const hasNextEvent =
    selectedEventIndex >= 0 &&
    selectedEventIndex < visibleEvents.length - 1;

  const visibleLaneDefinitions = lanes.filter(lane => visibleLanes.includes(lane.id));
  const toggleLane = (
    laneId: string
  ) => {
    setCollapsedLanes(prev =>
      prev.includes(laneId)
        ? prev.filter(id => id !== laneId)
        : [...prev, laneId]
    );
  };
  const areAllLanesOpen =
    visibleLaneDefinitions.every(
      lane =>
        !collapsedLanes.includes(
          lane.id
        )
  );
  const toggleAllLanes = () => {
    if (areAllLanesOpen) {
      setCollapsedLanes(
        visibleLaneDefinitions.map(
          lane => lane.id
        )
      );
    } else {
      setCollapsedLanes([]);
    }
  };

  useEffect(() => {
    if (visibleLaneDefinitions.length === 0) {
      return;
    }

    const firstVisibleLaneId =
      visibleLaneDefinitions[0].id;

    setCollapsedLanes(prev =>
      prev.filter(
        id => id !== firstVisibleLaneId
      )
    );
  }, [visibleLanes]);

  // =========================
  // LAYOUT CONFIG
  // =========================
  const HEADER_HEIGHT = 50;
  const ROW_HEIGHT = 35;
  const BASE_PADDING = 40;

  const STICKY_AXIS_Y = 96;
  const EDGE_PADDING = 80;

  const EVENT_TITLE_FONT_SIZE = 12;
  const EVENT_TITLE_HORIZONTAL_PADDING = 8;

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

    // const height = Math.max(
    //   laneHeight,
    //   HEADER_HEIGHT +
    //   rows * ROW_HEIGHT +
    //   BASE_PADDING
    // );

    const height = isLaneCollapsed(lane.id)
    ? HEADER_HEIGHT + 20
    : Math.max(
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
  // const [lastX, setLastX] = useState(0);
  // const [lastY, setLastY] = useState(0);
  const [lastPointerX, setLastPointerX] = useState(0);
  const [lastPointerY, setLastPointerY] = useState(0);
  const [velocityX, setVelocityX] = useState(0);
  const [velocityY, setVelocityY] = useState(0);

  const activePointersRef = useRef<
    Map<number, { x: number; y: number }>
  >(new Map());

  const pinchStartRef = useRef<{
    distance: number;
    centerX: number;
    centerY: number;
    zoom: number;
    panX: number;
    panY: number;
  } | null>(null);

  const primaryPointerStartRef = useRef<{
    id: number;
    x: number;
    y: number;
  } | null>(null);

  const primaryPointerMovedRef = useRef(false);

  const focusTimeoutRef =
    useRef<number | null>(null);

  const centerOnZero = () => {
    const worldZeroX = yearToX(0);
    const centerScreen = window.innerWidth / 2;

    setPanX(
      clampPanX(centerScreen - worldZeroX * zoom)
    );
  };

  const resetMapInteraction = () => {
    if (focusTimeoutRef.current !== null) {
      window.clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }

    cancelCameraAnimation();

    activePointersRef.current.clear();
    pinchStartRef.current = null;
    isMapGestureRef.current = false;
    primaryPointerStartRef.current = null;
    primaryPointerMovedRef.current = false;

    setIsDragging(false);
    setVelocityX(0);
    setVelocityY(0);
  };

  const focusEvent = (
    eventId: string
  ) => {
    resetMapInteraction();
    const event = events.find(
      e => e.id === eventId
    );

    if (!event) {
      return;
    }

    const primaryCategory = event.categories[0];

    if (!primaryCategory) {
      return;
    }

    // ====================
    // OPEN EVENT LANE
    // ====================
    setCollapsedLanes(prev => {
      if (
        !prev.includes(
          primaryCategory
        )
      ) {
        return prev;
      }

      return prev.filter(
        id =>
          id !== primaryCategory
      );
    });

    // ====================
    // CAMERA
    // ====================
    const eventX =
      worldToScreen(
        event.startYear
      );

    const centerScreen =
      VIEWPORT_WIDTH / 2;

    // animateToPan(
    //   centerScreen - eventX
    // );
    revealLane(primaryCategory);

    focusTimeoutRef.current = window.setTimeout(() => {
      animateToPan(
        clampPanX(centerScreen - eventX)
      );

      setSelectedEventId(event.id);
      focusTimeoutRef.current = null;
    }, 250);

    // ====================
    // PANEL
    // ====================
    setSelectedEventId(
      event.id
    );
  };

  const goToPreviousEvent = () => {
    if (!hasPreviousEvent) {
      return;
    }

    focusEvent(
      visibleEvents[selectedEventIndex - 1].id
    );
  };

  const goToNextEvent = () => {
    if (!hasNextEvent) {
      return;
    }

    focusEvent(
      visibleEvents[selectedEventIndex + 1].id
    );
  };

  // =========================
  // WHEEL ZOOM
  // =========================
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();

    const zoomIntensity = 0.0015;

    const direction = Math.exp(-e.deltaY * zoomIntensity);

    const minZoom = getMinZoom();

    const newZoom = Math.max(
      minZoom,
      Math.min(
        MAX_ZOOM,
        zoom * direction
      )
    );

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    const worldX = (mouseX - panX) / zoom;

    const newPanX = mouseX - worldX * newZoom;

    // setZoom(newZoom);
    // setPanX(newPanX);
    const newPanXBounds =
      getPanXBounds(newZoom);

    const clampedNewPanX = clamp(
      newPanX,
      newPanXBounds.min,
      newPanXBounds.max
    );

    setVelocityX(0);
    setVelocityY(0);
    setZoom(newZoom);
    setPanX(clampedNewPanX);
  };

  // =========================
  // DRAG
  // =========================
  const handlePointerDown = (
    e: React.PointerEvent<SVGSVGElement>
  ) => {
    if (e.pointerType !== "touch") {
      e.preventDefault();
    }

    setVelocityX(0);
    setVelocityY(0);

    e.currentTarget.setPointerCapture(e.pointerId);

    activePointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
    });

    const pointers = Array.from(
      activePointersRef.current.values()
    );

    if (pointers.length === 1) {
      primaryPointerStartRef.current = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
      };

      primaryPointerMovedRef.current = false;

      setIsDragging(false);
      setLastPointerX(e.clientX);
      setLastPointerY(e.clientY);
    }

    if (pointers.length === 2) {
      setIsDragging(false);
      primaryPointerMovedRef.current = true;
      isMapGestureRef.current = true;

      const [first, second] = pointers;
      const center = getPointerCenter(first, second);

      pinchStartRef.current = {
        distance: getPointerDistance(first, second),
        centerX: center.x,
        centerY: center.y,
        zoom,
        panX,
        panY,
      };
    }
  };

  const handlePointerMove = (
    e: React.PointerEvent<SVGSVGElement>
  ) => {
    e.preventDefault();

    if (!activePointersRef.current.has(e.pointerId)) {
      return;
    }

    activePointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
    });

    const pointers = Array.from(
      activePointersRef.current.values()
    );

    if (
      pointers.length === 2 &&
      pinchStartRef.current
    ) {
      isMapGestureRef.current = true;
      const [first, second] = pointers;
      const center = getPointerCenter(first, second);
      const distance = getPointerDistance(first, second);

      const zoomRatio =
        distance / pinchStartRef.current.distance;

      const minZoom = getMinZoom();

      const newZoom = Math.max(
        minZoom,
        Math.min(
          MAX_ZOOM,
          pinchStartRef.current.zoom * zoomRatio
        )
      );

      const startWorldX =
        (pinchStartRef.current.centerX -
          pinchStartRef.current.panX) /
        pinchStartRef.current.zoom;

      const newPanX =
        center.x - startWorldX * newZoom;

      const newPanY =
        pinchStartRef.current.panY +
        (center.y - pinchStartRef.current.centerY);

      const newPanXBounds =
        getPanXBounds(newZoom);

      const clampedNewPanX = clamp(
        newPanX,
        newPanXBounds.min,
        newPanXBounds.max
      );

      setZoom(newZoom);
      setPanX(clampedNewPanX);
      setPanY(clampPanY(newPanY));

      setVelocityX(0);
      setVelocityY(0);

      return;
    }

    if (pointers.length !== 1) {
      return;
    }

    const start = primaryPointerStartRef.current;

    if (!start) {
      return;
    }

    const totalDeltaX = e.clientX - start.x;
    const totalDeltaY = e.clientY - start.y;

    const hasMovedEnough =
      Math.abs(totalDeltaX) > DRAG_THRESHOLD ||
      Math.abs(totalDeltaY) > DRAG_THRESHOLD;

    if (!hasMovedEnough && !primaryPointerMovedRef.current) {
      return;
    }

    primaryPointerMovedRef.current = true;
    isMapGestureRef.current = true;
    setIsDragging(true);

    const deltaX = e.clientX - lastPointerX;
    const deltaY = e.clientY - lastPointerY;

    setPanX(prev => clampPanX(prev + deltaX));
    setPanY(prev => clampPanY(prev + deltaY));

    setVelocityX(deltaX);
    setVelocityY(deltaY);

    setLastPointerX(e.clientX);
    setLastPointerY(e.clientY);
  };

  const handlePointerUp = (
    e: React.PointerEvent<SVGSVGElement>
  ) => {
    e.preventDefault();

    activePointersRef.current.delete(e.pointerId);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    pinchStartRef.current = null;

    const remainingPointers = Array.from(
      activePointersRef.current.values()
    );

    if (remainingPointers.length === 1) {
      setIsDragging(true);
      setLastPointerX(remainingPointers[0].x);
      setLastPointerY(remainingPointers[0].y);
    } else {
      setIsDragging(false);
      primaryPointerStartRef.current = null;

      window.setTimeout(() => {
        isMapGestureRef.current = false;
        primaryPointerMovedRef.current = false;
      }, 100);
    }
  };

  const handlePointerCancel = (
    e: React.PointerEvent<SVGSVGElement>
  ) => {
    activePointersRef.current.delete(e.pointerId);
    pinchStartRef.current = null;
    setIsDragging(false);
  };

  const getPointerDistance = (
    first: { x: number; y: number },
    second: { x: number; y: number }
  ) => {
    const deltaX = second.x - first.x;
    const deltaY = second.y - first.y;

    return Math.sqrt(
      deltaX * deltaX + deltaY * deltaY
    );
  };

  const getPointerCenter = (
    first: { x: number; y: number },
    second: { x: number; y: number }
  ) => {
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    };
  };

  const isMapGestureRef = useRef(false);

  // inertia
  useEffect(() => {
    if (isDragging) return;

    if (
      Math.abs(velocityX) < 0.1 &&
      Math.abs(velocityY) < 0.1
    ) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      // setPanX(prev => prev + velocityX);
      // setPanY(prev => prev + velocityY);
      setPanX(prev => clampPanX(prev + velocityX));
      setPanY(prev => clampPanY(prev + velocityY));

      setVelocityX(v => v * 0.92);
      setVelocityY(v => v * 0.92);
    });

    return () => cancelAnimationFrame(frame);
  }, [isDragging, velocityX, velocityY]);

  useEffect(() => {
    let lastTouchEnd = 0;

    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = Date.now();

      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }

      lastTouchEnd = now;
    };

    document.addEventListener(
      "touchend",
      preventDoubleTapZoom,
      { passive: false }
    );

    return () => {
      document.removeEventListener(
        "touchend",
        preventDoubleTapZoom
      );
    };
  }, []);

  // =========================
  // TICKS
  // =========================
  const worldToScreen = (year: number) => yearToX(year) * zoom;
  const getTickStep = () => {
    const availableSteps = [
      1,
      2,
      5,
      10,
      25,
      50,
      100,
      200,
      500,
      1000,
    ];

    for (const step of availableSteps) {
      const startX = worldToScreen(0);
      const endX = worldToScreen(step);

      const pixelSpacing = Math.abs(
        endX - startX
      );

      if (
        pixelSpacing >=
        MIN_TICK_LABEL_SPACING
      ) {
        return step;
      }
    }

    return 1000;
  };

  const step = getTickStep();

  const ticksSet = new Set<number>();

  ticksSet.add(MIN_YEAR);
  ticksSet.add(0);
  ticksSet.add(MAX_YEAR);

  for (
    let year = step;
    year <= MAX_YEAR;
    year += step
  ) {
    ticksSet.add(year);
  }

  for (
    let year = -step;
    year >= MIN_YEAR;
    year -= step
  ) {
    ticksSet.add(year);
  }

  const ticks = Array.from(ticksSet).sort(
    (a, b) => a - b
  );

  const showEventTitles = zoom >= 0.15;
  const truncateEventTitle = (
    title: string,
    availableWidth: number
  ) => {
    const averageCharacterWidth =
      EVENT_TITLE_FONT_SIZE * 0.6;

    const maxCharacters = Math.floor(
      availableWidth / averageCharacterWidth
    );

    if (maxCharacters <= 1) {
      return "";
    }

    if (title.length <= maxCharacters) {
      return title;
    }

    if (maxCharacters <= 3) {
      return "…";
    }

    return `${title.slice(0, maxCharacters - 1)}…`;
  };

  // const axisStart = worldToScreen(-3400);
  // const axisEnd = worldToScreen(2025);
  const axisStart = worldToScreen(MIN_YEAR);
  const axisEnd = worldToScreen(MAX_YEAR);

  const contentTop = 90;
  const contentBottom = currentY + 120;

  // const minPanX =
  //   VIEWPORT_WIDTH - axisEnd - EDGE_PADDING;

  // const maxPanX =
  //   EDGE_PADDING - axisStart;

  const minPanY =
    window.innerHeight - contentBottom - EDGE_PADDING;

  const maxPanY =
    STICKY_AXIS_Y - contentTop;

  // const clampPanX = (value: number) =>
  // clamp(value, minPanX, maxPanX);

  const clampPanY = (value: number) =>
    clamp(value, minPanY, maxPanY);

  const getPanXBounds = (targetZoom: number) => {
    const targetAxisStart = yearToX(MIN_YEAR) * targetZoom;
    const targetAxisEnd = yearToX(MAX_YEAR) * targetZoom;
    const viewportWidth = window.innerWidth;

    return {
      min: viewportWidth - targetAxisEnd,
      max: -targetAxisStart,
    };
  };

  const getMinZoom = () => {
    const worldWidth =
      yearToX(MAX_YEAR) - yearToX(MIN_YEAR);

    return window.innerWidth / worldWidth;
  };

  const clampPanX = (value: number) => {
    const bounds = getPanXBounds(zoom);

    return clamp(
      value,
      bounds.min,
      bounds.max
    );
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div
      className="fixed inset-0 bg-zinc-950 overflow-hidden select-none touch-none"
      // onClick={() => setSelectedEventId(null)}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={() => {
        resetMapInteraction();
        setSelectedEventId(null);
      }}
    >

      {selectedEvent && (
        <div onClick={(e) => e.stopPropagation()}>
          <EventPanel
            event={selectedEvent}
            // onClose={() => setSelectedEventId(null)}
            onClose={() => {
              resetMapInteraction();
              setPanX(prev => clampPanX(prev));
              setPanY(prev => clampPanY(prev));
              setSelectedEventId(null);
            }}
            onPrevious={goToPreviousEvent}
            onNext={goToNextEvent}
            hasPrevious={hasPreviousEvent}
            hasNext={hasNextEvent}
          />
        </div>
      )}

      {hoveredEvent &&
        hoveredEvent.id !== selectedEventId && (
          <EventTooltip
            event={hoveredEvent}
          />
      )}

      <TimelineHeader
        visibleLanes={visibleLanes}
        setVisibleLanes={setVisibleLanes}
        onSelectEvent={focusEvent}
        onFocusSearch={() => setSelectedEventId(null)}
      />

      <div
        className="absolute bottom-6 right-6 z-30"
        onClick={(e) => e.stopPropagation()}
      >
        <TimelineControls
          // onZoomIn={() => setZoom(z => z * 1.2)}
          // onZoomOut={() => setZoom(z => z / 1.2)}
          onZoomIn={() =>
            setZoom(z =>
              Math.min(
                MAX_ZOOM,
                z * 1.2
              )
            )
          }
          onZoomOut={() =>
            setZoom(z => Math.max(getMinZoom(), z / 1.2))
          }
          // onPanLeft={() => setPanX(x => x - 200)}
          // onPanRight={() => setPanX(x => x + 200)}
          onPanLeft={() => setPanX(x => clampPanX(x - 200))}
          onPanRight={() => setPanX(x => clampPanX(x + 200))}
          onCenter={centerOnZero}
          onToggleLanes={toggleAllLanes}
          areAllLanesOpen={areAllLanesOpen}
        />
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        style={{ touchAction: "none" }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        width={VIEWPORT_WIDTH}
        height="100%"
        // height={currentY + 200}
        className={`w-full h-full relative z-10 bg-zinc-900 select-none touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <g transform={`translate(${panX},${panY})`}>

          {/* LANES */}
          {visibleLaneDefinitions.map(lane => {
            // const Icon = lane.icon;
            return (
            <g key={lane.id}>
              {/* <rect
                x={axisStart}
                y={getLaneY(lane.id) - 30}
                width={axisEnd - axisStart}
                height={laneHeights[lane.id]}
                fill={laneBackground(lane.color)}
                // stroke={lane.color ?? "#333"}
                // strokeOpacity={0.5}
              /> */}
              <rect
                x={-panX}
                y={getLaneY(lane.id) - 30}
                width="100%"
                height={laneHeights[lane.id]}
                fill={laneBackground(lane.color)}
              />
              {/* <g
                onClick={() => {
                  setCollapsedLanes(prev =>
                    prev.includes(lane.id)
                      ? prev.filter(id => id !== lane.id)
                      : [...prev, lane.id]
                  );
                }}
                className="cursor-pointer"
              >
                <rect
                  x={axisStart + 10}
                  y={getLaneY(lane.id) - 35}
                  width={axisEnd - axisStart}
                  height={80}
                  fill="transparent"
                />
                <text
                  x={axisStart + 20}
                  y={getLaneY(lane.id)}
                  fill="white"
                  fontSize={18}
                >
                  {isLaneCollapsed(lane.id) ? "+" : "−"}
                </text>
                <foreignObject
                  x={axisStart + 40}
                  y={getLaneY(lane.id) - 18}
                  width={20}
                  height={20}
                >
                  <Icon size={20} color="white" strokeWidth={2} />
                </foreignObject>
                <text
                  x={axisStart + 70}
                  y={getLaneY(lane.id)}
                  fill="#888"
                  fontSize={18}
                  fontWeight="bold"
                >
                  {lane.label.toUpperCase()}
                </text>
                <text
                  x={axisStart + 40}
                  y={getLaneY(lane.id) + 24}
                  fill="#888"
                  fontSize={16}
                >
                  {lane.description}
                </text>
              </g> */}
            </g>
            )
          })}

          {/* EVENTS */}
          {visibleLaneDefinitions.map(lane => {
            // const rows = packed[lane.id] ?? [];
            if (isLaneCollapsed(lane.id)) {
              return null;
            }

            const rows = packed[lane.id] ?? [];

            return rows.map((row, rowIndex) =>
              row.map(event => {
                const x = worldToScreen(event.startYear);
                const x2 = worldToScreen(event.endYear);
                const width = Math.max(
                  x2 - x,
                  12
                );
                const titleWidth = Math.max(
                  0,
                  width - EVENT_TITLE_HORIZONTAL_PADDING * 2
                );

                const displayTitle = truncateEventTitle(
                  event.title,
                  titleWidth
                );
                const y =
                  getLaneY(lane.id) +
                  HEADER_HEIGHT +
                  rowIndex * ROW_HEIGHT;

                return (
                  <g
                    key={event.id}
                    transform={`translate(${x}, ${y})`}
                    onMouseEnter={() =>
                      setHoveredEventId(event.id)
                    }
                    onMouseLeave={() =>
                      setHoveredEventId(null)
                    }
                    onPointerDown={(e) => {
                      if (e.pointerType !== "touch") {
                        e.stopPropagation();
                        isMapGestureRef.current = false;
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();

                      if (isMapGestureRef.current) {
                        return;
                      }

                      focusEvent(event.id);
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      width={width}
                      height={24}
                      fill={
                        event.color ??
                        lane.color ??
                        "#888888"
                      }
                      rx={12}
                    />
                    {showEventTitles && displayTitle && (
                      <text
                        x={EVENT_TITLE_HORIZONTAL_PADDING}
                        y={16}
                        fill="white"
                        fontSize={EVENT_TITLE_FONT_SIZE}
                        pointerEvents="none"
                      >
                        {displayTitle}
                      </text>
                    )}
                  </g>
                );
              })
            );
          })}

        </g>

        {/* STICKY LANE HEADERS */}
        <g transform={`translate(0, ${panY})`}>
          {visibleLaneDefinitions.map(lane => {
            const Icon = lane.icon;

            const headerX = 20;
            const headerY = getLaneY(lane.id);

            // const textWidth =
            //   Math.max(
            //     lane.label.length,
            //     lane.description.length
            //   ) * 9;

            return (
              <g
                key={`header-${lane.id}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();

                  if (isMapGestureRef.current) {
                    return;
                  }

                  toggleLane(lane.id);
                }}
                className="cursor-pointer"
              >
                <rect
                  x={headerX - 12}
                  y={headerY - 28}
                  // width={axisEnd - axisStart}
                  width={320}
                  height={60}
                  rx={8}
                  fill="rgba(24,24,27,0)"
                />
                <text
                  x={headerX}
                  y={headerY - 3}
                  fill="white"
                  fontSize={18}
                >
                  {isLaneCollapsed(lane.id) ? "+" : "−"}
                </text>
                <foreignObject
                  x={headerX + 20}
                  y={headerY - 18}
                  width={20}
                  height={20}
                >
                  <Icon
                    size={20}
                    color="white"
                    strokeWidth={2}
                  />
                </foreignObject>

                <text
                  x={headerX + 50}
                  y={headerY}
                  fill="#888"
                  fontSize={18}
                  fontWeight="bold"
                >
                  {lane.label.toUpperCase()}
                </text>

                <text
                  x={headerX}
                  y={headerY + 24}
                  fill="#888"
                  fontSize={16}
                >
                  {lane.description}
                </text>
              </g>
            );
          })}
        </g>

        {/* AXIS */}
        <g>
          <rect
            x={0}
            y={70}
            width="100%"
            height={70}
            fill="white"
          />

          <g transform={`translate(${panX},0)`}>
            <line
              x1={axisStart}
              y1={120}
              x2={axisEnd}
              y2={120}
              stroke="#000"
            />

            {ticks.map(year => {
              const x = worldToScreen(year);
              const isZero = year === 0;

              return (
                <g key={year}>
                  <line
                    x1={x}
                    y1={110}
                    x2={x}
                    y2={130}
                    stroke="#000"
                    strokeWidth={1}
                  />
                  <text
                    x={worldToScreen(year)}
                    y={100}
                    fill="black"
                    fontSize={AXIS_LABEL_FONT_SIZE}
                    textAnchor={
                      year === MIN_YEAR
                        ? "start"
                        : year === MAX_YEAR
                          ? "end"
                          : "middle"
                    }
                    pointerEvents="none"
                  >
                    {formatYear(year)}
                  </text>
                </g>
              );
            })}
          </g>
        </g>

      </svg>
    </div>
  );
}