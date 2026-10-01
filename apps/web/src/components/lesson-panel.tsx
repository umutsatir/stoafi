"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <p className="text-sm">{text}</p>
    </div>
  );
}

export interface LessonPanelLinkProps {
  lessonId: string;
  testId?: string;
  className?: string;
  ariaLabel?: string;
  /** Replaces the lesson's title as the link text. */
  children?: ReactNode;
}

/**
 * Reads a lesson card without leaving the page: a link-styled button that opens the card in a side panel,
 * with a way on to the full lessons page. Renders nothing for an unknown lesson.
 */
export function LessonPanelLink({
  lessonId,
  testId,
  className,
  ariaLabel,
  children,
}: LessonPanelLinkProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("lessons");
  const [open, setOpen] = useState(false);
  const lesson = getLessonCard(lessonId, locale);
  if (!lesson) return null;

  return (
    <>
      <button
        type="button"
        data-testid={testId}
        {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
        onClick={() => setOpen(true)}
        className={cn(
          "text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        {children ?? lesson.title}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          title={lesson.title}
          description={`${lesson.source.author}, ${lesson.source.work}`}
        >
          <p className="text-sm">{lesson.principle}</p>
          {lesson.formula && <Section label={t("formula")} text={lesson.formula} />}
          <Section label={t("fitsWhen")} text={lesson.fitsWhen} />
          <Section label={t("critique")} text={lesson.critique} />
          <Link
            href={`/lessons#${lesson.id}`}
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {t("openInLessons")}
          </Link>
        </SheetContent>
      </Sheet>
    </>
  );
}
