"use client";

import {
  ArrowRightLeft,
  BookOpen,
  Calendar,
  CircleCheckBig,
  CreditCard,
  Ellipsis,
  Eye,
  HeartPulse,
  House,
  LayoutGrid,
  ListTodo,
  Plus,
  Search,
  SlidersVertical,
  Target,
  UserRound,
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
  { href: "/", key: "home", icon: House },
  { href: "/calendar", key: "calendar", icon: Calendar },
  { href: "/income-expenses", key: "incomeExpenses", icon: ArrowRightLeft, divider: true },
  { href: "/sinking-funds", key: "sinkingFunds", icon: Target },
  { href: "/cards", key: "cards", icon: CreditCard },
  { href: "/plan", key: "plan", icon: LayoutGrid, divider: true },
  { href: "/queue", key: "queue", icon: ListTodo },
  { href: "/decisions", key: "decisions", icon: CircleCheckBig },
  { href: "/health", key: "health", icon: HeartPulse, divider: true },
  { href: "/lessons", key: "lessons", icon: BookOpen, divider: true },
  { href: "/profile", key: "profile", icon: UserRound, divider: true },
  { href: "/settings", key: "settings", icon: SlidersVertical },
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

/** The four-arc ring mark; arcs use the category colours so it follows the theme. */
function LogoMark() {
  const arcs: { d: string; color: string }[] = [
    { d: "M6.3 11.6 A14 14 0 0 1 17 5", color: "var(--c4)" },
    { d: "M22 5.6 A14 14 0 0 1 32.4 17", color: "var(--c1)" },
    { d: "M30.5 25 A14 14 0 0 1 20 33", color: "var(--c2)" },
    { d: "M14 32.6 A14 14 0 0 1 5.6 23", color: "var(--c3)" },
  ];
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true" className="flex-none">
      {arcs.map((a) => (
        <path key={a.color} d={a.d} stroke={a.color} strokeWidth="4.6" strokeLinecap="round" />
      ))}
    </svg>
  );
}

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
  const setTheme = useAppStore((s) => s.setTheme);
  const setQuickAction = useAppStore((s) => s.setQuickAction);
  const moreActive = MORE_ROUTES.some((r) => isActive(pathname, r.href));

  // Watch the attribute the bootstrap sets, so the switch never lags a click behind the store.
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.dataset.theme === "dark");
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

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
      <header className="sticky top-0 z-30 bg-background px-4 py-3 md:px-[34px] md:py-4">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-3 gap-y-3">
          <Link
            href="/"
            className="press flex flex-none items-center gap-2.5"
            aria-label={tApp("name")}
          >
            <LogoMark />
            <span className="text-xl font-extrabold lowercase tracking-[-0.03em]">
              {tApp("name")}
            </span>
          </Link>

          <div className="flex flex-none items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label={tPalette("open")}
              title={tPalette("open")}
              className="press flex items-center gap-2 rounded-full bg-card px-3.5 py-2.5 text-[13px] font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              <span className="hidden sm:inline">{t("search")}</span>
              <kbd className="hidden rounded-[7px] bg-muted px-[7px] py-0.5 font-sans text-[11px] sm:inline">
                {SHORTCUT_HINT}
              </kbd>
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={hideAmounts}
              aria-label={tPrivacy("hideToggle")}
              title={tPrivacy("hideToggle")}
              onClick={() => setHideAmounts(!hideAmounts)}
              className={cn(
                "press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                hideAmounts ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
              <span
                aria-hidden="true"
                className={cn(
                  "absolute h-[22px] w-0.5 -rotate-45 rounded-full bg-current transition-opacity",
                  hideAmounts ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={dark}
              aria-label={t("toggleTheme")}
              title={t("toggleTheme")}
              onClick={() => setTheme(dark ? "light" : "dark")}
              className="relative h-7 w-[46px] shrink-0 rounded-full bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className="absolute left-[5px] top-[5px] h-[18px] w-[18px] rounded-full bg-foreground transition-transform duration-[350ms] [transition-timing-function:cubic-bezier(.3,1.7,.5,1)]"
                style={{ transform: dark ? "translateX(18px)" : "translateX(0)" }}
              />
            </button>
            <button
              type="button"
              onClick={addToQueue}
              className="press relative flex items-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-primary px-4 py-[11px] text-[13px] font-extrabold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-[15px] w-[15px]" strokeWidth={2.6} aria-hidden="true" />
              <span>{t("add")}</span>
              <span
                aria-hidden="true"
                className="sheen pointer-events-none absolute inset-y-0 left-0 w-[30%] bg-white/45"
              />
            </button>
          </div>

          <nav
            aria-label={t("ariaLabel")}
            className="order-3 hidden min-w-0 max-w-full flex-initial md:flex"
          >
            <ul className="flex min-w-0 items-center gap-0.5 rounded-full bg-card p-1.5 shadow-[0_10px_30px_rgb(20_30_40/0.08)]">
              {ROUTES.map((r) => {
                const Icon = r.icon;
                const active = isActive(pathname, r.href);
                return (
                  <li key={r.href} className="flex items-center gap-0.5">
                    {r.divider && (
                      <span aria-hidden="true" className="mx-[3px] h-[22px] w-px bg-border" />
                    )}
                    <Link
                      href={r.href}
                      title={t(r.key)}
                      aria-label={t(r.key)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 whitespace-nowrap rounded-full text-[13px] font-bold transition-[translate,scale,background-color] duration-300 [transition-timing-function:cubic-bezier(.3,1.7,.5,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "bg-primary px-4 py-2.5 text-primary-foreground"
                          : "p-2.5 text-muted-foreground hover:-translate-y-1 hover:scale-[1.18]",
                      )}
                    >
                      <Icon className="h-[19px] w-[19px] flex-none" aria-hidden="true" />
                      {active && <span>{t(r.key)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
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
