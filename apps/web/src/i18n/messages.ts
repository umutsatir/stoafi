import en from "./en.json";
import tr from "./tr.json";

export const LOCALES = ["en", "tr"] as const;
export type Locale = (typeof LOCALES)[number];

export const messagesByLocale: Record<Locale, typeof en> = { en, tr };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
