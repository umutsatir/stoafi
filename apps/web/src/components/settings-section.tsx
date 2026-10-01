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
      className="rise-in flex flex-col gap-3"
    >
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
