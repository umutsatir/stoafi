import { useFormatter } from "next-intl";
import { useAppStore } from "@/store";

/**
 * Returns a formatter for integer minor units in the app's currency and the
 * active locale. The /100 is display-only; stored money stays integer.
 */
export function useMoney(): (minor: number) => string {
  const format = useFormatter();
  const currency = useAppStore((s) => s.currency);
  return (minor) =>
    format.number(minor / 100, { style: "currency", currency, currencyDisplay: "narrowSymbol" });
}
