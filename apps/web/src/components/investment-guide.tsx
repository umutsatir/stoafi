"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { INVESTMENT_TYPES } from "@stoafi/core";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { LessonLink } from "./lesson-link";

const FIELDS = ["what", "risk", "cost", "horizon", "mistake"] as const;

/** Short, plain-language notes on each kind of investment. Education, not advice. */
export function InvestmentGuide() {
  const t = useTranslations("investments.guide");
  const tTypes = useTranslations("investments.types");
  const [selected, setSelected] = useState<string>(INVESTMENT_TYPES[0]?.id ?? "gold");
  // "other" has no notes of its own, so it never appears as a chip.
  const types = INVESTMENT_TYPES.filter((type) => type.id !== "other" && t.has(`${type.id}.what`));

  return (
    <section
      className="pop-in rounded-card bg-card px-8 py-7"
      aria-label={t("title")}
      data-testid="investment-guide"
    >
      <h2 className="text-[19px] font-extrabold tracking-[-0.03em]">{t("title")}</h2>
      <p className="mt-[3px] text-[12.5px] text-muted-foreground">{t("intro")}</p>
      <div className="mt-3.5">
        <SegmentedControl
          tone="chips"
          label={t("title")}
          value={selected}
          onChange={setSelected}
          options={types.map((type) => ({ value: type.id, label: tTypes(`${type.id}.name`) }))}
        />
      </div>
      <dl
        key={selected}
        className="mt-3.5 grid gap-3 [animation:fade_0.4s_backwards] sm:grid-cols-2 lg:grid-cols-5"
        data-testid={`guide-${selected}`}
      >
        {FIELDS.map((field) => (
          <div key={field} className="rounded-[18px] bg-muted px-4 py-3.5">
            <dt className="text-[11px] font-extrabold text-muted-foreground">
              {t(`fields.${field}`)}
            </dt>
            <dd className="mt-1 text-[13px] font-bold leading-[1.45]">
              {t(`${selected}.${field}`)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3.5 text-xs text-muted-foreground">{t("notAdvice")}</p>
      <div className="mt-2">
        <LessonLink lessonId="index-funds" testId="lesson-link-index-funds-investments" />
      </div>
    </section>
  );
}
