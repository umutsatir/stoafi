/**
 * Monthly discount rate derived from an annual inflation expectation.
 * r = (1 + i)^(1/12) - 1
 */
export function monthlyRate(annualInflation: number): number {
  return Math.pow(1 + annualInflation, 1 / 12) - 1;
}

/**
 * Present value of an installment plan's payments, discounted at monthly
 * rate `r`. The first payment lands `firstPaymentOffset` months out
 * (default 1), each subsequent payment one month after the last.
 */
export function pvOfPlan(
  payments: { amount: number }[],
  r: number,
  firstPaymentOffset = 1,
): number {
  return payments.reduce((sum, payment, index) => {
    const k = firstPaymentOffset + index;
    return sum + payment.amount / Math.pow(1 + r, k);
  }, 0);
}
