"use client";

import {
  ArrowLeftRight,
  BookOpen,
  CalendarDays,
  CreditCard,
  Ellipsis,
  Eye,
  EyeOff,
  HeartPulse,
  LayoutDashboard,
  LayoutList,
  ListChecks,
  Moon,
  PiggyBank,
  Plus,
  Search,
  Settings as SettingsIcon,
  Sun,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/command-palette";
import { useAppStore } from "@/store";
import { Sheet, SheetContent } from "@/components/ui/sheet";

/** The key combination that opens the palette, shown as a hint; Ctrl works too. */
const SHORTCUT_HINT = "⌘K";

interface Route {
  href: string;
  key: string;
  icon: LucideIcon;
  /** A thin divider is drawn before this item in the dock. */
  divider?: boolean;
}

/** Dock order (desktop): the order and grouping of the design. */
const ROUTES: Route[] = [
  { href: "/", key: "home", icon: LayoutDashboard },
  { href: "/calendar", key: "calendar", icon: CalendarDays },
  { href: "/income-expenses", key: "incomeExpenses", icon: ArrowLeftRight, divider: true },
  { href: "/sinking-funds", key: "sinkingFunds", icon: PiggyBank },
  { href: "/cards", key: "cards", icon: CreditCard },
  { href: "/plan", key: "plan", icon: Wallet, divider: true },
  { href: "/queue", key: "queue", icon: ListChecks },
  { href: "/decisions", key: "decisions", icon: LayoutList },
  { href: "/health", key: "health", icon: HeartPulse, divider: true },
  { href: "/lessons", key: "lessons", icon: BookOpen, divider: true },
  { href: "/profile", key: "profile", icon: UserRound, divider: true },
  { href: "/settings", key: "settings", icon: SettingsIcon },
];

const route = (href: string): Route => ROUTES.find((r) => r.href === href) as Route; // hrefs below are all in ROUTES

/** The four always-visible phone tabs; "More" holds every other page. */
const TAB_ROUTES: { route: Route; labelKey: string }[] = [
  { route: route("/"), labelKey: "home" },
  { route: route("/income-expenses"), labelKey: "money" },
  { route: route("/queue"), labelKey: "queue" },
  { route: route("/plan"), labelKey: "plan" },
];
const MORE_ROUTES = ROUTES.filter((r) => !TAB_ROUTES.some((tab) => tab.route.href === r.href));

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

const ROUND_BUTTON =
  "press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Nav() {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const tPalette = useTranslations("palette");
  const tPrivacy = useTranslations("privacy");
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const hideAmounts = useAppStore((s) => s.hideAmounts);
  const setHideAmounts = useAppStore((s) => s.setHideAmounts);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const setQuickAction = useAppStore((s) => s.setQuickAction);
  const moreActive = MORE_ROUTES.some((r) => isActive(pathname, r.href));

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, [theme]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function addToQueue() {
    setQuickAction("addQueueItem");
    router.push("/queue");
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/90 px-4 py-3 backdrop-blur md:px-8 md:py-4">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="press flex flex-none items-center gap-2.5"
            aria-label={tApp("name")}
          >
            <span
              aria-hidden="true"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-foreground text-[17px] font-extrabold text-background"
            >
              {tApp("name").charAt(0).toUpperCase()}
            </span>
            <span className="text-xl font-extrabold tracking-[-0.03em]">{tApp("name")}</span>
          </Link>

          <nav
            aria-label={t("ariaLabel")}
            className="order-last hidden w-full min-w-0 flex-1 justify-center md:order-none md:flex md:w-auto"
          >
            <ul className="flex items-center gap-0.5 rounded-full bg-card p-1.5">
              {ROUTES.map((r) => {
                const Icon = r.icon;
                const active = isActive(pathname, r.href);
                return (
                  <li key={r.href} className="flex items-center">
                    {r.divider && <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />}
                    <Link
                      href={r.href}
                      title={t(r.key)}
                      aria-label={t(r.key)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "press flex items-center gap-2 rounded-full p-2.5 text-[13px] font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "bg-primary px-4 text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      {active && <span>{t(r.key)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex flex-none items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label={tPalette("open")}
              className="press flex h-10 items-center gap-2 rounded-full bg-card px-3.5 text-[13px] font-bold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t("search")}</span>
              <kbd className="hidden rounded-full bg-muted px-2 py-0.5 text-xs lg:inline">
                {SHORTCUT_HINT}
              </kbd>
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={hideAmounts}
              aria-label={tPrivacy("hideToggle")}
              onClick={() => setHideAmounts(!hideAmounts)}
              className={ROUND_BUTTON}
            >
              {hideAmounts ? (
                <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              aria-label={t("toggleTheme")}
              onClick={() => setTheme(dark ? "light" : "dark")}
              className={ROUND_BUTTON}
            >
              {dark ? (
                <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={addToQueue}
              className="press flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-extrabold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t("add")}</span>
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label={t("mobileAriaLabel")}
        className="fixed inset-x-3 bottom-3 z-40 rounded-full bg-card px-1 pb-[env(safe-area-inset-bottom)] shadow-lg md:hidden"
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
                    "m-1 flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-extrabold",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
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
                "m-1 flex min-h-12 w-[calc(100%-0.5rem)] flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-extrabold",
                moreActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <Ellipsis className="h-5 w-5" aria-hidden="true" />
              {t("more")}
            </button>
          </li>
        </ul>
      </nav>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

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
                    className="press flex min-h-12 items-center gap-2 rounded-2xl bg-muted px-3 text-sm font-bold"
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
