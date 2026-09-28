"use client";

import { PlanStateSchema } from "@stoafi/core";
import { useTranslations } from "next-intl";
import { PlanComparison } from "@/components/plan-comparison";
import { putSingleton } from "@/storage/repo";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";

export default function PlanPage() {
  const profile = useAppStore((s) => s.profile);
  const planState = useAppStore((s) => s.planState);
  const setPlanState = useAppStore((s) => s.setPlanState);
  const t = useTranslations("plan");

  return (
    <main>
      <h1>{t("title")}</h1>
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
        <p>{t("fillProfileFirst")}</p>
      )}
    </main>
  );
}
