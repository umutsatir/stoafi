"use client";

import { useTranslations } from "next-intl";
import { project } from "@stoafi/core";
import { HealthMetrics } from "@/components/health-metrics";
import { useAppStore } from "@/store";

export default function HealthPage() {
  const profile = useAppStore((s) => s.profile);
  const commitments = useAppStore((s) => s.commitments);
  const t = useTranslations("health");

  if (!profile) {
    return (
      <main>
        <h1>{t("title")}</h1>
        <p>{t("fillProfileFirst")}</p>
      </main>
    );
  }

  const income = profile.incomes.reduce((sum, i) => sum + i.monthly, 0);
  const monthlyNeeds = profile.fixedExpenses
    .filter((e) => e.bucket === "needs")
    .reduce((sum, e) => sum + e.monthly, 0);
  const projection = project({ income }, commitments, "2026-01");

  return (
    <main>
      <h1>{t("title")}</h1>
      <HealthMetrics
        projection={projection}
        savingsBalance={profile.savings}
        monthlyNeeds={monthlyNeeds}
      />
    </main>
  );
}
