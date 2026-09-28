# CLAUDE.md

Stoafi: a local-first personal finance app that turns income and average expenses into a monthly plan, prioritizes purchases into months, and evaluates installments against inflation. No server, no AI. Package scope: `@stoafi/*` (e.g. `@stoafi/core`, `@stoafi/web`).

The full product spec is in `docs/SPEC.md`. It is the source of truth for scope, formulas and module boundaries. Read the relevant section before working on a module.

## Workflow

- All work is tracked in `TASKS.md`. Always work from it.
- At the start of a session, read `TASKS.md` and pick the first unchecked task whose dependencies are done. Do not skip ahead, and do not work on tasks from a later phase.
- One task at a time. For each task:
  1. Re-read its acceptance criteria and the related spec section.
  2. Write or update tests first for any logic in `packages/core`.
  3. Implement the smallest change that makes the task complete.
  4. Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. All must pass.
  5. Tick the task in `TASKS.md` and add a one-line note under it if something non-obvious was decided.
  6. Commit with a Conventional Commits message that references the task id, e.g. `feat(installments): add PV calculation [T3.2]`.
- Stop and report at the end of every phase so the human can review before the next phase starts.
- If a task is too big, split it into subtasks in `TASKS.md` before starting.
- If the spec is ambiguous or a task conflicts with it, stop and ask. Do not invent product behavior. Record the question under "Open questions" in `TASKS.md`.
- Never mark a task done with failing tests, `any` types, TODOs in its code, or skipped tests.

## Hard rules

- **Money is always integer minor units** (kuruş/cents), typed as `Minor`. Never store or pass money as a float. Floats are allowed only inside a calculation; round once at the end, half-to-even.
- **`packages/core` is pure TypeScript.** No React, Next.js, Dexie, browser APIs, `Date.now()` or `Math.random()` inside core logic. Time and ids are passed in as arguments so every function is deterministic.
- **Modules never import each other.** A module may import only from `kernel/` and its own folder. Cross-module features go through the ledger or the `contributes` mechanism.
- **The monthly projection is derived, never persisted.**
- **Tunable values are data, not code:** strategy percentages, the installment cap, guard thresholds, legal installment limits.
- **No network calls anywhere in the MVP.** No analytics, no remote fonts at runtime, no fetched rates. Inflation and card rates are user-entered.
- **Every user-facing string goes through i18n** (`en` and `tr`). No hard-coded UI text.
- **Lesson card content is written in our own words.** Never paste passages from books.
- **Every persisted schema is versioned** with a Zod schema and a migration path.

## Stack

pnpm workspaces + Turborepo · TypeScript (strict) · Zod · Vitest + fast-check · Next.js (static export) · Dexie · Zustand · shadcn/ui + Tailwind · Recharts · dnd-kit · Serwist · next-intl.

Do not add a dependency that is not listed here without asking first.

## Repo layout

```
apps/web/                  Next.js PWA; imports logic only from packages/core
packages/core/kernel/      Money, Month, Commitment, registry, project()
packages/core/modules/     profile, plan, queue, installments, sinking-funds,
                           cards, health, guards, decisions, backup
packages/core/strategies/  50-30-20, pay-yourself-first, conscious-spending, baby-steps
packages/lessons/          lesson card JSON (en, tr)
docs/SPEC.md               product spec
TASKS.md                   task list and progress
```

Each module folder contains `schema.ts`, `selectors.ts`, `module.ts` and `*.test.ts`.

## Code style

- TypeScript strict mode, no `any`, no non-null assertions without a comment explaining why.
- Prefer small pure functions and explicit return types on exported functions.
- Test names describe behavior: `returns a positive saving when installments are cheaper than cash in real terms`.
- Money tests include edge cases: zero, one kuruş, very large amounts, rounding boundaries.
- Keep comments for why, not what.

## Commands

```
pnpm install
pnpm dev          # web app
pnpm test         # all tests
pnpm typecheck
pnpm lint
```

Update this section if the commands change.
