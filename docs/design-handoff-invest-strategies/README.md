# Invest strategy builder redesign — screenshots

The redesign request referenced a mockup URL that arrived as the literal
placeholder `[MOCKUP_URL]`, so the builder was implemented from the written
10-point spec against the existing portal visual language (cream / deep navy /
gold tokens).

## Screenshots

- `before.png` — the pre-redesign strategies page (rules carried bare
  `side`/`qty` fields, strategy-level `autonomy`, "Run the bot now",
  count-only run history)
- `after.png` — rebuilt page: AI draft first, template gallery with
  per-template cadence + expandable rule previews, typed rules, scoped
  strategies, diagnostic run history
- `after-form.png` — the builder itself: scope picker under the name,
  stacked rule sentence cards, Notify me / Propose an order split, health
  panel (firing estimate, warnings, Test scan), notification destinations
- `after-fr.png` — the same page in French

Captured via a temporary dev-only preview route (`/dev-invest-preview`,
removed before merge) since the portal is auth- and grant-gated.
