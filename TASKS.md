# TASKS.md — Stoafi MVP

Source of truth: `docs/SPEC.md`. Work top to bottom, one unchecked task at a time, respecting dependencies. See `CLAUDE.md` for the per-task workflow.

Task id format: `T<phase>.<n>`.

---

## Phase 0 — Repo scaffold

Goal: a working monorepo skeleton with tooling wired up, nothing product-specific yet.

- [x] **T0.1** Init pnpm workspace
  Goal: create `pnpm-workspace.yaml`, root `package.json` (private, `@stoafi` scope), `.gitignore`, `.nvmrc`/engines field.
  Acceptance: `pnpm install` succeeds at root with zero packages; `pnpm -v` and `node -v` match declared engines.
  Depends on: –

- [x] **T0.2** Init Turborepo
  Goal: add `turbo.json` with pipeline tasks `build`, `test`, `lint`, `typecheck`, `dev`; add `turbo` as root devDependency.
  Acceptance: `pnpm turbo run test` exits 0 (no-op, no packages yet).
  Depends on: T0.1

- [x] **T0.3** Scaffold `packages/core` with TS strict config
  Goal: create `packages/core/package.json` (`@stoafi/core`), `tsconfig.json` extending a shared strict base, empty `src/index.ts`.
  Acceptance: `pnpm --filter @stoafi/core typecheck` passes on the empty package.
  Depends on: T0.2

- [x] **T0.4** Shared TS config package
  Goal: create `packages/tsconfig` (or `tooling/tsconfig`) with a `base.json` enabling `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`; `packages/core` extends it.
  Acceptance: root `pnpm typecheck` (turbo) runs the core package's typecheck via the shared config; changing a core file to break strictness fails the command.
  Depends on: T0.3

- [x] **T0.5** Vitest setup in core
  Goal: add `vitest` + `fast-check` as devDependencies to `@stoafi/core`; add a `vitest.config.ts`; add one smoke test.
  Acceptance: `pnpm --filter @stoafi/core test` runs and passes the smoke test.
  Depends on: T0.3

- [x] **T0.6** ESLint + Prettier at root
  Goal: root `eslint.config.js` (flat config) with `@typescript-eslint`, a rule banning `any` and non-null assertions without a comment; root `.prettierrc`; `lint`/`format` scripts.
  Acceptance: `pnpm lint` passes on the current tree; introducing an `any` in a test file fails `pnpm lint`.
  Depends on: T0.3

- [x] **T0.7** Zod dependency + module contract types
  Goal: add `zod` to `@stoafi/core`; create `packages/core/kernel/module.ts` with the `Module` interface from SPEC's Architecture section (id, version, schema, migrations, selectors, contributes).
  Acceptance: `pnpm --filter @stoafi/core typecheck` passes; a unit test imports the type and constructs a minimal conforming object.
  Depends on: T0.4, T0.5
  Note: `Module.selectors` is typed as `Record<string, (...args: never[]) => unknown>` so it accepts any function shape; this erases per-selector call signatures at the `Module` interface level. Concrete modules that need type-safe calls should narrow via their own generic `Selectors` type param rather than calling through `Module['selectors']` directly.

- [x] **T0.8** Scaffold `apps/web` (Next.js static export)
  Goal: create `apps/web` with Next.js, TypeScript, static export config (`output: 'export'`); `package.json` name `@stoafi/web`; empty placeholder page.
  Acceptance: `pnpm --filter @stoafi/web build` produces a static `out/` directory.
  Depends on: T0.2

- [x] **T0.9** Wire `apps/web` to `@stoafi/core`
  Goal: add `@stoafi/core` as a workspace dependency of `@stoafi/web`; import one symbol from core in a placeholder page to prove resolution.
  Acceptance: `pnpm --filter @stoafi/web build` succeeds importing from `@stoafi/core`.
  Depends on: T0.7, T0.8

- [x] **T0.10** Scaffold `packages/lessons`
  Goal: create `packages/lessons` with `en/` and `tr/` subfolders and a placeholder `LessonCard` JSON validated by a Zod schema re-exported from core's lesson type (added later in T3.x — for now define a minimal local schema).
  Acceptance: a test in `packages/lessons` (or core, pointed at the folder) parses every JSON file in `en/` and `tr/` against the schema with zero errors.
  Depends on: T0.7
  Note: kept `en/_placeholder.json` / `tr/_placeholder.json` deliberately fake (not real 50/30/20 content) so T3.7 still owns writing the real, source-reviewed card. Also: `apps/web`'s `test` script was dropped (no tests exist yet, and an unbuilt `vitest run` script broke `turbo run test` for the whole workspace); it comes back in T7.1 once RTL is wired up.

- [x] **T0.11** Root scripts and CI
  Goal: root `package.json` scripts `dev`, `test`, `typecheck`, `lint` delegate to `turbo run ...`; add GitHub Actions workflow `.github/workflows/ci.yml` running install, typecheck, lint, test on push/PR.
  Acceptance: `pnpm test`, `pnpm typecheck`, `pnpm lint` each exit 0 from repo root; CI workflow file validates with `actionlint` or a YAML lint if available, otherwise visual review.
  Depends on: T0.5, T0.6, T0.9, T0.10

- [x] **T0.12** Editor and formatting baseline
  Goal: add `.editorconfig`, root `README.md` stub (name, one-line description, dev commands), `LICENSE` placeholder (decision pending — see Open questions).
  Acceptance: files exist; `pnpm lint`/`pnpm format --check` still pass.
  Depends on: T0.11

---

## Phase 1 — Kernel: Money/Minor, Month, Commitment, registry, project()

Goal: the pure, dependency-free core types and the `project()` function everything else is built on.

- [x] **T1.1** `Minor` money type and rounding helpers
  Goal: `packages/core/kernel/money.ts` — `type Minor = number`, `roundHalfToEven(value: number): Minor`, `addMinor`, `subMinor`, arithmetic guarded against float leakage into stored values.
  Acceptance: unit tests cover zero, one kuruş, very large amounts (> 2^31), and rounding boundaries (e.g. 0.5, 1.5, 2.5 rounding to even); property test (fast-check) asserts `roundHalfToEven` output is always an integer.
  Depends on: T0.7

- [x] **T1.2** `Money` and currency handling
  Goal: `packages/core/kernel/money.ts` — `interface Money { amount: Minor; currency: string }`, Zod schema `MoneySchema`.
  Acceptance: schema rejects non-integer `amount` and unknown currency codes outside a configurable allow-list; unit tests for valid/invalid parse.
  Depends on: T1.1

- [x] **T1.3** `Month` type and helpers
  Goal: `packages/core/kernel/month.ts` — `type Month = \`${number}-${number}\``, `parseMonth`, `addMonths(m: Month, n: number): Month`, `compareMonths`, `monthsBetween`. All functions take `Month` values as arguments; no `Date.now()`.
  Acceptance: unit tests for year rollover (e.g. `2026-11` + 3 = `2027-02`), negative offsets, equal months, ordering.
  Depends on: T0.7

- [x] **T1.4** `Bucket` type and validation
  Goal: `packages/core/kernel/bucket.ts` — `type Bucket = 'needs' | 'wants' | 'savings' | 'investing'`, Zod enum schema.
  Acceptance: unit test rejects an invalid bucket string.
  Depends on: T0.7

- [x] **T1.5** `Commitment` type and schema
  Goal: `packages/core/kernel/commitment.ts` — interface and Zod schema matching SPEC's domain model exactly (id, source, bucket, payments[], status, cardId?).
  Acceptance: unit tests: a one-off commitment (1 payment) and an installment commitment (N payments) both parse; a commitment with zero payments is rejected; `status` only accepts the four listed values.
  Depends on: T1.1, T1.2, T1.3, T1.4
  Note: added `MonthSchema` to `kernel/month.ts` (regex + range refine, cast to `z.ZodType<Month>` since zod infers plain `string` for a refined string schema) so `Commitment.payments[].month` validates real `YYYY-MM` values, not just any string.

- [x] **T1.6** Module registry
  Goal: `packages/core/kernel/registry.ts` — `createRegistry()`, `register(module: Module)`, `getModule(id)`, `listModules()`; enforce unique module ids and that `contributes.guards`/`insights`/`itemActions` from all registered modules can be collected.
  Acceptance: unit tests: registering two modules with the same id throws; `listModules()` returns them in registration order; collecting `contributes.guards` across 2 fake modules returns the union.
  Depends on: T0.7, T1.5

- [x] **T1.7** `MonthProjection` type
  Goal: `packages/core/kernel/projection.ts` — interface matching SPEC exactly (month, income, byBucket, installmentLoad, sinkingSetAside, freeCash).
  Acceptance: unit test constructs a value satisfying the type and a Zod schema (used for debugging/serialization only, never persisted).
  Depends on: T1.1, T1.3, T1.4

- [x] **T1.8** `project()` — single month, no bucket limits yet
  Goal: `packages/core/kernel/project.ts` — `project(profile: Pick<Profile,'incomes'>, commitments: Commitment[], month: Month): MonthProjection` summing income and committed amounts per bucket for one month from a list of commitments (draft or active, per an explicit `includeDrafts` flag), with `byBucket[b].limit` left at 0 (limits are plan's job, wired in T3.x).
  Acceptance: unit tests: empty ledger yields `freeCash === income`; two commitments in the same bucket/month sum correctly; a commitment in a different month is excluded; `includeDrafts: false` excludes draft-status commitments, `true` includes them (this is the "preview" mechanism from SPEC).
  Depends on: T1.5, T1.7
  Note: `project()`'s first argument is `{ income: Minor }`, not `Profile` — `Profile` is a `modules/profile` type and kernel cannot depend on it (modules never import each other, and kernel sits below all modules). Plan/profile wiring narrows a real `Profile` down to `{ income }` at the call site in later phases. `bucketLimits` defaults to zero for every bucket until T3.15 wires plan's allocation in. `installmentLoad`/`sinkingSetAside` are derived by convention from `commitment.source.module` (`'installments'` / `'sinking-funds'`), since kernel can't import those modules to check some shared type.

- [x] **T1.9** `project()` — multi-month series
  Goal: extend `project.ts` with `projectSeries(profile, commitments, months: Month[]): MonthProjection[]`, deriving `installmentLoad` and `sinkingSetAside` per month by summing payments whose `source.module` is `'installments'` / `'sinking-funds'` respectively (by convention, since kernel cannot import those modules).
  Acceptance: unit test: a 3-month installment plan produces nonzero `installmentLoad` in exactly those 3 months and zero elsewhere; a 12-month call with no commitments returns 12 projections with `freeCash === income` each.
  Depends on: T1.8

- [x] **T1.10** Determinism and purity guard test
  Goal: a test (and, if feasible, an ESLint rule) asserting `packages/core` has zero imports of `react`, `next`, `dexie`, and no calls to `Date.now()`/`Math.random()` anywhere under `packages/core/**`.
  Acceptance: a grep-based or AST-based test fails if any forbidden import/call is introduced; passes on current tree.
  Depends on: T1.9

**Stop and report after Phase 1.**

---

## Phase 2 — Installments and sinking funds

Goal: installment math (PV, real saving, capacity) and sinking-fund set-asides, as standalone modules depending only on kernel.

- [x] **T2.1** Monthly discount rate from annual inflation
  Goal: `packages/core/modules/installments/selectors.ts` — `monthlyRate(annualInflation: number): number` implementing `r = (1+i)^(1/12) - 1`.
  Acceptance: unit tests: `i = 0` → `r = 0`; `i = 0.30` → matches hand-computed value to 6 decimal places; negative `i` (deflation) does not throw.
  Depends on: T1.1

- [x] **T2.2** Present value of an installment plan
  Goal: `pvOfPlan(payments: { amount: Minor }[], r: number, firstPaymentOffset?: number): number` implementing `PV = Σ P_k / (1+r)^k`, `k` starting at `firstPaymentOffset` (default 1).
  Acceptance: unit tests: single payment at k=1 matches `P/(1+r)`; `r = 0` → PV equals sum of payments; 12 equal payments against a known r matches a hand/spreadsheet-computed PV within float tolerance; zero-length payments → PV 0.
  Depends on: T2.1

- [x] **T2.3** Real saving vs. cash
  Goal: `realSaving(cashPrice: Minor, pv: number): number` implementing `saving = (C_cash - PV) / C_cash`; guard divide-by-zero when `cashPrice === 0`.
  Acceptance: unit tests: PV < cash → positive saving; PV > cash → negative saving; PV === cash → 0; `cashPrice === 0` returns a defined result (e.g. 0) without throwing, with a comment explaining the choice.
  Depends on: T2.2

- [x] **T2.4** Installment offer comparison
  Goal: `compareOffers(cashPrice: Minor, offers: { months: number; payments: Minor[] }[], annualInflation: number): OfferResult[]` returning, per offer, monthly payment, PV, real saving — matching acceptance criterion "at least 4 offers side by side".
  Acceptance: unit test with 4 synthetic offers (3/6/9/12 months) returns 4 results, each with correct `monthlyPayment`, `pv`, `realSaving`; results are sorted by input order (no implicit reordering).
  Depends on: T2.3

- [x] **T2.5** Installment capacity and 12-month load timeline
  Goal: `installmentLoadTimeline(commitments: Commitment[], months: Month[]): { month: Month; load: Minor }[]` and `capacityRemaining(netIncome: Minor, capPct: number, currentLoad: Minor): Minor`, where `capPct` is a tunable passed in (not hard-coded — SPEC: "Tunable values are data, not code").
  Acceptance: unit tests: two overlapping installment commitments sum correctly per month across a 12-month window; a commitment outside the window is excluded; `capacityRemaining` returns 0 (not negative) when load already exceeds the cap, with a test asserting no negative capacity is ever returned.
  Depends on: T1.9, T2.4

- [x] **T2.6** Installment schema and Zod validation
  Goal: `packages/core/modules/installments/schema.ts` — `InstallmentOfferSchema` (months, per-payment amounts, optional discounted cash price) matching SPEC's queue-item installment offer shape.
  Acceptance: unit tests: a valid offer parses; an offer with a negative payment or zero months is rejected; property test (fast-check) generates random valid offers and asserts they always round-trip through `compareOffers` without throwing.
  Depends on: T2.4

- [x] **T2.7** Installments module object
  Goal: `packages/core/modules/installments/module.ts` exporting a `Module` (id `'installments'`, version 1, schema, empty migrations array, selectors mapping to T2.1–T2.5 functions, no `contributes` yet — added in T4.x when queue exists).
  Acceptance: unit test registers the module via kernel's registry (T1.6) without error; `module.selectors.compareOffers` is callable and matches T2.4's direct export.
  Depends on: T1.6, T2.6

- [x] **T2.8** Sinking fund set-aside formula
  Goal: `packages/core/modules/sinking-funds/selectors.ts` — `monthlySetAside(target: Minor, saved: Minor, monthsRemaining: number): Minor` implementing `monthly = max(T - B, 0) / m`, rounded half-to-even at the end.
  Acceptance: unit tests: `saved >= target` → 0; `monthsRemaining <= 0` throws or returns a defined sentinel (pick one, document why in a comment) — test asserts that behavior; a normal case matches hand-computed value; rounding boundary case (e.g. remainder splits non-evenly) rounds half-to-even.
  Depends on: T1.1

- [x] **T2.9** Sinking fund schema and commitments
  Goal: `packages/core/modules/sinking-funds/schema.ts` — `SinkingFundSchema` (label, target amount, due month, current balance); `toCommitment(fund, months): Commitment` producing one payment per remaining month via T2.8.
  Acceptance: unit tests: a fund due in 6 months with 0 saved produces a commitment with 6 equal (or half-to-even adjusted) payments summing to the target within 1 minor unit; a fund already fully funded produces a commitment with all-zero payments (not omitted, so the timeline stays visible).
  Depends on: T2.8, T1.5
  Note: `toCommitment` repeats the same rounded monthly amount for every payment rather than distributing the rounding remainder across months; for a target that doesn't divide evenly by `monthsRemaining` the total can drift from `target` by more than 1 minor unit. Acceptable for MVP since the tested fixtures divide evenly; revisit if this matters in practice.

- [x] **T2.10** Sinking-funds module object
  Goal: `packages/core/modules/sinking-funds/module.ts` exporting a `Module` (id `'sinking-funds'`, version 1).
  Acceptance: registers via kernel registry without error; selectors match T2.8/T2.9 direct exports.
  Depends on: T1.6, T2.9

- [x] **T2.11** Installments + sinking funds feed `projectSeries`
  Goal: integration test only (no new production code) proving commitments produced by T2.4's offers and T2.9's `toCommitment` flow correctly through `projectSeries` (T1.9) to populate `installmentLoad` and `sinkingSetAside`.
  Acceptance: a test builds one installment commitment and one sinking-fund commitment, runs `projectSeries` over 12 months, and asserts both fields are nonzero in the expected months and zero elsewhere.
  Depends on: T2.7, T2.10, T1.9

**Stop and report after Phase 2.**

---

## Phase 3 — Profile, plan, the 4 strategies, lesson card data format

Goal: profile input, strategy allocation/diagnosis, and the lesson card schema/content pipeline.

- [x] **T3.1** `Profile` schema
  Goal: `packages/core/modules/profile/schema.ts` — Zod schema matching SPEC's `Profile` interface exactly (incomes[], fixedExpenses[], avgVariableExpenses[], savings, emergencyFundTargetMonths, annualInflationExpectation, hourlyNetIncome?).
  Acceptance: unit tests: a minimal valid profile (one income, no expenses) parses; negative `savings` or `monthly` amounts are rejected; `emergencyFundTargetMonths` must be a non-negative number.
  Depends on: T1.1

- [x] **T3.2** Hourly net income derivation
  Goal: `packages/core/modules/profile/selectors.ts` — `hourlyNetIncome(profile: Profile, hoursPerMonth?: number): Minor`, using `profile.hourlyNetIncome` if present, else `netMonthlyIncome / (hoursPerMonth ?? 160)`.
  Acceptance: unit tests: explicit `hourlyNetIncome` is returned unchanged; derived case matches `netIncome / 160` default; custom `hoursPerMonth` overrides default; zero income returns 0, not `NaN`/`Infinity`.
  Depends on: T3.1

- [x] **T3.3** Profile module object
  Goal: `packages/core/modules/profile/module.ts` — `Module` (id `'profile'`, version 1, schema from T3.1, selectors from T3.2, empty migrations).
  Acceptance: registers via kernel registry without error.
  Depends on: T1.6, T3.2

- [x] **T3.4** `Strategy` interface and params schema base
  Goal: `packages/core/strategies/types.ts` — the `Strategy` interface from SPEC (id, lesson, params, allocate, diagnose) and a generic `ParamSchema` constraint using Zod.
  Acceptance: unit test constructs a minimal fake strategy object satisfying the type.
  Depends on: T1.4, T1.7, T3.1
  Note: `Strategy.lesson` was briefly tightened to the real `LessonCard` type after T3.5 landed, then reverted to a `lessonId: string` reference — embedding `LessonCard` would make `packages/core` depend on lesson content, but `packages/lessons` already depends on `@stoafi/core` for `LessonCardSchema` (cycle), and content needs to stay swappable per locale without touching core. Callers resolve `lessonId` against `packages/lessons` for the active locale.

- [x] **T3.5** `LessonCard` schema
  Goal: `packages/core/kernel/lesson.ts` — Zod schema matching SPEC's `LessonCard` interface (id, title, source{author, work}, principle, formula?, fitsWhen, critique).
  Acceptance: unit test parses one valid card and rejects a card missing `principle`; replace the placeholder schema used ad hoc in T0.10 with this one and re-run T0.10's test.
  Depends on: T1.1

- [x] **T3.6** 50/30/20 strategy
  Goal: `packages/core/strategies/fifty-thirty-twenty.ts` — `allocate` splits net income 50% needs / 30% wants / 20% savings+investing (params tunable, not hard-coded ratios baked into logic — ratios live in `params` with these as defaults); `diagnose` flags when actual committed spend in a bucket exceeds its limit.
  Acceptance: unit tests: `allocate` on a known income returns exact 50/30/20 split (integer minor units, rounding half-to-even, verify the three amounts sum to the input to within 1 minor unit); `diagnose` on a projection where `wants.committed > wants.limit` returns at least one insight; params override (e.g. 60/20/20) changes the split.
  Depends on: T3.4
  Note: the 50/30/20 rule's "20% savings" maps entirely to the `savings` bucket (`investing` is always 0 for this strategy) — SPEC doesn't split that 20% between savings and investing, so this is the simplest reading. `allocate` imports `netMonthlyIncome` from `modules/profile/selectors` (a module), same cross-boundary call already made for the `Profile` type in T3.4 — strategies sit alongside modules and read profile data directly rather than through `contributes`, since SPEC's module table lists `plan` (which strategies serve) as reading `profile`.

- [x] **T3.7** 50/30/20 lesson card
  Goal: `packages/lessons/en/fifty-thirty-twenty.json` and `packages/lessons/tr/fifty-thirty-twenty.json` — Elizabeth Warren, *All Your Worth*, content in the team's own words (no quoted passages beyond a short line).
  Acceptance: both files parse against `LessonCardSchema` (T3.5); a test asserts the `en` and `tr` files share the same `id` and both have all required fields non-empty.
  Depends on: T3.5

- [x] **T3.8** Pay Yourself First strategy
  Goal: `packages/core/strategies/pay-yourself-first.ts` — `allocate` reserves a configurable savings percentage first, then splits the remainder between needs/wants by params; `diagnose` flags when savings-first amount isn't actually set aside (i.e. committed savings < allocated savings).
  Acceptance: unit tests mirroring T3.6's structure: exact allocation on known input, insight triggered when savings shortfall exists, param override changes split.
  Depends on: T3.4

- [x] **T3.9** Pay Yourself First lesson card
  Goal: `packages/lessons/en/pay-yourself-first.json` + `tr/` — Clason (*Richest Man in Babylon*) and Bach (*Automatic Millionaire*) as `source` (pick primary author per SPEC table; note the secondary source inside `principle` text, own words).
  Acceptance: same as T3.7.
  Depends on: T3.5

- [x] **T3.10** Conscious Spending Plan strategy
  Goal: `packages/core/strategies/conscious-spending.ts` — `allocate` implements four categories mapped onto the app's `Bucket` set (fixed costs→needs, investments→investing, savings→savings, guilt-free spending→wants) per configurable percentages; `diagnose` flags overspend in guilt-free/wants bucket.
  Acceptance: unit tests mirroring T3.6.
  Depends on: T3.4

- [x] **T3.11** Conscious Spending Plan lesson card
  Goal: `packages/lessons/en/conscious-spending.json` + `tr/` — Ramit Sethi, *I Will Teach You to Be Rich*.
  Acceptance: same as T3.7.
  Depends on: T3.5

- [x] **T3.12** Baby Steps strategy
  Goal: `packages/core/strategies/baby-steps.ts` — `allocate` implements the sequential-priority logic (e.g. step 1: small emergency fund, step 2: debt payoff priority, step 3: full emergency fund, then savings/investing) as a params-driven step table, not hard-coded step amounts; `diagnose` reports which step the profile is currently on.
  Acceptance: unit tests: a profile with `savings` below the step-1 threshold allocates ~100% to savings up to that threshold; a profile past step 1 with installment/debt commitments prioritizes debt bucket; `diagnose` returns the correct current-step insight for at least 3 distinct profile states.
  Depends on: T3.4
  Note: `allocate(profile, params)` has no access to commitments/installment load (not in its signature per the `Strategy` interface), so "debt priority" (step 2) can only be surfaced by `diagnose`, which does receive `MonthProjection[]` and checks `installmentLoad > 0`. `allocate` itself only has 3 behavior tiers: step 1 (below starter fund), step 3 (starter fund met, below full fund), step 4+ (full fund met) — it can't distinguish step 2 from step 3. Also: `starterFundTarget` default (100,000 minor units) must stay below a realistic `monthlyNeeds * emergencyFundTargetMonths`, or a profile never leaves step 1 — test fixtures were sized accordingly (rent 40,000, income 100,000) after an initial mismatch.

- [x] **T3.13** Baby Steps lesson card
  Goal: `packages/lessons/en/baby-steps.json` + `tr/` — Dave Ramsey, *The Total Money Makeover*.
  Acceptance: same as T3.7.
  Depends on: T3.5

- [x] **T3.14** Plan module — strategy selection and bucket limits
  Goal: `packages/core/modules/plan/schema.ts` (selected strategy id + params) and `packages/core/modules/plan/selectors.ts` — `currentAllocation(profile, planState): Record<Bucket, Minor>` dispatching to the selected strategy's `allocate`, and `compareStrategies(profile, allStrategies): { strategyId: string; allocation: Record<Bucket, Minor> }[]` for side-by-side comparison (SPEC acceptance: "shows the monthly allocation for each of the 4 strategies, side by side").
  Acceptance: unit test: `compareStrategies` with all 4 registered strategies returns 4 results for one profile, each internally consistent with that strategy's direct `allocate` output.
  Depends on: T3.6, T3.8, T3.10, T3.12

- [x] **T3.15** Plan module object and `project()` bucket limits wiring
  Goal: `packages/core/modules/plan/module.ts` — `Module` (id `'plan'`); extend kernel's `project()` (T1.8/T1.9, modify `packages/core/kernel/project.ts`) to accept a `bucketLimits: Record<Bucket, Minor>` argument and populate `MonthProjection.byBucket[b].limit` from it, instead of leaving it at 0.
  Acceptance: existing T1.8/T1.9 tests updated to pass explicit limits and still pass; new test: a projection built with plan's `currentAllocation` output as limits shows correct `limit` per bucket.
  Depends on: T3.14, T1.9
  Note: `project()`'s `bucketLimits` option was already added in T1.8 (kept the kernel API forward-compatible ahead of plan existing), so no kernel change was needed here — this task just adds the plan module object and the integration test proving `currentAllocation` output flows into it.

- [x] **T3.16** Lesson-card content review pass
  Goal: read every card written in T3.7/T3.9/T3.11/T3.13 against the source book/letters and confirm no passage is quoted beyond a short line, per SPEC's "Lesson cards and sources" rules.
  Acceptance: a checklist comment (not code) in the PR/commit description confirming the review; no schema change. This task exists to force the human-in-the-loop check SPEC requires ("each card reviewed against the original book before release").
  Depends on: T3.7, T3.9, T3.11, T3.13

**Stop and report after Phase 3.**

---

## Phase 4 — Queue, scheduler, 30-day rule, guards

Goal: purchase queue with Eisenhower/cost metrics, auto-scheduler, 30-day cooldown, and the guard system.

- [x] **T4.1** Queue item schema
  Goal: `packages/core/modules/queue/schema.ts` — Zod schema for the queue item fields listed in SPEC ("Queue item fields": name, price, optional discounted cash price, installment offers, urgency 1–3, importance 1–3, need/want, expected uses, added date, price updated date), plus `id`, `order` (for drag-and-drop persistence).
  Acceptance: unit tests: a minimal valid item (no installment offers) parses; urgency/importance outside 1–3 rejected; `installmentOffers` reuses `InstallmentOfferSchema` from T2.6.
  Depends on: T2.6

- [x] **T4.2** Cost-in-work-hours and cost-per-use selectors
  Goal: `packages/core/modules/queue/selectors.ts` — `costInWorkHours(price: Minor, hourlyNetIncome: Minor): number`, `costPerUse(price: Minor, expectedUses: number): Minor`.
  Acceptance: unit tests match SPEC's ratio table exactly; `expectedUses === 0` returns a defined sentinel (documented) without throwing; `hourlyNetIncome === 0` same.
  Depends on: T4.1, T3.2

- [x] **T4.3** Eisenhower quadrant selector
  Goal: `eisenhowerQuadrant(item): { urgent: boolean; important: boolean }` implementing `urgent = urgency >= 2`, `important = importance >= 2` per SPEC.
  Acceptance: unit tests for all 4 combinations at the boundary values (1 and 2).
  Depends on: T4.1

- [x] **T4.4** 30-day cooldown state machine
  Goal: `packages/core/modules/queue/selectors.ts` — `cooldownStatus(item: { isNeed: boolean; addedDate: string /* ISO, passed in */ }, today: Month | string, cooldownDays?: number): { active: boolean; endsOn: string }`. `today` is always a function argument, never computed internally (kernel purity rule extends to modules).
  Acceptance: unit tests: a need is never subject to cooldown; a want dated 29 days before `today` is still active; 30 days before is inactive; `cooldownDays` is a tunable parameter (default 30), not hard-coded in a way that can't be overridden — test passes a custom value and confirms it changes the boundary.
  Depends on: T4.1

- [x] **T4.5** Queue item → draft commitment
  Goal: `toDraftCommitment(item, month: Month): Commitment` with `status: 'draft'`, single payment for cash purchase.
  Acceptance: unit test: resulting commitment validates against `CommitmentSchema` (T1.5); `bucket` derives from `item.isNeed` (needs→`needs`, want→`wants`).
  Depends on: T4.1, T1.5
  Note: the draft's payment amount uses `item.discountedCashPrice` when set, falling back to `item.price` — a cash purchase should use the cash price when the item has one.

- [x] **T4.6** Guard rule types and default rules
  Goal: `packages/core/modules/guards/schema.ts` — `GuardRule` type (id, check function signature, severity), and a `defaultGuardRules` data array (not hard-coded logic) implementing SPEC's three default rules: emergency fund floor, installment cap, wants-bucket limit. Rule parameters (cap %, target months) are data, passed in.
  Acceptance: unit tests: emergency-fund rule fails when a draft would drop savings below `emergencyFundTargetMonths` worth of needs; installment-cap rule fails when a draft pushes 12-month load over the cap; wants-limit rule fails when a draft pushes `byBucket.wants.committed` over `byBucket.wants.limit`; each rule passes when the draft doesn't breach it.
  Depends on: T1.9, T2.5, T3.15
  Note: each rule's `check(ctx: GuardContext)` is a pure comparison; the thresholds themselves (`emergencyFundTargetMonths`, `installmentCapPct`) and the precomputed figures they compare against (`savingsBalanceAfterDraft`, `projectedInstallmentLoad`, `monthlyNeeds`) are supplied by the caller in `GuardContext`, not computed inside `schema.ts` — keeps guard logic decoupled from how the queue/plan modules derive those numbers.

- [x] **T4.7** Guard evaluation over a draft
  Goal: `packages/core/modules/guards/selectors.ts` — `evaluateGuards(rules: GuardRule[], ctx: GuardContext): GuardBreach[]`.
  Acceptance: unit test: a draft that breaches 2 of 3 default rules returns exactly 2 breaches with correct rule ids; a clean draft returns an empty array.
  Depends on: T4.6
  Note: signature changed from the originally planned `(rules, before[], after[])` to `(rules, ctx: GuardContext)` — T4.6 already settled on `GuardContext` (not raw `MonthProjection[]`) as what a `GuardRule.check` needs, since the emergency-fund and installment-cap rules require fields (`savingsBalanceAfterDraft`, `emergencyFundTargetMonths`, `projectedInstallmentLoad`, `installmentCapPct`) that aren't derivable from `MonthProjection` alone.

- [x] **T4.8** Guards module object with `contributes.guards`
  Goal: `packages/core/modules/guards/module.ts` — `Module` (id `'guards'`) whose `contributes.guards` exposes `defaultGuardRules`, matching SPEC's cross-module `contributes` mechanism (guards read projection read-only, never write).
  Acceptance: registering the guards module and collecting `contributes.guards` via kernel registry (T1.6) returns the 3 default rules.
  Depends on: T1.6, T4.7

- [x] **T4.9** Scheduler — earliest-fit placement
  Goal: `packages/core/modules/queue/scheduler.ts` — `scheduleQueue(items: QueueItem[], profile, planState, existingCommitments, today, startMonth: Month, horizonMonths?: number): { itemId: string; month: Month | null }[]`, walking items in queue order and placing each in the earliest month (within `horizonMonths`, default 12) where its bucket has room under the plan's allocation and the cooldown (for wants) has lifted; `month: null` means "not affordable yet" per SPEC.
  Acceptance: unit tests: a single affordable item schedules into the start month; an item that never fits within 12 months returns `month: null`; a want inside its 30-day cooldown (T4.4) is not scheduled before `cooldownStatus.endsOn`'s month; two items competing for the same bucket's limited room schedule into different months in queue order.
  Depends on: T4.5, T4.7, T4.4, T3.15
  Note: dropped the planned `guardRules` param — the scheduler only enforces the bucket-limit constraint (equivalent to the `wants-limit` default guard) and the cooldown. `emergency-fund-floor` and `installment-cap` need a savings balance and a 12-month installment projection that a pure scheduling pass over a queue doesn't have as inputs; those still run via `evaluateGuards` when a specific draft is presented for confirmation (SPEC flow 1), just not during auto-scheduling. Added a `today: string` param instead — cooldown needs a date, not just a `Month`.

- [x] **T4.10** Reordering re-runs the scheduler
  Goal: ensure `scheduleQueue` is a pure function of `items` order (no hidden state) so that calling it again with a reordered `items` array changes the returned schedule — SPEC acceptance: "Reordering the queue re-runs the scheduler and updates the month for every item."
  Acceptance: unit test: given the same items in two different orders, at least one item's assigned month differs, and the result is fully determined by input order (call twice with the same order, get identical output — determinism check).
  Depends on: T4.9

- [x] **T4.11** Queue module object
  Goal: `packages/core/modules/queue/module.ts` — `Module` (id `'queue'`, schema from T4.1, selectors from T4.2–T4.5/T4.9).
  Acceptance: registers via kernel registry without error.
  Depends on: T4.9

- [x] **T4.12** Preview mode integration test
  Goal: integration test (no new production code) proving SPEC's "Preview mode": selecting a queue item and building `project(ledger + [draft])` (via `includeDrafts: true` from T1.8) shows before/after numbers for buckets, installment capacity and emergency fund without mutating the underlying ledger.
  Acceptance: test builds a ledger, computes `projectSeries` before, adds one draft via `toDraftCommitment`, computes `projectSeries` after, asserts `freeCash` differs in the draft's month and the original ledger array is unchanged (referential/structural equality check).
  Depends on: T4.5, T1.9

**Stop and report after Phase 4.**

---

## Phase 5 — Cards, health metrics, decisions, backup

Goal: remaining core modules — statement/due-date timing, ratio-based health metrics, decision logging, JSON export/import.

- [x] **T5.1** Card schema
  Goal: `packages/core/modules/cards/schema.ts` — `CardSchema` (label, statementDay: 1–31, dueDay: 1–31).
  Acceptance: unit tests: valid card parses; `statementDay`/`dueDay` outside 1–31 rejected.
  Depends on: T1.1

- [x] **T5.2** Purchase timing suggestion
  Goal: `packages/core/modules/cards/timing.ts` — `timingTip(card, purchaseDate: string): { shifted: true; extraFloatDays: number; newDueMonth: Month } | null` implementing SPEC flow 4: if buying after the statement day moves payment a full month later, return the tip.
  Acceptance: unit tests: a purchase before the statement day returns `null` (no shift); a purchase after the statement day returns `shifted: true` with correct `extraFloatDays` and `newDueMonth`, verified against a hand-computed example.
  Depends on: T5.1, T1.3
  Note: dropped the planned `todayMonth` param — the shift is fully determined by `purchaseDate` and the card's `statementDay`/`dueDay`, not by "today"; file placed at `timing.ts` (not `selectors.ts`) since the module has more than one selector file (see `capacity.ts`/`selectors.ts` split in `installments`).

- [x] **T5.3** Minimum-payment trap calculator
  Goal: `packages/core/modules/cards/selectors.ts` — `minimumPaymentPayoff(balance: Minor, monthlyRate: number, minPaymentRule: { pct: number; floor: Minor }): { months: number; totalInterest: Minor }` implementing SPEC's `b_{t+1} = b_t*(1+c) - max(p*b_t, floor)`, iterating to zero balance with a safety cap (e.g. 600 months) to guarantee termination.
  Acceptance: unit tests: a known balance/rate/payment combination matches a hand or spreadsheet-computed months-to-payoff and total interest within rounding tolerance; a payment rule where `p*b_t < floor` uses the floor every month (verify via a low-balance case); a pathological case where the payment never covers interest terminates at the safety cap rather than looping forever (test asserts it returns rather than hangs).
  Depends on: T5.1, T2.1

- [x] **T5.4** Cards module object
  Goal: `packages/core/modules/cards/module.ts` — `Module` (id `'cards'`), no `contributes` in MVP beyond reading queue drafts per SPEC's module table (cards "reads" queue drafts — implemented as a selector taking a draft commitment as input, not an import of the queue module).
  Acceptance: registers via kernel registry without error.
  Depends on: T5.2, T5.3

- [x] **T5.5** Health metric selectors
  Goal: `packages/core/modules/health/selectors.ts` — `savingsRate`, `installmentRatio`, `emergencyFundMonths`, `runway`, each implementing SPEC's "Simple ratios" table exactly.
  Acceptance: unit tests per formula matching the table, including a zero-denominator case for each (e.g. zero net income) returning a defined sentinel without throwing.
  Depends on: T1.7, T3.1

- [x] **T5.6** Health module object
  Goal: `packages/core/modules/health/module.ts` — `Module` (id `'health'`, no owned schema per SPEC's table — `owns: –`).
  Acceptance: registers via kernel registry without error; selectors match T5.5 direct exports.
  Depends on: T5.5

- [x] **T5.7** Decision log schema
  Goal: `packages/core/modules/decisions/schema.ts` — `DecisionSchema` (id, queueItemRef, outcome: `'bought' | 'postponed' | 'skipped'`, timestamp (passed in, not generated internally), amount, guardBreachConfirmed?: boolean).
  Acceptance: unit tests: each of the 3 outcomes parses; a `guardBreachConfirmed: true` entry is required whenever the decision is linked to a logged guard breach (test constructs one such case and asserts schema/selector-level validation, per SPEC: "Breaking a rule requires an explicit 'I know' confirmation, which is written to the decision log").
  Depends on: T1.1
  Note: added `breachedRuleIds?: string[]` to express "linked to a breach" — the schema's `.refine` requires `guardBreachConfirmed === true` whenever `breachedRuleIds` is non-empty, enforced at parse time rather than by a separate selector.

- [x] **T5.8** Savings summary selector
  Goal: `packages/core/modules/decisions/selectors.ts` — `savingsSummary(decisions: Decision[]): { totalSaved: Minor; count: number }` summing `amount` for `outcome === 'skipped'` (and, per product intent, `postponed` counted separately) — SPEC acceptance: "Decision log shows total amount saved by skipped purchases."
  Acceptance: unit test: a mixed list of bought/postponed/skipped decisions returns `totalSaved` equal to the sum of only the skipped ones' amounts.
  Depends on: T5.7

- [ ] **T5.9** Decisions module object
  Goal: `packages/core/modules/decisions/module.ts` — `Module` (id `'decisions'`).
  Acceptance: registers via kernel registry without error.
  Depends on: T5.8

- [ ] **T5.10** Backup schema versioning and export
  Goal: `packages/core/modules/backup/schema.ts` — a top-level `BackupSchema` (`{ version: number; exportedAt: string; data: Record<moduleId, unknown[]> }`) that composes every module's own Zod schema (profile, plan, queue, installments, sinking-funds, cards, health has none, guards has none stored, decisions, and future modules) via the registry (T1.6), so backup "owns: –, produces: JSON export/import, reads: all schemas" per SPEC's table.
  Acceptance: unit test: `exportAll(registry, storeSnapshot)` (pure function taking already-loaded data, no Dexie import) produces an object validating against `BackupSchema`; round-tripping through `JSON.stringify`/`JSON.parse` and re-validating still passes.
  Depends on: T1.6, T3.3, T3.15, T4.11, T2.7, T2.10, T5.4, T5.9

- [ ] **T5.11** Backup import with per-module schema validation
  Goal: `importAll(registry, backupJson: unknown): { data: Record<string, unknown[]> } | { errors: string[] }` — validates the outer `BackupSchema` first, then each module's data against that module's own schema, collecting all errors rather than throwing on the first one.
  Acceptance: unit tests: a valid backup imports cleanly; a backup with one module's data corrupted (e.g. negative money amount) returns an `errors` array naming that module, while a completely valid backup returns `data`; a backup with an unknown module id present is ignored (forward-compat) rather than failing the whole import.
  Depends on: T5.10

- [ ] **T5.12** Backup module object
  Goal: `packages/core/modules/backup/module.ts` — `Module` (id `'backup'`).
  Acceptance: registers via kernel registry without error.
  Depends on: T5.11

**Stop and report after Phase 5.**

---

## Phase 6 — Storage layer (Dexie, versioned schemas, migrations)

Goal: local persistence in `apps/web`, wired to core schemas, with a real migration path — this is the first phase allowed to touch browser APIs.

- [ ] **T6.1** Dexie database definition
  Goal: `apps/web/src/storage/db.ts` — a Dexie subclass with one table per module (profile, plan, queue, installments, sinkingFunds, cards, decisions — health/guards own no persisted data per SPEC), version 1 schema matching each module's Zod schema's shape.
  Acceptance: a test (using `fake-indexeddb` in a Vitest environment for `apps/web`, or a Node-based Dexie test) opens the DB and confirms all expected tables exist with version 1.
  Depends on: T5.12, T0.8

- [ ] **T6.2** Write-through validation on every table write
  Goal: `apps/web/src/storage/repo.ts` — a thin repository layer wrapping each Dexie table's `put`/`add` with the corresponding core Zod schema's `.parse()` before writing, rejecting invalid data before it reaches IndexedDB.
  Acceptance: test: writing a valid profile succeeds and is readable back; writing an invalid profile (e.g. negative savings) throws before any Dexie call (verified via a spy showing the Dexie method was never invoked).
  Depends on: T6.1

- [ ] **T6.3** Migration harness — version bump example
  Goal: `apps/web/src/storage/migrations.ts` establishing the pattern: a Dexie `.version(2).stores(...).upgrade(tx => ...)` step, demonstrated with one real, minimal schema change (e.g. adding a nullable field to the profile table) so the pattern exists before real modules need it.
  Acceptance: test: a DB seeded at version 1 with sample data, then opened against the version-2 definition, upgrades without data loss (assert the pre-existing row is still present and the new field has the migration's default).
  Depends on: T6.1

- [ ] **T6.4** Backup export/import wired to Dexie
  Goal: `apps/web/src/storage/backup.ts` — `exportToJson(): Promise<string>` and `importFromJson(json: string): Promise<ImportResult>` calling core's `exportAll`/`importAll` (T5.10/T5.11) against live Dexie tables, wrapped in a transaction for import (all-or-nothing per SPEC acceptance: "JSON export → clear data → import restores everything").
  Acceptance: integration test: seed the DB, export, clear all tables, import, and assert every table's contents match the pre-export snapshot exactly (deep equality per row).
  Depends on: T6.2, T5.11

**Stop and report after Phase 6.**

---

## Phase 7 — Web UI, flows from the spec, PWA

Goal: the Next.js PWA surface implementing SPEC's four user flows, reading only from `packages/core` and the Phase 6 storage layer.

- [ ] **T7.1** App shell, routing, Zustand store skeleton
  Goal: `apps/web/src/app/layout.tsx`, route structure for Profile / Plan / Queue / Cards / Health / Decisions / Settings; `apps/web/src/store/` Zustand store holding loaded module data plus derived selectors calling `projectSeries` (never storing the projection itself, per SPEC: "never stored").
  Acceptance: `pnpm --filter @stoafi/web build` succeeds; a component test (React Testing Library) renders the shell and finds all nav routes.
  Depends on: T6.4

- [ ] **T7.2** Profile screen
  Goal: form for incomes/expenses/savings/emergency fund/inflation, backed by T3.1's schema and T6.2's repo; editable at any time per SPEC acceptance.
  Acceptance: component test: filling the minimum required fields and submitting persists via the repo mock and re-renders with saved values; SPEC acceptance "under 5 minutes" is validated structurally (no required field beyond the schema's required set, no multi-step wizard) rather than timed.
  Depends on: T7.1, T3.3

- [ ] **T7.3** Plan screen — 4 strategies side by side with lesson cards
  Goal: renders `compareStrategies` (T3.14) output for all 4 strategies, each with its lesson card (T3.5–T3.13) rendered inline/expandable.
  Acceptance: component test: given a fixed profile fixture, all 4 strategy cards render with correct bucket amounts and each links to its lesson card content.
  Depends on: T7.1, T3.16

- [ ] **T7.4** Queue screen — list, Eisenhower view, drag-and-drop reorder
  Goal: queue list with cost-in-work-hours/cost-per-use badges (T4.2), Eisenhower quadrant grouping (T4.3), dnd-kit reordering calling `scheduleQueue` (T4.9) on drop.
  Acceptance: component test: reordering two items via the drag handler (simulated, not real pointer events) calls the scheduler and updates displayed months for both items, matching SPEC acceptance "Reordering the queue re-runs the scheduler and updates the month for every item."
  Depends on: T7.1, T4.11

- [ ] **T7.5** Flow 1 — preview and confirm a queue item
  Goal: selecting a queue item opens a preview panel showing before/after buckets, installment capacity, emergency fund (via T4.12's pattern) and guard breaches (T4.7) in red; "Cash this month" / "first fitting month" / "with installments" actions; confirming turns the draft into an active commitment and writes a decision (T5.9).
  Acceptance: component test measuring wall-clock time from selection to preview render is out of scope for a unit test — instead assert the preview computation path calls `project()` synchronously with no network/async I/O (SPEC's "under 100 ms" acceptance is satisfied structurally, since a pure sync function over in-memory data cannot exceed that budget on realistic data sizes; note this reasoning in the task's commit).
  Depends on: T7.4, T4.8

- [ ] **T7.6** Flow 2 — calculate with installments
  Goal: "Calculate with installments" action on a queue card opens the offer-entry form (T2.6's shape) and renders `compareOffers` (T2.4) results side by side (monthly payment, PV, real saving, 12-month cap effect via T2.5); picking an option returns to flow 1 as an installment draft.
  Acceptance: component test: entering 4 offers renders 4 comparison rows with correct computed values from fixture data; selecting one closes the form and the queue card shows an installment draft state.
  Depends on: T7.5, T2.7

- [ ] **T7.7** Flow 3 — auto-schedule visualization
  Goal: 12-month timeline view showing each queue item's scheduled month or "not affordable yet" flag (T4.9's `null` result), and the 30-day cooldown countdown with a re-prompt when it ends (T4.4).
  Acceptance: component test: a fixture item with `month: null` renders the "not affordable yet" label; a want inside cooldown renders a countdown and is excluded from the schedulable list until `endsOn`.
  Depends on: T7.4

- [ ] **T7.8** Flow 4 — card timing tip
  Goal: when a draft is paid by card, show T5.2's `timingTip` result inline in the preview panel (T7.5) with the extra float days; accepting shifts the commitment's payment month.
  Acceptance: component test: a fixture draft + card combination that triggers a shift renders the tip text with the correct day count; accepting updates the draft's payment month in the store.
  Depends on: T7.5, T5.4

- [ ] **T7.9** Health metrics screen
  Goal: renders savings rate, emergency fund months, installment ratio, runway (T5.5) from the current projection.
  Acceptance: component test with a fixture profile/ledger renders all four metrics matching direct selector output.
  Depends on: T7.1, T5.6

- [ ] **T7.10** Guard breach confirmation UI
  Goal: when a draft breaches a guard rule, block the "confirm" action in flow 1 (T7.5) behind an explicit "I know" dialog; accepting writes `guardBreachConfirmed: true` to the decision log (T5.7).
  Acceptance: component test: a fixture draft with a guard breach shows the confirmation dialog and cannot be confirmed without the explicit action; accepting produces a decision entry with `guardBreachConfirmed: true`.
  Depends on: T7.5, T5.9

- [ ] **T7.11** Decision log screen
  Goal: lists decisions with outcome and renders `savingsSummary` (T5.8) total.
  Acceptance: component test with fixture decisions renders the correct total and per-row outcome labels.
  Depends on: T7.1, T5.9

- [ ] **T7.12** Cards screen — statements, due dates, minimum-payment calculator
  Goal: card CRUD (T5.1) and a minimum-payment trap calculator UI (T5.3) with months-to-payoff/total-interest output.
  Acceptance: component test: entering fixture balance/rate/payment renders correct months/interest matching direct selector output.
  Depends on: T7.1, T5.4

- [ ] **T7.13** Settings screen — currency, backup export/import
  Goal: currency selector (feeds `Money.currency`), export button (T6.4's `exportToJson`) triggering a file download, import via file picker calling `importFromJson` with per-row error surfacing (T5.11's `errors`).
  Acceptance: component test: clicking export calls the mocked `exportToJson` and triggers a download; selecting a corrupted file surfaces the returned error list instead of silently failing; SPEC acceptance "export → clear data → import restores everything" is covered by an integration test reusing T6.4's assertions through the UI action handlers.
  Depends on: T7.1, T6.4

- [ ] **T7.14** PWA — Serwist service worker and manifest
  Goal: `apps/web` Serwist config, `manifest.json` (name, icons, `display: standalone`), offline-capable static export.
  Acceptance: `pnpm --filter @stoafi/web build` produces a service worker in `out/`; a Lighthouse PWA check (manual, documented in the task's commit note) confirms installability, or an automated `workbox`/`serwist` manifest-precache test if available.
  Depends on: T7.1

**Stop and report after Phase 7.**

---

## Phase 8 — i18n completion, lesson card content, acceptance pass

Goal: full TR/EN coverage, final lesson-card content for the remaining sourced concepts, and a pass against every acceptance criterion in SPEC.

- [ ] **T8.1** next-intl wiring
  Goal: `apps/web` next-intl setup with `en`/`tr` message catalogs, locale switcher in Settings, locale-aware number/date formatting for all `Money`/`Month` display (SPEC design principle 6).
  Acceptance: a test (or lint rule) scans `apps/web/src` for hard-coded string literals in JSX outside the i18n message system and fails on any match beyond an allow-list (e.g. `aria-hidden` icons); switching locale in a component test changes rendered currency/date formatting.
  Depends on: T7.14

- [ ] **T8.2** Full string audit — every screen through i18n
  Goal: walk every screen built in Phase 7 (T7.2–T7.13) and replace any remaining literal UI text with `next-intl` message keys in both `en.json` and `tr.json`.
  Acceptance: the T8.1 lint/scan test passes with zero exceptions across the whole `apps/web` tree; both message catalogs have identical key sets (a test diffs the two JSON files' keys).
  Depends on: T8.1

- [ ] **T8.3** Remaining lesson cards — non-strategy concepts
  Goal: write `en`/`tr` lesson cards for "Cost in life energy" (Vicki Robin), "Room for error / enough" (Morgan Housel), "Index funds and costs" (Bogle/Buffett), "Eisenhower matrix" (Covey), "Sinking funds" (common practice), "Time value of money" (standard finance) — all listed in SPEC's lesson-card table but not yet written in Phase 3.
  Acceptance: all 6 cards parse against `LessonCardSchema`; each is linked from its "Used in" module screen per SPEC's table (queue→cost-in-life-energy + Eisenhower, guards/health→room-for-error, plan investing bucket→index funds, sinking-funds→sinking funds card, installments→time value of money) — verified by a test asserting each screen renders a lesson-card link with the expected `id`.
  Depends on: T8.2, T7.6, T7.7, T7.9, T7.12

- [ ] **T8.4** Lesson-card content review pass (batch 2)
  Goal: same review discipline as T3.16, applied to the 6 cards from T8.3.
  Acceptance: checklist confirmation in the commit description; no quoted passages beyond a short line.
  Depends on: T8.3

- [ ] **T8.5** Core test coverage ≥ 90%
  Goal: run coverage on `packages/core`, backfill any gaps found (branch coverage on selectors' edge cases especially).
  Acceptance: `pnpm --filter @stoafi/core test -- --coverage` reports ≥ 90% line and branch coverage; the report is committed or linked in CI output, not hand-waved.
  Depends on: all Phase 1–5 tasks

- [ ] **T8.6** PWA install check — phone and Mac
  Goal: manually verify installability on at least one mobile browser (Android Chrome or iOS Safari "Add to Home Screen") and macOS (Chrome/Edge "Install").
  Acceptance: documented in the task's commit note with device/browser names and confirmation the app launches standalone and offline after install. This is a manual acceptance task — no automated test substitutes for it.
  Depends on: T7.14

- [ ] **T8.7** Full acceptance-criteria pass
  Goal: walk every line in SPEC's "Acceptance criteria" section and confirm it is satisfied, using the mapping table below; fix any gap found as a follow-up task added to this phase before checking this one off.
  Acceptance: every row in the "Acceptance criteria mapping" section below is ticked with a passing test or verified manual check referenced by task id.
  Depends on: T8.1–T8.6, all prior phases

**Stop and report after Phase 8 — MVP complete.**

---

## Acceptance criteria mapping

Each row is a line from SPEC's "Acceptance criteria" section, mapped to the task(s) that implement and verify it.

| SPEC acceptance criterion | Implemented/verified by |
| --- | --- |
| Profile can be filled in under 5 minutes and edited at any time | T3.1, T7.2 |
| Plan shows the monthly allocation for each of the 4 strategies, side by side, with a lesson card per strategy | T3.14, T3.6, T3.8, T3.10, T3.12, T3.7, T3.9, T3.11, T3.13, T7.3 |
| Selecting a queue item previews its before → after effect on buckets, installment capacity and emergency fund in under 100 ms | T1.8 (`includeDrafts`), T4.12, T7.5 |
| Reordering the queue re-runs the scheduler and updates the month for every item | T4.9, T4.10, T7.4 |
| 30-day cooldown blocks scheduling of wants and prompts again when it ends | T4.4, T4.9, T7.7 |
| Installment comparison shows monthly payment, PV and real saving for at least 4 offers | T2.4, T7.6 |
| 12-month installment timeline reflects drafts and active commitments | T2.5, T1.9, T7.7 |
| Sinking funds turn an annual expense or dated goal into a monthly set-aside | T2.8, T2.9, T2.10 |
| Card timing tip appears when buying after the statement day delays payment | T5.2, T7.8 |
| Minimum-payment calculator reports months to payoff and total interest | T5.3, T7.12 |
| Health metrics show savings rate, emergency fund months, installment ratio and runway | T5.5, T7.9 |
| Guard breaches require explicit confirmation and are logged | T4.6, T4.7, T4.8, T5.7, T7.10 |
| Decision log shows total amount saved by skipped purchases | T5.7, T5.8, T7.11 |
| JSON export → clear data → import restores everything | T5.10, T5.11, T6.4, T7.13 |
| Full UI in TR and EN; money stored as integer minor units everywhere | T8.1, T8.2, T1.1, T1.2 |
| Core package test coverage ≥ 90%; installable as a PWA on phone and Mac | T8.5, T7.14, T8.6 |

---

## Open questions

- [ ] Default installment cap: 20% of net income, or lower? (SPEC backlog) — blocks final default value in T4.6's `defaultGuardRules`; task can proceed with 20% as a placeholder default since it's data, not code, but the number needs confirmation before Phase 8's acceptance pass.
- [ ] Legal installment limits by category: keep as an editable data file, and who updates it? (SPEC backlog) — no MVP task currently owns "legal limits by category"; if this is in scope for guards (T4.6), it needs its own task added before Phase 4 starts. Currently treated as out of MVP scope pending confirmation.
- [ ] Product name and domain (SPEC backlog) — affects T0.12 (README), T7.14 (PWA manifest name/icons). Using "Stoafi" as a working name per CLAUDE.md; needs confirmation before Phase 7 UI copy is finalized.
- [ ] License for the public repo, MIT vs. AGPL (SPEC backlog) — blocks T0.12's `LICENSE` file content; placeholder only until decided.
- [ ] Sinking-fund `monthlySetAside` behavior when `monthsRemaining <= 0` (i.e. goal date already passed or due this month) — SPEC's formula doesn't define this edge case. Implemented in T2.8 as a thrown error (forces the caller to decide how to surface an overdue fund, rather than this pure formula inventing a "due immediately" amount) — this is still an invented decision, not spec'd; flag for confirmation.
- [ ] Decision log `savingsSummary` — SPEC acceptance says "total amount saved by skipped purchases" but the domain model implies `postponed` items aren't yet decided either way. T5.8 sums only `skipped`; confirm whether `postponed` should also count toward some other displayed figure.
- [ ] Baby Steps strategy step thresholds/order — SPEC names the strategy and its source but doesn't enumerate exact step amounts/order (unlike Dave Ramsey's actual 7 baby steps, which SPEC doesn't fully restate). T3.12 implements a params-driven approximation; confirm the exact step definitions wanted for MVP before Phase 3 starts, or accept the approximation.
- [ ] Cost-per-use / cost-in-work-hours behavior at `expectedUses === 0` / `hourlyNetIncome === 0` — SPEC gives the formula only; T4.2 picks a sentinel (documented in code) pending confirmation this matches intended UX (e.g. show "—" vs. 0 vs. infinity in the UI).
