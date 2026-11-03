"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  FUND_HOLDINGS,
  fundHoldingFit,
  type FundHolding,
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
import { Field } from "@/components/ui/field";
import { Stepper } from "@/components/ui/stepper";
import { NativeSelect } from "@/components/ui/native-select";
import { useMoney } from "@/lib/use-money";
import { stagger } from "@/lib/utils";
import { MoneyInput } from "./money-input";
import { PercentInput } from "./percent-input";

/** The settings part of the profile: savings, the emergency-fund goal and inflation. */
export type ProfileSettings = Pick<
  Profile,
  | "savings"
  | "emergencyFundTargetMonths"
  | "annualInflationExpectation"
  | "countryCode"
  | "emergencyFundHeld"
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
  const money = useMoney();
  const [savings, setSavings] = useState(initial?.savings ?? 0);
  const [fundMonths, setFundMonths] = useState(initial?.emergencyFundTargetMonths ?? 6);
  const [inflation, setInflation] = useState(initial?.annualInflationExpectation ?? 0.3);
  const [country, setCountry] = useState(initial?.countryCode ?? "");
  const [held, setHeld] = useState<FundHolding | undefined>(initial?.emergencyFundHeld);

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
      ...(held ? { emergencyFundHeld: held } : {}),
    });
  }

  const CARD = "pop-in flex flex-col rounded-card bg-card px-8 py-7";
  const TITLE = "text-[22px] font-extrabold tracking-[-0.03em]";
  const HINT = "mt-1 text-[13px] leading-normal text-muted-foreground";

  return (
    <form onSubmit={handleSubmit} className="grid items-stretch gap-4 lg:grid-cols-[1.1fr_1fr]">
      <section className={CARD} aria-label={t("fundTitle")}>
        <h2 className={TITLE}>{t("fundTitle")}</h2>
        <p className={HINT}>{t("fundHint")}</p>
        <div className="mt-5">
          <Field label={t("currentSavings")} htmlFor="savings">
            <MoneyInput id="savings" currency={currency} value={savings} onChange={setSavings} />
          </Field>
        </div>
        <p className="mt-[18px] text-[13px] font-bold" id="fund-months-label">
          {t("emergencyFundMonths")}
        </p>
        <Stepper
          className="mt-2"
          value={fundMonths}
          min={0}
          max={60}
          decreaseLabel={t("fundMonthsDecrease")}
          increaseLabel={t("fundMonthsIncrease")}
          onChange={setFundMonths}
        />
        {caption && (
          <p
            data-testid="emergency-fund-caption"
            className="mt-[18px] rounded-[18px] bg-muted px-4 py-3.5 text-[13.5px] font-semibold leading-normal"
          >
            {caption}
          </p>
        )}
        <p className="mt-5 text-[13px] font-bold" id="held-label">
          {t("held.label")}
        </p>
        <div role="radiogroup" aria-labelledby="held-label" className="mt-2 flex flex-wrap gap-2">
          {FUND_HOLDINGS.map((holding) => (
            <button
              key={holding}
              type="button"
              role="radio"
              aria-checked={held === holding}
              onClick={() => setHeld(held === holding ? undefined : holding)}
              className={`press rounded-full px-4 py-[9px] text-[13px] font-bold ${
                held === holding ? "bg-foreground text-background" : "bg-muted"
              }`}
            >
              {t(`held.${holding}`)}
            </button>
          ))}
        </div>
        {held && (
          <p
            data-testid="held-fit"
            className="mt-3 text-[13px] leading-[1.55] text-muted-foreground [animation:fade_0.4s_both]"
          >
            <b
              className={
                fundHoldingFit(held) === "good"
                  ? "text-success"
                  : fundHoldingFit(held) === "risky"
                    ? "text-destructive"
                    : "text-foreground"
              }
            >
              {t(`held.fit.${fundHoldingFit(held)}.title`)}
            </b>{" "}
            {t(`held.fit.${fundHoldingFit(held)}.text`)}
          </p>
        )}
      </section>

      <section className={CARD} style={stagger(1)} aria-label={t("economyTitle")}>
        <h2 className={TITLE}>{t("economyTitle")}</h2>
        <p className={HINT}>{t("economyHint")}</p>
        <div className="mt-5">
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
        </div>
        <div className="mt-[18px]">
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
        </div>
        <p
          data-testid="inflation-insight"
          className="mt-[18px] rounded-[18px] bg-muted px-[18px] py-4 text-sm font-semibold leading-[1.55]"
        >
          {t("inflationInsight", {
            rate: `${(inflation * 100).toFixed(0)}%`,
            amount: money(100_000),
            then: money(Math.round(100_000 * (1 + inflation))),
          })}
        </p>
        <div className="mt-auto pt-5">
          <Button type="submit" size="lg" className="w-full hover:scale-[1.03]">
            {t("save")}
          </Button>
        </div>
      </section>
    </form>
  );
}
