import { z } from "zod";

/** Integer minor units (kuruş / cents). Never a float once stored. */
export type Minor = number;

/** Currencies the MVP supports; extend this list as new ones are needed. */
export const SUPPORTED_CURRENCIES = ["TRY", "USD", "EUR"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export interface Money {
  amount: Minor;
  currency: Currency;
}

export const MoneySchema = z.object({
  amount: z.number().int(),
  currency: z.enum(SUPPORTED_CURRENCIES),
}) satisfies z.ZodType<Money>;

/**
 * Rounds a float amount to the nearest integer minor unit, half-to-even
 * (banker's rounding), so repeated rounding doesn't drift upward.
 */
export function roundHalfToEven(value: number): Minor {
  const floor = Math.floor(value);
  const diff = value - floor;

  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;

  // Exactly .5: round to the nearest even integer.
  return floor % 2 === 0 ? floor : floor + 1;
}

export function addMinor(a: Minor, b: Minor): Minor {
  return a + b;
}

export function subMinor(a: Minor, b: Minor): Minor {
  return a - b;
}
