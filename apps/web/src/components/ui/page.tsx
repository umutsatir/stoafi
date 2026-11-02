import type { ReactNode } from "react";

/**
 * Every screen's outer frame: a big title with an optional one-line subtitle, an optional main
 * action, and a vertical stack of content. `hideTitle` keeps the heading for screen readers only
 * (the home screen leads with its own hero card).
 */
export function Page({
  title,
  subtitle,
  action,
  hideTitle = false,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  hideTitle?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-col gap-4">
      <div
        className={
          hideTitle
            ? "sr-only"
            : "rise-in flex flex-wrap items-end justify-between gap-3 pb-2 pt-3 md:pb-3"
        }
      >
        <div className="min-w-0">
          <h1 className="text-[32px] font-extrabold leading-none tracking-[-0.05em] md:text-[42px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-[640px] text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </main>
  );
}
