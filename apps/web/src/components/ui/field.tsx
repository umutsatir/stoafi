import type { ReactNode } from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

export interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

/** A label, its control and an optional hint or error line. */
export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-[7px]", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-[12.5px] font-bold text-destructive">
          {error}
        </p>
      )}
      {hint && <p className="text-xs leading-normal text-muted-foreground">{hint}</p>}
    </div>
  );
}
