# Personal Finance School — MVP Spec

Sep 28, 2026 · @Umut

## Summary and goals

A local-first personal finance school: it turns income and average expenses into a monthly money plan, prioritizes purchases and schedules them into months, and evaluates installment decisions against inflation.

It is not a budget tracker: logging every cent is never required. The app acts as an advisor and teacher, not a bookkeeper. Every recommendation is shown alongside the book or investor it comes from.

- **Primary user:** the developer himself. Built for real, daily use.
- **Secondary goal:** public, open source, portfolio project.
- **MVP success criterion:** for 3 months, open the plan every month and make purchase decisions through this app.

## Scope

The MVP ships ten modules; investment depth, price tracking, AI and demo mode are deliberately left out.

| Module | What the MVP includes |
| --- | --- |
| Profile | Salaries, recurring obligations (loans, installments, bills, subscriptions), one lump monthly living-costs line, savings, emergency fund target, inflation expectation |
| Plan | 4 strategies, monthly allocation, strategy comparison, lesson cards, rule-based insights |
| Purchase queue | Items, Eisenhower quadrant, cost in work hours, cost per use, 30-day rule, drag-and-drop ordering, auto-scheduling |
| Installment engine | Installment capacity, 12-month load timeline, cash vs. installment NPV comparison |
| Sinking funds | Annual and irregular expenses, dated savings goals |
| Cards | Statement and due dates, purchase timing suggestion, minimum-payment trap calculator |
| Health metrics | Savings rate, emergency fund months, installment-to-income ratio, runway |
| Guards | Warning and explicit confirmation on emergency fund or installment cap breaches |
| Decision log | Bought, postponed and skipped records with a savings summary |
| Backup and settings | JSON export/import, TR/EN, currency |

Decision log and backup are support modules with little UI of their own; they are listed separately because they own their own data.

## Design principles

Six rules every module follows; a change that breaks one needs an explicit decision.

1. **Local-first, no server.** All data lives on the device (IndexedDB). No accounts, no backend, no hosting cost. Cross-device sync comes later through the E2E-encrypted sync engine.
2. **Deterministic calculations.** Every number comes from a pure, tested function. No AI in the MVP; when AI is added later, it only explains results and never produces figures.
3. **Money as integer minor units.** Amounts are stored as integer kuruş/cents. Intermediate math (NPV, rates) may use floats, but results are rounded once, at the end.
4. **Low-friction input.** Averages are enough; the app never demands a full expense log. Every input screen must be completable in under a minute.
5. **Every recommendation cites its source.** Strategies, rules and thresholds link to a lesson card naming the book or investor behind them.
6. **Internationalization from day one.** TR/EN strings, locale-aware number and date formatting, configurable currency. Content is written in our own words, never copied from books.

## Architecture

Modules never import each other. They only read and write one shared structure, the commitment ledger, and every screen derives its numbers from it.

```
 Purchase queue    Installments     Sinking funds      Cards
 (dated buys)      (payment plans)  (set-asides)       (shift due months)
       │                │                │                  │
       └────────────────┴───────┬────────┴──────────────────┘
                                ▼
                    ┌───────────────────────┐
                    │   Commitment ledger   │  single source of planned outflows
                    └───────────┬───────────┘
                                │  preview adds drafts
   Profile ───────────►         ▼          ◄─────────── Plan strategy
 (income, expenses)   ┌───────────────────────┐           (bucket limits)
                      │  Monthly projection   │  derived per month, never stored
                      └───────────┬───────────┘
       ┌────────────────┬─────────┴──────┬──────────────────┐
       ▼                ▼                ▼                  ▼
  Plan screen      Queue screen     Health metrics       Guards
 (bucket usage)  (fits this month?) (ratios, runway)  (warn and confirm)
```

A **commitment** is money that will leave the account in a given month: a one-off purchase, an installment plan or a sinking-fund set-aside. Producers add commitments; the monthly projection is a pure function of profile, plan and ledger, recomputed on every change and never stored.

**Preview mode.** Selecting a queue item adds it as a draft commitment: `project(ledger + [draft])`. Screens show before and after instantly; confirming turns the draft into a real commitment.

**Module contract.**

```ts
interface Module {
  id: string;
  version: number;
  schema: ZodSchema;              // the module's own data
  migrations: Migration[];        // data upgrades between versions
  selectors: Record<string, Fn>;  // pure calculations
  contributes?: {
    itemActions?: ItemAction[];   // buttons added to other modules' cards
    insights?: InsightRule[];     // rule-based feedback
    guards?: GuardRule[];         // checks run on every draft
  };
}
```

Cross-module features go through `contributes`. The installment module adds a "Calculate with installments" action to every queue card without the queue knowing it exists; a future price-tracking module plugs in the same way. Tunable values such as strategy percentages or the installment cap are stored as data, not code.

## Domain model

The kernel owns five types; every module builds on them and adds its own schema.

```ts
type Minor = number;          // integer minor units (kuruş / cents)
type Month = `${number}-${number}`; // 'YYYY-MM'
type Bucket = 'needs' | 'wants' | 'savings' | 'investing';

interface Money { amount: Minor; currency: string; }

interface Profile {
  incomes: { label: string; monthly: Minor }[];            // salaries only; one-off money is not modeled
  fixedExpenses: { label: string; monthly: Minor; bucket: Bucket; isSubscription?: boolean }[]; // recurring obligations
  livingExpenses: Minor;               // lump monthly day-to-day costs (groceries etc.), counted as needs
  savings: Minor;
  emergencyFundTargetMonths: number;   // e.g. 6
  annualInflationExpectation: number;  // e.g. 0.30, user-entered
  hourlyNetIncome?: Minor;             // derived if absent
}

interface Commitment {
  id: string;
  source: { module: string; refId: string }; // which module/item created it
  bucket: Bucket;
  payments: { month: Month; amount: Minor }[]; // 1 entry = one-off, N = installments
  status: 'draft' | 'active' | 'done' | 'cancelled';
  cardId?: string;
}

interface MonthProjection {
  month: Month;
  income: Minor;
  byBucket: Record<Bucket, { limit: Minor; committed: Minor }>;
  installmentLoad: Minor;
  sinkingSetAside: Minor;
  freeCash: Minor;
}
```

Purchase items, sinking funds, cards and decisions are module-owned schemas that reference commitments by id. `MonthProjection` is never persisted.

## Modules

Each module depends only on the kernel; the table lists what it owns, produces and reads.

| Module | Owns | Produces | Reads |
| --- | --- | --- | --- |
| `kernel` | Money, Month, Commitment, module registry, `project()` | Monthly projection | – |
| `profile` | Incomes, expenses, savings, inflation expectation | Hourly net income | – |
| `plan` | Selected strategy and its parameters | Bucket limits, insights | profile, projection |
| `queue` | Purchase items, order, 30-day timers | One-off commitments, schedule | plan, projection |
| `installments` | Installment offers per item | Installment commitments, NPV result | profile |
| `sinking-funds` | Annual expenses, dated goals | Monthly set-aside commitments | profile |
| `cards` | Credit cards, statement and due days | Due-month shifts, timing tips | queue drafts |
| `health` | – | Savings rate, fund months, installment ratio, runway | profile, projection |
| `guards` | Rule thresholds | Warnings on drafts | projection (read-only) |
| `decisions` | Decision log | Savings summary | queue events |
| `backup` | – | JSON export/import | all schemas |

**Queue item fields.** Name, price, optional discounted cash price, installment offers, urgency (1–3), importance (1–3), need or want, expected uses, added date, price updated date.

**Strategies in the MVP.** 50/30/20, Pay Yourself First, Conscious Spending Plan, Baby Steps. Each one implements:

```ts
interface Strategy {
  id: string;
  lesson: LessonCard;
  params: ParamSchema;
  allocate(profile: Profile, params: Params): Record<Bucket, Minor>;
  diagnose(profile: Profile, projection: MonthProjection[]): Insight[];
}
```

**Default guard rules** (editable): the emergency fund may not drop below target by a cash purchase; total installment load may not exceed the cap (default 20% of net income); a want may not push the wants bucket past its limit. Breaking a rule requires an explicit "I know" confirmation, which is written to the decision log.

## User flows

Four flows cover the MVP; all of them end in a commitment or a decision-log entry.

**1. Add a queue item to a month**

1. Select an item in the queue.
2. Preview opens: the item becomes a draft commitment and every affected number shows before → after (wants bucket, installment capacity, emergency fund).
3. Guards run on the draft; breaches are shown in red.
4. Choose one:
   - Cash this month
   - Cash in the first month it fits (suggested automatically)
   - With installments (opens flow 2)
5. Confirm: the draft becomes active and the decision is logged.

**2. Calculate with installments**

1. From a queue card, choose "Calculate with installments".
2. Enter offers (e.g. 3, 6, 9, 12 months; total price for each; optional discounted cash price).
3. See each option side by side: monthly payment, present value, real saving vs. cash, effect on the installment cap across 12 months.
4. Pick an option; it returns to flow 1 as an installment draft.

**3. Auto-schedule the queue**

1. Reorder items by drag and drop.
2. The scheduler walks the queue in order and places each item in the earliest month where its bucket limit and guards allow it.
3. Items that fit nowhere within 12 months are flagged "not affordable yet".
4. Wants that are not needs start a 30-day cooldown before they can be scheduled.

**4. Card timing tip**

1. When a draft is paid by card, the cards module checks today against the statement day.
2. If buying after the statement day moves the payment a full month later, it shows the tip and the extra days of float.
3. The user can accept the new date; the commitment's payment months shift accordingly.

## Calculation reference

Every formula below is a pure function in `packages/core` with unit tests; rates are user-entered, never fetched.

**Monthly discount rate** from the annual inflation expectation i:

```
r = (1 + i)^(1/12) - 1
```

**Present value of an installment plan** with payments P_k, first payment k months out (default 1, configurable):

```
PV = Σ_{k=1..n}  P_k / (1 + r)^k
```

**Real saving of installments vs. cash** (positive = installments are cheaper in real terms):

```
saving = (C_cash - PV) / C_cash
```

**Sinking fund set-aside** for a target T due in m months with balance B saved so far:

```
monthly = max(T - B, 0) / m
```

**Minimum-payment trap.** Simulate month by month until the balance is zero, with card rate c and minimum payment rule p (both user-entered); report months to payoff and total interest:

```
b_{t+1} = b_t * (1 + c) - max(p * b_t, floor)
```

**Simple ratios**

| Metric | Formula |
| --- | --- |
| Cost in work hours | price ÷ hourly net income (net monthly income ÷ 160 by default) |
| Cost per use | price ÷ expected uses |
| Eisenhower quadrant | urgent = urgency ≥ 2; important = importance ≥ 2 |
| Savings rate | (savings + investing buckets) ÷ net income |
| Installment ratio | month's installment load ÷ net income |
| Emergency fund months | savings ÷ monthly needs |
| Runway | savings ÷ (monthly needs + installment load) |

Rounding: all intermediate values stay as floats; the final amount is rounded half-to-even to minor units.

## Lesson cards and sources

Lesson cards are what make the app a school without AI: every strategy, metric and rule opens one.

```ts
interface LessonCard {
  id: string;
  title: string;
  source: { author: string; work: string };
  principle: string;      // one paragraph, our own words
  formula?: string;       // how the app applies it
  fitsWhen: string;       // who it suits
  critique: string;       // limits and counter-arguments
}
```

| Card | Source | Used in |
| --- | --- | --- |
| 50/30/20 | Elizabeth Warren, *All Your Worth* | plan |
| Pay Yourself First | George S. Clason, *The Richest Man in Babylon*; David Bach, *The Automatic Millionaire* | plan |
| Conscious Spending Plan | Ramit Sethi, *I Will Teach You to Be Rich* | plan |
| Baby Steps | Dave Ramsey, *The Total Money Makeover* | plan, guards |
| Cost in life energy | Vicki Robin, *Your Money or Your Life* | queue |
| Room for error, "enough" | Morgan Housel, *The Psychology of Money* | guards, health |
| Index funds and costs | John C. Bogle, *The Little Book of Common Sense Investing*; Warren Buffett's shareholder letters | plan (investing bucket) |
| Eisenhower matrix | Stephen Covey, *The 7 Habits of Highly Effective People* | queue |
| Sinking funds | Common personal-finance practice | sinking-funds |
| Time value of money | Standard finance (present value) | installments |

Rules for content: written in our own words, no quotations beyond a short line, each card reviewed against the original book before release. Cards are data files (`lessons/en/*.json`, `lessons/tr/*.json`), so they can be corrected without a code change.

## Tech stack and repo structure

A TypeScript monorepo: a dependency-free core package for all logic, and a statically exported Next.js PWA on top.

| Layer | Choice | Why |
| --- | --- | --- |
| Monorepo | pnpm workspaces + Turborepo | Core stays portable to Expo, a CLI or the sync engine |
| Core logic | Plain TypeScript, Zod schemas | Pure functions, no UI or storage imports |
| Tests | Vitest (+ property tests with fast-check for money math) | Formulas are the product |
| Web app | Next.js, static export | No server; free hosting on Cloudflare Pages or Vercel |
| Storage | Dexie over IndexedDB, versioned schemas | Local-first; migrations per module |
| State | Zustand + derived selectors from core | Projection recomputed, never stored |
| UI | shadcn/ui, Tailwind, Recharts, dnd-kit | Fast, accessible, drag-and-drop queue |
| PWA | Serwist | Installable on phone and Mac |
| i18n | next-intl | TR/EN from day one |

```
apps/
  web/                 # Next.js PWA
packages/
  core/
    kernel/            # Money, Month, Commitment, registry, project()
    modules/
      profile/  plan/  queue/  installments/
      sinking-funds/  cards/  health/  guards/
      decisions/  backup/
    strategies/        # 50-30-20, pay-yourself-first, ...
  lessons/             # lesson card JSON, en + tr
```

Each module folder holds `schema.ts`, `selectors.ts`, `module.ts` and its tests; the web app only imports from `packages/core`.

## Additions after the first release (Phases 11 to 14)

These extend the modules above; the rules in "Design principles" still hold (integer minor units, pure core, no network, derived projection never stored).

- **Savings pots with deposits.** A pot has an optional icon and colour, and a list of dated deposits and withdrawals (`kernel/deposit.ts`: a balance never goes below zero). The emergency fund is a pot; `Profile.savings` and its pot never diverge. Advice per month: `requiredThisMonth`, `monthlySavingsAdvice`; the savings rate comes from deposits.
- **Investments** (`modules/investments`, table `holdings`). Holdings of a user-editable type (`data/investment-types.json`) with buy and sell trades, a user-entered current price and its date. Cost basis is the weighted average; selling more than held is rejected; quantity may be decimal; rounding happens once, half-to-even. Output: unrealized and realized profit, allocation by type, real return after inflation, price staleness. No prices are fetched. Guidance text is our own words with source labels and a not-advice note.
- **Cards.** Supplementary cards (`kind`, `parentId`), per-card limit and current debt, bank presets for Turkey and the US (`data/banks.json`, colours approximate, no logos), installment purchases remember their card, and a `card-limit` guard rule warns when a purchase would exceed the limit.
- **Calendar** (`kernel/calendar.ts`). Upcoming card payments, installments and pot due dates, derived from the ledger for a window of days.
- **Snapshots** (`modules/snapshots`, table `snapshots`). One saved summary per month for trends; derived figures are recomputed, only the snapshot is stored.
- **Health.** Status per metric and an overall summary, with thresholds in `data/health-thresholds.json`.
- **Queue.** Price-age reminder (`priceStaleDays` in `data/queue-rules.json`), undo for buy, skip, postpone and delete.
- **Decision log.** Decisions keep the item name; filter, group by month, delete; stats (money saved by skipping, work hours).
- **Ask AI export** (`kernel/ai-export.ts`). Builds a prompt in English or Turkish with three privacy levels (ratios, rounded, full) and six question types. The user reads it, edits it, copies it and pastes it into an assistant themselves. The app makes no request and puts no data in any address; the "open Claude / ChatGPT" buttons only open the assistant's new-chat page.
- **Privacy.** Optional PIN lock (PBKDF2 hash, short wait after 5 wrong tries, auto-lock when hidden), a hide-amounts switch, a content security policy (`connect-src 'self'`), a backup reminder after 30 days. A PIN locks the screen; it does not encrypt stored data.
- **Resilience.** Error screen with a local report (nothing sent), module migrations applied on import so old backups upgrade, a fixture per stored version.
- **Recurring line kinds.** A recurring expense may be `regular`, `installment` or `loan` (optional field; missing reads as regular). Installments and loans end after a number of payments (stored as `endMonth`) and count toward the installment load and its cap.
- **Open pots.** A pot may have no due month and no target; it asks nothing each month.
- **Limits advice** (`kernel/limits.ts`). Per bucket: limit, committed, remaining, over by, and a short list of what to do, derived from the month's projection.
- **Investing basket** (`kernel/basket.ts`, `modules/investments/basket-*.ts`). Slices with whole percents; split a monthly amount exactly (largest remainder) by percent or by filling the gaps against what is held (never sells); drift against what is held; example baskets are dated data with named sources and a not-advice note.
- **Category breakdown and installment room.** Committed money is cut by what it is for inside each bucket; installment room is the installment cap (share of income) minus this month's installment and loan payments.
- **Living costs check** (`modules/profile/living-costs.ts`). Share of income against rule-of-thumb bands, a year of expected inflation, and the user's own rise against it when they give last year's figure.
- **Basket log.** A tick per slice and month; may also record one purchase at the holding's current price.
- **Quality budget** in `docs/QUALITY-BUDGET.md`.

## Acceptance criteria

The MVP is done when every box below is ticked.

- [ ] Profile can be filled in under 5 minutes and edited at any time
- [ ] Plan shows the monthly allocation for each of the 4 strategies, side by side, with a lesson card per strategy
- [ ] Selecting a queue item previews its before → after effect on buckets, installment capacity and emergency fund in under 100 ms
- [ ] Reordering the queue re-runs the scheduler and updates the month for every item
- [ ] 30-day cooldown blocks scheduling of wants and prompts again when it ends
- [ ] Installment comparison shows monthly payment, PV and real saving for at least 4 offers
- [ ] 12-month installment timeline reflects drafts and active commitments
- [ ] Sinking funds turn an annual expense or dated goal into a monthly set-aside
- [ ] Card timing tip appears when buying after the statement day delays payment
- [ ] Minimum-payment calculator reports months to payoff and total interest
- [ ] Health metrics show savings rate, emergency fund months, installment ratio and runway
- [ ] Guard breaches require explicit confirmation and are logged
- [ ] Decision log shows total amount saved by skipped purchases
- [ ] JSON export → clear data → import restores everything
- [ ] Full UI in TR and EN; money stored as integer minor units everywhere
- [ ] Core package test coverage ≥ 90%; installable as a PWA on phone and Mac

## Backlog and open questions

Everything below is deliberately out of the MVP and will plug in as new modules.

| Item | Notes |
| --- | --- |
| Investment depth | Portfolio entry, asset allocation, FX / gold / funds / BIST tracking |
| Price tracking | Automatic price updates for queue items; manual "price is 90 days old" reminder as a first step |
| AI explanations | Explains insights and lesson cards; never produces numbers |
| Cross-device sync | Via the E2E-encrypted, server-blind sync engine |
| Demo mode | One-click sample profile for visitors |
| Variable income mode | Plan on guaranteed income; split extra income by preset rules |
| Scenario simulator | Raise, income loss, large purchase what-ifs |
| Subscription audit | Yearly cost view and periodic "still using it?" prompts |
| Privacy | App PIN, hide-amounts mode |
| Quick add | ⌘K palette and one-line mobile entry |
| Native app | Expo, reusing `packages/core` |

**Open questions**

- [ ] Default installment cap: 20% of net income, or lower?
- [ ] Legal installment limits by category: keep as an editable data file, and who updates it?
- [ ] Product name and domain
- [ ] License for the public repo (MIT vs. AGPL)
