import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { stagger } from "@/lib/utils";

/** A titled block of settings: an icon, what it is for, then the controls. */
export function SettingsSection({
  title,
  description,
  icon: Icon,
  index = 0,
  testId,
  children,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  index?: number;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      data-testid={testId}
      style={stagger(index)}
      className="pop-in mb-4 flex break-inside-avoid flex-col gap-3 rounded-card bg-card px-[30px] py-[26px]"
    >
      <div>
        <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-[-0.03em]">
          <Icon className="h-5 w-5 text-primary-ink" aria-hidden="true" />
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
