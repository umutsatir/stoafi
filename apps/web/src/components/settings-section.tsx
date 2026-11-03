import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { stagger } from "@/lib/utils";

/** A titled block of settings: what it is for, then the controls. */
export function SettingsSection({
  title,
  description,
  index = 0,
  testId,
  children,
}: {
  title: string;
  description?: string;
  /** Kept so existing call sites compile; the design's section titles carry no icon. */
  icon?: LucideIcon;
  index?: number;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      data-testid={testId}
      style={stagger(index)}
      className="pop-in mb-4 flex break-inside-avoid flex-col rounded-card bg-card px-[30px] py-[26px]"
    >
      <h2 className="text-xl font-extrabold tracking-[-0.03em]">{title}</h2>
      {description && (
        <p className="mt-[3px] text-[13px] leading-normal text-muted-foreground">{description}</p>
      )}
      {children}
    </section>
  );
}
