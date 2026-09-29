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

## Collapsed create entry point (iteration 2)

The AI drafter and template gallery now sit behind a "New strategy"
disclosure so the strategy list stays dominant at rest; the panel self-opens
only while the list is empty, and a "Start blank" action inside it preserves
the bare-form path. Run rows carry relative timestamps, name their strategy
("deleted strategy" when it no longer resolves), and link proposal-producing
runs to Orders.

- `strategies-collapsed-en.png` / `-fr.png` — default state with strategies
  present: disclosure collapsed, list + run history dominant
- `strategies-expanded-en.png` / `-fr.png` — disclosure open: AI drafter,
  icon-tagged template gallery, "Start blank"

Captured via a temporary dev-only preview route (`/dev-preview/invest-strategies`,
removed before merge) rendering fixture state — the portal is auth- and
grant-gated.
