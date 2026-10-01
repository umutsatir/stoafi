import type { Card, DayRule, Profile } from "@stoafi/core";

/** Everything that lands on the same day each month: pay days, bills, card due dates. */
export function dayRulesFor(profile: Profile, cards: Card[]): DayRule[] {
  return [
    ...profile.incomes.map((income, n): DayRule => ({
      id: `income-${n}`,
      label: income.label,
      kind: "income",
      day: income.payDay ?? 1,
      amount: income.monthly,
    })),
    ...profile.fixedExpenses.map((expense, n): DayRule => ({
      id: `expense-${n}`,
      label: expense.label,
      kind: "expense",
      day: expense.dueDay ?? 1,
      amount: expense.monthly,
      ...(expense.endMonth ? { endMonth: expense.endMonth } : {}),
    })),
    ...cards.map((card): DayRule => ({
      id: `card-${card.id}`,
      label: card.label,
      kind: "card",
      day: card.dueDay,
    })),
  ];
}
