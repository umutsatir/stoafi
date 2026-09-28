import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { LessonCardSchema } from "@stoafi/core";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function jsonFilesIn(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => join(dir, name));
}

describe("lesson card JSON files", () => {
  it("every en and tr file parses against the kernel LessonCard schema", () => {
    const files = [
      ...jsonFilesIn(join(packageRoot, "en")),
      ...jsonFilesIn(join(packageRoot, "tr")),
    ];

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const raw = readFileSync(file, "utf-8");
      const result = LessonCardSchema.safeParse(JSON.parse(raw));
      expect(result.success, `${file} failed schema validation`).toBe(true);
    }
  });
});
