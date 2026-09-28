import type { z } from "zod";
import type { Bucket } from "../kernel/bucket";
import type { LessonCard } from "../kernel/lesson";
import type { Minor } from "../kernel/money";
import type { MonthProjection } from "../kernel/projection";
import type { Profile } from "../modules/profile/schema";

export interface Insight {
  id: string;
  message: string;
}

/** A strategy's tunable parameters (e.g. bucket percentages). */
export type ParamSchema = z.ZodTypeAny;

export interface Strategy<Params = unknown> {
  id: string;
  lesson: LessonCard;
  params: ParamSchema;
  allocate: (profile: Profile, params: Params) => Record<Bucket, Minor>;
  diagnose: (profile: Profile, projection: MonthProjection[]) => Insight[];
}
