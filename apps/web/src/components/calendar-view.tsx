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
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { StatCard } from "@/components/ui/stat-card";
import { dayRulesFor } from "@/lib/day-rules";
import { formatMonth } from "@/lib/format-month";
import { cn, stagger } from "@/lib/utils";

export interface CalendarViewProps {
  profile: Profile;
  cards: Card[];
  today: string;
}

const DOT: Record<CalendarEvent["kind"], string> = {
  income: "bg-success",
  expense: "bg-warning",
  card: "bg-info",
};

/** A month of what comes in and goes out, by day: pay days, bills and card due dates. */
export function CalendarView({ profile, cards, today }: CalendarViewProps) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const [month, setMonth] = useState<Month>(today.slice(0, 7) as Month);
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
  const byDate = (day: number) =>
    events.filter((e) => e.date === `${month}-${String(day).padStart(2, "0")}`);
  const dayFormat = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("previous")}
          onClick={() => setMonth((m) => addMonths(m, -1))}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <h2 className="text-lg font-semibold" data-testid="calendar-month">
          {formatMonth(month, locale)}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("next")}
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          className="rise-in"
          label={t("moneyIn")}
          value={<Money value={money("income")} />}
          testId="calendar-in"
        />
        <StatCard
          className="rise-in"
          style={stagger(1)}
          label={t("moneyOut")}
          value={<Money value={money("expense")} />}
          testId="calendar-out"
        />
      </div>

      <div
        className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground"
        aria-hidden="true"
      >
        {weekdays.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1" aria-label={t("grid")}>
        {cells.map((day, index) => {
          if (day === null) return <li key={`blank-${index}`} aria-hidden="true" />;
          const dayEvents = byDate(day);
          const isToday = `${month}-${String(day).padStart(2, "0")}` === today;
          return (
            <li
              key={day}
              data-testid={`day-${day}`}
              className={cn(
                "flex min-h-14 flex-col items-center gap-1 rounded-lg border p-1 text-sm",
                isToday ? "border-primary bg-primary/10 font-semibold" : "border-border bg-card",
              )}
            >
              <span>{day}</span>
              <span className="flex flex-wrap justify-center gap-0.5" aria-hidden="true">
                {dayEvents.map((e) => (
                  <span key={e.id} className={cn("h-1.5 w-1.5 rounded-full", DOT[e.kind])} />
                ))}
              </span>
            </li>
          );
        })}
      </ol>

      <section className="flex flex-col gap-2" aria-label={t("list")}>
        <h3 className="text-sm font-semibold">{t("list")}</h3>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("none")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card px-4">
            {events.map((e) => (
              <li
                key={`${e.id}-${e.date}`}
                className="flex items-center gap-3 py-3 text-sm"
                data-testid={`calendar-event-${e.id}`}
              >
                <span
                  className={cn("h-2.5 w-2.5 shrink-0 rounded-full", DOT[e.kind])}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate font-medium">{e.label}</span>
                <span className="text-xs text-muted-foreground">
                  {t(`kind.${e.kind}`)} · {dayFormat.format(new Date(`${e.date}T00:00:00Z`))}
                </span>
                {e.amount !== undefined && (
                  <span
                    className={
                      e.kind === "income" ? "w-24 text-right text-success" : "w-24 text-right"
                    }
                  >
                    {e.kind === "income" ? "+" : "−"}
                    <Money value={e.amount} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
