"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface OrbitSegment {
  id: string;
  label: string;
  /** Pre-formatted amount, e.g. "24.750 ₺". */
  amountText: string;
  /** Minor units; sizes the arc. */
  amount: number;
  /** A CSS colour, normally var(--c1)..var(--c4). */
  color: string;
  /** Share of income, already formatted ("%31 of income"). */
  shareText: string;
  rows: { label: string; amountText: string; amount: number }[];
  note: string;
}

const CIRCUMFERENCE = 2 * Math.PI * 190;
const INNER = 2 * Math.PI * 148;

/**
 * The home hero: income split into arcs (fixed, living, installments, what is left) with a thin
 * inner ring for how far into the month it is. Hover or focus a part to read what is inside it.
 */
export function OrbitRing({
  segments,
  income,
  day,
  days,
  innerLabel,
  ariaLabel,
}: {
  segments: OrbitSegment[];
  income: number;
  day: number;
  days: number;
  innerLabel: string;
  ariaLabel: string;
}) {
  const [active, setActive] = useState(segments.length - 1);
  const current = segments[Math.min(active, segments.length - 1)];
  if (!current) return null;
  const detailTotal = current.rows.reduce((sum, r) => sum + Math.abs(r.amount), 0) || 1;
  let cumulative = 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="mt-2 flex flex-wrap items-center gap-8">
        <div className="relative mx-auto aspect-square w-[min(420px,100%)] flex-none">
          <svg
            role="img"
            aria-label={ariaLabel}
            viewBox="0 0 500 500"
            className="h-full w-full -rotate-90 overflow-visible"
          >
            <circle cx="250" cy="250" r="190" fill="none" stroke="var(--muted)" strokeWidth="38" />
            {segments.map((segment, i) => {
              const fraction = income > 0 ? segment.amount / income : 0;
              const start = cumulative;
              cumulative += fraction;
              const on = i === active;
              return (
                <circle
                  key={segment.id}
                  cx="250"
                  cy="250"
                  r="190"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={on ? 50 : 38}
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(0.01, CIRCUMFERENCE * fraction - 46)} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-(start * CIRCUMFERENCE + 23)}
                  opacity={on ? 1 : 0.55}
                  className="cursor-pointer transition-[stroke-width,opacity] duration-300 ease-[cubic-bezier(.3,1.6,.5,1)]"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                />
              );
            })}
            <circle cx="250" cy="250" r="148" fill="none" stroke="var(--muted)" strokeWidth="7" />
            <circle
              cx="250"
              cy="250"
              r="148"
              fill="none"
              stroke="var(--foreground)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${(INNER * day) / Math.max(days, 1)} ${INNER}`}
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-sm font-bold text-muted-foreground">{current.label}</div>
            <div className="mt-0.5 text-[clamp(30px,6vw,48px)] font-extrabold leading-[1.1] tracking-[-0.05em]">
              {current.amountText}
            </div>
            <div className="mt-1.5 text-[12.5px] font-semibold text-muted-foreground">
              {innerLabel}
            </div>
          </div>
        </div>

        <div key={current.id} className="min-w-0 flex-1 basis-[260px] [animation:fade_0.5s_both]">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 rounded-full"
              style={{ background: current.color }}
            />
            <span className="text-[19px] font-extrabold tracking-[-0.02em]">{current.label}</span>
            <span className="ml-auto text-sm font-extrabold text-muted-foreground">
              {current.shareText}
            </span>
          </div>
          <ul className="max-h-[200px] overflow-hidden">
            {current.rows.map((row) => (
              <li key={row.label} className="mt-4">
                <div className="flex justify-between gap-3 text-[13.5px] font-semibold">
                  <span className="min-w-0 truncate">{row.label}</span>
                  <span className="font-extrabold">{row.amountText}</span>
                </div>
                <div className="mt-2 h-2 rounded-lg bg-muted">
                  <div
                    className="h-2 rounded-lg"
                    style={{
                      background: current.color,
                      width: `${(Math.abs(row.amount) / detailTotal) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[13px] font-medium leading-normal text-muted-foreground">
            {current.note}
          </p>
        </div>
      </div>

      <ul className="mt-2 flex flex-wrap gap-2">
        {segments.map((segment, i) => (
          <li key={segment.id} className="min-w-[120px] flex-1">
            <button
              type="button"
              aria-pressed={i === active}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className={cn(
                "w-full rounded-[20px] px-3.5 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                i === active ? "bg-muted" : "bg-transparent",
              )}
            >
              <span className="flex items-center gap-[7px] text-xs font-bold text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: segment.color }}
                />
                {segment.label}
              </span>
              <span className="mt-1 block text-base font-extrabold">{segment.amountText}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
