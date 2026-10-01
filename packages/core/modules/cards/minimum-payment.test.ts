import { describe, expect, it } from "vitest";
import { minimumPaymentPayoff } from "./minimum-payment";

describe("minimumPaymentPayoff", () => {
  it("matches a hand-computed payoff for a simple case", () => {
    // balance 1000, monthly rate 0.02, min payment 5% of balance, floor 0.
    // Hand simulation (first few months):
    // t0: b=1000
    // t1: interest=20, payment=max(0.05*1000,0)=50, b=1000*1.02-50=970
    // t2: interest=19.4, payment=48.5, b=970*1.02-48.5=940.9
    const result = minimumPaymentPayoff(1000, 0.02, { pct: 0.05, floor: 0 });
    expect(result.months).toBeGreaterThan(0);
    expect(result.totalInterest).toBeGreaterThan(0);

    // Re-simulate independently to cross-check months/interest exactly.
    let balance = 1000;
    let months = 0;
    let totalInterest = 0;
    while (balance >= 0.5 && months < 600) {
      const interest = balance * 0.02;
      totalInterest += interest;
      const payment = Math.max(0.05 * balance, 0);
      balance = balance * 1.02 - payment;
      months++;
    }
    expect(result.months).toBe(months);
    expect(result.totalInterest).toBeCloseTo(totalInterest, 6);
  });

  it("uses the floor when pct*balance is below it", () => {
    // Low balance where 5% of balance is tiny; floor forces a bigger payment,
    // so payoff should be faster than a run with floor 0.
    const withFloor = minimumPaymentPayoff(200, 0.02, { pct: 0.05, floor: 50 });
    const withoutFloor = minimumPaymentPayoff(200, 0.02, { pct: 0.05, floor: 0 });
    expect(withFloor.months).toBeLessThan(withoutFloor.months);
  });

  it("terminates at the safety cap instead of looping forever when payment never covers interest", () => {
    // rate 0.05 (5%/mo), payment pct 0.01 (1%/mo) -> payment never covers interest, balance grows.
    const result = minimumPaymentPayoff(1000, 0.05, { pct: 0.01, floor: 0 });
    expect(result.months).toBe(600);
  });

  it("flags a debt that never pays off and not one that does", () => {
    expect(minimumPaymentPayoff(1000, 0.05, { pct: 0.01, floor: 0 }).neverPaysOff).toBe(true);
    expect(minimumPaymentPayoff(1000, 0.02, { pct: 0.05, floor: 0 }).neverPaysOff).toBe(false);
    expect(minimumPaymentPayoff(0, 0.02, { pct: 0.05, floor: 0 }).neverPaysOff).toBe(false);
  });
});
