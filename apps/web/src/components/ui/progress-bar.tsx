import { cn } from "@/lib/utils";

export type Tone = "primary" | "success" | "warning" | "danger" | "info";

export const TONE_BAR: Record<Tone, string> = {
  primary: "bg-c4",
  success: "bg-c4",
  warning: "bg-c2",
  danger: "bg-c3",
  info: "bg-c1",
};

export interface ProgressBarProps {
  value: number;
  max: number;
  /** Screen-reader name; also the visible caption's source of truth. */
  label: string;
  tone?: Tone;
  className?: string;
  /** A CSS colour for the fill; overrides the tone's colour unless `overColor` is set. */
  color?: string;
  /** When true the tone's colour wins, so an over-limit bar still reads as a warning. */
  overColor?: boolean;
}

export function ProgressBar({
  value,
  max,
  label,
  tone = "primary",
  className,
  color,
  overColor = false,
}: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, 0), max)}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          color && !overColor ? "" : TONE_BAR[tone],
        )}
        style={{ width: `${ratio * 100}%`, ...(color && !overColor ? { background: color } : {}) }}
      />
    </div>
  );
}
