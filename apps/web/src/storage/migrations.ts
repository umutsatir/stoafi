import { migrateProfileV1ToV2 as migrateProfileShape } from "@stoafi/core";
import type { Transaction } from "dexie";

/**
 * Demonstrates the migration pattern: version 2 adds a `note` field to
 * every existing `profile` row (a nullable field, defaulted for rows that
 * predate it), proving upgrades don't lose data. `note` is a demo field
 * for this pattern, not a real product field on `Profile`.
 */
export async function migrateProfileV1ToV2(tx: Transaction): Promise<void> {
  await tx
    .table("profile")
    .toCollection()
    .modify((row: { note?: string | null }) => {
      if (row.note === undefined) {
        row.note = null;
      }
    });
}

/** v3: rewrites the stored profile to the salaries-only / livingExpenses shape (T9.1). */
export async function migrateProfileV2ToV3(tx: Transaction): Promise<void> {
  await tx
    .table("profile")
    .toCollection()
    .modify((row: { data: unknown }) => {
      row.data = migrateProfileShape(row.data);
    });
}
