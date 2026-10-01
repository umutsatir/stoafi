import type { Registry } from "../../kernel/registry";
import { BackupSchema } from "./schema";

export type ImportResult = { data: Record<string, unknown[]> } | { errors: string[] };

/**
 * Validates a backup's outer shape, then each module's rows against that
 * module's own schema, collecting every error instead of throwing on the
 * first one. A module id in the backup that isn't registered is ignored
 * (forward-compat), not an error.
 */
export function importAll(registry: Registry, backupJson: unknown): ImportResult {
  const outer = BackupSchema.safeParse(backupJson);
  if (!outer.success) {
    return { errors: [`invalid backup: ${outer.error.message}`] };
  }

  const errors: string[] = [];
  const data: Record<string, unknown[]> = {};

  for (const [moduleId, rows] of Object.entries(outer.data.data)) {
    const module = registry.getModule(moduleId);
    if (!module) continue;

    const validRows: unknown[] = [];
    rows.forEach((row, index) => {
      // A backup from an older app version holds rows in an older shape; bring them up to date first.
      const upgraded = module.migrations.reduce<unknown>(
        (current, migrate) =>
          typeof migrate === "function" ? (migrate as (r: unknown) => unknown)(current) : current,
        row,
      );
      const parsed = module.schema.safeParse(upgraded);
      if (parsed.success) {
        validRows.push(parsed.data);
      } else {
        errors.push(`${moduleId}[${index}]: ${parsed.error.message}`);
      }
    });

    if (errors.length === 0) {
      data[moduleId] = validRows;
    }
  }

  return errors.length > 0 ? { errors } : { data };
}
