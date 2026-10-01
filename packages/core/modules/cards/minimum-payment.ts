const SAFETY_CAP_MONTHS = 600;
/** A percentage-only minimum shrinks the balance geometrically and never hits exactly zero; below half a minor unit it is paid. */
const PAID_OFF_BELOW = 0.5;

export interface MinPaymentRule {
  pct: number;
  floor: number;
}

export interface MinimumPaymentPayoff {
  months: number;
  totalInterest: number;
  /** True when the balance was still positive at the safety cap: the payments never clear the debt. */
  neverPaysOff: boolean;
}

/**
 * Simulates a card balance under minimum payments until it reaches zero:
 * b_{t+1} = b_t*(1+c) - max(p*b_t, floor). Capped at 600 months so a
 * payment that never covers interest terminates instead of looping
 * forever; `neverPaysOff` flags that case so callers do not show the cap as a real duration.
 */
export function minimumPaymentPayoff(
  balance: number,
  monthlyRate: number,
  minPaymentRule: MinPaymentRule,
): MinimumPaymentPayoff {
  let b = balance;
  let months = 0;
  let totalInterest = 0;

  while (b >= PAID_OFF_BELOW && months < SAFETY_CAP_MONTHS) {
    const interest = b * monthlyRate;
    totalInterest += interest;
    const payment = Math.max(minPaymentRule.pct * b, minPaymentRule.floor);
    b = b * (1 + monthlyRate) - payment;
    months++;
  }

  return { months, totalInterest, neverPaysOff: b >= PAID_OFF_BELOW };
}
