import { beforeEach, describe, expect, it } from "vitest";
import { applyTheme, isThemePreference, THEME_BOOT_SCRIPT, THEME_STORAGE_KEY } from "./theme";

describe("applyTheme", () => {
  beforeEach(() => localStorage.clear());

  it("uses the system theme while the preference is system", () => {
    const root = document.createElement("html");
    expect(applyTheme("system", root, true)).toBe("dark");
    expect(root.dataset.theme).toBe("dark");
    expect(applyTheme("system", root, false)).toBe("light");
    expect(root.dataset.theme).toBe("light");
  });

  it("uses the chosen theme whatever the system prefers", () => {
    const root = document.createElement("html");
    applyTheme("light", root, true);
    expect(root.dataset.theme).toBe("light");
    applyTheme("dark", root, false);
    expect(root.dataset.theme).toBe("dark");
  });

  it("mirrors the preference for the first paint, and reads a missing one as system", () => {
    const root = document.createElement("html");
    applyTheme("dark", root, false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    applyTheme(undefined, root, false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  });

  it("recognises only real preferences", () => {
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("blue")).toBe(false);
    expect(isThemePreference(undefined)).toBe(false);
  });
});

describe("THEME_BOOT_SCRIPT", () => {
  function run(stored: string | null, systemDark: boolean): string | undefined {
    localStorage.clear();
    if (stored !== null) localStorage.setItem(THEME_STORAGE_KEY, stored);
    window.matchMedia = ((query: string) => ({
      matches: systemDark && query.includes("dark"),
    })) as typeof window.matchMedia;
    delete document.documentElement.dataset.theme;
    new Function(THEME_BOOT_SCRIPT)();
    return document.documentElement.dataset.theme;
  }

  it("picks the saved theme, or the system's when nothing is saved", () => {
    expect(run("dark", false)).toBe("dark");
    expect(run("light", true)).toBe("light");
    expect(run(null, true)).toBe("dark");
    expect(run("system", false)).toBe("light");
  });
});
