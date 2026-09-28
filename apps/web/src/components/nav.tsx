import Link from "next/link";

const ROUTES = [
  { href: "/profile", label: "Profile" },
  { href: "/plan", label: "Plan" },
  { href: "/queue", label: "Queue" },
  { href: "/cards", label: "Cards" },
  { href: "/health", label: "Health" },
  { href: "/decisions", label: "Decisions" },
  { href: "/settings", label: "Settings" },
] as const;

export function Nav() {
  return (
    <nav aria-label="Main">
      <ul>
        {ROUTES.map((route) => (
          <li key={route.href}>
            <Link href={route.href}>{route.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
