"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRightLeft,
  BookOpen,
  Calendar,
  CircleCheckBig,
  CreditCard,
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAppStore, type QuickAction } from "@/store";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  group: "go" | "do";
  href: string;
  action?: QuickAction;
}

const PAGE_ICONS: Record<string, LucideIcon> = {
  home: House,
  calendar: Calendar,
  incomeExpenses: ArrowRightLeft,
  sinkingFunds: Target,
  cards: CreditCard,
  plan: LayoutGrid,
  queue: ListTodo,
  decisions: CircleCheckBig,
  health: HeartPulse,
  lessons: BookOpen,
  profile: UserRound,
  settings: SlidersVertical,
};

const COMMANDS: Command[] = [
  { id: "home", group: "go", href: "/" },
  { id: "calendar", group: "go", href: "/calendar" },
  { id: "incomeExpenses", group: "go", href: "/income-expenses" },
  { id: "sinkingFunds", group: "go", href: "/sinking-funds" },
  { id: "cards", group: "go", href: "/cards" },
  { id: "plan", group: "go", href: "/plan" },
  { id: "queue", group: "go", href: "/queue" },
  { id: "decisions", group: "go", href: "/decisions" },
  { id: "health", group: "go", href: "/health" },
  { id: "lessons", group: "go", href: "/lessons" },
  { id: "profile", group: "go", href: "/profile" },
  { id: "settings", group: "go", href: "/settings" },
  { id: "addQueueItem", group: "do", href: "/queue", action: "addQueueItem" },
  { id: "addCard", group: "do", href: "/cards", action: "addCard" },
  { id: "addPot", group: "do", href: "/sinking-funds", action: "addPot" },
  { id: "addInvestment", group: "do", href: "/sinking-funds", action: "addInvestment" },
  { id: "openOnboarding", group: "do", href: "/", action: "openOnboarding" },
];

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Type to jump to a page or start something: add to the queue, a card, a pot. Opens with Ctrl/Cmd+K. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const t = useTranslations("palette");
  const router = useRouter();
  const setQuickAction = useAppStore((s) => s.setQuickAction);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return COMMANDS.filter(
      (c) => needle === "" || t(`commands.${c.id}`).toLocaleLowerCase().includes(needle),
    );
  }, [query, t]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function run(command: Command) {
    if (command.action) setQuickAction(command.action);
    router.push(command.href);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t("title")} description={t("hint")} className="max-w-[600px]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            autoFocus
            role="combobox"
            aria-expanded={true}
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
            aria-label={t("search")}
            placeholder={t("search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter" && results[active]) {
                e.preventDefault();
                run(results[active]);
              }
            }}
            className="h-12 w-full rounded-2xl border-0 bg-muted pl-10 pr-3 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("none")}</p>
        ) : (
          <ul
            id="palette-list"
            role="listbox"
            ref={listRef}
            className="flex max-h-72 flex-col gap-0.5 overflow-y-auto"
          >
            {results.map((command, index) => (
              <li
                key={command.id}
                id={`palette-${command.id}`}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => run(command)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2 text-sm font-semibold",
                  index === active ? "bg-muted" : "",
                )}
              >
                <span className="w-[34px] flex-none text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
                  {t(`group.${command.group}`)}
                </span>
                {(() => {
                  const Icon = command.group === "do" ? Plus : (PAGE_ICONS[command.id] ?? House);
                  return (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[11px]",
                        command.group === "do" ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                  );
                })()}
                <span>{t(`commands.${command.id}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
