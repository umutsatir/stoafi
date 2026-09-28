import { z } from "zod";
import type { Registry } from "../../kernel/registry";

export const BACKUP_VERSION = 1;

export const BackupSchema = z.object({
  version: z.number().int(),
  exportedAt: z.string(),
  data: z.record(z.string(), z.array(z.unknown())),
});

export type Backup = z.infer<typeof BackupSchema>;

/**
 * Composes a backup from an already-loaded snapshot of every module's
 * data (never touches storage itself — Dexie reads happen in apps/web).
 * `exportedAt` is always passed in, never generated internally.
 */
export function exportAll(
  registry: Registry,
  storeSnapshot: Record<string, unknown[]>,
  exportedAt: string,
): Backup {
  const knownModuleIds = new Set(registry.listModules().map((m) => m.id));
  const data: Record<string, unknown[]> = {};

  for (const [moduleId, rows] of Object.entries(storeSnapshot)) {
    if (knownModuleIds.has(moduleId)) {
      data[moduleId] = rows;
    }
  }

  return { version: BACKUP_VERSION, exportedAt, data };
}
