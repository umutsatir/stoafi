"use client";

import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Screen-reader name. */
  label: string;
  className?: string;
}

/** The design's on/off switch: a 52 by 30 track with a knob that springs across. */
export function Switch({ checked, onCheckedChange, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-[30px] w-[52px] flex-none rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary" : "bg-muted",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute left-1 top-1 h-[22px] w-[22px] rounded-full bg-card shadow-[0_2px_6px_rgb(0_0_0/0.2)] transition-transform duration-[350ms] [transition-timing-function:cubic-bezier(.3,1.7,.5,1)]"
        style={{ transform: checked ? "translateX(22px)" : "translateX(0)" }}
      />
    </button>
  );
}
