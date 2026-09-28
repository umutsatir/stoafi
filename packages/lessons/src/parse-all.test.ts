import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, dirname, join } from "node:path";
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

  it("every en file has a matching tr file with the same id and non-empty fields", () => {
    const enDir = join(packageRoot, "en");
    const trDir = join(packageRoot, "tr");
    const enFiles = jsonFilesIn(enDir);

    expect(enFiles.length).toBeGreaterThan(0);

    for (const enFile of enFiles) {
      const trFile = join(trDir, basename(enFile));

      const enCard = LessonCardSchema.parse(JSON.parse(readFileSync(enFile, "utf-8")));
      const trCard = LessonCardSchema.parse(JSON.parse(readFileSync(trFile, "utf-8")));

      expect(trCard.id, `${trFile} id mismatch`).toBe(enCard.id);

      for (const card of [enCard, trCard]) {
        expect(card.title.length).toBeGreaterThan(0);
        expect(card.source.author.length).toBeGreaterThan(0);
        expect(card.source.work.length).toBeGreaterThan(0);
        expect(card.principle.length).toBeGreaterThan(0);
        expect(card.fitsWhen.length).toBeGreaterThan(0);
        expect(card.critique.length).toBeGreaterThan(0);
      }
    }
  });
});
