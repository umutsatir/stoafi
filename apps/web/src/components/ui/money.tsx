"use client";

import { useMoney } from "@/lib/use-money";
import { AnimatedNumber } from "./animated-number";

export interface MoneyProps {
  /** Integer minor units. */
  value: number;
  /** Count up to the value when it changes. */
  animated?: boolean;
  className?: string;
  testId?: string;
}

/** An amount in the app's currency and language. The one place amounts are drawn. */
export function Money({ value, animated = false, className, testId }: MoneyProps) {
  const money = useMoney();
  if (animated) {
    return (
      <AnimatedNumber
        value={value}
        format={(n) => money(Math.round(n))}
        className={className}
        testId={testId}
      />
    );
  }
  return (
    <span className={className} data-testid={testId}>
      {money(value)}
    </span>
  );
}
