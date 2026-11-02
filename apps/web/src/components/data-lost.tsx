"use client";

import { DatabaseBackup } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface DataLostProps {
  /** Reads the chosen backup file's text and imports it; resolves to the problems found, if any. */
  onRestore: (json: string) => Promise<string[] | null>;
  /** Carries on with an empty app. */
  onStartFresh: () => void;
}

/** Shown when this browser had data before and now has none: the way back is a backup file. */
export function DataLost({ onRestore, onStartFresh }: DataLostProps) {
  const t = useTranslations("dataLost");
  const input = useRef<HTMLInputElement>(null);
  const [problems, setProblems] = useState<string[] | null>(null);

  async function choose(file: File | undefined) {
    if (!file) return;
    setProblems(await onRestore(await file.text()));
  }

  return (
    <main
      data-testid="data-lost"
      className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center"
    >
      <Card className="pop-in flex flex-col items-center gap-4 px-9 py-10 text-center">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-c2 text-on"
        >
          <DatabaseBackup className="h-7 w-7" />
        </span>
        <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">{t("title")}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("text")}</p>
        {problems && (
          <ul role="alert" className="text-sm font-semibold text-destructive">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label={t("restore")}
          onChange={(event) => void choose(event.target.files?.[0])}
        />
        <div className="flex flex-wrap justify-center gap-2.5">
          <Button type="button" onClick={() => input.current?.click()}>
            {t("restore")}
          </Button>
          <Button type="button" variant="outline" onClick={onStartFresh}>
            {t("startFresh")}
          </Button>
        </div>
      </Card>
    </main>
  );
}
