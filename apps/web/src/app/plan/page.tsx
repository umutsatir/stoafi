"use client";

import { PlanComparison } from "@/components/plan-comparison";
import { useAppStore } from "@/store";

export default function PlanPage() {
  const profile = useAppStore((s) => s.profile);

  return (
    <main>
      <h1>Plan</h1>
      {profile ? <PlanComparison profile={profile} /> : <p>Fill in your profile first.</p>}
    </main>
  );
}
