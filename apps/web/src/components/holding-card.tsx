"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { History, LineChart, Plus } from "lucide-react";
import {
  averageCost,
  costBasis,
  holdingQuantity,
  marketValue,
  priceStaleDays,
  unrealizedPnL,
  type Holding,
} from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { Money } from "@/components/ui/money";
import { PotVisual } from "@/components/ui/pot-visual";
import { StatusChip } from "@/components/ui/status-chip";
import { useMoney } from "@/lib/use-money";
import { stagger } from "@/lib/utils";
import { picturesFor } from "./investment-icons";

export interface HoldingCardProps {
  holding: Holding;
  index: number;
  today: string;
  /** This holding's share of the whole portfolio, 0 to 1; fills the picture. */
  share: number;
  /** Changes on every purchase; plays the falling animation. */
  dropKey: number;
  /** Shown instead of the type's own name for a custom type. */
  typeName: string;
  onTrade: (holding: Holding) => void;
  onPrice: (holding: Holding) => void;
  onHistory: (holding: Holding) => void;
}

const STALE_AFTER_DAYS = 30;

export function HoldingCard({
  holding,
  index,
  today,
  share,
  dropKey,
  typeName,
  onTrade,
  onPrice,
  onHistory,
}: HoldingCardProps) {
  const t = useTranslations("investments.card");
  const money = useMoney();
  const quantity = holdingQuantity(holding);
  const { value, priceKnown } = marketValue(holding);
  const profit = unrealizedPnL(holding);
  const cost = costBasis(holding);
  const average = averageCost(holding);
  const staleDays = priceStaleDays(holding, today);
  const pictures = picturesFor(holding.typeId);

  // A small celebration the first time a holding becomes worth more than it cost.
  const wasInProfit = useRef(profit > 0);
  const [celebrate, setCelebrate] = useState(0);
  useEffect(() => {
    if (!wasInProfit.current && profit > 0 && dropKey === 0) setCelebrate((n) => n + 1);
    wasInProfit.current = profit > 0;
  }, [profit, dropKey]);

  return (
    <li
      data-testid={`holding-${holding.id}`}
      style={stagger(index)}
      className="rise-in relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      {celebrate > 0 && <Confetti key={celebrate} />}
      <div className="flex gap-4">
        <PotVisual
          fraction={Math.max(share, quantity > 0 ? 0.08 : 0)}
          icon={pictures.pot}
          dropIcon={pictures.drop}
          dropKey={dropKey}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold">{holding.label}</h3>
            <StatusChip>{typeName}</StatusChip>
          </div>
          <p className="mt-1 text-2xl font-semibold" data-testid={`holding-value-${holding.id}`}>
            <Money value={value} animated />
          </p>
          <p
            className="text-sm text-muted-foreground"
            data-testid={`holding-quantity-${holding.id}`}
          >
            {t("quantity", { quantity: String(quantity), unit: holding.unitLabel ?? "" })}
            {average !== null && ` · ${t("average", { price: money(average) })}`}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">{t("cost")}</dt>
          <dd className="font-medium">
            <Money value={cost} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("profit")}</dt>
          <dd
            data-testid={`holding-profit-${holding.id}`}
            className={
              profit > 0
                ? "font-medium text-success"
                : profit < 0
                  ? "font-medium text-destructive"
                  : "font-medium"
            }
          >
            {profit > 0 ? "+" : profit < 0 ? "−" : ""}
            <Money value={Math.abs(profit)} />
            {cost > 0 && priceKnown && (
              <span className="ml-1 text-xs font-normal">
                ({profit >= 0 ? "+" : "−"}
                {Math.abs((profit / cost) * 100).toFixed(1)}%)
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {!priceKnown && quantity > 0 && (
          <StatusChip tone="warning">
            <span data-testid={`holding-noprice-${holding.id}`}>{t("noPrice")}</span>
          </StatusChip>
        )}
        {staleDays !== null && staleDays >= STALE_AFTER_DAYS && (
          <StatusChip tone="warning">
            <span data-testid={`holding-stale-${holding.id}`}>
              {t("stale", { days: staleDays })}
            </span>
          </StatusChip>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => onTrade(holding)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("trade")}
          <span className="sr-only"> {holding.label}</span>
        </Button>
        <Button type="button" variant="outline" onClick={() => onPrice(holding)}>
          <LineChart className="h-4 w-4" aria-hidden="true" />
          {t("updatePrice")}
          <span className="sr-only"> {holding.label}</span>
        </Button>
        <Button type="button" variant="ghost" onClick={() => onHistory(holding)}>
          <History className="h-4 w-4" aria-hidden="true" />
          {t("history")}
          <span className="sr-only"> {holding.label}</span>
        </Button>
      </div>
    </li>
  );
}
