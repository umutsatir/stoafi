import { useTranslations } from "next-intl";
import { savingsSummary, type Decision } from "@stoafi/core";

export function DecisionLog({ decisions }: { decisions: Decision[] }) {
  const summary = savingsSummary(decisions);
  const t = useTranslations("decisions");

  return (
    <div>
      <p data-testid="total-saved">{t("totalSaved", { amount: summary.totalSaved })}</p>
      <ul>
        {decisions.map((d) => (
          <li key={d.id} data-testid={`decision-${d.id}`}>
            <span>{d.queueItemRef}</span>
            <span data-testid={`outcome-${d.id}`}>{d.outcome}</span>
            <span>{d.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
