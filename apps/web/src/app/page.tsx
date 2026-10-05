"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Dashboard } from "@/components/dashboard";
import { Onboarding } from "@/components/onboarding";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { backupDue } from "@/lib/backup-reminder";
import { dataSince } from "@/lib/had-data";
import { localIsoDate } from "@/lib/clock";
import { buildDemoData, type DemoLabels } from "@/lib/demo-data";
import { loadAppState } from "@/storage/bootstrap";
import { clearUserData, writeDemoData } from "@/storage/demo";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";

const LABEL_KEYS: (keyof DemoLabels)[] = [
  "salary",
  "rent",
  "car",
  "streaming",
  "headphones",
  "washer",
  "laptop",
  "phone",
  "insurance",
  "holiday",
  "gold",
  "fund",
  "card",
  "spouse",
  "jacket",
  "watch",
];

export default function Home() {
  const profile = useAppStore((s) => s.profile);
  const planState = useAppStore((s) => s.planState);
  const queueItems = useAppStore((s) => s.queueItems);
  const sinkingFunds = useAppStore((s) => s.sinkingFunds);
  const cards = useAppStore((s) => s.cards);
  const guardThresholds = useAppStore((s) => s.guardThresholds);
  const today = useAppStore((s) => s.today);
  const demo = useAppStore((s) => s.demo);
  const lastBackup = useAppStore((s) => s.lastBackup);
  const snapshots = useAppStore((s) => s.snapshots);
  const hydrate = useAppStore((s) => s.hydrate);
  const setDemo = useAppStore((s) => s.setDemo);
  const t = useTranslations("home");
  const tLabels = useTranslations("demoLabels");

  const firstMonth = snapshots[0]?.month;
  // Data the device has held for some time counts from the day it first did; snapshots are the fallback.
  const firstDate = dataSince() ?? (firstMonth ? `${firstMonth}-01` : null);
  const autoBackupOn = useAppStore((s) => s.autoBackup.status === "on");
  const showBackupNudge =
    !demo && !autoBackupOn && backupDue(lastBackup, today, profile !== null, firstDate);

  async function startDemo() {
    const labels = Object.fromEntries(
      LABEL_KEYS.map((key) => [key, tLabels(key)]),
    ) as unknown as DemoLabels;
    await writeDemoData(db, buildDemoData(today, labels));
    hydrate(await loadAppState(db, navigator.language), localIsoDate(new Date()));
    setDemo(true);
  }

  async function clearDemo() {
    await clearUserData(db);
    hydrate(await loadAppState(db, navigator.language), localIsoDate(new Date()));
    setDemo(false);
    notify(t("demoCleared"));
  }

  return (
    <Dashboard
      profile={profile}
      planState={planState}
      queueItems={queueItems}
      sinkingFunds={sinkingFunds}
      cards={cards}
      installmentCapPct={guardThresholds.installmentCapPct}
      today={today}
      onboarding={<Onboarding onDemo={() => void startDemo()} />}
      banner={
        showBackupNudge ? (
          <div
            role="status"
            data-testid="backup-nudge"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm"
          >
            <span>{t("backupNudge")}</span>
            <Button asChild size="sm" variant="outline">
              <Link href="/settings">{t("backupNudgeAction")}</Link>
            </Button>
          </div>
        ) : demo ? (
          <div
            role="status"
            data-testid="demo-banner"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-info/40 bg-info/10 p-3 text-sm"
          >
            <span>{t("demoBanner")}</span>
            <Button type="button" size="sm" variant="outline" onClick={() => void clearDemo()}>
              {t("demoClear")}
            </Button>
          </div>
        ) : null
      }
    />
  );
}
