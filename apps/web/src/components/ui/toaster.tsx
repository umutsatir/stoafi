"use client";

import { useTranslations } from "next-intl";
import { Toaster as Sonner, toast } from "sonner";

/** Mount once in the layout. Colours follow the theme tokens. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "!bg-card !text-card-foreground !border-border !shadow-lg",
          actionButton: "!bg-primary !text-primary-foreground",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}

/** A short confirmation: "Saved". */
export function notify(message: string): void {
  toast.success(message);
}

/** A failure the user should see. */
export function notifyError(message: string): void {
  toast.error(message);
}

/** After a delete or other reversible change: the message plus an Undo for a few seconds. */
export function notifyUndo(message: string, undoLabel: string, onUndo: () => void): void {
  toast(message, { action: { label: undoLabel, onClick: onUndo }, duration: 6000 });
}

/** Hook that supplies the shared "Undo" word so callers do not repeat it. */
export function useUndoLabel(): string {
  return useTranslations("common")("undo");
}
