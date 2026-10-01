import type { Module } from "../../kernel/module";
import { SnapshotSchema, buildSnapshot, sameSnapshot, trendOf, upsertSnapshot } from "./snapshots";

export const snapshotsModule: Module<typeof SnapshotSchema> = {
  id: "snapshots",
  version: 1,
  schema: SnapshotSchema,
  migrations: [],
  selectors: { buildSnapshot, sameSnapshot, trendOf, upsertSnapshot },
};
