# Quality budget

What "good enough to give to a customer" means in numbers. Each line has a check that fails the build, or a named manual step.

## Size (checked by `pnpm --filter @stoafi/web budget`, after a build)

Gzip bytes, summed over the whole static export. Limits live in `apps/web/quality-budget.json` and are about 15% above the size when they were set (2026-10), so growth is a decision, not an accident.

| Measure | Now | Budget |
| --- | --- | --- |
| All JavaScript, every page | 706 KB | 820 KB |
| Largest single JavaScript file | 109 KB | 130 KB |
| All CSS | 8 KB | 16 KB |

Raising a limit needs a line in the commit message saying what was added and why.

## Accessibility (checked by `pnpm --filter @stoafi/web test:e2e`)

- Every page passes the axe scan with no violations, in light and dark, empty and with sample data.
- Both themes meet WCAG AA contrast for text colours (`tokens.test.ts`).
- Everything works from the keyboard; icon-only buttons have a spoken name; dialogs trap focus and return it.
- Animation stops under `prefers-reduced-motion`.

## Behaviour

- The preview of a queue purchase updates in under 100 ms (SPEC acceptance).
- No network request is made by the app after load (CSP `connect-src 'self'`: the page can only talk to its own host, `csp.test.ts`).
- Every user-facing string exists in `en` and `tr` with identical keys (`scan-tree.test.ts`, i18n tests).

## Manual, before a release (owner)

- Install as a PWA on one phone and one Mac, go offline, open it (T8.6 / T14.5).
- Read the Turkish text once on a phone.
- Lighthouse (mobile) on the home page: aim for 90+ on performance and accessibility. Not automated because the number changes with the machine.
