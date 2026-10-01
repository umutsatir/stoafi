"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  INFLATION_COUNTRY_CODES,
  INFLATION_DATA_AS_OF,
  activeFixedExpenses,
  monthlyNeeds,
  netMonthlyIncome,
  suggestedAnnualInflation,
  suggestedEmergencyFundMonth,
  type Month,
  type Profile,
} from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { MoneyInput } from "./money-input";
import { PercentInput } from "./percent-input";

/** The settings part of the profile: savings, the emergency-fund goal and inflation. */
export type ProfileSettings = Pick<
  Profile,
  "savings" | "emergencyFundTargetMonths" | "annualInflationExpectation" | "countryCode"
>;

export interface ProfileFormProps {
  /** The saved profile; its income and expenses feed the emergency-fund estimate. */
  initial?: Profile;
  currency?: string;
  currentMonth?: Month;
  /** This month's installment payments, taken off the surplus in the emergency-fund estimate. */
  installmentLoad?: number;
  onSave: (settings: ProfileSettings) => void | Promise<void>;
}

export function ProfileForm({
  initial,
  currency = "TRY",
  currentMonth,
  installmentLoad = 0,
  onSave,
}: ProfileFormProps) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const [savings, setSavings] = useState(initial?.savings ?? 0);
  const [fundMonths, setFundMonths] = useState(initial?.emergencyFundTargetMonths ?? 6);
  const [inflation, setInflation] = useState(initial?.annualInflationExpectation ?? 0.3);
  const [country, setCountry] = useState(initial?.countryCode ?? "");

  const regionNames = new Intl.DisplayNames(locale, { type: "region" });

  // Estimate from the saved income and expenses plus what is being typed here.
  const caption = (() => {
    if (!initial || !currentMonth) return null;
    const needs = monthlyNeeds(initial, currentMonth);
    const surplus =
      netMonthlyIncome(initial) -
      activeFixedExpenses(initial, currentMonth).reduce((sum, e) => sum + e.monthly, 0) -
      initial.livingExpenses -
      installmentLoad;
    if (savings >= Math.round(needs * fundMonths)) return t("emergencyFundReached");
    const month = suggestedEmergencyFundMonth(savings, needs, fundMonths, surplus, currentMonth);
    return month ? t("emergencyFundOnTrack", { month }) : t("emergencyFundUnreachable");
  })();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void onSave({
      savings,
      emergencyFundTargetMonths: fundMonths,
      annualInflationExpectation: inflation,
      ...(country ? { countryCode: country } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field label={t("currentSavings")} htmlFor="savings">
            <MoneyInput id="savings" currency={currency} value={savings} onChange={setSavings} />
          </Field>
          <Field label={t("emergencyFundMonths")} htmlFor="fund-months">
            <Input
              id="fund-months"
              type="number"
              min={0}
              step="any"
              className="w-40"
              value={fundMonths}
              onChange={(e) => setFundMonths(Math.max(0, Number(e.target.value)))}
            />
            {caption && (
              <p data-testid="emergency-fund-caption" className="text-xs text-muted-foreground">
                {caption}
              </p>
            )}
          </Field>
          <Field label={t("country")} htmlFor="country">
            <NativeSelect
              id="country"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                const rate = suggestedAnnualInflation(e.target.value);
                if (rate !== undefined) setInflation(rate);
              }}
            >
              <option value="">{t("countryPlaceholder")}</option>
              {INFLATION_COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>
                  {regionNames.of(code) ?? code}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            label={t("annualInflation")}
            htmlFor="inflation"
            hint={
              country
                ? t("suggestedInflationCaption", { asOf: INFLATION_DATA_AS_OF })
                : t("inflationHint")
            }
          >
            <PercentInput id="inflation" value={inflation} onChange={setInflation} />
          </Field>
        </CardContent>
      </Card>

      <div>
        <Button type="submit">{t("save")}</Button>
      </div>
    </form>
  );
}
