"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { SinkingFund } from "@stoafi/core";
import { LessonLink } from "@/components/lesson-link";
import { SinkingFundForm } from "@/components/sinking-fund-form";
import { SinkingFundList } from "@/components/sinking-fund-list";
import { Page } from "@/components/ui/page";
import { notify, notifyUndo } from "@/components/ui/toaster";
import { monthOf } from "@/lib/clock";
import { removeSinkingFund, saveSinkingFund } from "@/storage/sinking-repo";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";

function logFailure(what: string) {
  return (error: unknown) => console.error(`Could not ${what}`, error);
}

export default function SinkingFundsPage() {
  const funds = useAppStore((s) => s.sinkingFunds);
  const setFunds = useAppStore((s) => s.setSinkingFunds);
  const currency = useAppStore((s) => s.currency);
  const today = useAppStore((s) => s.today);
  const [editingId, setEditingId] = useState<string | null>(null);
  const t = useTranslations("sinkingFunds");
  const tc = useTranslations("common");

  const month = monthOf(today);
  const editing = funds.find((f) => f.id === editingId);

  function handleSave(fund: SinkingFund) {
    const exists = funds.some((f) => f.id === fund.id);
    setFunds(exists ? funds.map((f) => (f.id === fund.id ? fund : f)) : [...funds, fund]);
    setEditingId(null);
    void saveSinkingFund(db, fund).catch(logFailure("save the savings goal"));
    notify(tc("saved"));
  }

  function handleDelete(fund: SinkingFund) {
    setFunds(funds.filter((f) => f.id !== fund.id));
    if (editingId === fund.id) setEditingId(null);
    void removeSinkingFund(db, fund.id).catch(logFailure("delete the savings goal"));
    notifyUndo(tc("deletedItem", { name: fund.label }), tc("undo"), () => {
      const current = useAppStore.getState();
      current.setSinkingFunds([...current.sinkingFunds, fund]);
      void saveSinkingFund(db, fund).catch(logFailure("restore the savings goal"));
    });
  }

  return (
    <Page title={t("title")}>
      <p className="max-w-prose text-sm text-muted-foreground">{t("intro")}</p>
      <SinkingFundForm
        key={editing?.id ?? "new"}
        initial={editing}
        currency={currency}
        currentMonth={month}
        createId={() => crypto.randomUUID()}
        onSubmit={handleSave}
        onCancel={editing ? () => setEditingId(null) : undefined}
      />
      <SinkingFundList
        funds={funds}
        month={month}
        onEdit={(fund) => setEditingId(fund.id)}
        onDelete={handleDelete}
      />
      <div>
        <LessonLink lessonId="sinking-funds" testId="lesson-link-sinking-funds" />
      </div>
    </Page>
  );
}
