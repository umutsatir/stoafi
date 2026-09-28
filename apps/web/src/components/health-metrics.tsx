import {
  emergencyFundMonths,
  installmentRatio,
  runway,
  savingsRate,
  type MonthProjection,
} from "@stoafi/core";

export interface HealthMetricsProps {
  projection: MonthProjection;
  savingsBalance: number;
  monthlyNeeds: number;
}

export function HealthMetrics({ projection, savingsBalance, monthlyNeeds }: HealthMetricsProps) {
  return (
    <dl>
      <dt>Savings rate</dt>
      <dd data-testid="savings-rate">{(savingsRate(projection) * 100).toFixed(1)}%</dd>

      <dt>Emergency fund months</dt>
      <dd data-testid="emergency-fund-months">
        {emergencyFundMonths(savingsBalance, monthlyNeeds).toFixed(1)}
      </dd>

      <dt>Installment ratio</dt>
      <dd data-testid="installment-ratio">{(installmentRatio(projection) * 100).toFixed(1)}%</dd>

      <dt>Runway</dt>
      <dd data-testid="runway">
        {runway(savingsBalance, monthlyNeeds, projection.installmentLoad).toFixed(1)}
      </dd>
    </dl>
  );
}
