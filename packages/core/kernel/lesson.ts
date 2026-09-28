import { z } from "zod";

export interface LessonCard {
  id: string;
  title: string;
  source: { author: string; work: string };
  principle: string;
  formula?: string;
  fitsWhen: string;
  critique: string;
}

export const LessonCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.object({
    author: z.string(),
    work: z.string(),
  }),
  principle: z.string(),
  formula: z.string().optional(),
  fitsWhen: z.string(),
  critique: z.string(),
}) satisfies z.ZodType<LessonCard>;
