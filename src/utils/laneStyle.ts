export function laneBackground(color?: string) {
  if (!color) return "rgba(255,255,255,0.05)";
  return `${color}15`;
}