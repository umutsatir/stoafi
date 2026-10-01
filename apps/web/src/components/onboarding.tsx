"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import {
  INFLATION_COUNTRY_CODES,
  PlanStateSchema,
  ProfileSchema,
  compareStrategies,
  strategyRegistry,
  suggestedAnnualInflation,
  type Profile,
} from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { ProgressBar } from "@/components/ui/progress-bar";
import { DayOfMonthSelect } from "@/components/ui/day-of-month-select";
import { notify } from "@/components/ui/toaster";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { db } from "@/storage/instance";
import { putSingleton } from "@/storage/repo";
import { useAppStore } from "@/store";
import { useLocale } from "next-intl";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";
import { MoneyInput } from "./money-input";
import { PercentInput } from "./percent-input";

const CHIPS = [
  { key: "rent", bucket: "needs" },
  { key: "bills", bucket: "needs" },
  { key: "loan", bucket: "needs" },
  { key: "subscription", bucket: "wants" },
  { key: "school", bucket: "needs" },
] as const;

interface ExpenseRow {
  key: string;
  chip: (typeof CHIPS)[number]["key"];
  monthly: number;
}

export interface OnboardingProps {
  /** Loads the sample data; the page owns what that involves. */
  onDemo: () => void;
}

const STEPS = ["income", "expenses", "savings", "plan"] as const;

/** First run: four short steps from nothing to a plan, or a look around with sample data. */
export function Onboarding({ onDemo }: OnboardingProps) {
  const t = useTranslations("onboarding");
  const tTypes = useTranslations("profile");
  const locale = useLocale() as Locale;
  const money = useMoney();
  const currency = useAppStore((s) => s.currency);
  const setProfile = useAppStore((s) => s.setProfile);
  const setPlanState = useAppStore((s) => s.setPlanState);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [salaryName, setSalaryName] = useState("");
  const [salary, setSalary] = useState(0);
  const [payDay, setPayDay] = useState(1);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [living, setLiving] = useState(0);
  const [savings, setSavings] = useState(0);
  const [months, setMonths] = useState(6);
  const [country, setCountry] = useState("");
  const [inflation, setInflation] = useState(0.3);
  const [strategyId, setStrategyId] = useState("fifty-thirty-twenty");
  const [error, setError] = useState(false);
  const regionNames = new Intl.DisplayNames(locale, { type: "region" });

  const profile: Profile = {
    incomes: [
      {
        label: salaryName.trim() || t("defaultSalary"),
        monthly: salary,
        ...(payDay !== 1 ? { payDay } : {}),
      },
    ],
    fixedExpenses: expenses
      .filter((e) => e.monthly > 0)
      .map((e) => ({
        label: t(`chips.${e.chip}`),
        monthly: e.monthly,
        bucket: CHIPS.find((c) => c.key === e.chip)?.bucket ?? "needs",
        ...(e.chip === "subscription" ? { isSubscription: true } : {}),
      })),
    livingExpenses: living,
    savings,
    emergencyFundTargetMonths: months,
    annualInflationExpectation: inflation,
    ...(country ? { countryCode: country } : {}),
  };
  const fixedTotal = profile.fixedExpenses.reduce((sum, e) => sum + e.monthly, 0);
  const leftOver = salary - fixedTotal - living;

  function next() {
    if (step === 0 && salary <= 0) return setError(true);
    setError(false);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  async function finish() {
    const savedProfile = await putSingleton(db, "profile", ProfileSchema, profile);
    const plan = await putSingleton(db, "plan", PlanStateSchema, { strategyId, params: {} });
    setProfile(savedProfile);
    setPlanState(plan);
    notify(t("done"));
  }

  if (!started) {
    return (
      <section
        data-testid="onboarding-welcome"
        className="rise-in flex flex-col items-start gap-5 rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-8 shadow-sm"
      >
        <Sparkles className="h-8 w-8 text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-title font-semibold">{t("welcomeTitle")}</h2>
          <p className="mt-1 max-w-prose text-muted-foreground">{t("welcomeText")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => setStarted(true)}>
            {t("start")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" onClick={onDemo}>
            {t("demo")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("privacy")}</p>
      </section>
    );
  }

  const strategies = compareStrategies(profile, strategyRegistry);

  return (
    <section
      aria-label={t("title")}
      data-testid="onboarding"
      className="rise-in flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground" data-testid="onboarding-step">
          {t("step", { n: step + 1, total: STEPS.length })}
        </p>
        <ProgressBar value={step + 1} max={STEPS.length} label={t("progress")} />
        <h2 className="text-xl font-semibold">{t(`steps.${STEPS[step]}.title`)}</h2>
        <p className="text-sm text-muted-foreground">{t(`steps.${STEPS[step]}.hint`)}</p>
      </div>

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("salaryName")} htmlFor="ob-salary-name">
            <Input
              id="ob-salary-name"
              placeholder={t("defaultSalary")}
              value={salaryName}
              onChange={(e) => setSalaryName(e.target.value)}
            />
          </Field>
          <Field
            label={t("salaryAmount")}
            htmlFor="ob-salary"
            {...(error ? { error: t("salaryRequired") } : {})}
          >
            <MoneyInput id="ob-salary" currency={currency} value={salary} onChange={setSalary} />
          </Field>
          <Field label={t("payDay")} htmlFor="ob-pay-day">
            <DayOfMonthSelect id="ob-pay-day" value={payDay} onChange={setPayDay} />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <Button
                key={chip.key}
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setExpenses((rows) => [
                    ...rows,
                    { key: `${chip.key}-${rows.length}`, chip: chip.key, monthly: 0 },
                  ])
                }
              >
                + {t(`chips.${chip.key}`)}
              </Button>
            ))}
          </div>
          {expenses.map((row, index) => (
            <Field key={row.key} label={t(`chips.${row.chip}`)} htmlFor={`ob-exp-${index}`}>
              <span className="flex items-center gap-2">
                <MoneyInput
                  id={`ob-exp-${index}`}
                  currency={currency}
                  value={row.monthly}
                  onChange={(monthly) =>
                    setExpenses((rows) =>
                      rows.map((r) => (r.key === row.key ? { ...r, monthly } : r)),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpenses((rows) => rows.filter((r) => r.key !== row.key))}
                >
                  {t("remove")}
                </Button>
              </span>
            </Field>
          ))}
          <Field label={t("living")} htmlFor="ob-living" hint={t("livingHint")}>
            <MoneyInput id="ob-living" currency={currency} value={living} onChange={setLiving} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tTypes("currentSavings")} htmlFor="ob-savings">
            <MoneyInput id="ob-savings" currency={currency} value={savings} onChange={setSavings} />
          </Field>
          <Field label={tTypes("emergencyFundMonths")} htmlFor="ob-months" hint={t("monthsHint")}>
            <Input
              id="ob-months"
              type="number"
              min={0}
              step="any"
              value={months}
              className="w-32"
              onChange={(e) => setMonths(Math.max(0, Number(e.target.value)))}
            />
          </Field>
          <Field label={tTypes("country")} htmlFor="ob-country">
            <NativeSelect
              id="ob-country"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                const rate = suggestedAnnualInflation(e.target.value);
                if (rate !== undefined) setInflation(rate);
              }}
            >
              <option value="">{tTypes("countryPlaceholder")}</option>
              {INFLATION_COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>
                  {regionNames.of(code) ?? code}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            label={tTypes("annualInflation")}
            htmlFor="ob-inflation"
            hint={tTypes("inflationHint")}
          >
            <PercentInput id="ob-inflation" value={inflation} onChange={setInflation} />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-lg" data-testid="onboarding-left">
            {leftOver >= 0
              ? t("leftOver", { amount: money(leftOver) })
              : t("overspent", { amount: money(-leftOver) })}
          </p>
          <div role="radiogroup" aria-label={t("planChoice")} className="grid gap-3 sm:grid-cols-2">
            {strategies.map(({ strategyId: id, allocation }) => {
              const strategy = strategyRegistry[id];
              const lesson = strategy ? getLessonCard(strategy.lessonId, locale) : undefined;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={strategyId === id}
                  onClick={() => setStrategyId(id)}
                  className={cn(
                    "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    strategyId === id ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    {strategyId === id && (
                      <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                    )}
                    {lesson?.title ?? id}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("split", {
                      needs: money(allocation.needs),
                      wants: money(allocation.wants),
                      savings: money(allocation.savings + allocation.investing),
                    })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => (step === 0 ? setStarted(false) : setStep((s) => s - 1))}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("back")}
        </Button>
        <div className="flex gap-2">
          {step > 0 && step < STEPS.length - 1 && (
            <Button type="button" variant="outline" onClick={next}>
              {t("skip")}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              {t("next")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="button" onClick={() => void finish()}>
              {t("finish")}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
