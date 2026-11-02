"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CircleCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Page } from "@/components/ui/page";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { Locale } from "@/i18n/messages";
import { listLessonCards } from "@/lessons";
import { LESSON_CATEGORIES, lessonCategory } from "@/lib/lesson-meta";
import { cn, stagger } from "@/lib/utils";
import { useAppStore } from "@/store";

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-[20px] bg-muted px-[18px] py-3.5 text-[13px] leading-relaxed">
      <b>{label}.</b> {text}
    </div>
  );
}

const SHELF_FILL = ["bg-c1", "bg-c2", "bg-c3", "bg-c4"];

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
    <Page title={t("title")} subtitle={t("subtitle")}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3.5">
          <div className="relative w-full sm:w-[300px]">
            <Search
              className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label={t("search")}
              placeholder={t("search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-card pl-10"
            />
          </div>
          <SegmentedControl
            label={t("shelf.label")}
            value={category}
            onChange={setCategory}
            className="bg-card"
            options={[
              { value: "all", label: t("shelf.all") },
              ...LESSON_CATEGORIES.map((c) => ({ value: c, label: t(`shelf.${c}`) })),
            ]}
          />
        </div>
        <div className="flex items-center gap-3 text-[13.5px] font-bold">
          <span data-testid="read-progress">
            {t("progress", { read: readCount, total: cards.length })}
          </span>
          <div className="w-[140px]">
            <ProgressBar
              value={readCount}
              max={Math.max(cards.length, 1)}
              label={t("progressLabel")}
              tone="success"
              className="bg-card"
            />
          </div>
        </div>
      </div>

      {shown.length === 0 && <p className="text-sm text-muted-foreground">{t("noMatch")}</p>}

      <ul className="grid items-start gap-4 md:grid-cols-2">
        {shown.map((card, i) => {
          const open = openId === card.id;
          const read = readLessons.includes(card.id);
          const category = lessonCategory(card.id);
          return (
            <li
              key={card.id}
              id={card.id}
              data-testid={`lesson-${card.id}`}
              style={stagger(i)}
              className={cn(
                "lift pop-in scroll-mt-24 rounded-card bg-card px-[30px] py-[26px]",
                open && "shadow-[inset_0_0_0_2px_var(--primary)]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[19px] font-extrabold tracking-[-0.03em]">{card.title}</h2>
                  <p className="mt-[3px] text-[12.5px] text-muted-foreground">
                    {card.source.author}, {card.source.work}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[11.5px] font-extrabold text-on",
                    SHELF_FILL[LESSON_CATEGORIES.indexOf(category) % 4],
                  )}
                >
                  {t(`shelf.${category}`)}
                </span>
                {read && <span className="sr-only">{t("read")}</span>}
              </div>
              <p className="mt-3.5 text-sm leading-relaxed">{card.principle}</p>
              {open && (
                <div className="fade-in mt-3.5 flex flex-col gap-3">
                  {card.formula && <Section label={t("formula")} text={card.formula} />}
                  <Section label={t("fitsWhen")} text={card.fitsWhen} />
                  <Section label={t("critique")} text={card.critique} />
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-label={card.title}
                  onClick={() => setOpenId(open ? null : card.id)}
                  className="press rounded-full bg-muted px-4 py-2 text-[12.5px] font-extrabold"
                >
                  {open ? t("hideDetails") : t("showDetails")}
                </button>
                <button
                  type="button"
                  onClick={() => toggleRead(card.id)}
                  className={cn(
                    "press flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-extrabold",
                    read ? "bg-c4 text-on" : "bg-foreground text-background",
                  )}
                >
                  {read && <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />}
                  {read ? t("markUnread") : t("markRead")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}
