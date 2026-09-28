"use client";

import { useTranslations } from "next-intl";
import { PlanComparison } from "@/components/plan-comparison";
import { useAppStore } from "@/store";

export default function PlanPage() {
  const profile = useAppStore((s) => s.profile);
  const t = useTranslations("plan");

  return (
    <main>
      <h1>{t("title")}</h1>
      {profile ? <PlanComparison profile={profile} /> : <p>{t("fillProfileFirst")}</p>}
    </main>
  );
}
