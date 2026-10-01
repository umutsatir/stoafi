import { describe, expect, it } from "vitest";
import { lessonCategory, LESSON_CATEGORIES } from "./lesson-meta";
import { listLessonCards } from "@/lessons";

describe("lessonCategory", () => {
  it("puts every lesson card on a shelf, and an unknown one under thinking", () => {
    for (const card of listLessonCards("en")) {
      expect(LESSON_CATEGORIES).toContain(lessonCategory(card.id));
    }
    expect(lessonCategory("never-heard-of-it")).toBe("thinking");
  });

  it("groups the four planning strategies together", () => {
    for (const id of [
      "fifty-thirty-twenty",
      "pay-yourself-first",
      "conscious-spending",
      "baby-steps",
    ]) {
      expect(lessonCategory(id)).toBe("planning");
    }
  });
});
