import { cn } from "@/lib/utils";

export type Tone = "primary" | "success" | "warning" | "danger" | "info";

export const TONE_BAR: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
};

export interface ProgressBarProps {
  value: number;
  max: number;
  /** Screen-reader name; also the visible caption's source of truth. */
  label: string;
  tone?: Tone;
  className?: string;
}

export function ProgressBar({ value, max, label, tone = "primary", className }: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, 0), max)}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", TONE_BAR[tone])}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
