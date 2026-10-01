"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import { CalendarView } from "@/components/calendar-view";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Page } from "@/components/ui/page";
import { useAppStore } from "@/store";

export default function CalendarPage() {
  const profile = useAppStore((s) => s.profile);
  const cards = useAppStore((s) => s.cards);
  const today = useAppStore((s) => s.today);
  const t = useTranslations("calendar");

  return (
    <Page title={t("title")}>
      {profile ? (
        <CalendarView profile={profile} cards={cards} today={today} />
      ) : (
        <EmptyState
          icon={<CalendarDays className="h-8 w-8" />}
          title={t("empty.title")}
          description={t("empty.text")}
          action={
            <Button asChild>
              <Link href="/income-expenses">{t("empty.action")}</Link>
            </Button>
          }
        />
      )}
    </Page>
  );
}
