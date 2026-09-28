import { savingsSummary, type Decision } from "@stoafi/core";

export function DecisionLog({ decisions }: { decisions: Decision[] }) {
  const summary = savingsSummary(decisions);

  return (
    <div>
      <p data-testid="total-saved">Total saved by skipped purchases: {summary.totalSaved}</p>
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
