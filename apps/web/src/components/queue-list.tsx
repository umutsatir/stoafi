"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
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
  costInWorkHours,
  costPerUse,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
  t,
  money,
}: QueueRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const quadrant = eisenhowerQuadrant(item);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-testid={`queue-item-${item.id}`}
      className={`flex items-center gap-3 rounded-md border border-border bg-card p-3 ${
        isDragging ? "opacity-60 shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        aria-label={t("dragHandle", { name: item.name })}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        {onSelect ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-3 h-auto px-3 py-0.5 text-sm font-medium"
            onClick={() => onSelect(item)}
          >
            {item.name}
          </Button>
        ) : (
          <p className="text-sm font-medium">{item.name}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="secondary" data-testid={`month-${item.id}`}>
            {month ?? notAffordableLabel}
          </Badge>
          <Badge variant={quadrant.urgent ? "default" : "outline"}>
            {quadrant.urgent ? t("urgent") : t("notUrgent")}
          </Badge>
          <Badge variant={quadrant.important ? "default" : "outline"}>
            {quadrant.important ? t("important") : t("notImportant")}
          </Badge>
          <span>
            {t("hoursSuffix", { hours: costInWorkHours(item.price, hourlyNetIncome).toFixed(1) })}
          </span>
          <span>
            {t("perUseSuffix", { amount: money(costPerUse(item.price, item.expectedUses)) })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={index === 0}
            aria-label={t("moveUp", { name: item.name })}
            onClick={() => onMove(index, -1)}
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={index === total - 1}
            aria-label={t("moveDown", { name: item.name })}
            onClick={() => onMove(index, 1)}
          >
            ↓
          </Button>
        </div>
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
}: QueueListProps) {
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
    <Card>
      <CardHeader className="flex flex-row flex-wrap gap-3 border-b border-border pb-4 text-xs">
        <LessonLink lessonId="cost-in-life-energy" testId="lesson-link-cost-in-life-energy" />
        <LessonLink lessonId="eisenhower-matrix" testId="lesson-link-eisenhower-matrix" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-6">
        {items.length === 0 && <p className="text-sm text-muted-foreground">{t("empty")}</p>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
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
                  t={t}
                  money={money}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
