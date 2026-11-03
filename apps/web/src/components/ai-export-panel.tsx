"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessageSquare, ShieldAlert, Sparkles } from "lucide-react";
import {
  buildAiExport,
  type AiExportData,
  type AiPrivacyLevel,
  type AiQuestion,
} from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { notify, notifyError } from "@/components/ui/toaster";
import type { Locale } from "@/i18n/messages";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  "assessBudget",
  "whatToCut",
  "canIBuy",
  "installmentOrCash",
  "emergencyFaster",
  "free",
] as const;
type QuestionId = (typeof QUESTIONS)[number];

/** Where each assistant's new-chat page is. Nothing about the user's data is put in the address. */
export const ASSISTANTS = {
  claude: "https://claude.ai/new",
  chatgpt: "https://chatgpt.com/",
} as const;

export interface AiExportPanelProps {
  data: AiExportData;
  currency: string;
  /** Names of things in the queue, to pick from for the "should I buy" question. */
  itemNames: string[];
  /** Injected for tests; default to the browser. */
  copyText?: (text: string) => Promise<void>;
  openUrl?: (url: string) => void;
  downloadText?: (text: string, filename: string) => void;
}

function defaultDownload(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Make a prompt with your own figures, check exactly what is in it, and take it to an AI chat yourself. */
export function AiExportPanel({
  data,
  currency,
  itemNames,
  copyText = (text) => navigator.clipboard.writeText(text),
  openUrl = (url) => void window.open(url, "_blank", "noopener,noreferrer"),
  downloadText = defaultDownload,
}: AiExportPanelProps) {
  const t = useTranslations("settings.ai");
  const locale = useLocale() as Locale;
  // The safest level is the starting point; the user opens up more only on purpose.
  const [level, setLevel] = useState<AiPrivacyLevel>("ratios");
  const [questionId, setQuestionId] = useState<QuestionId>("assessBudget");
  const [item, setItem] = useState(itemNames[0] ?? "");
  const [freeText, setFreeText] = useState("");
  const [edited, setEdited] = useState<string | null>(null);

  const generated = useMemo(() => {
    const question: AiQuestion =
      questionId === "canIBuy"
        ? { id: "canIBuy", item: item || "?" }
        : questionId === "free"
          ? { id: "free", text: freeText || "?" }
          : { id: questionId };
    return buildAiExport({ language: locale, currency, level, question, data });
  }, [locale, currency, level, questionId, item, freeText, data]);
  const text = edited ?? generated;

  async function copy(): Promise<boolean> {
    try {
      await copyText(text);
      return true;
    } catch {
      notifyError(t("copyFailed"));
      return false;
    }
  }

  async function ask(assistant: keyof typeof ASSISTANTS) {
    if (!(await copy())) return;
    notify(t("copiedPaste"));
    openUrl(ASSISTANTS[assistant]);
  }

  const GROUP = "mt-4 text-[13px] font-bold";
  return (
    <div className="flex flex-col" data-testid="ai-export">
      <p className="mt-[3px] text-[13px] leading-normal text-muted-foreground">{t("intro")}</p>

      <p id="ai-level-label" className={GROUP}>
        {t("levelTitle")}
      </p>
      <SegmentedControl
        tone="chips"
        className="mt-2"
        label={t("levelTitle")}
        value={level}
        onChange={(next) => {
          setLevel(next);
          setEdited(null);
        }}
        options={[
          { value: "ratios", label: t("level.ratios") },
          { value: "rounded", label: t("level.rounded") },
          { value: "full", label: t("level.full") },
        ]}
      />
      <p className="mt-2 text-xs text-muted-foreground" data-testid="level-hint">
        {t(`levelHint.${level}`)}
      </p>

      <p className={GROUP}>{t("questionTitle")}</p>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t("questionTitle")}>
        {QUESTIONS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={questionId === id}
            onClick={() => {
              setQuestionId(id);
              setEdited(null);
            }}
            className={cn(
              "rounded-full px-4 py-[9px] text-[13px] font-bold transition-all duration-200 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              questionId === id ? "bg-foreground text-background" : "bg-muted",
            )}
          >
            {t(`questions.${id}`)}
          </button>
        ))}
      </div>
      {questionId === "canIBuy" && (
        <div className="mt-3">
          <Field label={t("itemLabel")} htmlFor="ai-item">
            {itemNames.length > 0 ? (
              <NativeSelect
                id="ai-item"
                value={item}
                onChange={(e) => {
                  setItem(e.target.value);
                  setEdited(null);
                }}
              >
                {itemNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            ) : (
              <Input id="ai-item" value={item} onChange={(e) => setItem(e.target.value)} />
            )}
          </Field>
        </div>
      )}
      {questionId === "free" && (
        <div className="mt-3">
          <Field label={t("freeLabel")} htmlFor="ai-free">
            <Input
              id="ai-free"
              value={freeText}
              onChange={(e) => {
                setFreeText(e.target.value);
                setEdited(null);
              }}
            />
          </Field>
        </div>
      )}

      <label htmlFor="ai-preview" className={GROUP}>
        {t("previewLabel")}
      </label>
      <textarea
        id="ai-preview"
        value={text}
        onChange={(e) => setEdited(e.target.value)}
        rows={10}
        className="mt-2 w-full resize-y rounded-[20px] bg-muted px-[18px] py-4 text-[12.5px] font-medium leading-[1.6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <p className="mt-2 text-xs text-muted-foreground">{t("previewHint")}</p>

      <p
        className="mt-3 flex items-start gap-2 rounded-[18px] bg-muted px-4 py-3 text-[12.5px] font-semibold leading-normal"
        role="note"
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
        {t("warning")}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={async () => {
            if (await copy()) notify(t("copied"));
          }}
        >
          {t("copy")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadText(text, "stoafi-prompt.md")}
        >
          {t("download")}
        </Button>
        <Button type="button" variant="outline" onClick={() => void ask("claude")}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {t("askClaude")}
        </Button>
        <Button type="button" variant="outline" onClick={() => void ask("chatgpt")}>
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          {t("askChatGPT")}
        </Button>
      </div>
      <p className="mt-2.5 text-xs leading-normal text-muted-foreground">{t("howItWorks")}</p>
    </div>
  );
}
