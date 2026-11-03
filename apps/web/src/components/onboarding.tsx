"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  PlanStateSchema,
  ProfileSchema,
  compareStrategies,
  strategyRegistry,
  type Profile,
} from "@stoafi/core";
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

const CHIPS = [
  { key: "rent", bucket: "needs" },
  { key: "bills", bucket: "needs" },
  { key: "loan", bucket: "needs" },
  { key: "subscription", bucket: "wants" },
  { key: "school", bucket: "needs" },
] as const;

export interface OnboardingProps {
  /** Loads the sample data; the page owns what that involves. */
  onDemo?: () => void;
  /** Called after the plan is saved. */
  onDone?: () => void;
  /** Called when the wizard is dismissed with Escape or by loading the sample data. */
  onClose?: () => void;
}

const STEPS = ["income", "expenses", "savings", "plan"] as const;
const MONTH_CHOICES = [3, 6, 9] as const;

/** First run: four short steps from nothing to a plan, or a look around with sample data. */
export function Onboarding({ onDemo, onDone, onClose }: OnboardingProps) {
  const t = useTranslations("onboarding");
  const tTypes = useTranslations("profile");
  const locale = useLocale() as Locale;
  const money = useMoney();
  const currency = useAppStore((s) => s.currency);
  const setProfile = useAppStore((s) => s.setProfile);
  const setPlanState = useAppStore((s) => s.setPlanState);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [salary, setSalary] = useState(0);
  const [chosen, setChosen] = useState<(typeof CHIPS)[number]["key"][]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [dismissed, setDismissed] = useState(false);
  const [living, setLiving] = useState(0);
  const [savings, setSavings] = useState(0);
  const [months, setMonths] = useState(6);
  const [strategyId, setStrategyId] = useState("conscious-spending");

  // The design closes its overlays with Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setDismissed(true);
      onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const profile: Profile = {
    incomes: [
      {
        label: t("defaultSalary"),
        monthly: salary,
      },
    ],
    fixedExpenses: chosen
      .filter((key) => (amounts[key] ?? 0) > 0)
      .map((key) => ({
        label: t(`chips.${key}`),
        monthly: amounts[key] ?? 0,
        bucket: CHIPS.find((c) => c.key === key)?.bucket ?? "needs",
        ...(key === "subscription" ? { isSubscription: true } : {}),
      })),
    livingExpenses: living,
    savings,
    emergencyFundTargetMonths: months,
    annualInflationExpectation: 0.3,
  };
  const fixedTotal = profile.fixedExpenses.reduce((sum, e) => sum + e.monthly, 0);
  const leftOver = salary - fixedTotal - living;

  function next() {
    if (step === 0 && salary <= 0) return notify(t("salaryRequired"));
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  async function finish() {
    const savedProfile = await putSingleton(db, "profile", ProfileSchema, profile);
    const plan = await putSingleton(db, "plan", PlanStateSchema, { strategyId, params: {} });
    setProfile(savedProfile);
    setPlanState(plan);
    notify(t("done"));
    onDone?.();
  }

  if (dismissed) return null;

  // The design lists the conscious plan first, then 50/30/20, pay yourself first and baby steps.
  const PLAN_ORDER = [
    "conscious-spending",
    "fifty-thirty-twenty",
    "pay-yourself-first",
    "baby-steps",
  ];
  const strategies = [...compareStrategies(profile, strategyRegistry)].sort(
    (a, b) => PLAN_ORDER.indexOf(a.strategyId) - PLAN_ORDER.indexOf(b.strategyId),
  );

  function close() {
    setDismissed(true);
    onClose?.();
  }

  const pill =
    "cursor-pointer rounded-full font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const toggle = (on: boolean) =>
    on ? "bg-foreground text-background" : "bg-muted text-foreground";

  return (
    <div
      data-testid="onboarding-overlay"
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-auto bg-background p-[30px] animate-[fade_.3s_both]"
    >
      <section
        aria-label={t("title")}
        data-testid={started ? "onboarding" : "onboarding-welcome"}
        className="w-[760px] max-w-full rounded-card bg-card px-6 py-9 shadow-[0_30px_80px_rgba(0,0,0,.15)] animate-[pop_.5s_backwards] sm:px-[50px] sm:py-[44px]"
      >
        {!started ? (
          <>
            <LogoRing />
            <h2 className="mt-[22px] text-[44px] font-extrabold leading-[1.05] tracking-[-0.05em]">
              {t("welcomeTitle")}
            </h2>
            <p className="mt-3 max-w-[560px] text-[15px] leading-[1.65] text-muted-foreground">
              {t("welcomeText")}
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setStarted(true)}
                className={cn(
                  pill,
                  "bg-primary px-7 py-3.5 text-[15px] font-extrabold text-primary-foreground",
                )}
              >
                {t("start")} →
              </button>
              {onDemo && (
                <button
                  type="button"
                  onClick={() => {
                    onDemo();
                    close();
                  }}
                  className={cn(pill, "bg-muted px-6 py-3.5 text-[15px]")}
                >
                  {t("demo")}
                </button>
              )}
            </div>
            <p className="mt-[18px] text-[12.5px] text-muted-foreground">{t("privacy")}</p>
          </>
        ) : (
          <>
            <p
              className="text-[13px] font-bold text-muted-foreground"
              data-testid="onboarding-step"
            >
              {t("step", { n: step + 1, total: STEPS.length })}
            </p>
            <div
              role="progressbar"
              aria-label={t("progress")}
              aria-valuemin={0}
              aria-valuemax={STEPS.length}
              aria-valuenow={step + 1}
              className="mt-2.5 h-2 rounded-lg bg-muted"
            >
              <div
                className="h-2 rounded-lg bg-primary transition-[width] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <h2 className="mt-[22px] text-[32px] font-extrabold tracking-[-0.04em]">
              {t(`steps.${STEPS[step]}.title`)}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t(`steps.${STEPS[step]}.hint`)}</p>

            {step === 0 && (
              <label className="mt-[22px] flex flex-col gap-[7px] text-[13px] font-bold [&_input]:text-[22px]">
                {t("salaryAmount")}
                <MoneyInput
                  id="ob-salary"
                  currency={currency}
                  value={salary}
                  onChange={setSalary}
                />
              </label>
            )}

            {step === 1 && (
              <>
                <div className="mt-[22px] flex flex-wrap gap-2">
                  {CHIPS.map((chip) => {
                    const on = chosen.includes(chip.key);
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setChosen((list) =>
                            on ? list.filter((k) => k !== chip.key) : [...list, chip.key],
                          )
                        }
                        className={cn(pill, "px-[18px] py-2.5 text-[13.5px]", toggle(on))}
                      >
                        {on ? "✓ " : "+ "}
                        {t(`chips.${chip.key}`)}
                      </button>
                    );
                  })}
                </div>
                {chosen.length > 0 && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {chosen.map((key) => (
                      <label key={key} className="flex flex-col gap-[7px] text-[13px] font-bold">
                        {t(`chips.${key}`)}
                        <MoneyInput
                          id={`ob-exp-${key}`}
                          currency={currency}
                          value={amounts[key] ?? 0}
                          onChange={(monthly) => setAmounts((a) => ({ ...a, [key]: monthly }))}
                        />
                      </label>
                    ))}
                  </div>
                )}
                <label className="mt-5 flex flex-col gap-[7px] text-[13px] font-bold">
                  {t("living")} ({t("livingHint").replace(/\.$/, "").toLocaleLowerCase(locale)})
                  <MoneyInput
                    id="ob-living"
                    currency={currency}
                    value={living}
                    onChange={setLiving}
                  />
                </label>
              </>
            )}

            {step === 2 && (
              <>
                <label className="mt-[22px] flex flex-col gap-[7px] text-[13px] font-bold">
                  {tTypes("currentSavings")}
                  <MoneyInput
                    id="ob-savings"
                    currency={currency}
                    value={savings}
                    onChange={setSavings}
                  />
                </label>
                <p className="mt-4 text-[13px] font-bold">
                  {tTypes("emergencyFundMonths")} ·{" "}
                  {t("monthsHint")
                    .replace(/\.$/, "")
                    .replace(/^./, (c) => c.toLocaleLowerCase(locale))}
                </p>
                <div
                  className="mt-2 flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label={tTypes("emergencyFundMonths")}
                >
                  {MONTH_CHOICES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={months === n}
                      onClick={() => setMonths(n)}
                      className={cn(
                        pill,
                        "px-4 py-[9px] text-[13px] hover:scale-[1.04]",
                        toggle(months === n),
                      )}
                    >
                      {t("monthsOption", { n })}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <p className="mt-[18px] text-base font-bold" data-testid="onboarding-left">
                  {leftOver >= 0
                    ? t("leftOver", { amount: money(leftOver) })
                    : t("overspent", { amount: money(-leftOver) })}
                </p>
                <div
                  role="radiogroup"
                  aria-label={t("planChoice")}
                  className="mt-3.5 grid gap-3 sm:grid-cols-2"
                >
                  {strategies.map(({ strategyId: id, allocation }) => {
                    const strategy = strategyRegistry[id];
                    const lesson = strategy ? getLessonCard(strategy.lessonId, locale) : undefined;
                    const on = strategyId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setStrategyId(id)}
                        className={cn(
                          "rounded-[22px] px-[18px] py-4 text-left transition-all duration-[250ms] hover:-translate-y-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          on
                            ? "bg-muted shadow-[inset_0_0_0_2px_var(--primary)]"
                            : "shadow-[inset_0_0_0_1px_var(--border)]",
                        )}
                      >
                        <span className="block text-[15px] font-extrabold">
                          {lesson?.title ?? id}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
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
              </>
            )}

            <div className="mt-[30px] flex justify-between">
              <button
                type="button"
                onClick={() => (step === 0 ? setStarted(false) : setStep((n) => n - 1))}
                className={cn(pill, "bg-muted px-5 py-3 text-sm")}
              >
                ← {t("back")}
              </button>
              <button
                type="button"
                onClick={step < STEPS.length - 1 ? next : () => void finish()}
                className={cn(
                  pill,
                  "bg-primary px-[26px] py-3 text-sm font-extrabold text-primary-foreground",
                )}
              >
                {step < STEPS.length - 1 ? `${t("next")} →` : t("finish")}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/** The four-arc ring mark, as in the app bar, at welcome size. */
function LogoRing() {
  const arcs = [
    { d: "M6.3 11.6 A14 14 0 0 1 17 5", color: "var(--c4)" },
    { d: "M22 5.6 A14 14 0 0 1 32.4 17", color: "var(--c1)" },
    { d: "M30.5 25 A14 14 0 0 1 20 33", color: "var(--c2)" },
    { d: "M14 32.6 A14 14 0 0 1 5.6 23", color: "var(--c3)" },
  ];
  return (
    <svg width="60" height="60" viewBox="0 0 38 38" fill="none" aria-hidden="true">
      {arcs.map((a) => (
        <path key={a.color} d={a.d} stroke={a.color} strokeWidth="4.6" strokeLinecap="round" />
      ))}
    </svg>
  );
}
