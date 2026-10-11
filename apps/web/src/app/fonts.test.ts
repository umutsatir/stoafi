import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");
const fontDir = join(__dirname, "../../public/fonts");

/** The code points covered by the unicode-range of every @font-face block, as numbers. */
function coveredCodePoints(): (cp: number) => boolean {
  const ranges = [...css.matchAll(/unicode-range:([^;]+);/g)]
    .flatMap((m) => (m[1] ?? "").split(","))
    .map((r) => r.trim().replace(/^U\+/i, ""))
    .filter(Boolean)
    .map((r) => {
      const [from, to] = r.split("-");
      return [parseInt(from ?? "0", 16), parseInt(to ?? from ?? "0", 16)] as const;
    });
  return (cp) => ranges.some(([from, to]) => cp >= from && cp <= to);
}

describe("self-hosted font", () => {
  const files = ["inter-latin-wght-normal.woff2", "inter-latin-ext-wght-normal.woff2"];

  it("ships the font files, as real woff2, next to its licence", () => {
    for (const file of files) {
      const path = join(fontDir, file);
      expect(existsSync(path), file).toBe(true);
      expect(readFileSync(path).subarray(0, 4).toString("latin1"), file).toBe("wOF2");
    }
    expect(readFileSync(join(fontDir, "OFL.txt"), "utf8")).toContain("SIL Open Font License");
  });

  it("points every @font-face at one of those files and at nothing on another site", () => {
    const urls = [...css.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1] ?? "");
    expect(urls.length).toBeGreaterThanOrEqual(2);
    for (const url of urls) {
      expect(url.startsWith("/fonts/"), url).toBe(true);
      expect(files.includes(url.replace("/fonts/", "")), url).toBe(true);
    }
  });

  it("swaps in the font without hiding text while it loads", () => {
    const blocks = css.match(/@font-face\s*{[^}]+}/g) ?? [];
    expect(blocks.length).toBe(2);
    for (const block of blocks) expect(block).toContain("font-display: swap");
  });

  it("covers every Turkish letter, so Turkish text never falls back to another font", () => {
    const covered = coveredCodePoints();
    for (const letter of "çÇğĞıİöÖşŞüÜâîû") {
      expect(covered(letter.codePointAt(0) ?? 0), letter).toBe(true);
    }
  });

  it("is first in the font stack, with system fonts behind it", () => {
    expect(css).toMatch(/--font-sans:\s*"Inter", ui-sans-serif, system-ui/);
  });

  it("is small: the two files together stay under 150 KB", () => {
    const total = files.reduce((sum, f) => sum + statSync(join(fontDir, f)).size, 0);
    expect(total).toBeLessThan(150 * 1024);
  });
});
