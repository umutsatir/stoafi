"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DecisionSchema,
  cooldownPhase,
  activeQueueItems,
  addMonths,
  cashFlowSeries,
  installmentCommitments,
  sinkingFundCommitments,
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
import { QueueBubbleView } from "@/components/queue-bubble-view";
import { remainingByCard } from "@/lib/card-debt";
import { monthOf } from "@/lib/clock";
import { db } from "@/storage/instance";
import { removeQueueItem, saveQueueItem, saveQueueOrder } from "@/storage/queue-repo";
import { putListItem } from "@/storage/repo";
import { useQuickAction } from "@/lib/use-quick-action";
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
  const sinkingFunds = useAppStore((s) => s.sinkingFunds);
  const decisions = useAppStore((s) => s.decisions);
  const setDecisions = useAppStore((s) => s.setDecisions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"bubble" | "list" | "eisenhower">("bubble");
  const [filter, setFilter] = useState<"all" | "need" | "want">("all");
  useQuickAction("addQueueItem", () => setAdding(true));
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

  const remainingByCardId = remainingByCard(queueItems, profile, monthOf(today));
  const waitingItems = activeQueueItems(queueItems);
  const selectedItem = waitingItems.find((i) => i.id === selectedId) ?? waitingItems[0] ?? null;
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
  const fitting = waitingItems.filter((i) => monthByItemId.get(i.id) === currentMonth);
  const nearestItem = waitingItems
    .flatMap((i) => {
      const m = monthByItemId.get(i.id);
      return m ? [{ name: i.name, month: m }] : [];
    })
    .sort((a, b) => a.month.localeCompare(b.month))[0];
  const summary = {
    total: waitingItems.reduce((sum, i) => sum + cashPrice(i), 0),
    fitsCount: fitting.length,
    nearest: nearestItem ?? null,
  };
  const timeline = cashFlowSeries(
    profile,
    [...installmentCommitments(queueItems), ...sinkingFundCommitments(sinkingFunds, currentMonth)],
    Array.from({ length: 12 }, (_, i) => addMonths(currentMonth, i)),
  ).map((point) => ({ month: point.month, left: point.left }));
  const visibleItems = waitingItems.filter(
    (i) => filter === "all" || (filter === "need" ? i.isNeed : !i.isNeed),
  );

  /** The first want whose 30-day wait is over and has not been asked "still want it?" yet. */
  const askItem = waitingItems.find((i) => cooldownPhase(i, today).phase === "ask");

  function confirmStillWanted(item: QueueItem) {
    handleSave({ ...item, cooldownConfirmedOn: today });
  }

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

  /** Takes back a decision: removes it from the log and puts the item back as it was. */
  function undoDecision(decision: Decision, original: QueueItem, wasRemoved: boolean) {
    const current = useAppStore.getState();
    current.setDecisions(current.decisions.filter((d) => d.id !== decision.id));
    void db.decisions.delete(decision.id).catch(logFailure("remove the decision"));
    const items = wasRemoved
      ? [...current.queueItems, original]
      : current.queueItems.map((i) => (i.id === original.id ? original : i));
    current.setQueueItems(items);
    void saveQueueItem(db, original).catch(logFailure("restore the queue item"));
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
      notifyUndo(
        tc("decisionRecorded", { name: selectedItem.name, outcome: tc("outcome.bought") }),
        tc("undo"),
        () => undoDecision(decision, selectedItem, true),
      );
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
      notifyUndo(
        tc("decisionRecorded", { name: selectedItem.name, outcome: tc("outcome.bought") }),
        tc("undo"),
        () => undoDecision(decision, selectedItem, false),
      );
    }
    setSelectedId(null);
  }

  function handleDecide(outcome: "skipped" | "postponed", target: QueueItem | null = selectedItem) {
    if (!target) return;
    const decision: Decision = {
      id: `${outcome}-${target.id}-${decisions.length}`,
      queueItemRef: target.id,
      itemName: target.name,
      outcome,
      timestamp: new Date().toISOString(),
      // What the item would have cost in cash: the money saved when skipped.
      amount: target.discountedCashPrice ?? target.price,
    };
    setDecisions([...decisions, decision]);
    void putListItem(db, "decisions", DecisionSchema, decision).catch(
      logFailure("save the decision"),
    );
    if (outcome === "skipped") removeItem(target);
    notifyUndo(
      tc("decisionRecorded", { name: target.name, outcome: tc(`outcome.${outcome}`) }),
      tc("undo"),
      () => undoDecision(decision, target, outcome === "skipped"),
    );
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
      subtitle={t("subtitle")}
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
          <div className="rise-in flex flex-wrap items-center justify-between gap-4">
            <SegmentedControl
              label={t("views.label")}
              value={view}
              onChange={setView}
              options={[
                { value: "bubble", label: t("views.time") },
                { value: "list", label: t("views.list") },
                { value: "eisenhower", label: t("views.eisenhower") },
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
            {view === "bubble" && (
              <QueueBubbleView
                items={visibleItems}
                months={timeline}
                monthByItemId={monthByItemId}
                selectedId={selectedItem?.id ?? null}
                onSelect={(item) => setSelectedId(item.id)}
              />
            )}
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
                selectedId={selectedItem?.id ?? null}
              />
            )}
            {view === "eisenhower" && (
              <QueueEisenhower
                items={visibleItems}
                selectedId={selectedItem?.id ?? null}
                onSelect={(item) => setSelectedId(item.id)}
              />
            )}
          </div>
          {askItem && (
            <section
              role="status"
              data-testid="cooldown-ask"
              className="pop-in flex flex-wrap items-center gap-5 rounded-card bg-c4 px-[30px] py-[22px] text-on"
            >
              <div className="min-w-0 flex-1 basis-60">
                <h2 className="text-[22px] font-extrabold tracking-[-0.03em]">
                  {t("cooldown.askTitle")}
                </h2>
                <p className="mt-0.5 text-[13.5px] font-semibold">
                  {t("cooldown.askText", { name: askItem.name })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => confirmStillWanted(askItem)}
                className="press rounded-full bg-on px-6 py-3 text-sm font-extrabold text-background"
              >
                {t("cooldown.keep")}
              </button>
              <button
                type="button"
                onClick={() => handleDecide("skipped", askItem)}
                className="press rounded-full bg-white/45 px-6 py-3 text-sm font-extrabold"
              >
                {t("cooldown.skip")}
              </button>
            </section>
          )}
          {selectedItem && (
            <QueuePreview
              key={selectedItem.id}
              item={selectedItem}
              profile={profile}
              planState={planState}
              commitments={commitments}
              month={monthOf(today)}
              income={income}
              monthlyNeeds={needs}
              installmentCapPct={guardThresholds.installmentCapPct}
              cards={cards}
              remainingInstallments={remainingByCardId}
              purchaseDate={today}
              suggestedMonth={suggestedMonth}
              onDecide={handleDecide}
              onConfirm={handleConfirm}
            />
          )}
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
    </Page>
  );
}
