import { describe, expect, it } from "vitest";
import { projectSeries } from "../../kernel/project";
import { toDraftCommitment } from "./to-commitment";
import type { Commitment } from "../../kernel/commitment";
import type { Month } from "../../kernel/month";
import type { QueueItem } from "./schema";

const twelveMonths: Month[] = [
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
  "2026-09",
  "2026-10",
  "2026-11",
  "2026-12",
];

describe("preview mode: selecting a queue item shows before/after without mutating the ledger", () => {
  it("freeCash in the draft's month changes after, and the original ledger is untouched", () => {
    const ledger: Commitment[] = [
      {
        id: "existing",
        source: { module: "queue", refId: "existing" },
        bucket: "needs",
        payments: [{ month: "2026-03", amount: 1000 }],
        status: "active",
      },
    ];
    const ledgerSnapshot = JSON.parse(JSON.stringify(ledger)) as Commitment[];

    const item: QueueItem = {
      id: "preview-item",
      name: "Headphones",
      price: 2000,
      urgency: 2,
      importance: 2,
      isNeed: false,
      expectedUses: 100,
      addedDate: "2025-01-01",
      priceUpdatedDate: "2025-01-01",
      order: 0,
    };

    const before = projectSeries({ income: 10000 }, ledger, twelveMonths, { includeDrafts: true });

    const draft = toDraftCommitment(item, "2026-03");
    const after = projectSeries({ income: 10000 }, [...ledger, draft], twelveMonths, {
      includeDrafts: true,
    });

    const beforeMarch = before.find((p) => p.month === "2026-03");
    const afterMarch = after.find((p) => p.month === "2026-03");

    expect(beforeMarch?.freeCash).not.toBe(afterMarch?.freeCash);
    expect(afterMarch?.freeCash).toBe((beforeMarch?.freeCash ?? 0) - item.price);

    // the original ledger array passed to `before` must be unchanged
    expect(ledger).toEqual(ledgerSnapshot);
  });
});
