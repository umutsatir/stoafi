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
  className?: string;
}

/** A centred modal for forms and previews that should not take you off the page. */
export function SheetContent({ title, description, children, className }: SheetContentProps) {
  const t = useTranslations("common");
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=closed]:animate-[overlay-out_160ms_ease-in_forwards] data-[state=open]:animate-[overlay-in_200ms_ease-out]" />
      <DialogPrimitive.Content
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 flex-col gap-[18px] overflow-y-auto rounded-card bg-card px-6 py-7 shadow-2xl sm:px-[34px] sm:py-8",
          "data-[state=open]:animate-[dialog-pop_450ms_cubic-bezier(.2,.8,.2,1)] data-[state=closed]:animate-[dialog-out_160ms_ease-in_forwards]",
          className,
        )}
      >
        <div className="flex flex-col gap-1.5 pr-6">
          <DialogPrimitive.Title className="text-2xl font-extrabold tracking-[-0.03em]">
            {title}
          </DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          )}
        </div>
        {children}
        <DialogPrimitive.Close
          aria-label={t("close")}
          className="absolute right-5 top-5 rounded-full bg-muted p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
