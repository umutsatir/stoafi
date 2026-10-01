# Deploying to Vercel

Stoafi is a static export (`apps/web/out`), so Vercel only serves files; there is no server and nothing runs on it.

## Branches

- `main`: where work is merged.
- `stable`: what customers see. Vercel's **Production Branch** is `stable`; every other branch gets a preview URL.
- To release: merge `main` into `stable` (a pull request `main` → `stable`, or `git push origin main:stable` when it fast-forwards).

## One-time setup in Vercel

1. Import the GitHub repository `umutsatir/stoafi`.
2. Framework Preset: **Other**. Leave **Root Directory** empty (the repository root).
3. Build settings are read from `vercel.json`, so do not override them: install `pnpm install --frozen-lockfile`, build `pnpm --filter @stoafi/web build`, output `apps/web/out`.
4. Environment variable: `ENABLE_EXPERIMENTAL_COREPACK` = `1`, so Vercel uses the pnpm version pinned in `package.json`.
5. Settings → Git → **Production Branch**: `stable`.
6. Deploy.

## What `vercel.json` does

- Serves pages without `.html` (`/plan`, not `/plan.html`).
- Sets the security headers (same values as `apps/web/public/_headers`; a test keeps them equal to `lib/csp.ts`).
- Stops `sw.js` from being cached so a new version reaches installed apps.

## Check after the first deploy

- Open the site, add to the home screen on a phone, switch to airplane mode and open it again.
- In the browser's network tab nothing should leave the site (the policy forbids it).
- Open a deep link such as `/plan` directly and refresh it.
