"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, CircleCheck, TriangleAlert } from "lucide-react";
import {
  trendOf,
  type HealthMetricKind,
  type HealthStatus,
  type HealthSummary,
  type Snapshot,
  type SnapshotKey,
} from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { InfoPopover } from "@/components/ui/info-popover";
import { ProgressBar, type Tone } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Sparkline } from "@/components/ui/sparkline";
import { StatCard } from "@/components/ui/stat-card";
import { useMoney } from "@/lib/use-money";
import type { ChipTone } from "@/components/ui/status-chip";
import { stagger } from "@/lib/utils";

export interface HealthMetricsProps {
  summary: HealthSummary;
  emergencyFundTargetMonths: number;
  /** The installment cap as a share of income (a setting). */
  installmentCapPct: number;
  /** Past months, for the trend lines; with fewer than two, a note says trends are coming. */
  snapshots?: Snapshot[];
}

const CHIP: Record<HealthStatus, ChipTone> = { good: "success", watch: "warning", risk: "danger" };
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
      case "emergencyFundMonths":
        return (
          <ProgressRing
            value={value}
            max={emergencyFundTargetMonths}
            label={t("fundRingLabel")}
            tone={TONE[status]}
            size={64}
          >
            {Math.min(100, Math.round((value / Math.max(emergencyFundTargetMonths, 0.01)) * 100))}%
          </ProgressRing>
        );
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
    <div className="flex flex-col gap-6">
      <section
        aria-label={t("summary.title")}
        data-testid="health-summary"
        className="rise-in flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        {summary.overall === "good" ? (
          <CircleCheck className="h-10 w-10 text-success" aria-hidden="true" />
        ) : (
          <TriangleAlert
            className={
              summary.overall === "risk" ? "h-10 w-10 text-destructive" : "h-10 w-10 text-warning"
            }
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{t("summary.title")}</p>
          <p className="text-title font-semibold" data-testid="overall-status">
            {t(`status.${summary.overall}`)}
          </p>
          <p className="text-sm text-muted-foreground">
            {first ? t(`steps.${first.id}.why`) : t("summary.allGood")}
          </p>
        </div>
        {first && (
          <Button asChild>
            <Link href={first.href}>
              {t("summary.fix")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KINDS.map((kind, i) => {
          const { status } = summary.metrics[kind];
          return (
            <StatCard
              key={kind}
              className="rise-in"
              style={stagger(i + 1)}
              label={t(`metric.${kind}`)}
              info={
                <InfoPopover label={t(`info.${kind}.label`)}>{t(`info.${kind}.text`)}</InfoPopover>
              }
              testId={kind === "savingsRate" ? "savings-rate" : kindTestId(kind)}
              value={text(kind)}
              status={{ label: t(`status.${status}`), tone: CHIP[status] }}
              hint={t(`hint.${kind}.${status}`, {
                target: emergencyFundTargetMonths,
                cap: Math.round(installmentCapPct * 100),
              })}
              footer={visual(kind)}
            />
          );
        })}
      </div>

      <section className="flex flex-col gap-3" aria-label={t("trends.title")} data-testid="trends">
        <h2 className="text-lg font-semibold">{t("trends.title")}</h2>
        {snapshots.length < 2 ? (
          <p className="text-sm text-muted-foreground">{t("trends.soon")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TREND_KEYS.map((key, i) => {
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
                <li
                  key={key}
                  data-testid={`trend-${key}`}
                  style={stagger(i)}
                  className="rise-in flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
                >
                  <p className="text-sm text-muted-foreground">{t(`trends.${key}`)}</p>
                  <p className="text-lg font-semibold">
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
                    className={
                      better === null ? "text-xs text-muted-foreground" : "text-xs font-medium"
                    }
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
      </section>

      {summary.steps.length > 0 && (
        <section className="flex flex-col gap-3" aria-label={t("steps.title")}>
          <h2 className="text-lg font-semibold">{t("steps.title")}</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {summary.steps.map((step, i) => (
              <li
                key={step.id}
                data-testid={`step-${step.id}`}
                style={stagger(i)}
                className="rise-in flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
              >
                <p className="font-medium">{t(`steps.${step.id}.title`)}</p>
                <p className="text-sm text-muted-foreground">{t(`steps.${step.id}.why`)}</p>
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <Link href={step.href}>{t(`steps.${step.id}.action`)}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
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
