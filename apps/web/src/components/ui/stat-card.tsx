import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import { StatusChip, type ChipTone } from "./status-chip";

export interface StatCardProps {
  label: string;
  /** The big number or text. */
  value: ReactNode;
  /** One line that says what the number means or what to do about it. */
  hint?: string;
  /** A status, shown as text plus colour. */
  status?: { label: string; tone: ChipTone };
  /** Shown next to the label, e.g. an InfoPopover. */
  info?: ReactNode;
  /** Something visual below: a bar, a ring, a sparkline. */
  footer?: ReactNode;
  testId?: string;
  className?: string;
  style?: CSSProperties;
}

export function StatCard({
  label,
  value,
  hint,
  status,
  info,
  footer,
  testId,
  className,
  style,
}: StatCardProps) {
  return (
    <Card className={cn("h-full", className)} style={style}>
      <CardContent className="flex h-full flex-col gap-2 pt-6">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            {label}
            {info}
          </p>
          {status && <StatusChip tone={status.tone}>{status.label}</StatusChip>}
        </div>
        <p className="text-title font-semibold tracking-tight" data-testid={testId}>
          {value}
        </p>
        {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
        {footer && <div className="mt-auto pt-2">{footer}</div>}
      </CardContent>
    </Card>
  );
}
