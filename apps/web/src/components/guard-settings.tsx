"use client";

import { useTranslations } from "next-intl";
import { Stepper } from "@/components/ui/stepper";

export interface GuardSettingsProps {
  /** The cap as a ratio: 0.2 means 20% of net income. */
  installmentCapPct: number;
  onChange: (installmentCapPct: number) => void;
}

/** Editable guard thresholds. Steps of one percent, kept between 0 and 100%. */
export function GuardSettings({ installmentCapPct, onChange }: GuardSettingsProps) {
  const t = useTranslations("guardSettings");

  return (
    <div>
      <p className="mt-4 text-[13px] font-bold">{t("installmentCap")}</p>
      <Stepper
        className="mt-2"
        value={Math.round(installmentCapPct * 100)}
        min={0}
        max={100}
        format={(v) => `%${v}`}
        decreaseLabel={t("decrease")}
        increaseLabel={t("increase")}
        onChange={(percent) => onChange(percent / 100)}
      />
      <p className="mt-2.5 text-[12.5px] leading-normal text-muted-foreground">
        {t("installmentCapHint")}
      </p>
    </div>
  );
}
