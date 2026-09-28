/** Price in hours of work. Returns 0 (not NaN/Infinity) when hourlyNetIncome is 0. */
export function costInWorkHours(price: number, hourlyNetIncome: number): number {
  if (hourlyNetIncome === 0) return 0;
  return price / hourlyNetIncome;
}

/** Price divided across expected uses. Returns 0 (not NaN/Infinity) when expectedUses is 0. */
export function costPerUse(price: number, expectedUses: number): number {
  if (expectedUses === 0) return 0;
  return price / expectedUses;
}

export function eisenhowerQuadrant(item: { urgency: number; importance: number }): {
  urgent: boolean;
  important: boolean;
} {
  return {
    urgent: item.urgency >= 2,
    important: item.importance >= 2,
  };
}
