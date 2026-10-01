import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./progress-bar";

const TONE_STROKE: Record<Tone, string> = {
  primary: "stroke-primary",
  success: "stroke-success",
  warning: "stroke-warning",
  danger: "stroke-destructive",
  info: "stroke-info",
};

export interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  tone?: Tone;
  /** Pixels. */
  size?: number;
  /** Shown in the middle, e.g. a percentage. */
  children?: ReactNode;
  className?: string;
}

export function ProgressRing({
  value,
  max,
  label,
  tone = "primary",
  size = 96,
  children,
  className,
}: ProgressRingProps) {
  const stroke = Math.max(6, Math.round(size / 10));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, 0), max)}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className={cn("transition-[stroke-dashoffset] duration-500", TONE_STROKE[tone])}
        />
      </svg>
      {children !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
          {children}
        </div>
      )}
    </div>
  );
}
