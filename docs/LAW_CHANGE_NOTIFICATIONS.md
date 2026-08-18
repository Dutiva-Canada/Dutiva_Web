# Law-change notifications

**Status: §4's decisions are made (2026-08-06) and built the same day. Nothing
sends until the owner steps in §7 are done — see there for exactly what's
missing.**

Today a detected law change lands in `law_updates` and waits to be read. Nobody
is told. A customer learns their jurisdiction's employment standards moved only
if they happen to open the Knowledge panel — which, for a compliance product,
is close to the feature not existing.

This document is the groundwork: what is already true, what has been built, and
the decisions that have to be made by a person before anything can be sent.

> **Not legal advice.** The CASL discussion below is engineering analysis of how
> the law shapes the architecture. Dutiva's own standing boundary applies to
> Dutiva: get the determination in §2 confirmed by counsel before the first
> message goes out.

## 1. What already exists

| Piece | State |
| --- | --- |
| Detection | Working (Federal) / not yet live (ON, QC) — `law_updates` gets a `change` row per amendment (`docs/LAW_MONITORING.md`) |
| Relevance filter | **Built** — `supabase/functions/_shared/lawUpdateRelevance.ts` |
| Review gate | **Built** — `law_updates.review_status` (migration `0046`); only a human flips a row to `reviewed` |
| Recipient jurisdiction | Resolver **built** — `resolveRecipientJurisdictions()`; not wired to a real recipient yet (internal pilot only) |
| Recipient language | Available — `profiles.language_default`, `organizations.default_language`; unused in the internal-only digest (English) |
| Digest send | **Built** — `send-law-updates`, weekly, via the same `resendSend()` helper `support-notify` uses |
| Consent record | **Missing — see §3** (not blocking while recipients are internal) |
| Recipient model | **Decided — see §4a.** Internal-only pilot. |

### The relevance filter

`lawUpdateRelevance.ts` answers "is this row a real, supported, customer-facing
law change?" — the part that is true regardless of how the decisions below are
settled. Two rules, both fail-closed:

- **Only `change` events.** `first_seen` means we started watching a page.
  `redirect` is our plumbing. `broken` is a report that *Dutiva's own scraper*
  failed — operationally urgent, and the last thing a customer should receive
  dressed as legal news.
- **Only ON / QC / FED.** The monitor watches 14 jurisdictions; Dutiva supports
  three. An unmapped jurisdiction returns `null`, never "pass it through".

A recipient with no jurisdiction on file receives **nothing**, not everything.
An unknown jurisdiction is a gap to fill, not a licence to send.

## 2. The CASL question, and why it drives the design

CASL governs *commercial electronic messages* — broadly, messages one purpose
of which is to encourage participation in a commercial activity. Two paths make
a law-change email lawful, and they lead to different products:

**Path A — a service message, outside the CEM definition.** A purely factual
notice to an existing customer about the service they already pay for is
arguably not a CEM at all; CASL also excludes messages that provide factual
information about the ongoing use or purchase of a subscription. On this
reading a bare "the Ontario ESA was amended on `<date>`; here is the section and
the official source" is a service message.

**Path B — a commercial message requiring consent.** The moment the email
carries an upsell, a plan comparison, a "refer a colleague", or marketing
footer, it is a CEM. It then needs consent, an identified sender, and a working
unsubscribe — and consent must be **provable by the sender**, not by the
recipient.

**This is the architectural fork, not a copywriting detail.** Path A buys
deliverability to every customer with no consent burden, but only if the
message stays austere forever — one marketing link retroactively reframes the
whole channel. Path B is unrestricted in content but reaches only people whose
consent you can evidence.

**Recommendation: build Path A, and enforce it structurally** — no promotional
content in the law-change template, ever, with the constraint written into the
template rather than left to whoever edits copy next. Then a marketing
newsletter, if wanted later, is a separate channel with its own consent, rather
than something that quietly contaminates this one.

Either path needs an unsubscribe/preference control. Under Path A it is
courtesy and good practice; under Path B it is mandatory. Build it regardless.

## 3. Finding: consent is collected but never recorded

The marketing signup asks for express CASL consent and the client refuses to
submit without it (`BetaSignup.tsx`, `landing_cta_consent_label`: *"Yes, email
me product updates about Dutiva. I can unsubscribe at any time."*). The value is
sent to `create-beta-signup` as `consent`.

**`beta_signups` has no column to store it.** Columns are `id, email, name,
company, team_size, province, role, hr_challenge, source, created_at, status,
internal_notes, language` — the consent flag is collected, transmitted, and
dropped.

Why this matters: under CASL the **burden of proving consent falls on the
sender**. Consent you cannot evidence — with a timestamp, the wording agreed
to, and how it was obtained — is not consent you can rely on when asked. Right
now Dutiva is asking correctly and keeping no record of the answer.

This is not blocking for Path A, which does not rest on consent. It *is*
blocking for Path B, and it is worth fixing on its own account regardless of
which path is chosen, because the consent is already being collected — the only
thing missing is writing it down.

**Suggested fix (not done here — it changes a live signup path):** add
`consent_granted boolean`, `consent_text text`, `consent_at timestamptz`,
`consent_source text` to `beta_signups`, and persist them. Storing the exact
wording matters: proving consent means proving what someone agreed to, and that
sentence will be edited eventually.

## 4. Decisions — settled 2026-08-06

**a. Who receives them? Internal-only.** A digest to `SUPPORT_OPERATOR_EMAIL`
(default `support@dutiva.ca`), so the pipeline and the summary quality are
proven before this ever reaches a customer. Because the recipient is an
operational alias, not a customer, **the CASL Path A/B fork in §2 does not
apply to this phase** — revisit it before the recipient model expands past
internal-only, not before.

**b. Immediate or digest? Weekly.** Amendments are rare and rarely
same-day urgent; a weekly digest is calmer and fails softly if a run is
missed. Scheduled Mondays 08:00 UTC.

**c. Which jurisdiction decides relevance?
`organizations.default_jurisdiction` wins over `profiles.province` when both
are set**, falling back to `profiles.province`, and to nothing (not "send
everything") when neither resolves to a supported jurisdiction — see
`resolveRecipientJurisdictions()` in
`supabase/functions/_shared/lawUpdateDigest.ts`. **Not wired to a real
recipient yet**: the internal pilot digest sends every supported
jurisdiction to the one internal address, because there is no per-customer
targeting to resolve against yet. The rule is decided and tested ahead of
that expansion rather than invented then.

**d. What does the message contain, and is it reviewed first? Yes, human
review required.** An unsupervised model summary reaching an inbox is a
materially different risk than one shown in the Knowledge panel a reader
chose to open. `law_updates.review_status` (0046) gates this the same way
`advisor_guidance_chunks.review_status` gates the Advisor corpus (TODO.md
L5) — every row is `machine_curated` by construction (the monitor's own
model writes `change_summary` at detection time), and only a human flipping
a row to `reviewed` makes it digestable. **No review UI exists yet** —
deliberately, for a low-volume internal pilot; see 0046's comment for the
direct-SQL review step and the query that finds what's waiting.

**e. Where does the boundary sit? Shipped.** The standing disclaimer is
appended to every digest email (`send-law-updates/index.ts`) — an email
carrying model-written summaries is a generated document leaving the
product, same as any other.

## 5. Architecture — built 2026-08-06

Reused the proven pattern rather than inventing one, per the plan this
section used to propose:

1. **`law_update_notifications`** (migration `0046`) — an outbox in the same
   shape `support_notifications` established, with a uniqueness constraint
   on `(law_update_id, recipient)` so a retry or an overlapping cron run can
   never double-send the same amendment to the same recipient. One row per
   *(update, recipient)* that has been digested — not one row per digest
   email.
2. **`send-law-updates`** (new edge function): selects `change` rows,
   narrows through `lawUpdateRelevance.ts` (unchanged — this module already
   answered "is this customer-relevant at all" before any of §4 was
   decided), then through `selectDigestableUpdates()` (reviewed, past the
   go-live cutoff, not already sent), composes one plain-text digest, and
   sends via the same `resendSend()` helper `support-notify` uses (pulled
   into `_shared/resendSend.ts` so both share one request shape).
3. **Scheduled by `pg_cron`** (`law-update-digest-weekly`, Mondays 08:00
   UTC) — same reasoning as `docs/LAW_MONITORING.md`: a schedule that lives
   with the data cannot be lost to a hosting move.
4. **Preference control / unsubscribe: not built.** Only matters once
   recipients are real customers (Path B), which this phase deliberately
   isn't yet — see (a).

**No backfill dump, two ways.** `send-law-updates` only digests reviewed
rows (nothing old is pre-reviewed by construction) *and* enforces a fixed
`GO_LIVE_AT` floor on `detected_at` as a second, independent guard — belt
and suspenders for the exact failure this section used to warn about.

## 6. Finding, still open: consent is collected but never recorded

Unchanged from before this pass — §3 above. Not blocking for the current
internal-only phase (no customer consent is needed to email
`support@dutiva.ca`), but still real, and still blocking for Path B whenever
that's decided.

## 7. Prerequisite, and what's left to turn this on

The monitor prerequisite this section used to state is **partly resolved**:
Federal has a reliable source (`docs/LAW_MONITORING.md`), and Ontario/Québec
now have real sources implemented (TODO.md EF2) — but none of the three has
completed a live sweep yet (`OA1`/`OA2` are still open), so `law_updates` has
no rows to review today regardless of what's built here.

Three owner steps, each independently a no-op until done:

1. `law_monitor_service_key` (OA1) and the ON/QC/FED sources actually
   running — without any `law_updates` rows, there is nothing to review or
   digest.
2. Deploy `send-law-updates`, and set `RESEND_API_KEY` /
   `SUPPORT_EMAIL_FROM` / `SUPPORT_OPERATOR_EMAIL` (OA3 — likely already set
   if support email is on).
3. `law_update_digest_service_key` in Vault, so the Monday cron can actually
   invoke the function:

   ```sql
   select vault.create_secret(
     '<service-role or secret key>',
     'law_update_digest_service_key',
     'Service key used by the send-law-updates cron job'
   );
   ```

Verify with `select * from public.law_update_digest_status();`. Federal is
the one supported jurisdiction with a reliable source proven live today, so
in practice the first real digest content will be federal-only regardless of
step 1's ON/QC progress.
