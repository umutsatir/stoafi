import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "../../kernel/money";

export const LOCALES = ["en", "tr"] as const;
export const THEMES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEMES)[number];

/** Device preferences: the UI language and the currency amounts are shown in. */
export const SettingsSchema = z.object({
  locale: z.enum(LOCALES),
  currency: z.enum(SUPPORTED_CURRENCIES),
  /** Optional so settings saved before themes existed stay valid; missing reads as "system". */
  theme: z.enum(THEMES).optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;

/** Turkish for any Turkish browser language, English otherwise. The language is passed in, never read here. */
export function detectLocale(language: string | undefined): Settings["locale"] {
  return language?.toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function defaultSettings(language: string | undefined): Settings {
  return { locale: detectLocale(language), currency: "TRY", theme: "system" };
}

/** The theme to draw: the user's choice, or the system's when they follow it. The system preference is passed in. */
export function resolveTheme(
  preference: ThemePreference | undefined,
  systemPrefersDark: boolean,
): "light" | "dark" {
  if (preference === "light" || preference === "dark") return preference;
  return systemPrefersDark ? "dark" : "light";
}
