"use client";

import { QueueList } from "@/components/queue-list";
import { useAppStore } from "@/store";

export default function QueuePage() {
  const profile = useAppStore((s) => s.profile);
  const planState = useAppStore((s) => s.planState);
  const queueItems = useAppStore((s) => s.queueItems);

  if (!profile || !planState) {
    return (
      <main>
        <h1>Queue</h1>
        <p>Fill in your profile and pick a plan first.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Queue</h1>
      <QueueList
        items={queueItems}
        profile={profile}
        planState={planState}
        today="2026-01-01"
        startMonth="2026-01"
        hourlyNetIncome={200}
      />
    </main>
  );
}
