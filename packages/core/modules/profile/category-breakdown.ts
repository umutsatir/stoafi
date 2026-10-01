import type { Bucket } from "../../kernel/bucket";
import type { Commitment } from "../../kernel/commitment";
import type { Minor } from "../../kernel/money";
import type { Month } from "../../kernel/month";
import { expenseKind } from "./active-expenses";
import type { Profile } from "./schema";

/** What a committed amount is for, a finer cut than the four plan buckets. */
export type CostCategory =
  "bills" | "living" | "personal" | "installments" | "loans" | "pots" | "saving";

export interface CategoryItem {
  /** Id of the line; for things the profile does not own (queue purchases, pots) the source id. */
  key: string;
  /** The line's name when the profile knows it; null when only the source id is known. */
  label: string | null;
  amount: Minor;
}

export interface CategoryAmount {
  bucket: Bucket;
  category: CostCategory;
  amount: Minor;
  items: CategoryItem[];
}

/**
 * Splits what is committed in `month` by what it is for, inside each plan bucket: bills, living costs,
 * installments (profile lines and queue purchases), loans, savings pots and regular saving or investing.
 * Draft and cancelled commitments are left out, as in the projection.
 */
export function committedByCategory(
  profile: Profile,
  commitments: Commitment[],
  month: Month,
): CategoryAmount[] {
  const groups = new Map<string, CategoryAmount>();

  for (const commitment of commitments) {
    if (commitment.status !== "active") continue;
    const amount = commitment.payments
      .filter((p) => p.month === month)
      .reduce((sum, p) => sum + p.amount, 0);
    if (amount <= 0) continue;

    const { module, refId } = commitment.source;
    let category: CostCategory;
    let label: string | null = null;
    if (refId === "living") category = "living";
    else if (refId === "personal") category = "personal";
    else if (module === "sinking-funds") category = "pots";
    else if (refId.startsWith("fixed-")) {
      const expense = profile.fixedExpenses[Number(refId.slice("fixed-".length))];
      label = expense?.label ?? null;
      const kind = expense ? expenseKind(expense) : "regular";
      category =
        kind === "installment"
          ? "installments"
          : kind === "loan"
            ? "loans"
            : commitment.bucket === "savings" || commitment.bucket === "investing"
              ? "saving"
              : "bills";
    } else category = "installments"; // a purchase from the queue, named by its id

    const id = `${commitment.bucket}:${category}`;
    const group = groups.get(id) ?? { bucket: commitment.bucket, category, amount: 0, items: [] };
    group.amount += amount;
    group.items.push({ key: refId, label, amount });
    groups.set(id, group);
  }
  return [...groups.values()];
}
