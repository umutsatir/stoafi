"use client";

import { LayoutList } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { hourlyNetIncome, type Decision, type QueueItem } from "@stoafi/core";
import { DecisionLog } from "@/components/decision-log";
import { LessonLink } from "@/components/lesson-link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Page } from "@/components/ui/page";
import { notify, notifyUndo } from "@/components/ui/toaster";
import { db } from "@/storage/instance";
import { saveQueueItem } from "@/storage/queue-repo";
import { putListItem } from "@/storage/repo";
import { useAppStore } from "@/store";
import { DecisionSchema } from "@stoafi/core";

function logFailure(what: string) {
  return (error: unknown) => console.error(`Could not ${what}`, error);
}

export default function DecisionsPage() {
  const decisions = useAppStore((s) => s.decisions);
  const setDecisions = useAppStore((s) => s.setDecisions);
  const queueItems = useAppStore((s) => s.queueItems);
  const setQueueItems = useAppStore((s) => s.setQueueItems);
  const profile = useAppStore((s) => s.profile);
  const today = useAppStore((s) => s.today);
  const t = useTranslations("decisions");
  const tc = useTranslations("common");

  function handleDelete(decision: Decision) {
    setDecisions(decisions.filter((d) => d.id !== decision.id));
    void db.decisions.delete(decision.id).catch(logFailure("delete the decision"));
    notifyUndo(
      tc("deletedItem", { name: decision.itemName ?? t("unknownItem") }),
      tc("undo"),
      () => {
        const current = useAppStore.getState();
        current.setDecisions([...current.decisions, decision]);
        void putListItem(db, "decisions", DecisionSchema, decision).catch(
          logFailure("restore the decision"),
        );
      },
    );
  }

  function handleAddBack(decision: Decision) {
    const order = queueItems.reduce((max, i) => Math.max(max, i.order + 1), 0);
    const item: QueueItem = {
      id: crypto.randomUUID(),
      name: decision.itemName ?? t("unknownItem"),
      price: decision.amount,
      urgency: 2,
      importance: 2,
      isNeed: false,
      expectedUses: 1,
      addedDate: today,
      priceUpdatedDate: today,
      order,
    };
    setQueueItems([...queueItems, item]);
    void saveQueueItem(db, item).catch(logFailure("add the item back to the queue"));
    notify(t("addedBack", { name: item.name }));
  }

  return (
    <Page title={t("title")}>
      {decisions.length === 0 ? (
        <EmptyState
          icon={<LayoutList className="h-8 w-8" />}
          title={t("emptyTitle")}
          description={t("emptyText")}
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link href="/queue">{t("emptyAction")}</Link>
              </Button>
              <LessonLink lessonId="cost-in-life-energy" testId="lesson-link-decisions-empty" />
            </div>
          }
        />
      ) : (
        <DecisionLog
          decisions={decisions}
          {...(profile ? { hourlyNetIncome: hourlyNetIncome(profile) } : {})}
          onDelete={handleDelete}
          onAddBack={handleAddBack}
        />
      )}
    </Page>
  );
}
