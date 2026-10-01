"use client";

import { useTranslations } from "next-intl";
import { Download, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildErrorReport } from "@/lib/error-report";
import { exportToJson } from "@/storage/backup";
import { db } from "@/storage/instance";

function save(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ErrorScreenProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** What the user sees when a page breaks: what happened, a way to retry, and a way to keep their data. */
export function ErrorScreen({ error, reset }: ErrorScreenProps) {
  const t = useTranslations("errorScreen");
  return (
    <main
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-start gap-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-6"
    >
      <TriangleAlert className="h-8 w-8 text-destructive" aria-hidden="true" />
      <div>
        <h1 className="text-title font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("text")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t("retry")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={async () =>
            save(
              await exportToJson(db, new Date().toISOString()),
              "stoafi-backup.json",
              "application/json",
            )
          }
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {t("saveData")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            save(
              JSON.stringify(
                buildErrorReport(error, {
                  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
                  time: new Date().toISOString(),
                  path: window.location.pathname,
                  userAgent: navigator.userAgent,
                }),
                null,
                2,
              ),
              "stoafi-error-report.json",
              "application/json",
            )
          }
        >
          {t("saveReport")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("reportNote")}</p>
    </main>
  );
}
