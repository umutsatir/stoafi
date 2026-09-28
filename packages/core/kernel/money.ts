/** Integer minor units (kuruş / cents). Never a float once stored. */
export type Minor = number;

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
