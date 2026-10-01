"use client";

import { useTranslations } from "next-intl";
import type { Bucket, CategoryAmount } from "@stoafi/core";
import { useMoney } from "@/lib/use-money";

export interface CategoryLinesProps {
  rows: CategoryAmount[];
  bucket: Bucket;
  /** Names for items the profile does not own (queue purchases, pots), by source id. */
  names?: Record<string, string>;
  /** One line of categories (home) or every line item under each category (plan). */
  detailed?: boolean;
}

/** What a bucket's committed money is for: bills, living costs, installments, loans, pots and saving. */
export function CategoryLines({ rows, bucket, names = {}, detailed = false }: CategoryLinesProps) {
  const t = useTranslations("home.limits.category");
  const money = useMoney();
  const mine = rows.filter((r) => r.bucket === bucket);
  if (mine.length === 0) return null;

  if (!detailed) {
    return (
      <p className="text-xs text-muted-foreground" data-testid={`categories-${bucket}`}>
        {mine.map((r) => `${t(r.category)} ${money(r.amount)}`).join(" · ")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5 text-sm" data-testid={`categories-${bucket}`}>
      {mine.map((r) => (
        <li key={r.category} data-testid={`category-${bucket}-${r.category}`}>
          <div className="flex justify-between gap-2">
            <span className="font-medium">{t(r.category)}</span>
            <span>{money(r.amount)}</span>
          </div>
          {r.items.length > 1 || r.items[0]?.label !== t(r.category) ? (
            <ul className="mt-0.5 flex flex-col gap-0.5 pl-3 text-xs text-muted-foreground">
              {r.items.map((item) => (
                <li key={item.key} className="flex justify-between gap-2">
                  <span className="truncate">{item.label ?? names[item.key] ?? item.key}</span>
                  <span>{money(item.amount)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
