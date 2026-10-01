"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Page } from "@/components/ui/page";
import type { Locale } from "@/i18n/messages";
import { listLessonCards } from "@/lessons";

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <p className="text-sm">{text}</p>
    </div>
  );
}

export default function LessonsPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations("lessons");
  const cards = listLessonCards(locale);

  // The page appears after saved data loads, so the browser cannot scroll to the
  // hash by itself; do it here for links like /lessons#baby-steps.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [locale]);

  return (
    <Page title={t("title")}>
      <p className="max-w-prose text-sm text-muted-foreground">{t("intro")}</p>
      {cards.map((card) => (
        <article
          key={card.id}
          id={card.id}
          className="scroll-mt-6 rounded-lg target:ring-2 target:ring-primary"
        >
          <Card>
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <p className="text-sm italic text-muted-foreground">
                {card.source.author}, {card.source.work}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm">{card.principle}</p>
              {card.formula && <Section label={t("formula")} text={card.formula} />}
              <Section label={t("fitsWhen")} text={card.fitsWhen} />
              <Section label={t("critique")} text={card.critique} />
            </CardContent>
          </Card>
        </article>
      ))}
    </Page>
  );
}
