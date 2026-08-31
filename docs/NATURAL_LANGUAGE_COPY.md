# Natural language copy — how Dutiva writes

Standing guide for anyone (human or agent) writing user-facing prose in this
repo: marketing pages, UI strings, FAQ, changelog, help, comparison copy,
and Advisor chrome. Engineering tone in code comments is out of scope.

**Facts and claims** still come from [CANONICAL_FACTS.md](./CANONICAL_FACTS.md).
This document governs _how_ we say true things — not what we are allowed to
assert.

Cursor agents also load a short always-on summary in
`.cursor/rules/natural-language-copy.mdc`.

## The goal

Natural writing is competent human communication, not “grammatically correct
but oddly robotic.” We model **communication**, not just next-token language.

Humans continuously decide:

| Decision   | Question                                             |
| ---------- | ---------------------------------------------------- |
| Intent     | What am I trying to accomplish on _this_ surface?    |
| Audience   | Who is reading (employer, HR lead, consultant)?      |
| Context    | What do they already know from the page above?       |
| Tone       | Formal, direct, cautious — match the relationship    |
| Density    | What can stay unsaid?                                |
| Rhythm     | Short. Then longer. A fragment when it earns it.     |
| Emphasis   | Which point actually matters?                        |
| Social fit | Would this sound patronizing, salesy, or artificial? |
| Revision   | Read it back — is any line awkward or generic?       |

The last step is mandatory: **draft → evaluate → revise**.

## Process

1. Write the draft for the real intent and audience.
2. Score it against the ban list below and against hedge rules in
   `CANONICAL_FACTS.md` / `AGENTS.md`.
3. Rewrite until a busy Canadian HR reader would believe a colleague wrote it.
4. Ship EN and FR together. FR must not upgrade EN hedges. Mark
   `[FR self-authored]` when the handoff had no French.

### Bad → better

> It is important to note that this approach provides several significant
> advantages. Additionally, it can be particularly beneficial when efficiency
> is a primary consideration.

> The main advantage is speed. It’s especially useful when efficiency matters.

Same information. Natural density and rhythm.

## Ban list (AI tells)

Do not ship these patterns in product or marketing copy:

- Filler openers: “It is important to note”, “Please note that”, “Additionally”
- Corporate fog: “leverage”, “robust”, “seamless”, “empower”, “unlock”
- Unprovable absolutes: “Everything you need”, “Every Canadian HR document”
- Transformation formula: “from guesswork into structured, reviewable…”
- Platform metaphor: “AI operating system”, “intelligence layer”
- Engineer labels in chrome: “engine”, “structured output”, “route gates”
- Generic companion: “Ask me anything”, over-reassurance essays on limits
- Default symmetry: “It’s not just X — it’s Y”, “not only… but also”
- Abstract slogans: “Foundational HR infrastructure”, “cleaner HR foundation”
- Anthropomorphizing: “speaks French as fluently as English” (say bilingual)
- Third-person corporate “they/their” when the page is already about the product
  by name
- FR claim upgrades (e.g. EN “PIPEDA-conscious” → FR “Conforme à la LPRPDE”)

Controlled messiness is fine (fragments, contractions, uneven sentence length).
Uncontrolled randomness is not.

## Prefer

- **Concrete verbs and objects** — documents, deadlines, cases, statutes
- **Name the next action** — “Open Advisor”, “Generate a document”, “Sign in”
- **Product vocabulary that is deliberate** — “compliance-oriented”,
  “review-ready”, “jurisdiction-aware”, “PIPEDA-conscious” (do not “improve”)
- **Contractions** in app UI where a human would (`couldn't`, `you're`)
- **Formal hedges** only where legal: standing disclaimer stays as written via
  the shared `Disclaimer` component — never rephrased for style
- **Statute naming** where coverage is claimed — name the act, not only the
  province

## Surface-specific notes

| Surface                   | Voice                                                     |
| ------------------------- | --------------------------------------------------------- |
| Marketing hero / CTAs     | One job, concrete; no slogan-ese                          |
| FAQ / Known limitations   | Plain limits; no fake confidence                          |
| Comparison pages          | Specific, hedged competitor claims; no cheerleading       |
| App empty states / errors | Short; “Couldn't X. Try again.”                           |
| Advisor workspace chrome  | What the panel _shows_, not how it is built               |
| Usage limits              | One short clause that the rest of the product still works |

## Style as policy (Martin / Dutiva)

When editing founder or brand voice, prefer:

- Direct over soft hedges that add no legal value
- Full name **Martin Constantineau** where the founder is named
  (`CANONICAL_FACTS.md`)
- EN/FR switching as a product fact, not a personality flourish
- Argument structure: observation → who built it → what the product is / is not

Do not invent a new house style ad hoc. Change this file when the policy
changes.

## Checklist before merging copy

- [ ] Intent and audience clear for this surface only
- [ ] No ban-list tells; no new product claims
- [ ] Hedges match EN ↔ FR strength
- [ ] Disclaimer untouched (or still via `Disclaimer`)
- [ ] Facts match `CANONICAL_FACTS.md` / code
- [ ] Read aloud once — would you send this to another CEO or HR lead?
