"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  dueDateInMonth,
  eventsInMonth,
  type CalendarEvent,
  type Card,
  type Month,
  type Profile,
} from "@stoafi/core";
import { Card as Surface } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { dayRulesFor } from "@/lib/day-rules";
import { formatMonth } from "@/lib/format-month";
import { cn } from "@/lib/utils";

export interface CalendarViewProps {
  profile: Profile;
  cards: Card[];
  today: string;
}

const DOT: Record<CalendarEvent["kind"], string> = {
  income: "bg-c4",
  expense: "bg-c2",
  card: "bg-c1",
};

const ARROW =
  "press flex h-[42px] w-[42px] items-center justify-center rounded-full bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** A month of what comes in and goes out, by day: pay days, bills and card due dates. */
export function CalendarView({ profile, cards, today }: CalendarViewProps) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const [month, setMonth] = useState<Month>(today.slice(0, 7) as Month);
  const [picked, setPicked] = useState<number | null>(null);
  const events = eventsInMonth(dayRulesFor(profile, cards), month);

  const first = new Date(`${dueDateInMonth(month, 1)}T00:00:00Z`);
  // Monday first: Sunday (0) becomes 6.
  const lead = (first.getUTCDay() + 6) % 7;
  const daysInMonth = Number(dueDateInMonth(month, 31).slice(8, 10));
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(
      new Date(Date.UTC(2024, 0, 1 + i)),
    ),
  );
  const money = (kind: CalendarEvent["kind"]) =>
    events.filter((e) => e.kind === kind).reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const dateOf = (day: number) => `${month}-${String(day).padStart(2, "0")}`;
  const byDate = (day: number) => events.filter((e) => e.date === dateOf(day));
  const dayFormat = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const shown = picked === null ? events : byDate(picked);

  function move(by: number) {
    setMonth((m) => addMonths(m, by));
    setPicked(null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Surface className="pop-in px-5 py-6 md:px-7">
        <div className="mb-[18px] flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label={t("previous")}
            onClick={() => move(-1)}
            className={ARROW}
          >
            <ChevronLeft className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <h2
            key={month}
            className="text-2xl font-extrabold tracking-[-0.03em] [animation:fade_0.4s_both]"
            data-testid="calendar-month"
          >
            {formatMonth(month, locale)}
          </h2>
          <button type="button" aria-label={t("next")} onClick={() => move(1)} className={ARROW}>
            <ChevronRight className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>

        <div
          className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-muted-foreground md:gap-2"
          aria-hidden="true"
        >
          {weekdays.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <ol
          key={month}
          className="grid grid-cols-7 gap-1.5 [animation:fade_0.4s_both] md:gap-2"
          aria-label={t("grid")}
        >
          {cells.map((day, index) => {
            if (day === null) return <li key={`blank-${index}`} aria-hidden="true" />;
            const dayEvents = byDate(day);
            const isToday = dateOf(day) === today;
            const selected = picked === day;
            return (
              <li key={day} data-testid={`day-${day}`}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-current={isToday ? "date" : undefined}
                  onClick={() => setPicked(selected ? null : day)}
                  className={cn(
                    "flex min-h-14 w-full flex-col gap-2 rounded-[20px] p-2 text-left transition-[transform,translate,scale,background] duration-200 [transition-timing-function:cubic-bezier(.3,1.7,.5,1)] hover:-translate-y-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-[84px] md:p-2.5",
                    selected
                      ? "bg-foreground text-background"
                      : isToday
                        ? "bg-muted text-foreground shadow-[inset_0_0_0_2px_var(--primary)]"
                        : "text-foreground shadow-[inset_0_0_0_1px_var(--border)]",
                  )}
                >
                  <span className="text-[15px] font-extrabold">{day}</span>
                  <span className="flex flex-wrap gap-1" aria-hidden="true">
                    {dayEvents.map((e) => (
                      <span
                        key={e.id}
                        className={cn(
                          "h-[9px] w-[9px] rounded-full [animation:dotin_0.4s_backwards]",
                          DOT[e.kind],
                        )}
                      />
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <ul className="mt-[18px] flex flex-wrap gap-x-[18px] gap-y-1 text-[12.5px] font-bold text-muted-foreground">
          {(["income", "expense", "card"] as const).map((kind) => (
            <li key={kind} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cn("h-[9px] w-[9px] rounded-full", DOT[kind])} />
              {t(`kind.${kind}`)}
            </li>
          ))}
        </ul>
      </Surface>

      <div className="flex flex-col gap-4">
        <Surface
          className="pop-in bg-c4 px-[26px] py-[22px] text-on"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="text-[13px] font-bold">{t("moneyIn")}</div>
          <div
            className="mt-1 text-[34px] font-extrabold tracking-[-0.05em]"
            data-testid="calendar-in"
          >
            <Money value={money("income")} />
          </div>
        </Surface>
        <Surface className="pop-in px-[26px] py-[22px]" style={{ animationDelay: "0.25s" }}>
          <div className="text-[13px] font-bold text-muted-foreground">{t("moneyOut")}</div>
          <div
            className="mt-1 text-[34px] font-extrabold tracking-[-0.05em]"
            data-testid="calendar-out"
          >
            <Money value={money("expense")} />
          </div>
        </Surface>
        <Surface
          className="pop-in flex-1 px-[26px] py-[22px]"
          style={{ animationDelay: "0.35s" }}
          aria-label={t("list")}
        >
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base font-extrabold">
              {picked === null
                ? t("list")
                : dayFormat.format(new Date(`${dateOf(picked)}T00:00:00Z`))}
            </h3>
            {picked !== null && (
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="text-[12.5px] font-extrabold text-muted-foreground hover:text-foreground"
              >
                {t("all")}
              </button>
            )}
          </div>
          {shown.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("none")}</p>
          ) : (
            <ul>
              {shown.map((e) => (
                <li
                  key={`${e.id}-${e.date}`}
                  className="mt-2.5 flex items-center gap-3 border-t border-border py-2.5 [animation:slide_0.4s_backwards]"
                  data-testid={`calendar-event-${e.id}`}
                >
                  <span
                    className={cn("h-2.5 w-2.5 shrink-0 rounded-full", DOT[e.kind])}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{e.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t(`kind.${e.kind}`)} · {dayFormat.format(new Date(`${e.date}T00:00:00Z`))}
                    </div>
                  </div>
                  {e.amount !== undefined && (
                    <span
                      className={cn(
                        "text-sm font-extrabold",
                        e.kind === "income" && "text-success",
                      )}
                    >
                      {e.kind === "income" ? "+" : "−"}
                      <Money value={e.amount} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </div>
  );
}
