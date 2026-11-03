"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const OVERLAY =
  "fixed inset-0 z-50 bg-black/45 data-[state=closed]:animate-[overlay-out_160ms_ease-in_forwards] data-[state=open]:animate-[overlay-in_200ms_ease-out]";

function CloseButton() {
  const t = useTranslations("common");
  return (
    <DialogPrimitive.Close
      aria-label={t("close")}
      className="absolute right-5 top-5 rounded-full bg-muted p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </DialogPrimitive.Close>
  );
}

export interface DialogContentProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function DialogContent({ title, description, children, className }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={OVERLAY} />
      <DialogPrimitive.Content
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "data-[state=open]:animate-[dialog-pop_450ms_cubic-bezier(.2,.8,.2,1)] data-[state=closed]:animate-[dialog-out_160ms_ease-in_forwards] fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col gap-[18px] overflow-y-auto rounded-card bg-card px-6 py-7 shadow-2xl sm:px-[34px] sm:py-8",
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
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  /** Defaults to "Cancel". */
  cancelLabel?: string;
  /** Style the confirm button as a destructive action. */
  destructive?: boolean;
  onConfirm: () => void;
}

/** Asks before something that cannot be undone. Focus starts on Cancel, the safe choice. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useTranslations("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} {...(description ? { description } : {})}>
        <div className="flex flex-wrap justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" autoFocus>
              {cancelLabel ?? t("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
