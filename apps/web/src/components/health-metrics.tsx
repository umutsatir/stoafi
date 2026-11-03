"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  trendOf,
  type HealthMetricKind,
  type HealthStatus,
  type HealthSummary,
  type Snapshot,
  type SnapshotKey,
} from "@stoafi/core";
import { ProgressBar, type Tone } from "@/components/ui/progress-bar";
import { Sparkline } from "@/components/ui/sparkline";
import { Card } from "@/components/ui/card";
import { useMoney } from "@/lib/use-money";
import { cn, stagger } from "@/lib/utils";

export interface HealthMetricsProps {
  summary: HealthSummary;
  emergencyFundTargetMonths: number;
  /** The installment cap as a share of income (a setting). */
  installmentCapPct: number;
  /** Past months, for the trend lines; with fewer than two, a note says trends are coming. */
  snapshots?: Snapshot[];
}

const TONE: Record<HealthStatus, Tone> = { good: "success", watch: "warning", risk: "danger" };
const TREND_KEYS: SnapshotKey[] = ["savingsRate", "emergencyMonths", "installmentRatio", "wealth"];
const KINDS: HealthMetricKind[] = [
  "savingsRate",
  "emergencyFundMonths",
  "installmentRatio",
  "runway",
];

export function HealthMetrics({
  summary,
  emergencyFundTargetMonths,
  installmentCapPct,
  snapshots = [],
}: HealthMetricsProps) {
  const t = useTranslations("health");
  const money = useMoney();
  const first = summary.steps[0];

  const FILL: Record<string, string> = { good: "bg-c4", watch: "bg-c2", risk: "bg-c3" };

  const text = (kind: HealthMetricKind): string => {
    const value = summary.metrics[kind].value;
    switch (kind) {
      case "savingsRate":
      case "installmentRatio":
        return `${(value * 100).toFixed(1)}%`;
      default:
        return t("monthsValue", { value: value.toFixed(1) });
    }
  };

  const visual = (kind: HealthMetricKind) => {
    const { value, status } = summary.metrics[kind];
    switch (kind) {
      case "emergencyFundMonths": {
        const pct = Math.min(
          100,
          Math.round((value / Math.max(emergencyFundTargetMonths, 0.01)) * 100),
        );
        return (
          <div
            role="progressbar"
            aria-label={t("fundRingLabel")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn("h-full rounded-full transition-[width] duration-500", FILL[status])}
              style={{ width: `${pct}%` }}
            />
            <span className="sr-only">{pct}%</span>
          </div>
        );
      }
      case "installmentRatio":
        return (
          <ProgressBar
            value={value}
            max={Math.max(installmentCapPct * 2, 0.01)}
            label={t("ratioBarLabel")}
            tone={TONE[status]}
          />
        );
      case "savingsRate":
        return (
          <ProgressBar value={value} max={0.3} label={t("rateBarLabel")} tone={TONE[status]} />
        );
      case "runway":
        return (
          <ProgressBar value={value} max={12} label={t("runwayBarLabel")} tone={TONE[status]} />
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid gap-4 sm:grid-cols-2 sm:grid-rows-2">
          {KINDS.map((kind, i) => {
            const { status } = summary.metrics[kind];
            return (
              <Card
                key={kind}
                className="pop-in flex flex-col px-7 py-[26px]"
                style={stagger(i + 1)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-extrabold">{t(`metric.${kind}`)}</span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-extrabold text-on",
                      FILL[status],
                    )}
                  >
                    {t(`status.${status}`)}
                  </span>
                </div>
                <p
                  data-testid={kindTestId(kind)}
                  className="mt-3 text-[clamp(32px,4vw,46px)] font-extrabold leading-[1.1] tracking-[-0.06em]"
                >
                  {text(kind)}
                </p>
                <div className="mt-3.5">{visual(kind)}</div>
                <div className="mt-auto pt-3">
                  <p className="text-[12.5px] leading-normal text-muted-foreground">
                    {t(`hint.${kind}.${status}`, {
                      target: emergencyFundTargetMonths,
                      cap: Math.round(installmentCapPct * 100),
                    })}
                  </p>
                  <p className="mt-2 text-xs leading-normal text-muted-foreground opacity-80">
                    {t(`info.${kind}.text`)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          <Card
            data-testid="health-summary"
            aria-label={t("summary.title")}
            className={cn("pop-in px-[30px] py-[26px] text-on", FILL[summary.overall])}
            style={stagger(2)}
          >
            <p className="text-[13px] font-bold">{t("summary.title")}</p>
            <p
              data-testid="overall-status"
              className="mt-1 text-[clamp(38px,5vw,54px)] font-extrabold leading-[1.1] tracking-[-0.06em]"
            >
              {t(`status.${summary.overall}`)}
            </p>
            <p className="mt-1 text-[13px] font-semibold">
              {first ? t(`steps.${first.id}.why`) : t("summary.allGood")}
            </p>
          </Card>

          <Card className="pop-in flex-1 px-[30px] py-[26px]" style={stagger(3)}>
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">{t("steps.title")}</h2>
            {summary.steps.length === 0 ? (
              <p className="mt-3.5 text-sm font-semibold">{t("steps.allGood")}</p>
            ) : (
              <ul>
                {summary.steps.map((step) => (
                  <li
                    key={step.id}
                    data-testid={`step-${step.id}`}
                    className="mt-4 border-t border-border pt-3.5"
                  >
                    <p className="text-[15px] font-extrabold">{t(`steps.${step.id}.title`)}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {t(`steps.${step.id}.why`)}
                    </p>
                    <Link
                      href={step.href}
                      className="press mt-2.5 inline-block rounded-full bg-foreground px-4 py-2 text-[12.5px] font-extrabold text-background"
                    >
                      {t(`steps.${step.id}.action`)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card
        className="pop-in px-5 py-[26px] md:px-8"
        style={stagger(4)}
        aria-label={t("trends.title")}
        data-testid="trends"
      >
        <h2 className="text-xl font-extrabold tracking-[-0.03em]">{t("trends.title")}</h2>
        {snapshots.length < 2 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("trends.soon")}</p>
        ) : (
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TREND_KEYS.map((key) => {
              const trend = trendOf(snapshots, key, 6);
              const percent = key === "savingsRate" || key === "installmentRatio";
              const change = trend.change;
              const better =
                change === null || change === 0
                  ? null
                  : (key === "installmentRatio") === change < 0;
              const format = (n: number) =>
                key === "wealth"
                  ? money(n)
                  : percent
                    ? `${(n * 100).toFixed(1)}%`
                    : t("monthsValue", { value: n.toFixed(1) });
              return (
                <li key={key} data-testid={`trend-${key}`} className="flex flex-col gap-1">
                  <p className="text-[13px] font-bold text-muted-foreground">
                    {t(`trends.${key}`)}
                  </p>
                  <p className="text-lg font-extrabold">
                    {format(trend.points[trend.points.length - 1] ?? 0)}
                  </p>
                  <Sparkline
                    points={trend.points}
                    label={t("trends.lineLabel", {
                      name: t(`trends.${key}`),
                      months: trend.points.length,
                    })}
                  />
                  <p
                    className={cn(
                      "text-[12.5px] font-bold",
                      better === null
                        ? "text-muted-foreground"
                        : better
                          ? "text-success"
                          : "text-destructive",
                    )}
                    data-testid={`trend-change-${key}`}
                  >
                    {change === null || change === 0
                      ? t("trends.same")
                      : `${change > 0 ? "▲" : "▼"} ${
                          key === "wealth"
                            ? money(Math.abs(change))
                            : percent
                              ? `${(Math.abs(change) * 100).toFixed(1)} ${t("trends.points")}`
                              : t("monthsValue", { value: Math.abs(change).toFixed(1) })
                        } · ${better ? t("trends.better") : t("trends.worse")}`}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function kindTestId(kind: HealthMetricKind): string {
  return {
    savingsRate: "savings-rate",
    emergencyFundMonths: "emergency-fund-months",
    installmentRatio: "installment-ratio",
    runway: "runway",
  }[kind];
}
