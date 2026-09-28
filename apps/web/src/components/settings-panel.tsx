"use client";

import { useState, type ChangeEvent } from "react";
import type { ImportResult } from "@stoafi/core";

const CURRENCIES = ["TRY", "USD", "EUR"] as const;

export interface SettingsPanelProps {
  currency: string;
  onCurrencyChange: (currency: string) => void;
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
  currency,
  onCurrencyChange,
  onExport,
  onImport,
  downloadJson = defaultDownload,
}: SettingsPanelProps) {
  const [importErrors, setImportErrors] = useState<string[] | null>(null);

  async function handleExport() {
    const json = await onExport();
    downloadJson(json);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = await onImport(text);
    setImportErrors("errors" in result ? result.errors : null);
  }

  return (
    <div>
      <label htmlFor="currency">Currency</label>
      <select id="currency" value={currency} onChange={(e) => onCurrencyChange(e.target.value)}>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <button type="button" onClick={() => void handleExport()}>
        Export backup
      </button>

      <label htmlFor="import-file">Import backup</label>
      <input id="import-file" type="file" accept="application/json" onChange={handleFileChange} />

      {importErrors && (
        <ul data-testid="import-errors">
          {importErrors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
