/**
 * Monthly discount rate derived from an annual inflation expectation.
 * r = (1 + i)^(1/12) - 1
 */
export function monthlyRate(annualInflation: number): number {
  return Math.pow(1 + annualInflation, 1 / 12) - 1;
}
