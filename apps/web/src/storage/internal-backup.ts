import type { StoafiDb } from "./db";

/** How many daily copies are kept. */
export const KEEP_DAILY_COPIES = 3;
export const BEFORE_IMPORT_ID = "before-import";

export interface CopyInfo {
  id: string;
  createdAt: string;
  /** True for the copy taken just before a backup file replaced the data. */
  beforeImport: boolean;
}

/**
 * Keeps today's copy of the data (one per day) and drops the oldest beyond `KEEP_DAILY_COPIES`.
 * Protects against a bad edit or a wrong import; it cannot protect against the browser clearing the site's
 * data, which clears these copies too.
 */
export async function saveDailyCopy(
  db: StoafiDb,
  today: string,
  json: string,
  now: string,
): Promise<void> {
  if (await db.backups.get(today)) return;
  await db.backups.put({ id: today, createdAt: now, json });
  const daily = (await db.backups.toArray())
    .filter((row) => row.id !== BEFORE_IMPORT_ID)
    .sort((a, b) => b.id.localeCompare(a.id));
  for (const old of daily.slice(KEEP_DAILY_COPIES)) await db.backups.delete(old.id);
}

/** The copy taken before an import; each import replaces the last one. */
export async function saveBeforeImport(db: StoafiDb, json: string, now: string): Promise<void> {
  await db.backups.put({ id: BEFORE_IMPORT_ID, createdAt: now, json });
}

/** Newest first, with the pre-import copy first of all. */
export async function listCopies(db: StoafiDb): Promise<CopyInfo[]> {
  const rows = await db.backups.toArray();
  return rows
    .map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      beforeImport: row.id === BEFORE_IMPORT_ID,
    }))
    .sort((a, b) =>
      a.beforeImport === b.beforeImport ? b.id.localeCompare(a.id) : a.beforeImport ? -1 : 1,
    );
}

export async function readCopy(db: StoafiDb, id: string): Promise<string | null> {
  return (await db.backups.get(id))?.json ?? null;
}

export async function clearCopies(db: StoafiDb): Promise<void> {
  await db.backups.clear();
}
