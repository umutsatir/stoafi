"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from "recharts";
import type { CashFlowPoint } from "@stoafi/core";
import { useMoney } from "@/lib/use-money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = {
  obligations: "var(--chart-needs)",
  living: "var(--chart-wants)",
  personal: "var(--chart-investing)",
  installments: "var(--chart-installments)",
  setAside: "var(--chart-setaside)",
  income: "var(--chart-income)",
  left: "var(--chart-left)",
};

/** Income against what goes out each month, with what is left. Also readable as a table. */
export function CashFlowChart({ series }: { series: CashFlowPoint[] }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const money = useMoney();

  return (
    <Card data-testid="cash-flow-chart" data-points={series.length}>
      <CardHeader>
        <CardTitle className="text-base">{t("cashFlowTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <ComposedChart width={720} height={300} data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value: number) =>
                (value / 100).toLocaleString(locale, { notation: "compact" })
              }
            />
            <Tooltip formatter={(value) => money(Number(value))} />
            <Legend />
            <Bar
              dataKey="obligations"
              name={t("obligations")}
              stackId="costs"
              fill={COLORS.obligations}
            />
            <Bar dataKey="living" name={t("living")} stackId="costs" fill={COLORS.living} />
            <Bar
              dataKey="personal"
              name={t("personalSpending")}
              stackId="costs"
              fill={COLORS.personal}
            />
            <Bar
              dataKey="installments"
              name={t("installments")}
              stackId="costs"
              fill={COLORS.installments}
            />
            <Bar dataKey="setAside" name={t("setAside")} stackId="costs" fill={COLORS.setAside} />
            <Line
              dataKey="income"
              name={t("income")}
              stroke={COLORS.income}
              dot={false}
              strokeWidth={2}
            />
            <Line
              dataKey="left"
              name={t("left")}
              stroke={COLORS.left}
              dot={false}
              strokeWidth={2}
            />
          </ComposedChart>
        </div>
        <div className="sr-only">
          <table>
            <caption>{t("cashFlowTitle")}</caption>
            <thead>
              <tr>
                <th>{t("month")}</th>
                <th>{t("left")}</th>
                <th>{t("installments")}</th>
                <th>{t("setAside")}</th>
              </tr>
            </thead>
            <tbody>
              {series.map((point) => (
                <tr key={point.month}>
                  <td>{point.month}</td>
                  <td>{money(point.left)}</td>
                  <td>{money(point.installments)}</td>
                  <td>{money(point.setAside)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
