export function formatYear(year: number) {
  if (year < 0) {
    return `${Math.abs(year) + 1} BCE`;
  }

  if (year === 0) {
    return `1 BCE`;
  }

  return `${year} CE`;
}