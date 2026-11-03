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
  /** "surface" sits on the page background; "soft" sits inside a card. */
  tone?: "surface" | "soft";
}

/** A short either-or switch (view modes). Arrow keys move the choice, like native radios. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  tone = "surface",
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex gap-1.5 rounded-full p-[5px] text-[13px] font-bold",
        tone === "surface" ? "bg-card" : "bg-muted",
        className,
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "cursor-pointer rounded-full px-4 py-2 transition-all duration-[250ms] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
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
