/** "2026-10, 2026-11" for a few months, "2026-01–2026-12" for a longer run. */
export function summarizeMonths(months: string[]): string {
  const unique = [...new Set(months)].sort();
  if (unique.length <= 3) return unique.join(", ");
  return `${unique[0]}–${unique[unique.length - 1]}`;
}
