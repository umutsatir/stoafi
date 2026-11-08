/** "2026-11" as "November 2026" in the active language. */
export function formatMonth(month: string, locale: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) return month;
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

/** "2026-10-20" (or an ISO timestamp) as "Oct 20, 2026" in the active language; other text unchanged. */
export function formatDay(day: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(day);
  if (!match) return day;
  const [, year, month, date] = match.map(Number);
  if (!year || !month || !date) return day;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, date)));
}
