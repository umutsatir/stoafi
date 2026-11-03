"use client";

import { cn } from "@/lib/utils";

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Text shown for the value, e.g. "%20". Defaults to the number. */
  format?: (value: number) => string;
  decreaseLabel: string;
  increaseLabel: string;
  className?: string;
}

const BUTTON =
  "flex h-[42px] w-[42px] items-center justify-center rounded-full bg-muted text-xl font-extrabold transition-colors hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

/** A round minus and plus around a big number, as in the design. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = String,
  decreaseLabel,
  increaseLabel,
  className,
}: StepperProps) {
  return (
    <div className={cn("flex items-center gap-3.5", className)}>
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
        className={BUTTON}
      >
        −
      </button>
      <output className="min-w-[60px] text-center text-[28px] font-extrabold tracking-[-0.04em]">
        {format(value)}
      </output>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
        className={BUTTON}
      >
        +
      </button>
    </div>
  );
}
