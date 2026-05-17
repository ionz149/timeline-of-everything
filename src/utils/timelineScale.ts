// export const MIN_YEAR = -10000;
export const MIN_YEAR = -3000;
export const MAX_YEAR = 2026;

export const TOTAL_YEARS =
  MAX_YEAR - MIN_YEAR;

export function yearToX(
  year: number,
  width: number
) {
  return (
    ((year - MIN_YEAR) / TOTAL_YEARS) *
    width
  );
}