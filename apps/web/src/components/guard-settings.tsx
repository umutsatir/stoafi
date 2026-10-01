"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { PercentInput } from "./percent-input";

export interface GuardSettingsProps {
  /** The cap as a ratio: 0.2 means 20% of net income. */
  installmentCapPct: number;
  onChange: (installmentCapPct: number) => void;
}

/** Editable guard thresholds. Only values the guard schema accepts (0 to 100%) are passed on. */
export function GuardSettings({ installmentCapPct, onChange }: GuardSettingsProps) {
  const t = useTranslations("guardSettings");
  const [outOfRange, setOutOfRange] = useState(false);

  return (
    <Card>
      <CardContent className="pt-6">
        <Field
          label={t("installmentCap")}
          htmlFor="installment-cap"
          hint={t("installmentCapHint")}
          error={outOfRange ? t("outOfRange") : undefined}
        >
          <PercentInput
            id="installment-cap"
            value={installmentCapPct}
            onChange={(ratio) => {
              if (ratio > 1) {
                setOutOfRange(true);
                return;
              }
              setOutOfRange(false);
              onChange(ratio);
            }}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
