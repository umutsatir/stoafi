"use client";

import { useTranslations } from "next-intl";
import { DecisionLog } from "@/components/decision-log";
import { useAppStore } from "@/store";

export default function DecisionsPage() {
  const decisions = useAppStore((s) => s.decisions);
  const t = useTranslations("decisions");

  return (
    <main>
      <h1>{t("title")}</h1>
      <DecisionLog decisions={decisions} />
    </main>
  );
}
