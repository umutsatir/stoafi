"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface MonthBar {
  key: string;
  /** Short month name under the bar. */
  short: string;
  /** Long month name for the readout. */
  long: string;
  valueText: string;
  value: number;
}

/** Twelve small bars, one per month; hover or focus one to read it. The first is the current month. */
export function MonthBars({
  bars,
  title,
  monthHeader,
  valueHeader,
}: {
  bars: MonthBar[];
  title: string;
  monthHeader: string;
  valueHeader: string;
}) {
  const [active, setActive] = useState(0);
  const max = Math.max(1, ...bars.map((b) => Math.max(0, b.value)));
  const current = bars[active] ?? bars[0];
  if (!current) return null;
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-extrabold">{title}</h2>
        <span className="text-[12.5px] font-semibold text-muted-foreground">
          {current.long} · {current.valueText}
        </span>
      </div>
      <ul className="mt-3 flex h-[84px] items-end gap-[5px]">
        {bars.map((bar, i) => (
          <li key={bar.key} className="flex h-full flex-1 items-end">
            <button
              type="button"
              aria-label={`${bar.long}: ${bar.valueText}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className={cn(
                "w-full rounded-t-lg rounded-b-[3px] transition-[background,height] duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                i === active ? "bg-foreground" : i === 0 ? "bg-primary" : "bg-secondary",
              )}
              style={{ height: `${Math.max(5, (Math.max(0, bar.value) / max) * 100)}%` }}
            />
          </li>
        ))}
      </ul>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>{monthHeader}</th>
            <th>{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.key}>
              <td>{bar.key}</td>
              <td>{bar.valueText}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="mt-1.5 flex gap-[5px]" aria-hidden="true">
        {bars.map((bar) => (
          <li
            key={bar.key}
            className="flex-1 text-center text-[10.5px] font-semibold text-muted-foreground"
          >
            {bar.short}
          </li>
        ))}
      </ul>
    </div>
  );
}
