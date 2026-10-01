import { cn } from "@/lib/utils";

/** A grey placeholder shaped like the content that is loading. Decorative: the page announces loading itself. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
