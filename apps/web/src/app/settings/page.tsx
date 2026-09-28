"use client";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { SettingsPanel } from "@/components/settings-panel";
import { StoafiDb } from "@/storage/db";
import { exportToJson, importFromJson } from "@/storage/backup";
import { useAppStore } from "@/store";

const db = new StoafiDb();

export default function SettingsPage() {
  const currency = useAppStore((s) => s.currency);
  const setCurrency = useAppStore((s) => s.setCurrency);

  return (
    <main>
      <h1>Settings</h1>
      <SettingsPanel
        currency={currency}
        onCurrencyChange={setCurrency}
        onExport={() => exportToJson(db, "2026-01-01T00:00:00.000Z")}
        onImport={(json) => importFromJson(db, json)}
      />
      <LocaleSwitcher />
    </main>
  );
}
