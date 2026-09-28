import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { InstallmentOfferSchema } from "./schema";
import { compareOffers } from "./selectors";

describe("InstallmentOfferSchema", () => {
  it("parses a valid offer", () => {
    const result = InstallmentOfferSchema.safeParse({
      months: 6,
      payments: [200, 200, 200, 200, 200, 200],
      discountedCashPrice: 1100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative payment", () => {
    const result = InstallmentOfferSchema.safeParse({
      months: 3,
      payments: [400, -400, 400],
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero months", () => {
    const result = InstallmentOfferSchema.safeParse({
      months: 0,
      payments: [],
    });
    expect(result.success).toBe(false);
  });

  it("property: valid offers always round-trip through compareOffers without throwing", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 24 }),
        fc.array(fc.integer({ min: 1, max: 100_000 }), { minLength: 1, maxLength: 24 }),
        (months, payments) => {
          const offer = { months, payments };
          const parsed = InstallmentOfferSchema.safeParse(offer);
          if (parsed.success) {
            expect(() => compareOffers(100_000, [offer], 0.3)).not.toThrow();
          }
        },
      ),
    );
  });
});
