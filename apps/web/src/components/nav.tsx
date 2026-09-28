"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

const ROUTES = [
  { href: "/profile", key: "profile" },
  { href: "/plan", key: "plan" },
  { href: "/queue", key: "queue" },
  { href: "/cards", key: "cards" },
  { href: "/health", key: "health" },
  { href: "/decisions", key: "decisions" },
  { href: "/settings", key: "settings" },
] as const;

export function Nav() {
  const t = useTranslations("nav");

  return (
    <nav aria-label={t("ariaLabel")}>
      <ul>
        {ROUTES.map((route) => (
          <li key={route.href}>
            <Link href={route.href}>{t(route.key)}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
