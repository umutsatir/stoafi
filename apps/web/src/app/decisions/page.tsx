"use client";

import { DecisionLog } from "@/components/decision-log";
import { useAppStore } from "@/store";

export default function DecisionsPage() {
  const decisions = useAppStore((s) => s.decisions);

  return (
    <main>
      <h1>Decisions</h1>
      <DecisionLog decisions={decisions} />
    </main>
  );
}
