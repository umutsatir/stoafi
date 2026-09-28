import { useTranslations } from "next-intl";
import {
  emergencyFundMonths,
  installmentRatio,
  runway,
  savingsRate,
  type MonthProjection,
} from "@stoafi/core";
import { Card, CardContent } from "@/components/ui/card";

export interface HealthMetricsProps {
  projection: MonthProjection;
  savingsBalance: number;
  monthlyNeeds: number;
}

function Metric({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight" data-testid={testId}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function HealthMetrics({ projection, savingsBalance, monthlyNeeds }: HealthMetricsProps) {
  const t = useTranslations("health");

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Metric
        label={t("savingsRate")}
        testId="savings-rate"
        value={`${(savingsRate(projection) * 100).toFixed(1)}%`}
      />
      <Metric
        label={t("emergencyFundMonths")}
        testId="emergency-fund-months"
        value={emergencyFundMonths(savingsBalance, monthlyNeeds).toFixed(1)}
      />
      <Metric
        label={t("installmentRatio")}
        testId="installment-ratio"
        value={`${(installmentRatio(projection) * 100).toFixed(1)}%`}
      />
      <Metric
        label={t("runway")}
        testId="runway"
        value={runway(savingsBalance, monthlyNeeds, projection.installmentLoad).toFixed(1)}
      />
    </div>
  );
}
