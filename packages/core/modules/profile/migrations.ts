/**
 * v1 -> v2: incomes lose the `variable` flag and `avgVariableExpenses` is
 * folded into the single `livingExpenses` line (SPEC: only salaries and
 * recurring obligations are modeled). Takes and returns `unknown` because it
 * runs on stored rows before schema validation; already-migrated or
 * non-object input passes through unchanged.
 */
export function migrateProfileV1ToV2(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const row = raw as Record<string, unknown>;
  if ("livingExpenses" in row) return raw;

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
