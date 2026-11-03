import { describe, expect, it } from "vitest";
import { FUND_HOLDINGS, fundHoldingFit } from "./fund-holding";

describe("fundHoldingFit", () => {
  it("rates a deposit as a good home for an emergency fund", () => {
    expect(fundHoldingFit("deposit")).toBe("good");
  });

  it("rates plain cash and gold as middling: easy to reach, but they lose or swing in value", () => {
    expect(fundHoldingFit("cash")).toBe("medium");
    expect(fundHoldingFit("gold")).toBe("medium");
  });

  it("rates an index fund as risky for money needed at the worst moment", () => {
    expect(fundHoldingFit("indexFund")).toBe("risky");
  });

  it("covers every holding the profile can store", () => {
    for (const holding of FUND_HOLDINGS) {
      expect(["good", "medium", "risky"]).toContain(fundHoldingFit(holding));
    }
  });
});
