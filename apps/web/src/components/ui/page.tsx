import type { ReactNode } from "react";

/** Every screen's outer frame: a title and a vertical stack of cards. */
export function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </main>
  );
}
