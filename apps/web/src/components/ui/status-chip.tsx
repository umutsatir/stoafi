import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipTone = "neutral" | "success" | "warning" | "danger" | "info";

const CHIP: Record<ChipTone, string> = {
  neutral: "bg-muted",
  success: "bg-success/15",
  warning: "bg-warning/15",
  danger: "bg-destructive/15",
  info: "bg-info/15",
};

const DOT: Record<ChipTone, string> = {
  neutral: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
};

/**
 * A small status label. The text is always the normal text colour, so it stays readable on its tint;
 * the colour shows in the dot. Colour never carries the meaning alone: the text always says it.
 */
export function StatusChip({
  tone = "neutral",
  children,
  className,
}: {
  tone?: ChipTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-foreground",
        CHIP[tone],
        className,
      )}
    >
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[tone])} />
      {children}
    </span>
  );
}
