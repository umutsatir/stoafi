"use client";

import { useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Download, Upload } from "lucide-react";
import type { ImportResult } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card>
      <CardContent className="flex flex-col gap-5 pt-6">
        <p className="text-sm text-muted-foreground" data-testid="last-backup">
          {since === null
            ? t("lastBackupNever")
            : since === 0
              ? t("lastBackupToday")
              : t("lastBackupDays", { days: since })}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={() => void handleExport()}>
            <Download className="h-4 w-4" />
            {t("exportBackup")}
          </Button>

          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <Label
              htmlFor="import-file"
              className="flex cursor-pointer items-center gap-2 text-sm font-medium"
            >
              <Upload className="h-4 w-4" />
              {t("importBackup")}
            </Label>
            <input
              id="import-file"
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              className="w-full min-w-0 max-w-full text-sm text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
          </div>
        </div>

        {importErrors && (
          <ul
            data-testid="import-errors"
            className="flex flex-col gap-1 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {importErrors.map((err) => (
              <li key={err} className="flex items-start gap-1.5">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {err}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
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
    </Card>
  );
}
