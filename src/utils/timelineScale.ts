export const MIN_YEAR = -3400;
export const MAX_YEAR = 2026;

export const WORLD_WIDTH = 20000;

export function yearToX(year: number) {
  return (
    ((year - MIN_YEAR) /
      (MAX_YEAR - MIN_YEAR)) *
    WORLD_WIDTH
  );
}