# Brand — colour system and product direction

**Version 2026-09** · decided 2026-09-18 · read alongside
[CANONICAL_FACTS.md](CANONICAL_FACTS.md) (facts outrank this file) and
[NATURAL_LANGUAGE_COPY.md](NATURAL_LANGUAGE_COPY.md) (how we write).

This file records two things: the colour system the product now ships, and
the product direction the brand is built to carry. Values are enforced —
the brand rows in CANONICAL_FACTS.md are checked against the stylesheets by
`npm run check:facts`, so the hexes below cannot drift silently.

## 1. Product direction the brand carries

Dutiva started as a Canadian HR-compliance workspace. The direction is wider:
**any business function, automated end-to-end by AI agents — including local
models.** The workspace already spans People, Revenue, Operations, Finance,
Governance, Security, Specialists and Analytics
(`docs/design-handoff-business-functions/`), and Dutiva is entering
BusinessTech beyond HR and beyond Canada over time.

Two disciplines follow from that:

- **Direction, not shipped claim.** "Any business automated end-to-end" is
  where the product is going, not what it does today. Public copy may
  describe AI agents working across business functions _as direction_ — it
  may not claim a business is automated, compliant, or covered end-to-end.
  Same rule as every hedge in CANONICAL_FACTS.md: don't upgrade a direction
  into a fact.
- **Local models stay internal until decided.**
  [LOCAL_INFERENCE.md](LOCAL_INFERENCE.md) is still the decision record and
  still says: do not quote it in marketing as a shipped capability. The
  Advisor runs on DigitalOcean Gradient serverless today. Local-model
  support may be named as a roadmap commitment inside the company, never as
  a feature a customer has.

## 2. The colour system

**Timeless foundation + evolving accent.** The foundation — deep navy,
charcoal, ivory — is chosen to age well and to carry a BusinessTech brand,
not just an HR one. The accent layer is where the brand can evolve without
repainting the house.

| Role          | Colour         | Hex       | Meaning                                         | Token                     |
| ------------- | -------------- | --------- | ----------------------------------------------- | ------------------------- |
| Foundation    | Deep navy      | `#0b1f3a` | Trust, stability, professionalism               | `--dutiva-navy`           |
| Foundation    | Charcoal       | `#1c2530` | Premium, serious, corporate                     | `--dutiva-charcoal`       |
| Foundation    | Ivory          | `#f7f3ea` | Warmth, elegance; the light floor               | `--dutiva-ivory`          |
| Accent        | Teal           | `#0f766e` | People + technology; **the interactive accent** | `--dutiva-teal`           |
| Accent (dark) | Teal bright    | `#45c4b5` | Teal lifted to hold ≥4.5:1 on navy              | `--dutiva-teal-bright`    |
| Executive     | Champagne gold | `#c8a96b` | Premium / executive moments only                | `--dutiva-gold`           |
| —             | Deep floor     | `#060f1e` | Navy darkened past brand for dark surfaces      | `.surface-marketing --bg` |

Alternatives considered and why they lost: electric blue and violet read
tech-forward but date faster (violet especially — the AI-purple wave is a
trend); burgundy and forest green narrowed the brand toward consultancy;
keeping gold primary made every screen compete with the accent that should
mean "executive".

### Roles, not just colours

- **Teal owns interaction.** Links, active nav, focus rings, selections,
  routine affordances — anything that means "you can act here". It is the
  `--accent` token on every surface and `--focus` everywhere.
- **Champagne gold is the executive accent.** The leaf mark, `.gold-button`
  hero CTAs, badges, gradient headline text, the entry brand rail — moments
  that should feel premium. Gold is never the primary UI colour: no gold
  body links, no gold routine buttons, no gold focus rings. Where a screen
  uses gold for an everyday control, that's a bug — point it at teal.
- **Navy is the brand's voice**, not a paint bucket. Deep navy grounds dark
  surfaces, the entry brand rail, and hero moments; it is not a text colour
  for body copy.
- **Semantic colours stay semantic.** Risk/warn/ok/support and `--info`
  carry status, not brand. Never re-hue a status to match the palette.
- **Charcoal** is the neutral dark for toasts, ink and premium panels that
  should not read as navy.

### Themes — two designed surfaces, light first

- Light is the default; dark is a peer, not a fallback. Both ramps are
  designed, not derived — verify both on any user-facing change
  (AGENTS.md already requires this).
- Resolution order is unchanged: stored choice → `prefers-color-scheme` →
  light. A user's OS setting wins; the toggle persists their override
  (`public/bootstrap-theme.js`, `src/lib/theme.tsx`).
- Marketing light sits on ivory (`--bg: #f6f2e9`); app light sits on the
  same family desaturated a step (`--bg: #f5f3ec`) so long sessions stay
  quiet. Both dark ramps share the charcoal-navy floor family.

### Accessibility floor

Same rules as before, restated so they survive the rebrand: `--text-3` and
every `-fg`/`-faint` text token hold ≥4.5:1 on the surfaces they render on
(WCAG AA); `--control-border` holds ≥3:1 against adjacent fills (1.4.11);
`--accent` and `--gold-strong` hold ≥4.5:1 as text. When tuning a ramp,
verify against the worst surface the token touches — including
gold-tinted panels — not just `--bg`.

## 3. What changed on 2026-09-18

- Brand navy `#0d1b2a` → `#0b1f3a`; dark floor `#081019` → `#060f1e`.
- Brand gold `#d4af37` (yellow gold) → `#c8a96b` (champagne); gradient and
  on-navy/on-dark shades retuned to match.
- New brand teal `#0f766e` (+ `#45c4b5` dark step) takes `--accent`,
  `--focus`, `--nav-active-*` and `::selection` on every surface.
- Marketing light moved from cool grey `#f3f5fa` to ivory `#f6f2e9`; app
  neutrals warmed to the same family.
- Chrome tints (`index.html`, `bootstrap-theme.js`, `theme.tsx`,
  `site.webmanifest`) updated to match.

The leaf logo and raster brand assets still read as gold on navy — the
champagne shift is inside the same family, so `public/brand/` assets were
not regenerated. If the mark is ever redrawn, re-export with the values
above, not the old `#d4af37`.

## 4. Token map

| Token                                                                                   | Lives in                         | Carries                                  |
| --------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------- |
| `--dutiva-navy`, `--dutiva-charcoal`, `--dutiva-ivory`                                  | `tokens.css :root`               | Foundation                               |
| `--dutiva-teal`, `--dutiva-teal-bright` (+ `-rgb`)                                      | `tokens.css :root`               | Interactive accent                       |
| `--dutiva-gold`, `--gold-gradient`, `--gold-bright`, `--gold-on-navy`, `--gold-on-dark` | `tokens.css :root`               | Executive accent                         |
| `--accent`, `--accent-soft`, `--focus`, `--nav-active-*`                                | `surfaces.css` per surface+theme | Resolve to teal                          |
| `--gold-*` surface set                                                                  | `surfaces.css` per surface+theme | Resolve to champagne                     |
| `--bg`, `--surface`, `--border`, `--text-*`                                             | `surfaces.css` per surface+theme | Navy/charcoal/ivory ramps                |
| `--risk-*`, `--warn-*`, `--ok-*`, `--support-*`, `--success`, `--info`                  | `surfaces.css`                   | Semantic status — off-limits to branding |

Rule that outlives this palette: **use the token, never the hex.** A colour
that exists as a token must be referenced as one (`bg-surface`,
`text-gold-fg`, `var(--accent)`); a new brand colour enters through
`tokens.css`, not through a component.
