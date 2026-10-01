"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

export interface InfoPopoverProps {
  /** Screen-reader name of the (i) button, e.g. "What is the runway?" */
  label: string;
  children: ReactNode;
}

/** A small (i) that opens a short explanation. Opens on click and Enter, so it works on touch and by keyboard. */
export function InfoPopover({ label, children }: InfoPopoverProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        aria-label={label}
        className="inline-flex rounded-full p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={6}
          className="z-50 max-w-xs rounded-lg border border-border bg-card p-3 text-sm text-card-foreground shadow-md"
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
