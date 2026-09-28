import { useTranslations } from "next-intl";
import { savingsSummary, type Decision } from "@stoafi/core";
import { useMoney } from "@/lib/use-money";

export function DecisionLog({ decisions }: { decisions: Decision[] }) {
  const summary = savingsSummary(decisions);
  const t = useTranslations("decisions");
  const money = useMoney();

  return (
    <div>
      <p data-testid="total-saved">{t("totalSaved", { amount: money(summary.totalSaved) })}</p>
      <ul>
        {decisions.map((d) => (
          <li key={d.id} data-testid={`decision-${d.id}`}>
            <span>{d.queueItemRef}</span>
            <span data-testid={`outcome-${d.id}`}>{t(`outcome.${d.outcome}`)}</span>
            <span>{money(d.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
