"use client";

import {
  CreditCard,
  HeartPulse,
  LayoutDashboard,
  LayoutList,
  ListChecks,
  Settings as SettingsIcon,
  UserRound,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ROUTES = [
  { href: "/", key: "home", icon: LayoutDashboard },
  { href: "/profile", key: "profile", icon: UserRound },
  { href: "/plan", key: "plan", icon: Wallet },
  { href: "/queue", key: "queue", icon: ListChecks },
  { href: "/cards", key: "cards", icon: CreditCard },
  { href: "/health", key: "health", icon: HeartPulse },
  { href: "/decisions", key: "decisions", icon: LayoutList },
  { href: "/settings", key: "settings", icon: SettingsIcon },
] as const;

export function Nav() {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("ariaLabel")}
      className="shrink-0 border-b border-border bg-card md:w-56 md:border-b-0 md:border-r"
    >
      <div className="p-4 text-lg font-semibold tracking-tight">{tApp("name")}</div>
      <ul className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:px-3">
        {ROUTES.map((route) => {
          const Icon = route.icon;
          const active = pathname === route.href;
          return (
            <li key={route.href}>
              <Link
                href={route.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t(route.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
