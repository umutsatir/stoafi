"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, TrendingUp } from "lucide-react";
import {
  addTrade,
  allocationByType,
  costBasis,
  holdingQuantity,
  marketValue,
  portfolioTotals,
  priceStaleDays,
  removeTrade,
  unrealizedPnL,
  type BasketEntry,
  type BasketLogEntry,
  type Month,
  type Holding,
  type Trade,
} from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMoney } from "@/lib/use-money";
import { useQuickAction } from "@/lib/use-quick-action";
import { cn, stagger } from "@/lib/utils";
import { BasketPanel } from "./basket-panel";
import { HoldingForm, PriceForm, TradeForm } from "./holding-forms";
import { InvestmentGuide } from "./investment-guide";

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
  savedMonthly?: number | null;
  emergencyFirst?: boolean;
  onMonthlyChange?: (amount: number) => void;
  basketLog?: BasketLogEntry[];
  month?: Month;
  onBasketToggle?: (entry: BasketEntry, amount: number, done: boolean) => void;
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
  const [actionId, setActionId] = useState<string | null>(null);
  const [, setDrops] = useState<Record<string, number>>({});
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

  const actionHolding = holdings.find((h) => h.id === actionId);
  const COLORS = ["bg-c2", "bg-c1", "bg-c4", "bg-c3"];
  const abbreviation = (h: Holding) => typeName(h).slice(0, 3).toLocaleUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <BasketPanel
        basket={props.basket}
        holdings={holdings}
        currency={currency}
        suggestedMonthly={props.suggestedMonthly}
        {...(props.savedMonthly !== undefined ? { savedMonthly: props.savedMonthly } : {})}
        {...(props.emergencyFirst ? { emergencyFirst: true } : {})}
        {...(props.onMonthlyChange ? { onMonthlyChange: props.onMonthlyChange } : {})}
        {...(props.basketLog ? { log: props.basketLog } : {})}
        {...(props.month ? { month: props.month } : {})}
        {...(props.onBasketToggle ? { onToggle: props.onBasketToggle } : {})}
        createId={createId}
        onChange={props.onBasketChange}
        onAssign={props.onAssign}
      />

      {holdings.length > 0 && (
        <section
          className="grid items-stretch gap-4 lg:grid-cols-[1.3fr_1fr]"
          aria-label={t("summary.title")}
        >
          <div className="pop-in flex flex-col rounded-card bg-card px-8 py-7">
            <div className="grid grid-cols-3 gap-5">
              <div>
                <p className="text-[13px] font-bold text-muted-foreground">{t("summary.value")}</p>
                <p
                  data-testid="portfolio-value"
                  className="mt-0.5 text-[28px] font-extrabold tracking-[-0.05em]"
                >
                  <Money value={totals.value} animated />
                </p>
              </div>
              <div>
                <p className="text-[13px] font-bold text-muted-foreground">{t("summary.cost")}</p>
                <p
                  data-testid="portfolio-cost"
                  className="mt-0.5 text-[28px] font-extrabold tracking-[-0.05em]"
                >
                  <Money value={totals.cost} />
                </p>
              </div>
              <div>
                <p className="text-[13px] font-bold text-muted-foreground">{t("summary.profit")}</p>
                <p
                  data-testid="portfolio-profit"
                  className={cn(
                    "mt-0.5 text-[28px] font-extrabold tracking-[-0.05em]",
                    totals.profit >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {totals.profit >= 0 ? "+" : "−"}
                  <Money value={Math.abs(totals.profit)} />
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("summary.profitPct", {
                    pct: `${profitPct >= 0 ? "+" : "−"}${Math.abs(profitPct).toFixed(1)}%`,
                  })}
                </p>
              </div>
            </div>
            <div
              role="img"
              aria-label={t("summary.allocationLabel", {
                parts: split
                  .map((x) => `${keyName(x.key)} ${Math.round(x.share * 100)}%`)
                  .join(", "),
              })}
              className="mt-5 flex h-3 gap-1 overflow-hidden"
            >
              {split.map((x, i) => (
                <div
                  key={x.key}
                  className={cn(
                    "rounded-[10px] transition-[width] duration-700",
                    COLORS[i % COLORS.length],
                  )}
                  style={{ width: `${x.share * 100}%` }}
                />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1 text-xs font-bold">
              {split.map((x, i) => (
                <li
                  key={x.key}
                  className="flex items-center gap-1.5"
                  data-testid={`alloc-${x.key}`}
                >
                  <span
                    className={cn("h-2.5 w-2.5 rounded-full", COLORS[i % COLORS.length])}
                    aria-hidden="true"
                  />
                  {keyName(x.key)} {Math.round(x.share * 100)}%
                </li>
              ))}
            </ul>
          </div>
          <div className="pop-in rounded-card bg-c1 px-[26px] py-6 text-on">
            <h3 className="text-[17px] font-extrabold tracking-[-0.02em]">
              {t("summary.inflationTitle")}
            </h3>
            <p className="mt-2.5 text-[13px] font-semibold leading-[1.55]">
              {t("summary.inflationNote", { rate: `${Math.round(props.annualInflation * 100)}%` })}
            </p>
          </div>
        </section>
      )}

      <section className="pop-in rounded-card bg-card px-8 py-7" aria-label={t("holdingsTitle")}>
        <h2 className="text-[19px] font-extrabold tracking-[-0.03em]">{t("holdingsTitle")}</h2>
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
          <ul>
            {holdings.map((h, i) => {
              const { value, priceKnown } = marketValue(h);
              const cost = costBasis(h);
              const profit = unrealizedPnL(h);
              const quantity = holdingQuantity(h);
              const staleDays = priceStaleDays(h, today);
              return (
                <li
                  key={h.id}
                  data-testid={`holding-${h.id}`}
                  style={stagger(i)}
                  className="rise-in border-t border-border first:border-t-0"
                >
                  <button
                    type="button"
                    onClick={() => setActionId(h.id)}
                    aria-label={h.label}
                    className="flex w-full items-center gap-3.5 py-3.5 text-left transition-[transform,translate,scale] duration-200 hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-11 w-11 flex-none items-center justify-center rounded-[15px] text-[11px] font-extrabold text-on",
                        COLORS[i % COLORS.length],
                      )}
                    >
                      {abbreviation(h)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-extrabold">{h.label}</span>
                      <span
                        className="block text-xs text-muted-foreground"
                        data-testid={`holding-quantity-${h.id}`}
                      >
                        {typeName(h)} · {quantity} {h.unitLabel ?? ""} · {t("card.paid")}{" "}
                        {money(cost)}
                      </span>
                      {((!priceKnown && quantity > 0) ||
                        (staleDays !== null && staleDays >= 30)) && (
                        <span className="mt-1 block text-xs font-bold text-warning">
                          {!priceKnown && quantity > 0 ? (
                            <span data-testid={`holding-noprice-${h.id}`}>{t("card.noPrice")}</span>
                          ) : (
                            <span data-testid={`holding-stale-${h.id}`}>
                              {t("card.stale", { days: staleDays ?? 0 })}
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                    <span className="text-right">
                      <span
                        className="block text-base font-extrabold"
                        data-testid={`holding-value-${h.id}`}
                      >
                        {money(value)}
                      </span>
                      <span
                        data-testid={`holding-profit-${h.id}`}
                        className={cn(
                          "block text-xs font-extrabold",
                          profit > 0
                            ? "text-success"
                            : profit < 0
                              ? "text-destructive"
                              : "text-muted-foreground",
                        )}
                      >
                        {profit >= 0 ? "+" : "−"}
                        {cost > 0 && priceKnown
                          ? `${Math.abs((profit / cost) * 100).toFixed(1)}% · `
                          : ""}
                        {profit >= 0 ? "+" : "−"}
                        {money(Math.abs(profit))}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <InvestmentGuide />

      <Sheet open={actionHolding !== undefined} onOpenChange={(open) => !open && setActionId(null)}>
        {actionHolding && (
          <SheetContent title={actionHolding.label}>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => {
                  setTradeId(actionHolding.id);
                  setActionId(null);
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("card.trade")}
                <span className="sr-only"> {actionHolding.label}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPriceId(actionHolding.id);
                  setActionId(null);
                }}
              >
                {t("card.updatePrice")}
                <span className="sr-only"> {actionHolding.label}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setHistoryId(actionHolding.id);
                  setActionId(null);
                }}
              >
                {t("card.history")}
                <span className="sr-only"> {actionHolding.label}</span>
              </Button>
            </div>
          </SheetContent>
        )}
      </Sheet>

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
