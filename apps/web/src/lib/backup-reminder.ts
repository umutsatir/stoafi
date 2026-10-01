/** After this many days without a backup, the app asks for one. */
export const BACKUP_REMINDER_DAYS = 30;

const day = (iso: string): number =>
  Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;

/** Days since the last backup, or null if there never was one. */
export function daysSinceBackup(lastBackup: string | null, today: string): number | null {
  if (!lastBackup) return null;
  return Math.max(0, Math.round(day(today) - day(lastBackup)));
}

/**
 * Whether to nudge for a backup: only when there is something worth saving, and the last backup is old
 * or missing. `firstDataDate` is when the user's data began (for "never backed up").
 */
export function backupDue(
  lastBackup: string | null,
  today: string,
  hasData: boolean,
  firstDataDate: string | null,
): boolean {
  if (!hasData) return false;
  const since = daysSinceBackup(lastBackup, today);
  if (since !== null) return since >= BACKUP_REMINDER_DAYS;
  // Never backed up: give a new user a month before asking.
  if (!firstDataDate) return false;
  return Math.round(day(today) - day(firstDataDate)) >= BACKUP_REMINDER_DAYS;
}
