import type { z } from "zod";

/** An action another module's card can offer, contributed via `contributes.itemActions`. */
export interface ItemAction {
  id: string;
  label: string;
}

/** A rule-based insight surfaced on the plan or health screens. */
export interface InsightRule {
  id: string;
}

/** A guard check run against every draft commitment before it can be confirmed. */
export interface GuardRule {
  id: string;
}

/**
 * A Stoafi core module: owns a schema, its migrations, its pure selectors,
 * and optionally contributes actions/insights/guards to other modules.
 * Modules never import each other directly — cross-module features go
 * through this `contributes` mechanism or the commitment ledger.
 */
export interface Module<Schema extends z.ZodTypeAny = z.ZodTypeAny> {
  id: string;
  version: number;
  schema: Schema;
  migrations: unknown[];
  selectors: Record<string, (...args: never[]) => unknown>;
  contributes?: {
    itemActions?: ItemAction[];
    insights?: InsightRule[];
    guards?: GuardRule[];
  };
}
