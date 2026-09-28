"use client";

import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SettingsPanel } from "@/components/settings-panel";
import { db } from "@/storage/instance";
import { exportToJson, importFromJson } from "@/storage/backup";
import { useAppStore } from "@/store";

export default function SettingsPage() {
  const currency = useAppStore((s) => s.currency);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const t = useTranslations("settings");

  return (
    <main>
      <h1>{t("title")}</h1>
      <SettingsPanel
        currency={currency}
        onCurrencyChange={setCurrency}
        onExport={() => exportToJson(db, new Date().toISOString())}
        onImport={(json) => importFromJson(db, json)}
      />
      <LocaleSwitcher />
    </main>
  );
}
