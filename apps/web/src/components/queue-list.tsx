"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import {
  cooldownPhase,
  costInWorkHours,
  priceAgeDays,
  priceIsStale,
  eisenhowerQuadrant,
  scheduleQueue,
  type Commitment,
  type Month,
  type PlanStateInput,
  type Profile,
  type QueueItem,
} from "@stoafi/core";
import { LessonLink } from "@/components/lesson-link";
import { useMoney } from "@/lib/use-money";
import { Button } from "@/components/ui/button";
import { StatusChip, type ChipTone } from "@/components/ui/status-chip";
import { formatDay, formatMonth } from "@/lib/format-month";
import { cn, stagger } from "@/lib/utils";

const NO_COMMITMENTS: Commitment[] = [];

export interface QueueListProps {
  /** Controlled: the parent owns the items and persists changes. */
  items: QueueItem[];
  onItemsChange: (items: QueueItem[]) => void;
  onSelect?: (item: QueueItem) => void;
  onEdit?: (item: QueueItem) => void;
  onDelete?: (item: QueueItem) => void;
  profile: Profile;
  planState: PlanStateInput;
  today: string;
  startMonth: Month;
  /** Existing commitments (e.g. installments already taken); they use up bucket room. */
  commitments?: Commitment[];
  hourlyNetIncome: number;
  /** False hides the drag handle and arrows (e.g. while a filter hides some items). */
  reorderable?: boolean;
  selectedId?: string | null;
}

/** Renumbers `order` to match array position. */
function renumber(items: QueueItem[]): QueueItem[] {
  return items.map((item, i) => ({ ...item, order: i }));
}

/** Moves the item at `index` one slot earlier/later and renumbers `order`. */
function reorder(items: QueueItem[], index: number, direction: -1 | 1): QueueItem[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;

  const next = [...items];
  const [moved] = next.splice(index, 1);
  if (!moved) return items;
  next.splice(target, 0, moved);

  return renumber(next);
}

/** One chip for the Eisenhower position: both, only one, or neither. */
function priorityOf(q: { urgent: boolean; important: boolean }): {
  key: "urgentImportant" | "urgentOnly" | "importantOnly" | "neither";
  tone: ChipTone;
} {
  if (q.urgent && q.important) return { key: "urgentImportant", tone: "danger" };
  if (q.urgent) return { key: "urgentOnly", tone: "warning" };
  if (q.important) return { key: "importantOnly", tone: "info" };
  return { key: "neither", tone: "neutral" };
}

interface QueueRowProps {
  item: QueueItem;
  index: number;
  total: number;
  month: Month | null | undefined;
  notAffordableLabel: string;
  onMove: (index: number, direction: -1 | 1) => void;
  onSelect?: (item: QueueItem) => void;
  onEdit?: (item: QueueItem) => void;
  onDelete?: (item: QueueItem) => void;
  hourlyNetIncome: number;
  reorderable: boolean;
  selected: boolean;
  today: string;
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  money: (minor: number) => string;
}

function QueueRow({
  item,
  index,
  total,
  month,
  notAffordableLabel,
  onMove,
  onSelect,
  onEdit,
  onDelete,
  hourlyNetIncome,
  reorderable,
  selected,
  today,
  locale,
  t,
  money,
}: QueueRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const quadrant = eisenhowerQuadrant(item);
  const priority = priorityOf(quadrant);
  const cooldown = cooldownPhase(item, today);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...stagger(index),
  };

  const kindColor = item.isNeed ? "bg-c4" : item.installmentPurchase ? "bg-c3" : "bg-c2";
  const SOFT_CHIP =
    "whitespace-nowrap rounded-full bg-muted px-2.5 py-[3px] text-[11.5px] font-bold";
  const ARROW =
    "flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-[11px] disabled:opacity-40 sm:h-[22px] sm:w-7";

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-testid={`queue-item-${item.id}`}
      className={cn(
        "rise-in flex flex-wrap items-center gap-x-3 gap-y-3 rounded-[20px] px-4 py-4 transition-[transform,translate,scale,box-shadow,background-color] duration-[250ms] sm:flex-nowrap sm:gap-4 sm:px-5 sm:hover:translate-x-[5px]",
        selected ? "bg-muted shadow-[inset_0_0_0_2px_var(--primary)]" : "bg-card",
        isDragging && "opacity-60 shadow-lg",
      )}
    >
      {reorderable && (
        <button
          type="button"
          aria-label={t("dragHandle", { name: item.name })}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      <span
        aria-hidden="true"
        className={cn(
          "flex h-11 w-11 flex-none items-center justify-center rounded-[15px] text-[17px] font-extrabold text-on",
          kindColor,
        )}
      >
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        {onSelect ? (
          <button
            type="button"
            className="text-left text-[16.5px] font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onSelect(item)}
          >
            {item.name}
          </button>
        ) : (
          <p className="text-[16.5px] font-extrabold">{item.name}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={SOFT_CHIP}>{item.isNeed ? t("kindNeed") : t("kindWant")}</span>
          <span className={SOFT_CHIP}>{t("cash")}</span>
          <span className={SOFT_CHIP}>
            {t("hoursSuffix", { hours: costInWorkHours(item.price, hourlyNetIncome).toFixed(1) })}
          </span>
          <span className={SOFT_CHIP}>{t(`priority.${priority.key}`)}</span>
          {cooldown.phase === "counting" && (
            <span className="rounded-full bg-c2 px-2.5 py-[3px] text-[11.5px] font-extrabold text-on">
              <span data-testid={`cooldown-${item.id}`}>
                {t("cooldown.days", { count: cooldown.daysLeft })}
              </span>
            </span>
          )}
          {cooldown.phase === "confirmed" && (
            <span className="rounded-full bg-c4 px-2.5 py-[3px] text-[11.5px] font-extrabold text-on">
              <span data-testid={`cooldown-${item.id}`}>
                {t("cooldown.confirmed", { date: formatDay(cooldown.on, locale) })}
              </span>
            </span>
          )}
          {cooldown.phase === "ask" && (
            <span className="rounded-full bg-c3 px-2.5 py-[3px] text-[11.5px] font-extrabold text-on">
              {t("cooldown.askBadge")}
            </span>
          )}
          {priceIsStale(item, today) && (
            <button
              type="button"
              data-testid={`stale-${item.id}`}
              onClick={() => onEdit?.(item)}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <StatusChip tone="warning" className="cursor-pointer hover:bg-warning/25">
                {t("priceStale", { days: priceAgeDays(item, today) })}
              </StatusChip>
            </button>
          )}
        </div>
      </div>

      {/* On a phone the price and the buttons get their own line under the name, so nothing overlaps. */}
      <div className="flex w-full items-center justify-between gap-3 border-t border-border pt-3 sm:contents">
        <div className="sm:text-right">
          <div className="text-[16.5px] font-extrabold">{money(item.price)}</div>
          <div
            className={cn("mt-[3px] text-[12.5px] font-bold", !month && "text-destructive")}
            data-testid={`month-${item.id}`}
          >
            {month ? formatMonth(month, locale) : notAffordableLabel}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {reorderable && (
            <div className="flex gap-1 sm:flex-col">
              <button
                type="button"
                className={ARROW}
                disabled={index === 0}
                aria-label={t("moveUp", { name: item.name })}
                onClick={() => onMove(index, -1)}
              >
                ▲
              </button>
              <button
                type="button"
                className={ARROW}
                disabled={index === total - 1}
                aria-label={t("moveDown", { name: item.name })}
                onClick={() => onMove(index, 1)}
              >
                ▼
              </button>
            </div>
          )}
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("edit", { name: item.name })}
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("delete", { name: item.name })}
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

export function QueueList({
  items,
  onItemsChange,
  onSelect,
  onEdit,
  onDelete,
  profile,
  planState,
  today,
  startMonth,
  commitments = NO_COMMITMENTS,
  hourlyNetIncome,
  reorderable = true,
  selectedId = null,
}: QueueListProps) {
  const locale = useLocale();
  const t = useTranslations("queue");
  const tTimeline = useTranslations("timeline");
  const money = useMoney();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const schedule = useMemo(
    () => scheduleQueue(items, profile, planState, commitments, today, startMonth),
    [items, profile, planState, commitments, today, startMonth],
  );
  const scheduleByItemId = new Map(schedule.map((s) => [s.itemId, s.month]));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onItemsChange(renumber(arrayMove(items, oldIndex, newIndex)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3 text-xs">
        <LessonLink lessonId="cost-in-life-energy" testId="lesson-link-cost-in-life-energy" />
        <LessonLink lessonId="eisenhower-matrix" testId="lesson-link-eisenhower-matrix" />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-3">
            {items.map((item, index) => (
              <QueueRow
                key={item.id}
                item={item}
                index={index}
                total={items.length}
                month={scheduleByItemId.get(item.id)}
                notAffordableLabel={tTimeline("notAffordableYet")}
                onMove={(i, direction) => onItemsChange(reorder(items, i, direction))}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                hourlyNetIncome={hourlyNetIncome}
                reorderable={reorderable}
                selected={item.id === selectedId}
                today={today}
                locale={locale}
                t={t}
                money={money}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
