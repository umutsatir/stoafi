"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Download, Upload } from "lucide-react";
import type { ImportResult } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/toaster";
import { daysSinceBackup } from "@/lib/backup-reminder";
import { backupFileSupported, chosenBackupFileName, pickBackupFile } from "@/lib/backup-file";
import { listCopies, type BrowserCopy } from "@/lib/browser-copies";
import { isStoragePersisted, requestStoragePersist } from "@/lib/storage-persist";

export interface SettingsPanelProps {
  /** YYYY-MM-DD of the last backup, if any, and today, to say how long ago it was. */
  lastBackup?: string | null;
  today?: string;
  onExport: () => Promise<string>;
  onImport: (json: string) => Promise<ImportResult>;
  /** Injected for testability; defaults to a real file download. */
  downloadJson?: (json: string) => void;
}

function defaultDownload(json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "stoafi-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function SettingsPanel({
  lastBackup = null,
  today,
  onExport,
  onImport,
  downloadJson = defaultDownload,
}: SettingsPanelProps) {
  const [importErrors, setImportErrors] = useState<string[] | null>(null);
  /** A chosen backup file waits here until the user confirms replacing their data. */
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const t = useTranslations("settings");
  const since = today ? daysSinceBackup(lastBackup, today) : null;
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [copies, setCopies] = useState<BrowserCopy[]>([]);
  const fileSupported = backupFileSupported();

  useEffect(() => {
    void isStoragePersisted().then(setPersisted);
    void chosenBackupFileName().then(setFileName);
    void listCopies()
      .then(setCopies)
      .catch(() => setCopies([]));
  }, []);

  async function handleExport() {
    const json = await onExport();
    downloadJson(json);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImport(await file.text());
    e.target.value = "";
  }

  async function confirmImport() {
    if (pendingImport === null) return;
    const result = await onImport(pendingImport);
    setPendingImport(null);
    setImportErrors("errors" in result ? result.errors : null);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <p className="mt-[3px] text-[13px] text-muted-foreground" data-testid="last-backup">
          {since === null
            ? t("lastBackupNever")
            : since === 0
              ? t("lastBackupToday")
              : t("lastBackupDays", { days: since })}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => void handleExport()}>
            <Download className="h-4 w-4" />
            {t("exportBackup")}
          </Button>

          <Label
            htmlFor="import-file"
            className="press flex cursor-pointer items-center gap-2 rounded-full bg-muted px-5 py-[11px] text-[13px] font-extrabold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          >
            <Upload className="h-4 w-4" />
            {t("importBackup")}
            <input
              id="import-file"
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              className="sr-only"
            />
          </Label>
        </div>

        {(persisted !== null || fileSupported || copies.length > 0) && (
          <div className="mt-5 border-t border-border pt-4" data-testid="data-safety">
            <h3 className="text-[15px] font-extrabold">{t("safety.title")}</h3>
            {persisted !== null && (
              <div className="mt-2.5">
                <p className="flex items-center gap-2.5 text-[13.5px] font-semibold">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full ${persisted ? "bg-success" : "bg-c2"}`}
                  />
                  {t("safety.persistLabel")}{" "}
                  <b data-testid="persist-state">
                    {persisted ? t("safety.persistYes") : t("safety.persistNo")}
                  </b>
                </p>
                {!persisted && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2.5"
                    onClick={() =>
                      void requestStoragePersist().then((granted) => {
                        setPersisted(granted);
                        if (!granted) notify(t("safety.persistDenied"));
                      })
                    }
                  >
                    {t("safety.persistAsk")}
                  </Button>
                )}
              </div>
            )}
            {fileSupported && (
              <div className="mt-3">
                <p className="text-[12.5px] leading-normal text-muted-foreground">
                  {t("safety.fileHint")}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void pickBackupFile().then((name) => name && setFileName(name))}
                  >
                    {t("safety.pickFile")}
                  </Button>
                  {fileName && (
                    <span className="text-[12.5px] font-bold" data-testid="backup-file-name">
                      {t("safety.fileChosen", { name: fileName })}
                    </span>
                  )}
                </div>
              </div>
            )}
            {copies.length > 0 && (
              <div className="mt-3.5">
                <p className="text-[12.5px] font-bold text-muted-foreground">
                  {t("safety.copiesTitle")}
                </p>
                <ul>
                  {copies.map((copy) => (
                    <li
                      key={copy.id}
                      className="flex items-center justify-between gap-3 border-b border-border py-[9px] text-[13px] font-semibold last:border-0"
                    >
                      <span>
                        {copy.kind === "beforeImport"
                          ? t("safety.beforeImport")
                          : t("safety.dailyCopy", { date: copy.date })}
                      </span>
                      <button
                        type="button"
                        className="font-extrabold hover:underline"
                        onClick={() => setPendingImport(copy.json)}
                      >
                        {t("safety.restore")}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {importErrors && (
          <ul
            data-testid="import-errors"
            className="mt-4 flex flex-col gap-1 rounded-[20px] bg-destructive/10 px-4 py-3 text-[13px] font-bold text-destructive"
          >
            {importErrors.map((err) => (
              <li key={err} className="flex items-start gap-1.5">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {err}
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={pendingImport !== null}
        onOpenChange={(open) => {
          if (!open) setPendingImport(null);
        }}
        title={t("importConfirmTitle")}
        description={t("importConfirmText")}
        confirmLabel={t("importConfirm")}
        destructive
        onConfirm={() => void confirmImport()}
      />
    </div>
  );
}
