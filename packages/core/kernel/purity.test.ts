import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CORE_ROOT = join(import.meta.dirname, "..");
const FORBIDDEN_IMPORTS = ["react", "next", "dexie"];
const FORBIDDEN_CALLS = ["Date.now(", "Math.random("];

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    if (entry === "node_modules" || entry === "dist") continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
    } else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("packages/core purity", () => {
  const files = listSourceFiles(CORE_ROOT);

  it("scans at least one source file", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("never imports react, next or dexie", () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      for (const forbidden of FORBIDDEN_IMPORTS) {
        if (new RegExp(`from ["']${forbidden}["']`).test(content)) {
          violations.push(`${file} imports "${forbidden}"`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("never calls Date.now() or Math.random()", () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      for (const forbidden of FORBIDDEN_CALLS) {
        if (content.includes(forbidden)) {
          violations.push(`${file} calls ${forbidden}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
