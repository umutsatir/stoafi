import type { Module } from "../../kernel/module";
import { SettingsSchema, defaultSettings, detectLocale } from "./schema";

export const settingsModule: Module<typeof SettingsSchema> = {
  id: "settings",
  version: 1,
  schema: SettingsSchema,
  migrations: [],
  selectors: {
    detectLocale,
    defaultSettings,
  },
};
