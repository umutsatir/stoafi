import { useTranslations } from "next-intl";
import {
  emergencyFundMonths,
  installmentRatio,
  runway,
  savingsRate,
  type MonthProjection,
} from "@stoafi/core";
import { InfoPopover } from "@/components/ui/info-popover";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatCard } from "@/components/ui/stat-card";

export interface HealthMetricsProps {
  projection: MonthProjection;
  savingsBalance: number;
  monthlyNeeds: number;
  /** When given, the emergency fund card shows a progress ring toward this many months. */
  emergencyFundTargetMonths?: number;
}

export function HealthMetrics({
  projection,
  savingsBalance,
  monthlyNeeds,
  emergencyFundTargetMonths,
}: HealthMetricsProps) {
  const t = useTranslations("health");
  const fundMonths = emergencyFundMonths(savingsBalance, monthlyNeeds);
  const info = (key: "savingsRate" | "emergencyFundMonths" | "installmentRatio" | "runway") => (
    <InfoPopover label={t(`info.${key}.label`)}>{t(`info.${key}.text`)}</InfoPopover>
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={t("savingsRate")}
        info={info("savingsRate")}
        testId="savings-rate"
        value={`${(savingsRate(projection) * 100).toFixed(1)}%`}
      />
      <StatCard
        label={t("emergencyFundMonths")}
        info={info("emergencyFundMonths")}
        testId="emergency-fund-months"
        value={t("monthsValue", { value: fundMonths.toFixed(1) })}
        footer={
          emergencyFundTargetMonths ? (
            <ProgressRing
              value={fundMonths}
              max={emergencyFundTargetMonths}
              label={t("fundRingLabel")}
              size={64}
            >
              {Math.min(100, Math.round((fundMonths / emergencyFundTargetMonths) * 100))}%
            </ProgressRing>
          ) : undefined
        }
      />
      <StatCard
        label={t("installmentRatio")}
        info={info("installmentRatio")}
        testId="installment-ratio"
        value={`${(installmentRatio(projection) * 100).toFixed(1)}%`}
      />
      <StatCard
        label={t("runway")}
        info={info("runway")}
        testId="runway"
        value={t("monthsValue", {
          value: runway(savingsBalance, monthlyNeeds, projection.installmentLoad).toFixed(1),
        })}
      />
    </div>
  );
}
