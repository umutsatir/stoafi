"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DatabaseBackup, FileUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notifyError } from "@/components/ui/toaster";
import { importWithSafetyCopy } from "@/storage/backup";
import { db } from "@/storage/instance";
import { listCopies, readCopy, type CopyInfo } from "@/storage/internal-backup";

export interface DataLostScreenProps {
  /** Called after data was restored, so the app can load it. */
  onRestored: () => void;
  /** The user chose to start again with nothing. */
  onStartFresh: () => void;
}

/**
 * Shown when this device used to hold the user's data and the database is now empty: the browser may have
 * cleared it. Offers the ways back: a backup file, or a copy kept inside the browser if one survived.
 */
export function DataLostScreen({ onRestored, onStartFresh }: DataLostScreenProps) {
  const t = useTranslations("dataLost");
  const fileInput = useRef<HTMLInputElement>(null);
  const [copies, setCopies] = useState<CopyInfo[]>([]);

  useEffect(() => {
    let cancelled = false;
    void listCopies(db).then((found) => {
      if (!cancelled) setCopies(found);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function restore(json: string | null) {
    if (!json) return notifyError(t("failed"));
    try {
      const result = await importWithSafetyCopy(db, json, new Date().toISOString());
      if ("errors" in result) return notifyError(t("failed"));
      onRestored();
    } catch {
      notifyError(t("failed"));
    }
  }

  return (
    <main
      role="alert"
      data-testid="data-lost"
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-auto bg-background p-[30px] animate-[fade_.3s_both]"
    >
      <div className="w-[560px] max-w-full rounded-card bg-card px-6 py-9 shadow-[0_30px_80px_rgba(0,0,0,.15)] animate-[pop_.5s_backwards] sm:px-[50px] sm:py-[44px]">
        <DatabaseBackup className="h-8 w-8 text-c2" aria-hidden="true" />
        <h1 className="mt-3.5 text-[30px] font-extrabold tracking-[-0.04em]">{t("title")}</h1>
        <p className="mt-2.5 text-sm leading-[1.65] text-muted-foreground">{t("text")}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" onClick={() => fileInput.current?.click()}>
            <FileUp className="h-4 w-4" aria-hidden="true" />
            {t("fromFile")}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label={t("fileInput")}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) await restore(await file.text());
            }}
          />
          <Button type="button" variant="outline" onClick={onStartFresh}>
            {t("startFresh")}
          </Button>
        </div>
        {copies.length > 0 && (
          <div className="mt-5 flex flex-col gap-2" data-testid="internal-copies">
            <p className="text-[13px] font-bold">{t("copiesTitle")}</p>
            <ul className="flex flex-wrap gap-2">
              {copies.map((copy) => (
                <li key={copy.id}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => restore(await readCopy(db, copy.id))}
                  >
                    <History className="h-4 w-4" aria-hidden="true" />
                    {copy.beforeImport ? t("beforeImport") : t("copyOf", { date: copy.id })}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
