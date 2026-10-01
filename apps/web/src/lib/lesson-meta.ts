export const LESSON_CATEGORIES = ["planning", "saving", "investing", "thinking"] as const;
export type LessonCategory = (typeof LESSON_CATEGORIES)[number];

/** Which shelf each lesson card sits on. A card not listed here goes under "thinking". */
const CATEGORY_BY_LESSON: Record<string, LessonCategory> = {
  "fifty-thirty-twenty": "planning",
  "pay-yourself-first": "planning",
  "conscious-spending": "planning",
  "baby-steps": "planning",
  "sinking-funds": "saving",
  "room-for-error": "saving",
  "index-funds": "investing",
  "time-value-of-money": "investing",
  "cost-in-life-energy": "thinking",
  "eisenhower-matrix": "thinking",
};

export function lessonCategory(id: string): LessonCategory {
  return CATEGORY_BY_LESSON[id] ?? "thinking";
}
