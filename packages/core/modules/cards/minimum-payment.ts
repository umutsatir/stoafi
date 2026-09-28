const SAFETY_CAP_MONTHS = 600;

export interface MinPaymentRule {
  pct: number;
  floor: number;
}

export interface MinimumPaymentPayoff {
  months: number;
  totalInterest: number;
}

/**
 * Simulates a card balance under minimum payments until it reaches zero:
 * b_{t+1} = b_t*(1+c) - max(p*b_t, floor). Capped at 600 months so a
 * payment that never covers interest terminates instead of looping
 * forever; the cap is reported as `months` in that case.
 */
export function minimumPaymentPayoff(
  balance: number,
  monthlyRate: number,
  minPaymentRule: MinPaymentRule,
): MinimumPaymentPayoff {
  let b = balance;
  let months = 0;
  let totalInterest = 0;

  while (b > 0 && months < SAFETY_CAP_MONTHS) {
    const interest = b * monthlyRate;
    totalInterest += interest;
    const payment = Math.max(minPaymentRule.pct * b, minPaymentRule.floor);
    b = b * (1 + monthlyRate) - payment;
    months++;
  }

  return { months, totalInterest };
}
