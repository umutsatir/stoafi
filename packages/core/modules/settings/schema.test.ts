import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { settingsModule } from "./module";
import { SettingsSchema, defaultSettings, detectLocale, resolveTheme } from "./schema";

describe("SettingsSchema", () => {
  it("accepts a supported locale and currency", () => {
    expect(SettingsSchema.safeParse({ locale: "tr", currency: "TRY" }).success).toBe(true);
    expect(SettingsSchema.safeParse({ locale: "en", currency: "EUR" }).success).toBe(true);
  });

  it("rejects an unknown locale or currency", () => {
    expect(SettingsSchema.safeParse({ locale: "de", currency: "TRY" }).success).toBe(false);
    expect(SettingsSchema.safeParse({ locale: "en", currency: "XXX" }).success).toBe(false);
    expect(SettingsSchema.safeParse({ locale: "en" }).success).toBe(false);
  });
});

describe("detectLocale", () => {
  it("picks Turkish for any Turkish browser language", () => {
    expect(detectLocale("tr")).toBe("tr");
    expect(detectLocale("tr-TR")).toBe("tr");
    expect(detectLocale("TR-tr")).toBe("tr");
  });

  it("falls back to English for everything else, including nothing", () => {
    expect(detectLocale("en-US")).toBe("en");
    expect(detectLocale("de-DE")).toBe("en");
    expect(detectLocale("")).toBe("en");
    expect(detectLocale(undefined)).toBe("en");
  });
});

describe("defaultSettings", () => {
  it("uses the detected locale with TRY for a Turkish browser", () => {
    expect(defaultSettings("tr-TR")).toEqual({ locale: "tr", currency: "TRY", theme: "system" });
  });

  it("uses English with TRY otherwise", () => {
    expect(defaultSettings("en-GB")).toEqual({ locale: "en", currency: "TRY", theme: "system" });
  });
});

describe("settingsModule", () => {
  it("registers in the kernel registry", () => {
    const registry = createRegistry();
    registry.register(settingsModule);
    expect(registry.getModule("settings")?.version).toBe(1);
  });
});

describe("theme setting", () => {
  it("accepts system, light and dark and leaves older settings without a theme valid", () => {
    for (const theme of ["system", "light", "dark"]) {
      expect(SettingsSchema.safeParse({ locale: "en", currency: "TRY", theme }).success).toBe(true);
    }
    expect(SettingsSchema.safeParse({ locale: "en", currency: "TRY" }).success).toBe(true);
    expect(SettingsSchema.safeParse({ locale: "en", currency: "TRY", theme: "blue" }).success).toBe(
      false,
    );
  });

  it("follows the system when the theme is system or was never chosen", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme(undefined, true)).toBe("dark");
  });

  it("ignores the system when the user picked a theme", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("defaults new settings to following the system", () => {
    expect(defaultSettings("en").theme).toBe("system");
  });
});

describe("read lessons setting", () => {
  it("keeps the ids of lessons marked as read, and older settings without them stay valid", () => {
    expect(
      SettingsSchema.safeParse({ locale: "en", currency: "TRY", readLessons: ["a", "b"] }).success,
    ).toBe(true);
    expect(SettingsSchema.safeParse({ locale: "en", currency: "TRY" }).success).toBe(true);
    expect(
      SettingsSchema.safeParse({ locale: "en", currency: "TRY", readLessons: [1] }).success,
    ).toBe(false);
  });
});
