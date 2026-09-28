import { z } from "zod";

/**
 * Placeholder lesson card schema, local to this package.
 * Replaced by the kernel's LessonCard schema in T3.5/T3.7.
 */
export const LessonCardPlaceholderSchema = z.object({
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
});

export type LessonCardPlaceholder = z.infer<typeof LessonCardPlaceholderSchema>;
