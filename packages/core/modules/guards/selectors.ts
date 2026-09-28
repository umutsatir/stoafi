import type { GuardContext, GuardRule } from "./schema";

export interface GuardBreach {
  ruleId: string;
  severity: "warning" | "block";
}

/** Runs every rule's `check` against a draft's guard context, read-only. */
export function evaluateGuards(rules: GuardRule[], ctx: GuardContext): GuardBreach[] {
  return rules
    .filter((rule) => rule.check(ctx))
    .map((rule) => ({ ruleId: rule.id, severity: rule.severity }));
}
