"use client";

import {
  ArrowLeftRight,
  BookOpen,
  CalendarDays,
  CreditCard,
  Ellipsis,
  HeartPulse,
  LayoutDashboard,
  LayoutList,
  ListChecks,
  PiggyBank,
  Settings as SettingsIcon,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface Route {
  href: string;
  key: string;
  icon: LucideIcon;
}

/** Sidebar order and grouping (desktop). */
const GROUPS: { key: string; routes: Route[] }[] = [
  {
    key: "overview",
    routes: [
      { href: "/", key: "home", icon: LayoutDashboard },
      { href: "/calendar", key: "calendar", icon: CalendarDays },
    ],
  },
  {
    key: "money",
    routes: [
      { href: "/income-expenses", key: "incomeExpenses", icon: ArrowLeftRight },
      { href: "/sinking-funds", key: "sinkingFunds", icon: PiggyBank },
      { href: "/cards", key: "cards", icon: CreditCard },
    ],
  },
  {
    key: "plan",
    routes: [
      { href: "/plan", key: "plan", icon: Wallet },
      { href: "/queue", key: "queue", icon: ListChecks },
      { href: "/decisions", key: "decisions", icon: LayoutList },
    ],
  },
  { key: "status", routes: [{ href: "/health", key: "health", icon: HeartPulse }] },
  { key: "learn", routes: [{ href: "/lessons", key: "lessons", icon: BookOpen }] },
  {
    key: "you",
    routes: [
      { href: "/profile", key: "profile", icon: UserRound },
      { href: "/settings", key: "settings", icon: SettingsIcon },
    ],
  },
];

const ALL_ROUTES = GROUPS.flatMap((g) => g.routes);
const route = (href: string): Route => ALL_ROUTES.find((r) => r.href === href) as Route; // hrefs below are all in GROUPS

/** The four always-visible phone tabs; "More" holds every other page. */
const TAB_ROUTES: { route: Route; labelKey: string }[] = [
  { route: route("/"), labelKey: "home" },
  { route: route("/income-expenses"), labelKey: "money" },
  { route: route("/queue"), labelKey: "queue" },
  { route: route("/plan"), labelKey: "plan" },
];
const MORE_ROUTES = ALL_ROUTES.filter((r) => !TAB_ROUTES.some((tab) => tab.route.href === r.href));

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_ROUTES.some((r) => isActive(pathname, r.href));

  return (
    <>
      <nav
        aria-label={t("ariaLabel")}
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card px-3 py-5 md:flex"
      >
        <div className="px-3 text-lg font-semibold tracking-tight">{tApp("name")}</div>
        {GROUPS.map((group) => (
          <div key={group.key} className="flex flex-col gap-1">
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t(`groups.${group.key}`)}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.routes.map((r) => {
                const Icon = r.icon;
                const active = isActive(pathname, r.href);
                return (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "bg-primary text-primary-foreground dark:bg-primary/15 dark:text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {t(r.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <nav
        aria-label={t("mobileAriaLabel")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-5">
          {TAB_ROUTES.map(({ route: r, labelKey }) => {
            const Icon = r.icon;
            const active = isActive(pathname, r.href);
            return (
              <li key={r.href}>
                <Link
                  href={r.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {t(labelKey)}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium",
                moreActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Ellipsis className="h-5 w-5" aria-hidden="true" />
              {t("more")}
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent title={t("moreTitle")}>
          <ul className="grid grid-cols-2 gap-2">
            {MORE_ROUTES.map((r) => {
              const Icon = r.icon;
              return (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={isActive(pathname, r.href) ? "page" : undefined}
                    className="flex min-h-12 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-secondary"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {t(r.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
