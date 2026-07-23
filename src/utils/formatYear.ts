export function formatYear(year: number) {
  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  }

  if (year === 0) {
    return "0";
  }

  return `${year} CE`;
}