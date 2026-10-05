import { exportAll, importAll, type ImportResult } from "@stoafi/core";
import type { StoafiDb } from "./db";
import { SINGLETON_ID, type ListRow, type SingletonRow } from "./db";
import { saveBeforeImport } from "./internal-backup";
import { createAppRegistry, MODULE_ID_TO_TABLE, SINGLETON_MODULE_IDS } from "./registry";

type TableName = (typeof MODULE_ID_TO_TABLE)[keyof typeof MODULE_ID_TO_TABLE];

async function readSnapshot(db: StoafiDb): Promise<Record<string, unknown[]>> {
  const snapshot: Record<string, unknown[]> = {};

  for (const [moduleId, tableName] of Object.entries(MODULE_ID_TO_TABLE)) {
    const table = db[tableName as TableName];

    if (SINGLETON_MODULE_IDS.has(moduleId)) {
      const row = (await table.get(SINGLETON_ID)) as SingletonRow | undefined;
      snapshot[moduleId] = row ? [row.data] : [];
    } else {
      const rows = (await table.toArray()) as ListRow[];
      snapshot[moduleId] = rows;
    }
  }

  return snapshot;
}

export async function exportToJson(db: StoafiDb, exportedAt: string): Promise<string> {
  const registry = createAppRegistry();
  const snapshot = await readSnapshot(db);
  const backup = exportAll(registry, snapshot, exportedAt);
  return JSON.stringify(backup);
}

/**
 * Validates and writes a backup in a single transaction — all tables clear
 * and repopulate together, or nothing changes (SPEC: "export → clear data
 * → import restores everything").
 */
export async function importFromJson(db: StoafiDb, json: string): Promise<ImportResult> {
  const registry = createAppRegistry();
  const parsed: unknown = JSON.parse(json);
  const result = importAll(registry, parsed);

  if ("errors" in result) {
    return result;
  }

  const tableNames = Object.values(MODULE_ID_TO_TABLE) as TableName[];

  await db.transaction("rw", tableNames, async () => {
    for (const [moduleId, tableName] of Object.entries(MODULE_ID_TO_TABLE)) {
      const rows = result.data[moduleId] ?? [];

      if (SINGLETON_MODULE_IDS.has(moduleId)) {
        const table = db[tableName as TableName] as StoafiDb["profile"];
        await table.clear();
        if (rows.length > 0) {
          await table.put({ id: SINGLETON_ID, data: rows[0] });
        }
      } else {
        const table = db[tableName as TableName] as StoafiDb["cards"];
        await table.clear();
        for (const row of rows) {
          await table.put(row as ListRow);
        }
      }
    }
  });

  return result;
}

/**
 * Like `importFromJson`, but first keeps a copy of what is there, so a wrong file can be undone. Nothing is
 * copied when the database holds no profile yet, and a file that fails validation changes nothing.
 */
export async function importWithSafetyCopy(
  db: StoafiDb,
  json: string,
  now: string,
): Promise<ImportResult> {
  if (await db.profile.get(SINGLETON_ID)) {
    await saveBeforeImport(db, await exportToJson(db, now), now);
  }
  return importFromJson(db, json);
}
