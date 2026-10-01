import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "../../kernel/money";

export const LOCALES = ["en", "tr"] as const;

/** Device preferences: the UI language and the currency amounts are shown in. */
export const SettingsSchema = z.object({
  locale: z.enum(LOCALES),
  currency: z.enum(SUPPORTED_CURRENCIES),
});

export type Settings = z.infer<typeof SettingsSchema>;

/** Turkish for any Turkish browser language, English otherwise. The language is passed in, never read here. */
export function detectLocale(language: string | undefined): Settings["locale"] {
  return language?.toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function defaultSettings(language: string | undefined): Settings {
  return { locale: detectLocale(language), currency: "TRY" };
}
