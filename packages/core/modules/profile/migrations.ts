/**
 * v1 -> v2: incomes lose the `variable` flag and `avgVariableExpenses` is
 * folded into the single `livingExpenses` line (SPEC: only salaries and
 * recurring obligations are modeled). Takes and returns `unknown` because it
 * runs on stored rows before schema validation; anything that is not a v1
 * profile passes through unchanged.
 */
export function migrateProfileV1ToV2(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const row = raw as Record<string, unknown>;
  // A v1 profile always carries avgVariableExpenses (it was required); anything else is not v1.
  if (!("avgVariableExpenses" in row)) return raw;

  const { avgVariableExpenses, incomes, ...rest } = row;
  const variable = Array.isArray(avgVariableExpenses) ? avgVariableExpenses : [];
  const livingExpenses = variable.reduce<number>((sum, e) => {
    const monthly = (e as { monthly?: unknown } | null)?.monthly;
    return sum + (typeof monthly === "number" ? monthly : 0);
  }, 0);
  const cleanedIncomes = Array.isArray(incomes)
    ? incomes.map((i) => {
        const income = { ...(i as Record<string, unknown>) };
        delete income.variable;
        return income;
      })
    : incomes;
  return { ...rest, incomes: cleanedIncomes, livingExpenses };
}
