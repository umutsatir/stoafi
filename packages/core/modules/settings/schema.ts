import { z } from "zod";
import { BasketEntrySchema } from "../../kernel/basket";
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
  /** Ids of lesson cards the user marked as read. Optional so older settings stay valid. */
  readLessons: z.array(z.string()).optional(),
  /** True while the app holds sample data from the demo, so a banner can offer to clear it. */
  demo: z.boolean().optional(),
  /** Show "••••" instead of amounts, for using the app where others can see the screen. */
  hideAmounts: z.boolean().optional(),
  /** YYYY-MM-DD of the last time a backup file was downloaded. */
  lastBackup: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  /** The user's investing basket: how new investing money should be shared. Optional; none until they make one. */
  basket: z.array(BasketEntrySchema).optional(),
  /** A PIN that covers the app: a random salt and the PBKDF2 hash of the PIN, never the PIN itself. */
  lock: z.object({ salt: z.string(), hash: z.string() }).optional(),
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
