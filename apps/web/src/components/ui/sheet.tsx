"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export interface SheetContentProps {
  title: string;
  description?: string;
  children?: ReactNode;
  /** Desktop: slides in from the right. Phone: always a bottom sheet. */
  className?: string;
}

/** A side panel for forms and previews that should not take you off the page. */
export function SheetContent({ title, description, children, className }: SheetContentProps) {
  const t = useTranslations("common");
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm data-[state=closed]:animate-[overlay-out_160ms_ease-in_forwards] data-[state=open]:animate-[overlay-in_200ms_ease-out]" />
      <DialogPrimitive.Content
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "fixed z-50 flex flex-col gap-4 overflow-y-auto border-border bg-card p-6 shadow-lg",
          "data-[state=open]:animate-[sheet-up-in_280ms_cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-[sheet-up-out_200ms_ease-in_forwards]",
          "md:data-[state=open]:animate-[sheet-right-in_280ms_cubic-bezier(0.16,1,0.3,1)] md:data-[state=closed]:animate-[sheet-right-out_200ms_ease-in_forwards]",
          "inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl border-t",
          "md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-full md:max-w-md md:rounded-none md:border-l md:border-t-0",
          className,
        )}
      >
        <div className="flex flex-col gap-1.5 pr-6">
          <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          )}
        </div>
        {children}
        <DialogPrimitive.Close
          aria-label={t("close")}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
