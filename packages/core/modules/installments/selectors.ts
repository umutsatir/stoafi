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
/**
 * Real saving of installments vs. cash: positive means installments are
 * cheaper in real terms. `cashPrice === 0` returns 0 rather than dividing
 * by zero — there is nothing to save relative to a free item.
 */
export function realSaving(cashPrice: number, pv: number): number {
  if (cashPrice === 0) return 0;
  return (cashPrice - pv) / cashPrice;
}

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
