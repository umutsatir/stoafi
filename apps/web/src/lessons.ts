import { LessonCardSchema, type LessonCard } from "@stoafi/core";
import fiftyThirtyTwentyEn from "@stoafi/lessons/en/fifty-thirty-twenty.json";
import payYourselfFirstEn from "@stoafi/lessons/en/pay-yourself-first.json";
import consciousSpendingEn from "@stoafi/lessons/en/conscious-spending.json";
import babyStepsEn from "@stoafi/lessons/en/baby-steps.json";

/**
 * Lesson cards bundled at build time, en locale only for now — TR and a
 * real locale switch land in Phase 8 (T8.1/T8.2).
 */
const LESSONS_EN: Record<string, LessonCard> = {
  "fifty-thirty-twenty": LessonCardSchema.parse(fiftyThirtyTwentyEn),
  "pay-yourself-first": LessonCardSchema.parse(payYourselfFirstEn),
  "conscious-spending": LessonCardSchema.parse(consciousSpendingEn),
  "baby-steps": LessonCardSchema.parse(babyStepsEn),
};

export function getLessonCard(lessonId: string): LessonCard | undefined {
  return LESSONS_EN[lessonId];
}
