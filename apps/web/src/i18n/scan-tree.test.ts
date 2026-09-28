import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import en from "./en.json";
import tr from "./tr.json";
import { scanForHardcodedStrings } from "./scan-hardcoded-strings";

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules") continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...listTsxFiles(full));
    } else if (entry.endsWith(".tsx") && !entry.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe("apps/web/src has zero hard-coded strings outside the i18n system", () => {
  it("scans every .tsx file in the tree with zero violations", () => {
    const files = listTsxFiles(srcRoot);
    expect(files.length).toBeGreaterThan(0);

    const allViolations = files.flatMap((file) =>
      scanForHardcodedStrings(readFileSync(file, "utf-8"), file).map(
        (v) => `${file}:${v.line}: ${v.text}`,
      ),
    );

    expect(allViolations).toEqual([]);
  });
});

describe("en.json and tr.json have identical key sets", () => {
  it("both catalogs define exactly the same translation keys", () => {
    const enKeys = flattenKeys(en).sort();
    const trKeys = flattenKeys(tr).sort();
    expect(trKeys).toEqual(enKeys);
  });
});
