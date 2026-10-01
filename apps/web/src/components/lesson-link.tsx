"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { cn } from "@/lib/utils";

export interface LessonLinkProps {
  lessonId: string;
  testId?: string;
  className?: string;
  /** Replaces the card's title as the link text. */
  children?: ReactNode;
  ariaLabel?: string;
}

/** A link to a lesson card's place on the lessons screen; renders nothing for an unknown lesson. */
export function LessonLink({ lessonId, testId, className, children, ariaLabel }: LessonLinkProps) {
  const locale = useLocale() as Locale;
  const lesson = getLessonCard(lessonId, locale);
  if (!lesson) return null;

  return (
    <Link
      href={`/lessons#${lesson.id}`}
      aria-label={ariaLabel ?? `${lesson.id} lesson`}
      data-testid={testId}
      className={cn(
        "text-sm font-medium text-primary underline-offset-2 hover:underline",
        className,
      )}
    >
      {children ?? lesson.title}
    </Link>
  );
}
