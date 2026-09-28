"use client";

import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SettingsPanel } from "@/components/settings-panel";
import { db } from "@/storage/instance";
import { exportToJson, importFromJson } from "@/storage/backup";
import { localIsoDate } from "@/lib/clock";
import { loadAppState } from "@/storage/bootstrap";
import { useAppStore } from "@/store";
import { Page } from "@/components/ui/page";

export default function SettingsPage() {
  const currency = useAppStore((s) => s.currency);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const hydrate = useAppStore((s) => s.hydrate);
  const t = useTranslations("settings");

  return (
    <Page title={t("title")}>
      <SettingsPanel
        currency={currency}
        onCurrencyChange={setCurrency}
        onExport={() => exportToJson(db, new Date().toISOString())}
        onImport={async (json) => {
          const result = await importFromJson(db, json);
          // The store mirrors Dexie, so an imported backup must be loaded back in.
          if (!("errors" in result)) hydrate(await loadAppState(db), localIsoDate(new Date()));
          return result;
        }}
      />
      <LocaleSwitcher />
    </Page>
  );
}
