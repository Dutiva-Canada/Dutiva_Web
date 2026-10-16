# Dev Annotations overlay

An in-app tool for turning "change that thing over there" into a precise,
file-anchored brief you can paste to an AI. Click any element, pin a comment
to it, and the tool captures the exact **source file + line**, a description of
the element, and the route — then exports it all as a clean Markdown brief.

## Where it runs

- ✅ **Local dev** (`npm run dev`) and **Vercel preview deployments**.
- ❌ **Never on production** (`dutiva.ca`). The whole feature is compiled out of
  the production build — no code, no chunk, no `data-loc` attributes ship to
  real users (verified: the production bundle contains none of it).

On a preview URL it works on any device — open the preview on your phone,
annotate the live page, and copy the brief.

## How to use it

1. Look for the **◎ Annotate** pill at the bottom-left of the page (or press
   **⌘/Ctrl + Shift + D**).
2. Click it, then click **◎ Annotate** in the panel to arm annotation mode.
3. Click any element on the page. A note is pinned to it, capturing its source
   `file:line`, a description, and the current route. Type what you want
   changed.
4. Repeat for as many elements as you like (across routes — notes are grouped
   by route and persist in `localStorage`).
5. Click **Copy brief** and paste it into your AI chat. It looks like:

   ```markdown
   # Requested changes (2 annotations)

   ## /workspace/cases

   - `src/features/app/views/cases/CasesView.tsx:88` · `button "New case"` — Make this bigger and move it left

   ## /pricing

   - `src/pages/Pricing.tsx:41` · `h1 "Simple pricing"` — Shorten this headline
   ```

Other controls: **Locate** re-finds and flashes an element; **Delete** / **Clear**
remove notes; **Hide** dismisses the tool until you press ⌘/Ctrl+Shift+D again;
**Show brief** reveals the text inline if clipboard copy is blocked.

## How it works

- **`vite.config.ts`** adds a small `pre` transform (`devSourceLocation`) that
  stamps every host element with `data-loc="src/…/File.tsx:line"`, using
  `@babel/parser` + `magic-string`. It's inserted inline (no line shifts, so
  source maps and Fast Refresh are unaffected) and is added **only** for dev
  and preview builds — never production, never under Vitest.
- **`src/devtools/`** — the overlay:
  - `domInspect.ts` reads the nearest `data-loc`, describes the element, and
    builds a best-effort selector for "Locate".
  - `annotations.ts` — the data model, `localStorage` persistence, and the
    `buildBrief()` Markdown formatter.
  - `DevAnnotations.tsx` — the UI, portalled to `<body>` with its own styles so
    it works over both the marketing and app surfaces without touching them.
- **`src/app/App.tsx`** mounts it behind a build-time flag
  (`import.meta.env.DEV || __VERCEL_ENV__ === 'preview'`). Because that folds to
  a literal at build time, the production bundle drops the lazy import entirely.

## Toggling it off

Use **Hide** in the panel (persisted), or clear `localStorage`'s
`dutiva-dev-enabled` / `dutiva-dev-annotations` keys. It's off-screen until you
open it, and gone completely in production.
