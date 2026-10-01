import { LessonCardSchema, type LessonCard } from "@stoafi/core";
import fiftyThirtyTwentyEn from "@stoafi/lessons/en/fifty-thirty-twenty.json";
import payYourselfFirstEn from "@stoafi/lessons/en/pay-yourself-first.json";
import consciousSpendingEn from "@stoafi/lessons/en/conscious-spending.json";
import babyStepsEn from "@stoafi/lessons/en/baby-steps.json";
import costInLifeEnergyEn from "@stoafi/lessons/en/cost-in-life-energy.json";
import roomForErrorEn from "@stoafi/lessons/en/room-for-error.json";
import indexFundsEn from "@stoafi/lessons/en/index-funds.json";
import eisenhowerMatrixEn from "@stoafi/lessons/en/eisenhower-matrix.json";
import sinkingFundsEn from "@stoafi/lessons/en/sinking-funds.json";
import timeValueOfMoneyEn from "@stoafi/lessons/en/time-value-of-money.json";

import fiftyThirtyTwentyTr from "@stoafi/lessons/tr/fifty-thirty-twenty.json";
import payYourselfFirstTr from "@stoafi/lessons/tr/pay-yourself-first.json";
import consciousSpendingTr from "@stoafi/lessons/tr/conscious-spending.json";
import babyStepsTr from "@stoafi/lessons/tr/baby-steps.json";
import costInLifeEnergyTr from "@stoafi/lessons/tr/cost-in-life-energy.json";
import roomForErrorTr from "@stoafi/lessons/tr/room-for-error.json";
import indexFundsTr from "@stoafi/lessons/tr/index-funds.json";
import eisenhowerMatrixTr from "@stoafi/lessons/tr/eisenhower-matrix.json";
import sinkingFundsTr from "@stoafi/lessons/tr/sinking-funds.json";
import timeValueOfMoneyTr from "@stoafi/lessons/tr/time-value-of-money.json";

import type { Locale } from "@/i18n/messages";

function buildCatalog(raw: Record<string, unknown>): Record<string, LessonCard> {
  return Object.fromEntries(
    Object.entries(raw).map(([id, card]) => [id, LessonCardSchema.parse(card)]),
  );
}

const LESSONS: Record<Locale, Record<string, LessonCard>> = {
  en: buildCatalog({
    "fifty-thirty-twenty": fiftyThirtyTwentyEn,
    "pay-yourself-first": payYourselfFirstEn,
    "conscious-spending": consciousSpendingEn,
    "baby-steps": babyStepsEn,
    "cost-in-life-energy": costInLifeEnergyEn,
    "room-for-error": roomForErrorEn,
    "index-funds": indexFundsEn,
    "eisenhower-matrix": eisenhowerMatrixEn,
    "sinking-funds": sinkingFundsEn,
    "time-value-of-money": timeValueOfMoneyEn,
  }),
  tr: buildCatalog({
    "fifty-thirty-twenty": fiftyThirtyTwentyTr,
    "pay-yourself-first": payYourselfFirstTr,
    "conscious-spending": consciousSpendingTr,
    "baby-steps": babyStepsTr,
    "cost-in-life-energy": costInLifeEnergyTr,
    "room-for-error": roomForErrorTr,
    "index-funds": indexFundsTr,
    "eisenhower-matrix": eisenhowerMatrixTr,
    "sinking-funds": sinkingFundsTr,
    "time-value-of-money": timeValueOfMoneyTr,
  }),
};

export function getLessonCard(lessonId: string, locale: Locale = "en"): LessonCard | undefined {
  return LESSONS[locale][lessonId];
}

/** Every lesson card id, in the order SPEC lists them. */
export const LESSON_IDS = [
  "fifty-thirty-twenty",
  "pay-yourself-first",
  "conscious-spending",
  "baby-steps",
  "cost-in-life-energy",
  "room-for-error",
  "index-funds",
  "eisenhower-matrix",
  "sinking-funds",
  "time-value-of-money",
] as const;

export function listLessonCards(locale: Locale = "en"): LessonCard[] {
  return LESSON_IDS.flatMap((id) => {
    const card = LESSONS[locale][id];
    return card ? [card] : [];
  });
}
