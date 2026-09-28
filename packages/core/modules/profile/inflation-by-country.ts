import inflationData from "../../data/inflation-by-country.json";

export const INFLATION_DATA_AS_OF = inflationData.asOf;
export const INFLATION_DATA_SOURCE = inflationData.source;

const rates: Record<string, number> = inflationData.rates;

/** ISO 3166-1 alpha-2 codes covered by the bundled snapshot, in dataset order. */
export const INFLATION_COUNTRY_CODES: string[] = Object.keys(rates);

/**
 * A suggested annual inflation rate for `countryCode` (ISO 3166-1 alpha-2),
 * from a bundled static snapshot — never a live lookup (CLAUDE.md: no
 * network calls in the MVP). Callers must present this as an editable
 * suggestion, not silently apply it.
 */
export function suggestedAnnualInflation(countryCode: string): number | undefined {
  return rates[countryCode];
}
