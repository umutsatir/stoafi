"use client";

import { Dashboard } from "@/components/dashboard";
import { useAppStore } from "@/store";

export default function Home() {
  const profile = useAppStore((s) => s.profile);
  const planState = useAppStore((s) => s.planState);
  const queueItems = useAppStore((s) => s.queueItems);
  const sinkingFunds = useAppStore((s) => s.sinkingFunds);
  const cards = useAppStore((s) => s.cards);
  const guardThresholds = useAppStore((s) => s.guardThresholds);
  const today = useAppStore((s) => s.today);

  return (
    <Dashboard
      profile={profile}
      planState={planState}
      queueItems={queueItems}
      sinkingFunds={sinkingFunds}
      cards={cards}
      installmentCapPct={guardThresholds.installmentCapPct}
      today={today}
    />
  );
}
