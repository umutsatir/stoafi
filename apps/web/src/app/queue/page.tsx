"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DecisionSchema,
  activeQueueItems,
  hourlyNetIncome,
  monthlyNeeds,
  type Commitment,
  type Decision,
  type Month,
  type GuardBreach,
  type QueueItem,
  scheduleQueue,
} from "@stoafi/core";
import { ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Page } from "@/components/ui/page";
import { notify, notifyUndo } from "@/components/ui/toaster";
import { QueueForm } from "@/components/queue-form";
import { QueueList } from "@/components/queue-list";
import { QueuePreview, type PurchaseChoice } from "@/components/queue-preview";
import { QueueEisenhower } from "@/components/queue-eisenhower";
import { QueueSummary } from "@/components/queue-summary";
import { QueueTimeView } from "@/components/queue-time-view";
import { monthOf } from "@/lib/clock";
import { db } from "@/storage/instance";
import { removeQueueItem, saveQueueItem, saveQueueOrder } from "@/storage/queue-repo";
import { putListItem } from "@/storage/repo";
import { useAppStore, useLedger } from "@/store";

function logFailure(what: string) {
  return (error: unknown) => console.error(`Could not ${what}`, error);
}

export default function QueuePage() {
  const profile = useAppStore((s) => s.profile);
  const planState = useAppStore((s) => s.planState);
  const queueItems = useAppStore((s) => s.queueItems);
  const setQueueItems = useAppStore((s) => s.setQueueItems);
  const currency = useAppStore((s) => s.currency);
  const cards = useAppStore((s) => s.cards);
  const guardThresholds = useAppStore((s) => s.guardThresholds);
  const commitments = useLedger();
  const today = useAppStore((s) => s.today);
  const decisions = useAppStore((s) => s.decisions);
  const setDecisions = useAppStore((s) => s.setDecisions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"list" | "eisenhower" | "time">("list");
  const [filter, setFilter] = useState<"all" | "need" | "want">("all");
  const t = useTranslations("queue");
  const tc = useTranslations("common");

  if (!profile || !planState) {
    return (
      <Page title={t("title")}>
        <Card>
          <CardContent className="flex flex-col items-start gap-4 pt-6">
            <p className="text-sm text-muted-foreground">{t("fillProfileAndPlanFirst")}</p>
            <Button asChild>
              <Link href="/income-expenses">{t("goToProfile")}</Link>
            </Button>
          </CardContent>
        </Card>
      </Page>
    );
  }

  const waitingItems = activeQueueItems(queueItems);
  const selectedItem = waitingItems.find((i) => i.id === selectedId) ?? null;
  const editingItem = waitingItems.find((i) => i.id === editingId);
  const needs = monthlyNeeds(profile, monthOf(today));
  const income = profile.incomes.reduce((sum, i) => sum + i.monthly, 0);
  const schedule = scheduleQueue(
    waitingItems,
    profile,
    planState,
    commitments,
    today,
    monthOf(today),
  );
  const suggestedMonth = selectedItem
    ? (schedule.find((r) => r.itemId === selectedItem.id)?.month ?? null)
    : undefined;
  const nextOrder = waitingItems.reduce((max, i) => Math.max(max, i.order + 1), 0);
  const monthByItemId = new Map<string, Month | null>(schedule.map((r) => [r.itemId, r.month]));
  const cashPrice = (item: QueueItem) => item.discountedCashPrice ?? item.price;
  const currentMonth = monthOf(today);
  const placed = schedule.flatMap((r) => (r.month ? [r.month] : []));
  const summary = {
    total: waitingItems.reduce((sum, i) => sum + cashPrice(i), 0),
    fitsThisMonth: waitingItems
      .filter((i) => monthByItemId.get(i.id) === currentMonth)
      .reduce((sum, i) => sum + cashPrice(i), 0),
    nearestMonth: placed.length > 0 ? ([...placed].sort()[0] ?? null) : null,
  };
  const visibleItems = waitingItems.filter(
    (i) => filter === "all" || (filter === "need" ? i.isNeed : !i.isNeed),
  );

  function handleSave(item: QueueItem) {
    const exists = queueItems.some((i) => i.id === item.id);
    setQueueItems(
      exists ? queueItems.map((i) => (i.id === item.id ? item : i)) : [...queueItems, item],
    );
    setEditingId(null);
    void saveQueueItem(db, item).catch(logFailure("save the queue item"));
    notify(tc("saved"));
  }

  function removeItem(item: QueueItem) {
    setQueueItems(queueItems.filter((i) => i.id !== item.id));
    if (selectedId === item.id) setSelectedId(null);
    if (editingId === item.id) setEditingId(null);
    void removeQueueItem(db, item.id).catch(logFailure("delete the queue item"));
  }

  /** The delete button: removes the item and offers to bring it back. */
  function handleDelete(item: QueueItem) {
    removeItem(item);
    notifyUndo(tc("deletedItem", { name: item.name }), tc("undo"), () => {
      const current = useAppStore.getState();
      current.setQueueItems([...current.queueItems, item]);
      void saveQueueItem(db, item).catch(logFailure("restore the queue item"));
    });
  }

  function handleReorder(next: QueueItem[]) {
    // `next` holds only the waiting items; bought-in-installments items keep their place in the store.
    setQueueItems([...next, ...queueItems.filter((i) => i.installmentPurchase)]);
    void saveQueueOrder(db, next).catch(logFailure("save the queue order"));
  }

  function handleConfirm(
    commitment: Commitment,
    breaches: GuardBreach[],
    guardBreachConfirmed: boolean,
    purchase: PurchaseChoice,
  ) {
    if (!selectedItem) return;
    const decision: Decision = {
      id: commitment.id,
      queueItemRef: selectedItem.id,
      itemName: selectedItem.name,
      outcome: "bought",
      timestamp: new Date().toISOString(),
      amount: commitment.payments.reduce((sum, p) => sum + p.amount, 0),
      breachedRuleIds: breaches.map((b) => b.ruleId),
      guardBreachConfirmed,
    };
    setDecisions([...decisions, decision]);
    void putListItem(db, "decisions", DecisionSchema, decision).catch(
      logFailure("save the decision"),
    );

    if (purchase.method === "cash") {
      // Cash is paid from the account by the user: it is a decision only, not a monthly commitment.
      removeItem(selectedItem);
    } else {
      // Installments become an expense: the item stays, flagged, and its payments are derived from it.
      const bought: QueueItem = {
        ...selectedItem,
        installmentPurchase: {
          offer: purchase.offer,
          firstMonth: purchase.firstMonth,
          ...(purchase.cardId ? { cardId: purchase.cardId } : {}),
        },
      };
      setQueueItems(queueItems.map((i) => (i.id === bought.id ? bought : i)));
      void saveQueueItem(db, bought).catch(logFailure("save the installment purchase"));
    }
    setSelectedId(null);
  }

  function handleDecide(outcome: "skipped" | "postponed") {
    if (!selectedItem) return;
    const decision: Decision = {
      id: `${outcome}-${selectedItem.id}-${decisions.length}`,
      queueItemRef: selectedItem.id,
      itemName: selectedItem.name,
      outcome,
      timestamp: new Date().toISOString(),
      // What the item would have cost in cash: the money saved when skipped.
      amount: selectedItem.discountedCashPrice ?? selectedItem.price,
    };
    setDecisions([...decisions, decision]);
    void putListItem(db, "decisions", DecisionSchema, decision).catch(
      logFailure("save the decision"),
    );
    if (outcome === "skipped") removeItem(selectedItem);
    setSelectedId(null);
  }

  const formOpen = adding || editingItem !== undefined;
  const closeForm = () => {
    setAdding(false);
    setEditingId(null);
  };

  return (
    <Page
      title={t("title")}
      action={
        <Button type="button" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("addItem")}
        </Button>
      }
    >
      {waitingItems.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-8 w-8" />}
          title={t("emptyState.title")}
          description={t("emptyState.text")}
          action={
            <Button type="button" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("addItem")}
            </Button>
          }
        />
      ) : (
        <>
          <QueueSummary {...summary} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl
              label={t("views.label")}
              value={view}
              onChange={setView}
              options={[
                { value: "list", label: t("views.list") },
                { value: "eisenhower", label: t("views.eisenhower") },
                { value: "time", label: t("views.time") },
              ]}
            />
            <SegmentedControl
              label={t("filters.label")}
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: t("filters.all") },
                { value: "need", label: t("filters.need") },
                { value: "want", label: t("filters.want") },
              ]}
            />
          </div>
          <div key={view} className="fade-in">
            {view === "list" && (
              <QueueList
                items={visibleItems}
                commitments={commitments}
                reorderable={filter === "all"}
                onItemsChange={handleReorder}
                onSelect={(item) => setSelectedId(item.id)}
                onEdit={(item) => setEditingId(item.id)}
                onDelete={handleDelete}
                profile={profile}
                planState={planState}
                today={today}
                startMonth={currentMonth}
                hourlyNetIncome={hourlyNetIncome(profile)}
              />
            )}
            {view === "eisenhower" && (
              <QueueEisenhower items={visibleItems} onSelect={(item) => setSelectedId(item.id)} />
            )}
            {view === "time" && (
              <QueueTimeView
                items={visibleItems}
                monthByItemId={monthByItemId}
                today={today}
                onSelect={(item) => setSelectedId(item.id)}
              />
            )}
          </div>
        </>
      )}

      <Sheet open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        {formOpen && (
          <SheetContent title={editingItem ? t("editTitle") : t("addTitle")}>
            <QueueForm
              bare
              key={editingItem?.id ?? "new"}
              initial={editingItem}
              today={today}
              nextOrder={nextOrder}
              createId={() => crypto.randomUUID()}
              currency={currency}
              onSubmit={(item) => {
                handleSave(item);
                closeForm();
              }}
              onCancel={closeForm}
            />
          </SheetContent>
        )}
      </Sheet>

      <Sheet open={selectedItem !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        {selectedItem && (
          <SheetContent title={selectedItem.name} className="md:max-w-xl">
            <QueuePreview
              item={selectedItem}
              profile={profile}
              planState={planState}
              commitments={commitments}
              month={monthOf(today)}
              income={income}
              monthlyNeeds={needs}
              installmentCapPct={guardThresholds.installmentCapPct}
              cards={cards}
              purchaseDate={today}
              suggestedMonth={suggestedMonth}
              onDecide={handleDecide}
              onConfirm={handleConfirm}
            />
          </SheetContent>
        )}
      </Sheet>
    </Page>
  );
}
