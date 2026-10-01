"use client";

import { PlanStateSchema } from "@stoafi/core";
import { useTranslations } from "next-intl";
import { PlanUsage } from "@/components/plan-usage";
import { PlanComparison } from "@/components/plan-comparison";
import { PlanInsights } from "@/components/plan-insights";
import { monthOf } from "@/lib/clock";
import { putSingleton } from "@/storage/repo";
import { db } from "@/storage/instance";
import { useAppStore, useLedger } from "@/store";
import { Page } from "@/components/ui/page";

export default function PlanPage() {
  const profile = useAppStore((s) => s.profile);
  const planState = useAppStore((s) => s.planState);
  const setPlanState = useAppStore((s) => s.setPlanState);
  const today = useAppStore((s) => s.today);
  const queueItems = useAppStore((s) => s.queueItems);
  const sinkingFunds = useAppStore((s) => s.sinkingFunds);
  const guardThresholds = useAppStore((s) => s.guardThresholds);
  const ledger = useLedger();
  const t = useTranslations("plan");

  return (
    <Page title={t("title")}>
      {profile && planState && (
        <PlanUsage
          profile={profile}
          planState={planState}
          ledger={ledger}
          month={monthOf(today)}
          queueItems={queueItems}
          sinkingFunds={sinkingFunds}
          installmentCapPct={guardThresholds.installmentCapPct}
        />
      )}
      {profile && planState && (
        <PlanInsights
          profile={profile}
          planState={planState}
          ledger={ledger}
          month={monthOf(today)}
        />
      )}
      {profile ? (
        <PlanComparison
          profile={profile}
          activeStrategyId={planState?.strategyId}
          onSelect={async (strategyId) => {
            setPlanState(
              await putSingleton(db, "plan", PlanStateSchema, { strategyId, params: {} }),
            );
          }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{t("fillProfileFirst")}</p>
      )}
    </Page>
  );
}
