import type { Module } from "../../kernel/module";
import { BackupSchema, exportAll } from "./schema";
import { importAll } from "./import";

export const backupModule: Module<typeof BackupSchema> = {
  id: "backup",
  version: 1,
  schema: BackupSchema,
  migrations: [],
  selectors: {
    exportAll,
    importAll,
  },
};
