import * as React from "react";
import { cn } from "@/lib/utils";

/** A native <select> styled like the other inputs; keeps plain string values and full keyboard/mobile support. */
export function NativeSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex w-full rounded-2xl border-2 border-border bg-background px-4 py-[11px] text-[15px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
