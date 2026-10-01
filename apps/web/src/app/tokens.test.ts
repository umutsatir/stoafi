import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const tokens: Record<string, string> = {};
  for (const m of css.slice(open + 1, close).matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    tokens[m[1] as string] = m[2] as string;
  }
  return tokens;
}

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const themes = { light: block(":root {"), dark: block(':root[data-theme="dark"]') };

// Text pairs need 4.5:1 (WCAG AA); chart colours and focus rings need 3:1.
const TEXT_PAIRS: [string, string][] = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["primary-foreground", "primary"],
  ["highlight-foreground", "highlight"],
  ["destructive-foreground", "destructive"],
  ["success-foreground", "success"],
  ["warning-foreground", "warning"],
  ["info-foreground", "info"],
  ["destructive", "card"],
  ["success", "card"],
  ["warning", "card"],
  ["info", "card"],
  ["primary", "card"],
];
const CHART_TOKENS = [
  "chart-needs",
  "chart-wants",
  "chart-savings",
  "chart-investing",
  "chart-installments",
  "chart-setaside",
  "chart-income",
  "chart-left",
];

describe.each(["light", "dark"] as const)("%s theme tokens", (name) => {
  const tokens = themes[name];

  it.each(TEXT_PAIRS)("%s on %s has at least 4.5:1 contrast", (fg, bg) => {
    expect(contrast(tokens[fg] as string, tokens[bg] as string)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(CHART_TOKENS)("%s is visible on a card (3:1)", (token) => {
    expect(contrast(tokens[token] as string, tokens.card as string)).toBeGreaterThanOrEqual(3);
  });

  it("has a visible focus ring and input border (3:1 on the card)", () => {
    expect(contrast(tokens.ring as string, tokens.card as string)).toBeGreaterThanOrEqual(3);
  });

  it("defines the same tokens as the other theme", () => {
    const other = name === "light" ? themes.dark : themes.light;
    expect(Object.keys(tokens).sort()).toEqual(Object.keys(other).sort());
  });
});

describe("colours come from tokens", () => {
  function files(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) return files(path);
      return /\.(tsx?|css)$/.test(entry) && !/\.test\./.test(entry) ? [path] : [];
    });
  }

  it("has no hard-coded colour outside globals.css and the PWA theme colour", () => {
    const offenders = files(join(__dirname, ".."))
      .filter((f) => !f.endsWith("globals.css") && !f.endsWith("layout.tsx"))
      .filter((f) => /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
