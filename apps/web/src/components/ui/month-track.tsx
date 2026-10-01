import { cn } from "@/lib/utils";

export type MonthTrackState = "past" | "current" | "free" | "tight" | "full";

export interface MonthTrackItem {
  /** "2026-10" */
  month: string;
  /** Short visible name, already localized, e.g. "Oct". */
  label: string;
  state: MonthTrackState;
  /** Spoken description, e.g. "October: room for 4,000". */
  description: string;
}

const STATE_CLASS: Record<MonthTrackState, string> = {
  past: "bg-muted text-muted-foreground",
  current: "bg-primary text-primary-foreground",
  free: "bg-success/15 text-success",
  tight: "bg-warning/15 text-warning",
  full: "bg-destructive/15 text-destructive",
};

/** A row of months showing which have room, which are tight and which are full. */
export function MonthTrack({ items, className }: { items: MonthTrackItem[]; className?: string }) {
  return (
    <ol className={cn("flex gap-1 overflow-x-auto", className)}>
      {items.map((item) => (
        <li
          key={item.month}
          aria-label={item.description}
          className={cn(
            "flex min-w-12 flex-1 flex-col items-center rounded-md px-2 py-1.5 text-xs font-medium",
            STATE_CLASS[item.state],
          )}
        >
          {item.label}
        </li>
      ))}
    </ol>
  );
}
