import { useRef, useState } from "react";

export function useTimelineCamera() {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const animationFrameRef =
    useRef<number | null>(null);

  const cancelCameraAnimation = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const animateToPan = (
    targetPanX: number,
    duration = 750,
    onComplete?: () => void
  ) => {
    cancelCameraAnimation();

    const startPan = panX;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;

      const progress = Math.min(
        elapsed / duration,
        1
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      const currentPan =
        startPan +
        (targetPanX - startPan) * eased;

      setPanX(currentPan);

      if (progress < 1) {
        animationFrameRef.current =
          requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
        onComplete?.();
      }
    };

    animationFrameRef.current =
      requestAnimationFrame(animate);
  };

  return {
    zoom,
    setZoom,
    panX,
    setPanX,
    panY,
    setPanY,
    animateToPan,
    cancelCameraAnimation,
  };
}