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
const DOUBLE_TAP_DELAY = 300;
const DOUBLE_TAP_DISTANCE = 30;
const DOUBLE_TAP_ZOOM_MULTIPLIER = 1.8;

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

  let currentY = 144;

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
  const [pinchMomentum, setPinchMomentum] =
    useState<{
      x: number;
      y: number;
      zoom: number;
    } | null>(null);

  const activePointersRef = useRef<
    Map<number, { x: number; y: number }>
  >(new Map());

  const pinchGestureRef = useRef<{
    distance: number;
    centerX: number;
    centerY: number;
    zoom: number;
    panX: number;
    panY: number;
    timestamp: number;
    velocityX: number;
    velocityY: number;
    zoomVelocity: number;
  } | null>(null);

  const pinchReleaseVelocityRef = useRef<{
    x: number;
    y: number;
    zoom: number;
  }>({
    x: 0,
    y: 0,
    zoom: 0,
  });

  const primaryPointerStartRef = useRef<{
    id: number;
    x: number;
    y: number;
  } | null>(null);

  const primaryPointerMovedRef = useRef(false);

  const focusTimeoutRef =
    useRef<number | null>(null);

  const cameraAnimationFrameRef =
    useRef<number | null>(null);

  const lastTapRef = useRef<{
    time: number;
    x: number;
    y: number;
  } | null>(null);

  const pendingEventTapRef =
    useRef<string | null>(null);

  const singleTapTimeoutRef =
    useRef<number | null>(null);

  const lastEventPointerTypeRef =
    useRef<string | null>(null);

  const cancelPendingEventTap = () => {
    if (singleTapTimeoutRef.current !== null) {
      window.clearTimeout(
        singleTapTimeoutRef.current
      );

      singleTapTimeoutRef.current = null;
    }

    pendingEventTapRef.current = null;
  };

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
    pinchGestureRef.current = null;

    pinchReleaseVelocityRef.current = {
      x: 0,
      y: 0,
      zoom: 0,
    };

    isMapGestureRef.current = false;
    primaryPointerStartRef.current = null;
    primaryPointerMovedRef.current = false;

    setIsDragging(false);
    setVelocityX(0);
    setVelocityY(0);
    setPinchMomentum(null);
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
  // CAMERA ANIMATION
  // =========================
  const easeOutCubic = (progress: number) => {
    return 1 - Math.pow(1 - progress, 3);
  };

  const animateCameraTo = (
    targetZoom: number,
    targetPanX: number,
    targetPanY: number,
    duration = 220
  ) => {
    if (cameraAnimationFrameRef.current !== null) {
      cancelAnimationFrame(
        cameraAnimationFrameRef.current
      );
    }

    const startZoom = zoom;
    const startPanX = panX;
    const startPanY = panY;

    const startTime = performance.now();

    const targetPanXBounds =
      getPanXBounds(targetZoom);

    const clampedTargetPanX = clamp(
      targetPanX,
      targetPanXBounds.min,
      targetPanXBounds.max
    );

    const clampedTargetPanY =
      clampPanY(targetPanY);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      const progress = Math.min(
        elapsed / duration,
        1
      );

      const easedProgress =
        easeOutCubic(progress);

      const animatedZoom =
        startZoom +
        (targetZoom - startZoom) *
          easedProgress;

      const animatedPanX =
        startPanX +
        (clampedTargetPanX - startPanX) *
          easedProgress;

      const animatedPanY =
        startPanY +
        (clampedTargetPanY - startPanY) *
          easedProgress;

      setZoom(animatedZoom);
      setPanX(animatedPanX);
      setPanY(animatedPanY);

      if (progress < 1) {
        cameraAnimationFrameRef.current =
          requestAnimationFrame(animate);
      } else {
        cameraAnimationFrameRef.current = null;

        setZoom(targetZoom);
        setPanX(clampedTargetPanX);
        setPanY(clampedTargetPanY);
      }
    };

    cameraAnimationFrameRef.current =
      requestAnimationFrame(animate);
  };

  const animateZoomBy = (
    zoomMultiplier: number
  ) => {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    const rect = svg.getBoundingClientRect();

    const centerX = rect.width / 2;

    const minZoom = getMinZoom();

    const targetZoom = Math.max(
      minZoom,
      Math.min(
        MAX_ZOOM,
        zoom * zoomMultiplier
      )
    );

    if (targetZoom === zoom) {
      return;
    }

    const worldX =
      (centerX - panX) / zoom;

    const targetPanX =
      centerX - worldX * targetZoom;

    setVelocityX(0);
    setVelocityY(0);

    animateCameraTo(
      targetZoom,
      targetPanX,
      panY
    );
  };

  const animateZoomAtPoint = (
    screenX: number,
    screenY: number,
    zoomMultiplier: number
  ) => {
    const minZoom = getMinZoom();

    const targetZoom = Math.max(
      minZoom,
      Math.min(
        MAX_ZOOM,
        zoom * zoomMultiplier
      )
    );

    if (targetZoom === zoom) {
      return;
    }

    const worldX =
      (screenX - panX) / zoom;

    const targetPanX =
      screenX - worldX * targetZoom;

    const targetPanY = panY;

    setVelocityX(0);
    setVelocityY(0);

    animateCameraTo(
      targetZoom,
      targetPanX,
      targetPanY
    );
  };

  // =========================
  // WHEEL ZOOM
  // =========================
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (cameraAnimationFrameRef.current !== null) {
      cancelAnimationFrame(
        cameraAnimationFrameRef.current
      );

      cameraAnimationFrameRef.current = null;
    }
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

    if (cameraAnimationFrameRef.current !== null) {
      cancelAnimationFrame(
        cameraAnimationFrameRef.current
      );

      cameraAnimationFrameRef.current = null;
    }

    setVelocityX(0);
    setVelocityY(0);
    setPinchMomentum(null);

    e.currentTarget.setPointerCapture(
      e.pointerId
    );

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

      lastTapRef.current = null;
      cancelPendingEventTap();

      const [first, second] = pointers;
      const center = getPointerCenter(
        first,
        second
      );

      pinchGestureRef.current = {
        distance: getPointerDistance(
          first,
          second
        ),
        centerX: center.x,
        centerY: center.y,
        zoom,
        panX,
        panY,
        timestamp: performance.now(),
        velocityX: 0,
        velocityY: 0,
        zoomVelocity: 0,
      };

      pinchReleaseVelocityRef.current = {
        x: 0,
        y: 0,
        zoom: 0,
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
      pinchGestureRef.current
    ) {
      lastTapRef.current = null;
      cancelPendingEventTap();
      isMapGestureRef.current = true;

      const [first, second] = pointers;

      const center = getPointerCenter(
        first,
        second
      );

      const distance = getPointerDistance(
        first,
        second
      );

      const previous =
        pinchGestureRef.current;

      const currentTime =
        performance.now();

      const elapsedMilliseconds = Math.max(
        currentTime - previous.timestamp,
        1
      );

      const frameDuration = 1000 / 60;

      const velocityScale =
        frameDuration /
        elapsedMilliseconds;

      // Calculate zoom from the previous
      // pinch frame rather than the
      // beginning of the entire gesture.
      const zoomRatio =
        distance / previous.distance;

      const minZoom = getMinZoom();

      const newZoom = Math.max(
        minZoom,
        Math.min(
          MAX_ZOOM,
          previous.zoom * zoomRatio
        )
      );

      // Keep the horizontal world position
      // beneath the previous midpoint attached
      // to the current midpoint.
      const midpointWorldX =
        (previous.centerX -
          previous.panX) /
        previous.zoom;

      const proposedPanX =
        center.x -
        midpointWorldX * newZoom;

      // The timeline does not scale vertically,
      // so Y follows midpoint movement directly.
      const midpointDeltaY =
        center.y -
        previous.centerY;

      const proposedPanY =
        previous.panY +
        midpointDeltaY;

      const newPanXBounds =
        getPanXBounds(newZoom);

      const clampedNewPanX = clamp(
        proposedPanX,
        newPanXBounds.min,
        newPanXBounds.max
      );

      const clampedNewPanY =
        clampPanY(proposedPanY);

      // Velocities are normalized to roughly
      // one 60 FPS animation frame. They are
      // captured now but not yet applied after
      // the gesture ends.
      const MOMENTUM_PAN_SCALE = 0.18;
      const MOMENTUM_ZOOM_SCALE = 0.08;

      const pinchVelocityX =
        (clampedNewPanX -
          previous.panX) *
        velocityScale *
        MOMENTUM_PAN_SCALE;

      const pinchVelocityY =
        (clampedNewPanY -
          previous.panY) *
        velocityScale *
        MOMENTUM_PAN_SCALE;

      const pinchZoomVelocity =
        (newZoom -
          previous.zoom) *
        velocityScale *
        MOMENTUM_ZOOM_SCALE;

      setZoom(newZoom);
      setPanX(clampedNewPanX);
      setPanY(clampedNewPanY);

      // Prevent the existing drag inertia
      // system from running during the pinch.
      setVelocityX(0);
      setVelocityY(0);

      pinchGestureRef.current = {
        distance,
        centerX: center.x,
        centerY: center.y,
        zoom: newZoom,
        panX: clampedNewPanX,
        panY: clampedNewPanY,
        timestamp: currentTime,
        velocityX: pinchVelocityX,
        velocityY: pinchVelocityY,
        zoomVelocity:
          pinchZoomVelocity,
      };

      pinchReleaseVelocityRef.current = {
        x: pinchVelocityX,
        y: pinchVelocityY,
        zoom: pinchZoomVelocity,
      };

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
    lastTapRef.current = null;
    cancelPendingEventTap();
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

    const pointerCountAfterRelease =
      activePointersRef.current.size;

    const pinchReleaseVelocity =
      pinchReleaseVelocityRef.current;

    const hasPinchMomentum =
      Math.abs(
        pinchReleaseVelocity.x
      ) > 0.05 ||
      Math.abs(
        pinchReleaseVelocity.y
      ) > 0.05 ||
      Math.abs(
        pinchReleaseVelocity.zoom
      ) > 0.0005;

    if (
      pointerCountAfterRelease < 2 &&
      hasPinchMomentum
    ) {
      setPinchMomentum({
        x: pinchReleaseVelocity.x,
        y: pinchReleaseVelocity.y,
        zoom: pinchReleaseVelocity.zoom,
      });
    }

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    pinchGestureRef.current = null;

    const remainingPointers = Array.from(
      activePointersRef.current.values()
    );

    if (remainingPointers.length === 1) {
      setIsDragging(true);
      setLastPointerX(remainingPointers[0].x);
      setLastPointerY(remainingPointers[0].y);
    } else {
      const wasMapGesture =
        isMapGestureRef.current ||
        primaryPointerMovedRef.current;

      setIsDragging(false);
      primaryPointerStartRef.current = null;

      if (
        e.pointerType === "touch" &&
        !wasMapGesture
      ) {
        const svg = svgRef.current;

        if (svg) {
          const rect =
            svg.getBoundingClientRect();

          const tapX =
            e.clientX - rect.left;

          const tapY =
            e.clientY - rect.top;

          const now = performance.now();
          const lastTap = lastTapRef.current;

          const isDoubleTap =
            lastTap !== null &&
            now - lastTap.time <=
              DOUBLE_TAP_DELAY &&
            Math.hypot(
              tapX - lastTap.x,
              tapY - lastTap.y
            ) <= DOUBLE_TAP_DISTANCE;

          if (isDoubleTap) {
            lastTapRef.current = null;

            cancelPendingEventTap();

            isMapGestureRef.current = true;

            animateZoomAtPoint(
              tapX,
              tapY,
              DOUBLE_TAP_ZOOM_MULTIPLIER
            );
          } else {
            lastTapRef.current = {
              time: now,
              x: tapX,
              y: tapY,
            };

            const pendingEventId =
              pendingEventTapRef.current;

            if (pendingEventId) {
              cancelPendingEventTap();

              pendingEventTapRef.current =
                pendingEventId;

              singleTapTimeoutRef.current =
                window.setTimeout(() => {
                  focusEvent(pendingEventId);

                  pendingEventTapRef.current = null;
                  singleTapTimeoutRef.current = null;
                }, DOUBLE_TAP_DELAY);
            }
          }
        }
      }

      window.setTimeout(() => {
        isMapGestureRef.current = false;
        primaryPointerMovedRef.current = false;
      }, 100);
    }
  };

  const handlePointerCancel = (
    e: React.PointerEvent<SVGSVGElement>
  ) => {
    activePointersRef.current.delete(
      e.pointerId
    );

    pinchGestureRef.current = null;

    pinchReleaseVelocityRef.current = {
      x: 0,
      y: 0,
      zoom: 0,
    };

    setIsDragging(false);
    setPinchMomentum(null);
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

  // =========================
  // PINCH MOMENTUM
  // =========================
  useEffect(() => {
    if (!pinchMomentum) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const minZoom = getMinZoom();

      const nextZoom = clamp(
        zoom + pinchMomentum.zoom,
        minZoom,
        MAX_ZOOM
      );

      const panXBounds =
        getPanXBounds(nextZoom);

      const nextPanX = clamp(
        panX + pinchMomentum.x,
        panXBounds.min,
        panXBounds.max
      );

      const nextPanY = clampPanY(
        panY + pinchMomentum.y
      );

      setZoom(nextZoom);
      setPanX(nextPanX);
      setPanY(nextPanY);

      const decay = 0.82;

      const nextMomentum = {
        x: pinchMomentum.x * decay,
        y: pinchMomentum.y * decay,
        zoom:
          pinchMomentum.zoom * decay,
      };

      const momentumHasStopped =
        Math.abs(nextMomentum.x) <
          0.05 &&
        Math.abs(nextMomentum.y) <
          0.05 &&
        Math.abs(nextMomentum.zoom) <
          0.0005;

      if (momentumHasStopped) {
        setPinchMomentum(null);
        return;
      }

      setPinchMomentum(nextMomentum);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    pinchMomentum,
    zoom,
    panX,
    panY,
  ]);

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

  useEffect(() => {
    return () => {
      if (
        cameraAnimationFrameRef.current !== null
      ) {
        cancelAnimationFrame(
          cameraAnimationFrameRef.current
        );
      }

      if (
        singleTapTimeoutRef.current !== null
      ) {
        window.clearTimeout(
          singleTapTimeoutRef.current
        );
      }
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
          onZoomIn={() => {
            animateZoomBy(1.2);
          }}
          onZoomOut={() => {
            animateZoomBy(1 / 1.2);
          }}
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
                      lastEventPointerTypeRef.current =
                        e.pointerType;

                      if (e.pointerType === "touch") {
                        pendingEventTapRef.current =
                          event.id;

                        return;
                      }

                      e.stopPropagation();
                      isMapGestureRef.current = false;
                    }}
                    onClick={(e) => {
                      e.stopPropagation();

                      if (
                        lastEventPointerTypeRef.current ===
                        "touch"
                      ) {
                        return;
                      }

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
            height={50}
            fill="white"
          />

          <g transform={`translate(${panX},0)`}>
            <line
              x1={axisStart}
              y1={120}
              x2={axisEnd}
              y2={120}
              stroke="#000"
              strokeWidth={2}
            />

            {ticks.map(year => {
              const x = worldToScreen(year);

              return (
                <g key={year}>
                  <line
                    x1={x}
                    y1={104}
                    x2={x}
                    y2={120}
                    stroke="#000"
                    strokeWidth={1.5}
                  />

                  <text
                    x={x}
                    y={96}
                    fill="black"
                    fontSize={AXIS_LABEL_FONT_SIZE}
                    fontWeight={600}
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