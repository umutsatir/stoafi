import type { Strategy } from "../../strategies/types";
import * as fiftyThirtyTwenty from "../../strategies/fifty-thirty-twenty";
import * as payYourselfFirst from "../../strategies/pay-yourself-first";
import * as consciousSpending from "../../strategies/conscious-spending";
import * as babySteps from "../../strategies/baby-steps";

export const strategies: Record<string, Strategy> = {
  "fifty-thirty-twenty": {
    id: "fifty-thirty-twenty",
    lessonId: "fifty-thirty-twenty",
    params: fiftyThirtyTwenty.paramsSchema,
    allocate: fiftyThirtyTwenty.allocate as Strategy["allocate"],
    diagnose: fiftyThirtyTwenty.diagnose,
  },
  "pay-yourself-first": {
    id: "pay-yourself-first",
    lessonId: "pay-yourself-first",
    params: payYourselfFirst.paramsSchema,
    allocate: payYourselfFirst.allocate as Strategy["allocate"],
    diagnose: payYourselfFirst.diagnose,
  },
  "conscious-spending": {
    id: "conscious-spending",
    lessonId: "conscious-spending",
    params: consciousSpending.paramsSchema,
    allocate: consciousSpending.allocate as Strategy["allocate"],
    diagnose: consciousSpending.diagnose,
  },
  "baby-steps": {
    id: "baby-steps",
    lessonId: "baby-steps",
    params: babySteps.paramsSchema,
    allocate: babySteps.allocate as Strategy["allocate"],
    diagnose: babySteps.diagnose,
  },
};
