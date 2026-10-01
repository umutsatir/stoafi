/**
 * Text <-> number helpers for money and percent inputs. Users type major
 * units ("1.250,50"); we hand back integer minor units without ever going
 * through a float, so 0,01 is exactly 1 kuruş.
 */

function separators(locale: string): { group: string; decimal: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(1_000_000.5);
  return {
    group: parts.find((p) => p.type === "group")?.value ?? ",",
    decimal: parts.find((p) => p.type === "decimal")?.value ?? ".",
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Turns user text into a plain "123.45" string, or null if it is not a
 * non-negative decimal. The locale's group separator is only treated as
 * grouping when it sits between 3-digit groups ("1.250" in tr is 1250);
 * otherwise "," and "." both count as a decimal point, so a dot typed on a
 * Turkish keypad still works.
 */
function normalize(text: string, locale: string): string | null {
  const compact = text.replace(/\s/g, "");
  if (compact === "") return "0";
  const { group, decimal } = separators(locale);
  const g = escapeRegExp(group);
  const d = escapeRegExp(decimal);
  const grouped = new RegExp(`^\\d{1,3}(?:${g}\\d{3})+(?:${d}\\d+)?$`);
  const unified = grouped.test(compact)
    ? compact.split(group).join("").replace(decimal, ".")
    : compact.replace(",", ".");
  return /^\d*\.?\d*$/.test(unified) && /\d/.test(unified) ? unified : null;
}

export function parseMinor(text: string, locale: string): number | null {
  const normalized = normalize(text, locale);
  if (normalized === null) return null;
  const [whole = "", fraction = ""] = normalized.split(".");
  if (fraction.length > 2) return null;
  const minor = Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0") || "0");
  return Number.isSafeInteger(minor) ? minor : null;
}

export function formatMinorForInput(minor: number, locale: string): string {
  if (minor === 0) return "";
  const { decimal } = separators(locale);
  const whole = Math.floor(minor / 100);
  const fraction = String(minor % 100)
    .padStart(2, "0")
    .replace(/0+$/, "");
  return fraction === "" ? String(whole) : `${whole}${decimal}${fraction}`;
}

/** "30" -> 0.3. Percent is a ratio, not money, so a float is fine here. */
export function parsePercent(text: string, locale: string): number | null {
  const normalized = normalize(text, locale);
  if (normalized === null) return null;
  return Number(normalized) / 100;
}

/** 0.3 -> "30". Rounded to 2 decimals to hide float noise (0.07 * 100). */
export function formatPercentForInput(ratio: number, locale: string): string {
  if (ratio === 0) return "";
  const { decimal } = separators(locale);
  const percent = Math.round(ratio * 10_000) / 100;
  return String(percent).replace(".", decimal);
}

/**
 * A quantity of something (grams, shares): a positive decimal typed in the user's style, or null.
 * Unlike money it may be fractional, so it is a plain number rather than minor units.
 */
export function parseQuantity(text: string, locale: string): number | null {
  const normalized = normalize(text, locale);
  if (normalized === null) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}
