import type { ReactNode } from "react";

/** Every screen's outer frame: a title, an optional main action, and a vertical stack of content. */
export function Page({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title font-semibold tracking-tight">{title}</h1>
        {action}
      </div>
      {children}
    </main>
  );
}
