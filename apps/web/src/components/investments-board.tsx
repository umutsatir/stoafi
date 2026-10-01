"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, TrendingUp } from "lucide-react";
import {
  addTrade,
  allocationByType,
  holdingQuantity,
  marketValue,
  portfolioTotals,
  removeTrade,
  type BasketEntry,
  type Holding,
  type Trade,
} from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { StatCard } from "@/components/ui/stat-card";
import { useMoney } from "@/lib/use-money";
import { useQuickAction } from "@/lib/use-quick-action";
import { cn, stagger } from "@/lib/utils";
import { BasketPanel } from "./basket-panel";
import { HoldingForm, PriceForm, TradeForm } from "./holding-forms";
import { HoldingCard } from "./holding-card";
import { InvestmentGuide } from "./investment-guide";

const SEGMENTS = [
  "bg-[var(--chart-needs)]",
  "bg-[var(--chart-savings)]",
  "bg-[var(--chart-investing)]",
  "bg-[var(--chart-installments)]",
  "bg-[var(--chart-setaside)]",
  "bg-[var(--chart-left)]",
  "bg-[var(--chart-wants)]",
];

export interface InvestmentsBoardProps {
  holdings: Holding[];
  today: string;
  currency: string;
  createId: () => string;
  /** The user's expected yearly inflation, for the plain-language reminder. */
  annualInflation: number;
  basket: BasketEntry[];
  /** What the plan sets for investing this month; the basket offers it as the amount to split. */
  suggestedMonthly: number;
  onBasketChange: (basket: BasketEntry[]) => void;
  onAssign: (holdingId: string, basketId: string | undefined) => void;
  onSave: (holding: Holding) => void;
  onDelete: (holding: Holding) => void;
  /** Called after a trade was removed, so the page can offer undo. */
  onTradeRemoved: (holding: Holding, trade: Trade) => void;
}

export function InvestmentsBoard(props: InvestmentsBoardProps) {
  const { holdings, today, currency, createId } = props;
  const t = useTranslations("investments");
  const tTypes = useTranslations("investments.types");
  const money = useMoney();
  const [adding, setAdding] = useState(false);
  const [tradeId, setTradeId] = useState<string | null>(null);
  const [priceId, setPriceId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [drops, setDrops] = useState<Record<string, number>>({});
  useQuickAction("addInvestment", () => setAdding(true));

  const totals = portfolioTotals(holdings);
  const split = allocationByType(holdings);
  const tradeHolding = holdings.find((h) => h.id === tradeId);
  const priceHolding = holdings.find((h) => h.id === priceId);
  const historyHolding = holdings.find((h) => h.id === historyId);
  const typeName = (h: Holding) =>
    h.typeId === "custom" ? (h.customType ?? "") : tTypes(`${h.typeId}.name`);
  const keyName = (key: string) =>
    key.startsWith("custom:") ? key.slice("custom:".length) : tTypes(`${key}.name`);
  const profitPct = totals.cost > 0 ? (totals.profit / totals.cost) * 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      {holdings.length > 0 && (
        <section className="flex flex-col gap-4" aria-label={t("summary.title")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              className="rise-in"
              style={stagger(0)}
              label={t("summary.value")}
              value={<Money value={totals.value} animated />}
              testId="portfolio-value"
            />
            <StatCard
              className="rise-in"
              style={stagger(1)}
              label={t("summary.cost")}
              value={<Money value={totals.cost} />}
              testId="portfolio-cost"
            />
            <StatCard
              className="rise-in"
              style={stagger(2)}
              label={t("summary.profit")}
              testId="portfolio-profit"
              value={
                <span className={totals.profit >= 0 ? "text-success" : "text-destructive"}>
                  {totals.profit >= 0 ? "+" : "−"}
                  <Money value={Math.abs(totals.profit)} />
                </span>
              }
              hint={t("summary.profitPct", {
                pct: `${profitPct >= 0 ? "+" : "−"}${Math.abs(profitPct).toFixed(1)}%`,
              })}
            />
          </div>
          <div
            role="img"
            aria-label={t("summary.allocationLabel", {
              parts: split.map((s) => `${keyName(s.key)} ${Math.round(s.share * 100)}%`).join(", "),
            })}
            className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
          >
            {split.map((s, i) => (
              <div
                key={s.key}
                className={cn("transition-[width] duration-700", SEGMENTS[i % SEGMENTS.length])}
                style={{ width: `${s.share * 100}%` }}
              />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {split.map((s, i) => (
              <li key={s.key} className="flex items-center gap-1.5" data-testid={`alloc-${s.key}`}>
                <span
                  className={cn("h-2.5 w-2.5 rounded-full", SEGMENTS[i % SEGMENTS.length])}
                  aria-hidden="true"
                />
                {keyName(s.key)} {Math.round(s.share * 100)}%
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            {t("summary.inflationNote", { rate: `${Math.round(props.annualInflation * 100)}%` })}
          </p>
        </section>
      )}

      <BasketPanel
        basket={props.basket}
        holdings={holdings}
        currency={currency}
        suggestedMonthly={props.suggestedMonthly}
        createId={createId}
        onChange={props.onBasketChange}
        onAssign={props.onAssign}
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("holdingsTitle")}</h2>
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("addInvestment")}
        </Button>
      </div>

      {holdings.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-8 w-8" />}
          title={t("empty.title")}
          description={t("empty.text")}
          action={
            <Button type="button" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("addInvestment")}
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {holdings.map((h, i) => (
            <HoldingCard
              key={h.id}
              holding={h}
              index={i}
              today={today}
              share={totals.value > 0 ? marketValue(h).value / totals.value : 0}
              dropKey={drops[h.id] ?? 0}
              typeName={typeName(h)}
              onTrade={(x) => setTradeId(x.id)}
              onPrice={(x) => setPriceId(x.id)}
              onHistory={(x) => setHistoryId(x.id)}
            />
          ))}
        </ul>
      )}

      <InvestmentGuide />

      <Sheet open={adding} onOpenChange={(open) => !open && setAdding(false)}>
        {adding && (
          <SheetContent title={t("addInvestment")}>
            <HoldingForm
              basket={props.basket}
              today={today}
              currency={currency}
              createId={createId}
              onCancel={() => setAdding(false)}
              onSubmit={(holding) => {
                props.onSave(holding);
                if (holding.trades.length > 0) setDrops((d) => ({ ...d, [holding.id]: 1 }));
                setAdding(false);
              }}
            />
          </SheetContent>
        )}
      </Sheet>

      <Sheet open={tradeHolding !== undefined} onOpenChange={(open) => !open && setTradeId(null)}>
        {tradeHolding && (
          <SheetContent title={t("trade.title", { name: tradeHolding.label })}>
            <TradeForm
              today={today}
              currency={currency}
              createId={createId}
              holdingLabel={tradeHolding.label}
              held={holdingQuantity(tradeHolding)}
              {...(tradeHolding.unitLabel ? { unitLabel: tradeHolding.unitLabel } : {})}
              onCancel={() => setTradeId(null)}
              onSubmit={(trade) => {
                const result = addTrade(tradeHolding, trade);
                if (!result.ok) return;
                props.onSave({
                  ...result.holding,
                  // The latest purchase or sale price is the best guess until the user updates it.
                  currentPrice: trade.unitPrice,
                  priceDate: trade.date,
                });
                if (trade.side === "buy")
                  setDrops((d) => ({ ...d, [tradeHolding.id]: (d[tradeHolding.id] ?? 0) + 1 }));
                setTradeId(null);
              }}
            />
          </SheetContent>
        )}
      </Sheet>

      <Sheet open={priceHolding !== undefined} onOpenChange={(open) => !open && setPriceId(null)}>
        {priceHolding && (
          <SheetContent title={t("price.title", { name: priceHolding.label })}>
            <PriceForm
              today={today}
              currency={currency}
              createId={createId}
              holding={priceHolding}
              onCancel={() => setPriceId(null)}
              onSubmit={(price, date) => {
                props.onSave({ ...priceHolding, currentPrice: price, priceDate: date });
                setPriceId(null);
              }}
            />
          </SheetContent>
        )}
      </Sheet>

      <Sheet
        open={historyHolding !== undefined}
        onOpenChange={(open) => !open && setHistoryId(null)}
      >
        {historyHolding && (
          <SheetContent title={t("history.title", { name: historyHolding.label })}>
            {historyHolding.trades.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border" data-testid="trade-history">
                {[...historyHolding.trades]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((trade) => (
                    <li key={trade.id} className="flex items-center gap-3 py-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {t(trade.side === "buy" ? "history.buy" : "history.sell", {
                            quantity: String(trade.quantity),
                            unit: historyHolding.unitLabel ?? "",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {trade.date} · {t("history.at", { price: money(trade.unitPrice) })}
                          {trade.note ? ` · ${trade.note}` : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={t("history.delete", { date: trade.date })}
                        onClick={() => {
                          const result = removeTrade(historyHolding, trade.id);
                          if (!result.ok) return;
                          props.onSave(result.holding);
                          props.onTradeRemoved(historyHolding, trade);
                        }}
                      >
                        {t("history.deleteShort")}
                      </Button>
                    </li>
                  ))}
              </ul>
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-fit"
              aria-label={t("history.deleteHolding", { name: historyHolding.label })}
              onClick={() => {
                props.onDelete(historyHolding);
                setHistoryId(null);
              }}
            >
              {t("history.deleteHoldingShort")}
            </Button>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
