"use client";

import { Database, EyeOff, Info, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { GuardThresholdsSchema } from "@stoafi/core";
import { AiExportPanel } from "@/components/ai-export-panel";
import { GuardSettings } from "@/components/guard-settings";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PrivacySettings } from "@/components/privacy-settings";
import { SettingsPanel } from "@/components/settings-panel";
import { SettingsSection } from "@/components/settings-section";
import { Page } from "@/components/ui/page";
import { monthOf, localIsoDate } from "@/lib/clock";
import { buildAiExportData } from "@/lib/ai-export-input";
import { exportToJson, importFromJson } from "@/storage/backup";
import { loadAppState } from "@/storage/bootstrap";
import { db } from "@/storage/instance";
import { putSingleton } from "@/storage/repo";
import { useAppStore, useLedger } from "@/store";
import type { Locale } from "@/i18n/messages";
import { activeQueueItems } from "@stoafi/core";

export default function SettingsPage() {
  const currency = useAppStore((s) => s.currency);
  const hydrate = useAppStore((s) => s.hydrate);
  const guardThresholds = useAppStore((s) => s.guardThresholds);
  const setGuardThresholds = useAppStore((s) => s.setGuardThresholds);
  const profile = useAppStore((s) => s.profile);
  const planState = useAppStore((s) => s.planState);
  const queueItems = useAppStore((s) => s.queueItems);
  const sinkingFunds = useAppStore((s) => s.sinkingFunds);
  const holdings = useAppStore((s) => s.holdings);
  const cards = useAppStore((s) => s.cards);
  const decisions = useAppStore((s) => s.decisions);
  const today = useAppStore((s) => s.today);
  const lastBackup = useAppStore((s) => s.lastBackup);
  const setLastBackup = useAppStore((s) => s.setLastBackup);
  const locale = useAppStore((s) => s.locale) as Locale;
  const ledger = useLedger();
  const t = useTranslations("settings");
  const tTypes = useTranslations("investments.types");

  return (
    <Page title={t("title")}>
      <SettingsSection
        title={t("sections.general")}
        description={t("sections.generalHint")}
        icon={Settings2}
      >
        <LocaleSwitcher />
      </SettingsSection>

      <SettingsSection
        title={t("sections.rules")}
        description={t("sections.rulesHint")}
        icon={ShieldCheck}
        index={1}
      >
        <GuardSettings
          installmentCapPct={guardThresholds.installmentCapPct}
          onChange={(installmentCapPct) => {
            const next = { ...guardThresholds, installmentCapPct };
            setGuardThresholds(next);
            void putSingleton(db, "guards", GuardThresholdsSchema, next).catch((error: unknown) =>
              console.error("Could not save the installment cap", error),
            );
          }}
        />
      </SettingsSection>

      <SettingsSection
        title={t("sections.privacy")}
        description={t("sections.privacyHint")}
        icon={EyeOff}
        index={2}
        testId="privacy-section"
      >
        <PrivacySettings />
      </SettingsSection>

      <SettingsSection
        title={t("sections.data")}
        description={t("sections.dataHint")}
        icon={Database}
        index={2}
      >
        <SettingsPanel
          lastBackup={lastBackup}
          today={today}
          onExport={async () => {
            const json = await exportToJson(db, new Date().toISOString());
            setLastBackup(today);
            return json;
          }}
          onImport={async (json) => {
            const result = await importFromJson(db, json);
            // The store mirrors Dexie, so an imported backup must be loaded back in.
            if (!("errors" in result)) hydrate(await loadAppState(db), localIsoDate(new Date()));
            return result;
          }}
        />
      </SettingsSection>

      {profile && (
        <SettingsSection
          title={t("sections.ai")}
          description={t("sections.aiHint")}
          icon={Sparkles}
          index={3}
          testId="ai-section"
        >
          <AiExportPanel
            currency={currency}
            itemNames={activeQueueItems(queueItems).map((i) => i.name)}
            data={buildAiExportData({
              profile,
              planState,
              queueItems,
              sinkingFunds,
              holdings,
              cards,
              decisions,
              ledger,
              installmentCapPct: guardThresholds.installmentCapPct,
              today,
              month: monthOf(today),
              locale,
              typeName: (h) =>
                h.typeId === "custom" ? (h.customType ?? "") : tTypes(`${h.typeId}.name`),
            })}
          />
        </SettingsSection>
      )}

      <SettingsSection title={t("sections.about")} icon={Info} index={4}>
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <p>{t("about.privacy")}</p>
          <p className="mt-2">{t("about.notAdvice")}</p>
        </div>
      </SettingsSection>
    </Page>
  );
}
