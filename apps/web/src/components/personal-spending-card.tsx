"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { MoneyInput } from "./money-input";

export interface PersonalSpendingCardProps {
  currency: string;
  value: number | undefined;
  onChange: (minor: number | undefined) => void;
}

/** An optional monthly amount for going out, friends and shopping, counted with the wants. */
export function PersonalSpendingCard({ currency, value, onChange }: PersonalSpendingCardProps) {
  const t = useTranslations("profile.personal");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Field label={t("amount")} htmlFor="personal-spending" hint={t("amountHint")}>
          <MoneyInput
            id="personal-spending"
            currency={currency}
            value={value ?? 0}
            onChange={(minor) => onChange(minor > 0 ? minor : undefined)}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
