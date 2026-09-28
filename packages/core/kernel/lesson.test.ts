import { describe, expect, it } from "vitest";
import { LessonCardSchema } from "./lesson";

describe("LessonCardSchema", () => {
  it("parses a valid card", () => {
    const result = LessonCardSchema.safeParse({
      id: "fifty-thirty-twenty",
      title: "The 50/30/20 rule",
      source: { author: "Elizabeth Warren", work: "All Your Worth" },
      principle: "Split income into three buckets.",
      fitsWhen: "You want one simple rule.",
      critique: "Ignores cost-of-living variance.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a card missing principle", () => {
    const result = LessonCardSchema.safeParse({
      id: "fifty-thirty-twenty",
      title: "The 50/30/20 rule",
      source: { author: "Elizabeth Warren", work: "All Your Worth" },
      fitsWhen: "You want one simple rule.",
      critique: "Ignores cost-of-living variance.",
    });
    expect(result.success).toBe(false);
  });
});
