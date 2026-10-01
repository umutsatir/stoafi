"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BookOpen, CircleCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Page } from "@/components/ui/page";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusChip } from "@/components/ui/status-chip";
import type { Locale } from "@/i18n/messages";
import { listLessonCards } from "@/lessons";
import { LESSON_CATEGORIES, lessonCategory } from "@/lib/lesson-meta";
import { cn, stagger } from "@/lib/utils";
import { useAppStore } from "@/store";

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h4>
      <p className="text-sm">{text}</p>
    </div>
  );
}

export default function LessonsPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations("lessons");
  const cards = listLessonCards(locale);
  const readLessons = useAppStore((s) => s.readLessons);
  const toggleRead = useAppStore((s) => s.toggleLessonRead);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | (typeof LESSON_CATEGORIES)[number]>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  // A link like /lessons#baby-steps opens that card and scrolls to it. The page appears after saved
  // data loads, so the browser cannot do the scrolling by itself.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    setOpenId(id);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
  }, [locale]);

  const needle = query.trim().toLowerCase();
  const shown = cards.filter(
    (card) =>
      (category === "all" || lessonCategory(card.id) === category) &&
      (needle === "" ||
        `${card.title} ${card.source.author} ${card.source.work} ${card.principle}`
          .toLowerCase()
          .includes(needle)),
  );
  const readCount = cards.filter((c) => readLessons.includes(c.id)).length;

  return (
    <Page title={t("title")}>
      <p className="max-w-prose text-sm text-muted-foreground">{t("intro")}</p>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium" data-testid="read-progress">
          {t("progress", { read: readCount, total: cards.length })}
        </p>
        <ProgressBar
          value={readCount}
          max={Math.max(cards.length, 1)}
          label={t("progressLabel")}
          tone="success"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label={t("search")}
            placeholder={t("search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <SegmentedControl
          label={t("shelf.label")}
          value={category}
          onChange={setCategory}
          options={[
            { value: "all", label: t("shelf.all") },
            ...LESSON_CATEGORIES.map((c) => ({ value: c, label: t(`shelf.${c}`) })),
          ]}
        />
      </div>

      {shown.length === 0 && <p className="text-sm text-muted-foreground">{t("noMatch")}</p>}

      <ul className="flex flex-col gap-3">
        {shown.map((card, i) => {
          const open = openId === card.id;
          const read = readLessons.includes(card.id);
          return (
            <li
              key={card.id}
              id={card.id}
              data-testid={`lesson-${card.id}`}
              style={stagger(i)}
              className={cn(
                "rise-in scroll-mt-6 rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md",
                open ? "border-primary" : "border-border",
              )}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : card.id)}
                className="flex w-full items-start gap-3 rounded-2xl p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BookOpen className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{card.title}</span>
                    <StatusChip>{t(`shelf.${lessonCategory(card.id)}`)}</StatusChip>
                    {read && (
                      <StatusChip tone="success">
                        <span className="flex items-center gap-1">
                          <CircleCheck className="h-3 w-3" aria-hidden="true" />
                          {t("read")}
                        </span>
                      </StatusChip>
                    )}
                  </span>
                  <span className="mt-0.5 block text-sm italic text-muted-foreground">
                    {card.source.author}, {card.source.work}
                  </span>
                  {!open && (
                    <span className="mt-2 line-clamp-2 block text-sm text-muted-foreground">
                      {card.principle}
                    </span>
                  )}
                </span>
              </button>
              {open && (
                <div className="fade-in flex flex-col gap-4 px-5 pb-5 pl-13">
                  <p className="text-sm">{card.principle}</p>
                  {card.formula && <Section label={t("formula")} text={card.formula} />}
                  <Section label={t("fitsWhen")} text={card.fitsWhen} />
                  <Section label={t("critique")} text={card.critique} />
                  <Button
                    type="button"
                    variant={read ? "outline" : "default"}
                    className="w-fit"
                    onClick={() => toggleRead(card.id)}
                  >
                    {read ? t("markUnread") : t("markRead")}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Page>
  );
}
