import { resolveTheme, THEMES, type ThemePreference } from "@stoafi/core";

/**
 * A small mirror of the saved theme so the first paint can pick the right colours
 * before the database has loaded. The database stays the source of truth.
 */
export const THEME_STORAGE_KEY = "stoafi-theme";

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/** Sets the colour theme on the page. Returns what was applied. */
export function applyTheme(
  preference: ThemePreference | undefined,
  root: HTMLElement = document.documentElement,
  systemPrefersDark: boolean = window.matchMedia("(prefers-color-scheme: dark)").matches,
): "light" | "dark" {
  const theme = resolveTheme(preference, systemPrefersDark);
  root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference ?? "system");
  } catch {
    // Private mode or blocked storage: the theme still applies, it just is not mirrored.
  }
  return theme;
}

/** Runs in <head> before the page paints, so a dark user never sees a white flash. Plain JS on purpose. */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=p==="dark"||((p===null||p==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})();`;
