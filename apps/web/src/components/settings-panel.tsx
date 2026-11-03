"use client";

import { useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Download, Upload } from "lucide-react";
import type { ImportResult } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { daysSinceBackup } from "@/lib/backup-reminder";

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
