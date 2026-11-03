"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CircleCheck, FolderSync, History, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { notify, notifyError } from "@/components/ui/toaster";
import { allowAutoBackup, disableAutoBackup, enableAutoBackup } from "@/lib/auto-backup-run";
import { persistState, requestPersistence, type PersistState } from "@/lib/persist-storage";
import { backupToFileNow } from "@/lib/use-data-safety";
import { importWithSafetyCopy } from "@/storage/backup";
import { db } from "@/storage/instance";
import { listCopies, readCopy, type CopyInfo } from "@/storage/internal-backup";
import { useAppStore } from "@/store";

export interface DataSafetySettingsProps {
  /** Called after an internal copy was put back, so the app can load it. */
  onRestored: () => void;
}

/** Three layers against losing data: the browser's promise, a backup file kept in sync, copies inside the browser. */
export function DataSafetySettings({ onRestored }: DataSafetySettingsProps) {
  const t = useTranslations("settings.safety");
  const format = useFormatter();
  const autoBackup = useAppStore((s) => s.autoBackup);
  const setAutoBackup = useAppStore((s) => s.setAutoBackup);
  const [persist, setPersist] = useState<PersistState | null>(null);
  const [copies, setCopies] = useState<CopyInfo[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);

  const refreshCopies = useCallback(() => {
    void listCopies(db).then(setCopies);
  }, []);

  useEffect(() => {
    void persistState().then(setPersist);
    refreshCopies();
  }, [refreshCopies]);

  async function restore(id: string) {
    const json = await readCopy(db, id);
    if (!json) return notifyError(t("copies.failed"));
    const result = await importWithSafetyCopy(db, json, new Date().toISOString());
    if ("errors" in result) return notifyError(t("copies.failed"));
    setConfirming(null);
    refreshCopies();
    onRestored();
    notify(t("copies.restored"));
  }

  const written = autoBackup.lastWritten
    ? format.dateTime(new Date(autoBackup.lastWritten), { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <div className="flex flex-col gap-6" data-testid="data-safety">
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldQuestion className="h-4 w-4 text-primary" aria-hidden="true" />
          {t("persist.title")}
        </h3>
        {persist !== null && (
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <StatusChip tone={persist === "persisted" ? "success" : "warning"}>
              <span data-testid="persist-state">{t(`persist.state.${persist}`)}</span>
            </StatusChip>
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {persist === "persisted" ? t("persist.okText") : t("persist.riskText")}
        </p>
        {persist === "not-persisted" && (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => setPersist(await requestPersistence())}
            >
              {t("persist.ask")}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <FolderSync className="h-4 w-4 text-primary" aria-hidden="true" />
          {t("file.title")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("file.text")}</p>
        {autoBackup.status === "unsupported" && (
          <p className="text-sm" data-testid="file-unsupported">
            {t("file.unsupported")}
          </p>
        )}
        {autoBackup.status === "off" && (
          <div>
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                const status = await enableAutoBackup();
                setAutoBackup({ status });
                if (status === "on") await backupToFileNow();
              }}
            >
              {t("file.choose")}
            </Button>
          </div>
        )}
        {autoBackup.status === "needs-permission" && (
          <div className="flex flex-col gap-2" data-testid="file-needs-permission">
            <p className="text-sm">{t("file.needsPermission")}</p>
            <div>
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  const status = await allowAutoBackup();
                  setAutoBackup({ status });
                  if (status === "on") await backupToFileNow();
                }}
              >
                {t("file.allow")}
              </Button>
            </div>
          </div>
        )}
        {autoBackup.status === "on" && (
          <div className="flex flex-col gap-2" data-testid="file-on">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CircleCheck className="h-4 w-4 text-success" aria-hidden="true" />
              {written ? t("file.onWritten", { time: written }) : t("file.on")}
            </p>
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await disableAutoBackup();
                  setAutoBackup({ status: "off", lastWritten: null });
                }}
              >
                {t("file.stop")}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <History className="h-4 w-4 text-primary" aria-hidden="true" />
          {t("copies.title")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("copies.text")}</p>
        {copies.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("copies.none")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border" data-testid="copies-list">
            {copies.map((copy) => (
              <li
                key={copy.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span>
                  {copy.beforeImport ? t("copies.beforeImport") : t("copies.of", { date: copy.id })}
                </span>
                {confirming === copy.id ? (
                  <span className="flex items-center gap-2">
                    <Button type="button" size="sm" onClick={() => void restore(copy.id)}>
                      {t("copies.confirm")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirming(null)}
                    >
                      {t("copies.cancel")}
                    </Button>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={t("copies.restoreLabel", {
                      name: copy.beforeImport ? t("copies.beforeImport") : copy.id,
                    })}
                    onClick={() => setConfirming(copy.id)}
                  >
                    {t("copies.restore")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
