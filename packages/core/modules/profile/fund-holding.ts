/** Where the user keeps their emergency fund. A rule of thumb, not advice about a product. */
export const FUND_HOLDINGS = ["cash", "gold", "deposit", "indexFund"] as const;
export type FundHolding = (typeof FUND_HOLDINGS)[number];
export type FundHoldingFit = "good" | "medium" | "risky";

/**
 * How well a place suits money that must be reachable and keep its value at the worst moment:
 * a deposit is both; cash is reachable but loses to inflation, gold reachable but swings; an index
 * fund can be down when the money is needed.
 */
export function fundHoldingFit(holding: FundHolding): FundHoldingFit {
  switch (holding) {
    case "deposit":
      return "good";
    case "cash":
    case "gold":
      return "medium";
    case "indexFund":
      return "risky";
  }
}
