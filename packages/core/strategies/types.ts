import type { z } from "zod";
import type { Bucket } from "../kernel/bucket";
import type { Month } from "../kernel/month";
import type { Minor } from "../kernel/money";
import type { MonthProjection } from "../kernel/projection";
import type { Profile } from "../modules/profile/schema";

export interface Insight {
  id: string;
  /** English text for logs and as a fallback; screens translate by `id`. */
  message: string;
  /** The month the insight is about. */
  month: Month;
}

/** A strategy's tunable parameters (e.g. bucket percentages). */
export type ParamSchema = z.ZodTypeAny;

export interface Strategy<Params = unknown> {
  id: string;
  /**
   * A reference to the strategy's lesson card, not the embedded
   * `LessonCard` content: `packages/lessons` (en/tr JSON) depends on
   * `@stoafi/core` for `LessonCardSchema`, so core cannot depend back on
   * lesson content without a cycle — and content needs to stay swappable
   * per locale without a code change. Callers resolve `lessonId` against
   * `packages/lessons` for the active locale.
   */
  lessonId: string;
  params: ParamSchema;
  allocate: (profile: Profile, params: Params) => Record<Bucket, Minor>;
  diagnose: (profile: Profile, projection: MonthProjection[]) => Insight[];
}
