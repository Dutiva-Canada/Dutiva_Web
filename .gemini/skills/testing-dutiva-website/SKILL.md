---
name: Test the Dutiva marketing website locally
description: |
  Run the Dutiva marketing site locally, navigate to / and /fr, and verify
  bilingual user-facing copy. Use this skill when testing i18n or landing-page
  string changes.
---

# Test the Dutiva marketing website locally

## Devin secrets needed

None.

## Environment

- Run commands from the repo root.
- Default system Node at `/usr/bin/node` is v20.18.1, which is too old for Vite 8
  and causes a missing native Rolldown binding (`@rolldown/binding-linux-x64-gnu`).
  Use nvm Node 22+:
  ```bash
  source /home/ubuntu/.nvm/nvm.sh
  nvm use 22
  ```
- Install dependencies: `npm install`
- Start the dev server: `npm run dev` (Vite; typically `http://localhost:5173/`)
- Build command: `npm run build` (slower; runs typecheck, SSR, prerender and SEO validation)
- Required pre-commit gate: `npm run check` (typecheck + lint + tests + check:migrations + check:rls + check:facts + check:message-scopes)
- Quick useful checks: `npm run typecheck`, `npm run lint`, `npm run test`

## How to test language versions

- English marketing pages are at the unprefixed paths, e.g. `http://localhost:5173/`
- French marketing pages are under `/fr`, e.g. `http://localhost:5173/fr`
- The `FR` / `EN` button in the site header switches locale by navigating to the
  alternate path (see `src/seo/routes.ts`).

## What to look for on i18n changes

- Strings are defined in `src/i18n/messages/*.ts` as `{ en, fr }` pairs.
- The landing page product section is in `src/features/marketing/sections/Product.tsx`
  and is reached from the top nav under **Document Studio** (`#product`).
- Verify both the section subtitle (`landing_prod_sub`) and the matching feature
  card title (`landing_prod1_t`) on both `/` and `/fr`.

## Common pitfalls

- Node 20.x produces a Rolldown native-binding error when running `vite`. Switch
  to Node 22+ via nvm and re-run `npm install` if you see
  `Cannot find native binding ... @rolldown/binding-linux-x64-gnu`.
- The marketing site is the public surface and does not require authentication.
