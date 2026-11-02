"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  /** Screen-reader name for the group. */
  label: string;
  className?: string;
}

/** A short either-or switch (view modes). Arrow keys move the choice, like native radios. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex rounded-full bg-muted p-1", className)}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "press cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
            value === option.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
