import { useTranslations } from "next-intl";
import { savingsSummary, type Decision } from "@stoafi/core";
import { useMoney } from "@/lib/use-money";
import { Money } from "@/components/ui/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const OUTCOME_VARIANT: Record<Decision["outcome"], "default" | "secondary" | "outline"> = {
  bought: "default",
  postponed: "secondary",
  skipped: "outline",
};

export function DecisionLog({ decisions }: { decisions: Decision[] }) {
  const summary = savingsSummary(decisions);
  const t = useTranslations("decisions");
  const money = useMoney();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="pt-6">
          <p className="text-lg font-semibold tracking-tight" data-testid="total-saved">
            {t("totalSaved", { amount: money(summary.totalSaved) })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableBody>
              {decisions.map((d) => (
                <TableRow key={d.id} data-testid={`decision-${d.id}`}>
                  <TableCell>{d.itemName ?? t("unknownItem")}</TableCell>
                  <TableCell>
                    <Badge variant={OUTCOME_VARIANT[d.outcome]} data-testid={`outcome-${d.id}`}>
                      {t(`outcome.${d.outcome}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Money value={d.amount} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
