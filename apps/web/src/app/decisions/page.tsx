"use client";

import { useTranslations } from "next-intl";
import { DecisionLog } from "@/components/decision-log";
import { useAppStore } from "@/store";
import { Page } from "@/components/ui/page";

export default function DecisionsPage() {
  const decisions = useAppStore((s) => s.decisions);
  const t = useTranslations("decisions");

  return (
    <Page title={t("title")}>
      <DecisionLog decisions={decisions} />
    </Page>
  );
}
