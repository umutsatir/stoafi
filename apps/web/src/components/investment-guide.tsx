"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { INVESTMENT_TYPES } from "@stoafi/core";
import { LessonLink } from "./lesson-link";

const FIELDS = ["what", "risk", "cost", "horizon", "mistake"] as const;

/** Short, plain-language notes on each kind of investment. Education, not advice. */
export function InvestmentGuide() {
  const t = useTranslations("investments.guide");
  const tTypes = useTranslations("investments.types");
  return (
    <section className="flex flex-col gap-3" aria-label={t("title")}>
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {INVESTMENT_TYPES.map((type) => (
          <li key={type.id}>
            <details
              className="group rounded-xl border border-border bg-card"
              data-testid={`guide-${type.id}`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {tTypes(`${type.id}.name`)}
                <ChevronDown
                  className="h-4 w-4 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <dl className="flex flex-col gap-2 px-4 pb-4 text-sm">
                {FIELDS.map((field) => (
                  <div key={field}>
                    <dt className="font-medium">{t(`fields.${field}`)}</dt>
                    <dd className="text-muted-foreground">{t(`${type.id}.${field}`)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t("notAdvice")}</p>
      <LessonLink lessonId="index-funds" testId="lesson-link-index-funds-investments" />
    </section>
  );
}
