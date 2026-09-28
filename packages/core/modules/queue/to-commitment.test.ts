import { describe, expect, it } from "vitest";
import { CommitmentSchema } from "../../kernel/commitment";
import { toDraftCommitment } from "./to-commitment";
import type { QueueItem } from "./schema";

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "item-1",
    name: "New laptop",
    price: 500000,
    urgency: 2,
    importance: 2,
    isNeed: false,
    expectedUses: 1000,
    addedDate: "2026-09-01",
    priceUpdatedDate: "2026-09-01",
    order: 0,
    ...overrides,
  };
}

describe("toDraftCommitment", () => {
  it("produces a commitment that validates against CommitmentSchema", () => {
    const commitment = toDraftCommitment(makeItem(), "2026-09");
    expect(CommitmentSchema.safeParse(commitment).success).toBe(true);
  });

  it("maps a want item to the wants bucket", () => {
    const commitment = toDraftCommitment(makeItem({ isNeed: false }), "2026-09");
    expect(commitment.bucket).toBe("wants");
  });

  it("maps a need item to the needs bucket", () => {
    const commitment = toDraftCommitment(makeItem({ isNeed: true }), "2026-09");
    expect(commitment.bucket).toBe("needs");
  });

  it("has status draft and a single payment for the given month", () => {
    const commitment = toDraftCommitment(makeItem(), "2026-09");
    expect(commitment.status).toBe("draft");
    expect(commitment.payments).toEqual([{ month: "2026-09", amount: 500000 }]);
  });
});
