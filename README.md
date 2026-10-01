# Stoafi

Spend wisely, the stoic way. A local-first personal finance app that turns your salary and regular costs into a monthly plan, lines up what you want to buy, schedules it into the months you can afford, and weighs installments against inflation.

It is an advisor and a teacher, not a bookkeeper: you never have to log every cent, and every recommendation links to the book or investor it comes from.

- **Local-first.** Everything lives on your device in IndexedDB. There is no server, no account, no analytics and no network call. Inflation and card rates are numbers you enter.
- **No AI, no guesswork.** Every figure comes from a pure, tested function in `packages/core`.
- **Turkish and English**, with locale-aware numbers, dates and currency.
- **Installable** as a PWA on phone and desktop.

## What it does

| Screen | What you get |
| --- | --- |
| Home | This month at a glance, your emergency fund, the active plan, what is next in your queue and a 12-month cash-flow chart |
| Income & Expenses | Salaries, recurring expenses (loans, bills, subscriptions, with due days and end months), one living-costs line, and installment purchases |
| Profile | Savings, emergency-fund target (with a suggested completion month), country-based inflation suggestion |
| Plan | Four strategies side by side (50/30/20, Pay Yourself First, Conscious Spending, Baby Steps), what the active one says about your next 12 months, and its lesson |
| Queue | Wishes and needs ranked by drag and drop, Eisenhower quadrant, cost in work hours and per use, a 30-day rule for wants, auto-scheduling, before/after preview, guards, cash or installment purchase (with a card timing tip), skip or postpone |
| Savings goals | Annual or dated expenses spread into a monthly set-aside |
| Cards | Statement and due days, and a minimum-payment trap calculator |
| Health | Savings rate, emergency-fund months, installment ratio, runway |
| Decisions | What you bought, postponed or skipped, and how much skipping saved |
| Lessons | The ideas behind every recommendation, in our own words, with sources |
| Settings | Language, currency, installment cap, JSON backup export and import |

See [`docs/SPEC.md`](docs/SPEC.md) for the product spec and [`TASKS.md`](TASKS.md) for the task list and decisions.

## Development

Requires Node 22.13 or newer and pnpm (the version is pinned in `package.json`).

```
pnpm install
pnpm dev          # web app on http://localhost:3000
pnpm test         # all tests
pnpm typecheck
pnpm lint
pnpm --filter @stoafi/core test:coverage   # fails below 90% lines or branches
pnpm --filter @stoafi/web build            # static export to apps/web/out
```

CI runs formatting, typecheck, lint, tests, core coverage and the web build on every push and pull request.

## Layout

```
apps/web/            Next.js PWA (static export); imports logic only from packages/core
packages/core/       pure TypeScript: kernel (money, months, ledger, projection) and modules
packages/lessons/    lesson cards as JSON, en and tr
docs/SPEC.md         product spec
TASKS.md             task list and progress
CLAUDE.md            working rules for contributors and coding agents
```

The ground rules (money as integer minor units, a deterministic core with no clock or randomness, modules that never import each other, every string through i18n) are in [`CLAUDE.md`](CLAUDE.md).

## Your data

Data is stored only in your browser. Use **Settings → Export backup** to save a JSON file and **Import backup** to restore it. Clearing site data removes everything, so export a backup before you do.

## License

Not decided yet; see the open questions in `TASKS.md`.
