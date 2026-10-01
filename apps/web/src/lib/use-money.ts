import { useFormatter } from "next-intl";
import { useAppStore } from "@/store";

/** What is shown in place of an amount while amounts are hidden. */
export const HIDDEN_AMOUNT = "••••";

/**
 * Returns a formatter for integer minor units in the app's currency and the
 * active locale. The /100 is display-only; stored money stays integer.
 * While amounts are hidden it returns a mask instead, so every screen hides them at once.
 */
export function useMoney(): (minor: number) => string {
  const format = useFormatter();
  const currency = useAppStore((s) => s.currency);
  const hidden = useAppStore((s) => s.hideAmounts);
  return (minor) =>
    hidden
      ? HIDDEN_AMOUNT
      : format.number(minor / 100, {
          style: "currency",
          currency,
          currencyDisplay: "narrowSymbol",
        });
}
