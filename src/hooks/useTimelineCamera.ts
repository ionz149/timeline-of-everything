import { useState } from "react";

export function useTimelineCamera() {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const animateToPan = (
    targetPanX: number,
    duration = 750,
    onComplete?: () => void
  ) => {
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
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

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
  };
}