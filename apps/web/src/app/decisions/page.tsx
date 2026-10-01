"use client";

import { LayoutList } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DecisionLog } from "@/components/decision-log";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppStore } from "@/store";
import { Page } from "@/components/ui/page";

export default function DecisionsPage() {
  const decisions = useAppStore((s) => s.decisions);
  const t = useTranslations("decisions");

  return (
    <Page title={t("title")}>
      {decisions.length === 0 ? (
        <EmptyState
          icon={<LayoutList className="h-8 w-8" />}
          title={t("emptyTitle")}
          description={t("emptyText")}
          action={
            <Button asChild>
              <Link href="/queue">{t("emptyAction")}</Link>
            </Button>
          }
        />
      ) : (
        <DecisionLog decisions={decisions} />
      )}
    </Page>
  );
}
