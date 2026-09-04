# Export protection

Watermarking, fingerprinting, velocity limits and an audit trail for
everything a user takes out of Dutiva — Document Studio PDFs and Word files,
"Copy link" shares, and the Advisor memory JSON.

## Threat model — what this does and does not do

Dutiva's generated documents, templates and Advisor output are company work
product. Once a user can _see_ content, no client-side mechanism can make
copying it impossible — screenshots, retyping, and the browser's own dev
tools defeat any DRM a web app could ship, and pretending otherwise would be
security theatre. What this system delivers instead is the set of properties
that actually deter and resolve content theft:

| Property         | Mechanism                                                                    |
| ---------------- | ---------------------------------------------------------------------------- |
| **Attribution**  | Every export is stamped with who exported it, when, and a unique export ID   |
| **Traceability** | A leaked copy — even a pasted excerpt — resolves back to that export         |
| **Detection**    | Every export is recorded; bulk patterns are visible and rate-limited         |
| **Prevention**   | Velocity ceilings stop bulk exfiltration (the whole library in an afternoon) |
| **Deterrence**   | The artifact says, visibly, that it is traceable to the exporting account    |

An export that was never authorized (velocity ceiling hit) never produces an
artifact at all. An export that was authorized is deliberately _not_ blocked
from being shared — HR documents exist to be sent to employees — but no copy
of it is anonymous.

## The three fingerprint channels

Each export gets a UUID (`export id`) carried through redundant channels,
because any single channel can be stripped (`src/lib/exportProtection/`):

1. **Visible watermark** — an identity + confidentiality line at the end of
   text/Word exports and in the footer of _every_ PDF page:
   `Exported from Dutiva — {workspace} · {name} ({email}) · {UTC time} ·
Export ID {id}.` Survives print, screenshot, and PDF re-save.
2. **Invisible zero-width tag** (`fingerprint.ts`) — the id encoded as
   ZWNJ/ZWSP runs between WORD JOINER sentinels, woven into the exported
   text (Word body / JSON notice string). Survives copy-paste of the content
   itself — exactly the path a visible footer gets cropped from.
   `decodeInvisibleTag()` recovers it from a leaked snippet.
3. **Artifact metadata** — PDF `/Info /Keywords (dutiva-export-id:…)` +
   `/Author`; Word core keywords + custom property `dutiva-export-id` in
   the `.docx` package; the JSON `_export` manifest (id, actor, workspace,
   timestamp, content SHA-256). Survives file re-saves that keep the format.

The PDF body deliberately carries no zero-width tag (WinAnsi has no encoding
for those code points); its per-page footer + Info dict do that job.

## Enforcement and audit

- **Client guard** (`localAudit.ts`) — a device-local sliding window over
  the export trail: 12 exports / 5 min, 100 / 24 h. Works offline, demo
  mode included. Clearing site data resets it — it is friction for the
  casual case, not the boundary.
- **Server guard** (`claim_export_slot`, migration `0033_export_audit.sql`;
  `record-export` edge function) — the boundary a cleared localStorage
  cannot reset: 10 / 5 min, 80 / 24 h per account (env-overridable:
  `EXPORT_BURST_WINDOW_SECONDS`, `EXPORT_BURST_LIMIT`,
  `EXPORT_DAILY_LIMIT`). Check-and-reserve under an advisory lock (same
  pattern as `claim_ai_usage`, 0027), so concurrent clicks cannot race past
  the ceiling. On allow it writes the authoritative `export_events` row and
  mints the export id the client embeds; its 429 is final.
- **Audit trails** — every allowed export lands in:
  - `export_events` (server, signed-in exports): user, surface, kind,
    title (capped), content SHA-256, char count, language, timestamp.
    Service-role only; RLS enabled with no client policies. On account
    deletion rows are kept but unlinked (`on delete set null`) — an
    already-leaked artifact stays resolvable to "a deleted account,
    exported at T" without retaining identity.
  - the device trail (`dutiva-export-audit` localStorage ring buffer),
    surfaced in **Settings → Export activity** — including demo/offline
    exports that never reached the server.

Order of authority in the client (`authorize.ts`): local guard → server
claim (signed in) → on server 429, refuse; on server _unreachable_ (offline
PWA, function not deployed), proceed under the local decision with a
locally-minted id, marked `recordedRemotely: false`. Offline export keeps
working by design (docs/OFFLINE_PWA.md); what is lost offline is only the
server copy of the audit row, never the watermark.

## Tracing a leaked document

1. Get the export id:
   - visible footer / last page of the PDF, or
   - `decodeInvisibleTag(pastedText)` (`src/lib/exportProtection`) for a
     pasted excerpt, or
   - the file's metadata (PDF Info dict / Word meta / JSON `_export`).
2. Look it up (service role):
   `select * from export_events where id = '<export id>';`
   → who, when, which document, which format, and the content hash to
   confirm (or show tampering against) the leaked copy.
3. Device-only exports (demo/offline) appear in the exporting device's
   Settings → Export activity with the same id.

## Operations — the two halves (AGENTS.md rule)

Merging this feature does **not** activate the server half. After merge:

1. Apply migration `0033_export_audit.sql` to the project
   (`supabase db push`, or the MCP `apply_migration`).
2. Deploy the `record-export` edge function (default `verify_jwt` on — the
   function checks the bearer itself and requires workspace membership).
3. Verify: sign in as a beta account, export a document, then confirm a row
   in `export_events` and that the artifact's footer carries the same id.

Until both are done the client degrades cleanly: exports still watermark and
audit locally (`recordedRemotely: false`), and the server ceilings simply do
not bind — worth closing quickly, since the server guard is the one users
cannot reset.

## Known limits and follow-ups

- ~~The Advisor chat "Copy" button and on-screen text are not watermarked —
  screen content is the analog hole; watermarking starts at _export_.
  A future pass could run copies through the same pipeline.~~ **Done (EF3,
  2026-08-06).** The Copy button now runs through the same `authorizeExport`
  pipeline as Document Studio (`surface='advisor'`, `kind='text'`), so every
  copied message carries an invisible zero-width tag that resolves to an
  `export_events` row. On-screen text remains unwatermarked (the analog hole);
  the Copy button is the boundary where content leaves the product.
- Zero-width tags do not survive re-typing or aggressive sanitizers; that is
  why three channels exist, and why the visible line names the exporter.
- ~~The server trail is read through service-role tooling today; an in-app
  admin viewer over `export_events` is a natural follow-up once the
  admin-reporting surface exists.~~ **Done (EF3, 2026-08-06).** An admin
  viewer is live at `/app/support/admin/exports`, reading through the
  `export-audit-trail` edge function (service-role, `is_admin`-gated
  server-side). The table itself stays service-role-only with zero client
  policies — the edge function is the only read path. Supports filtering by
  surface/kind, pagination, and forensic lookup of a single export id.
- If real file storage (Supabase Storage) arrives, downloads should move to
  short-lived signed URLs so links themselves expire. Not applicable today —
  exports are generated client-side as Blob downloads, not stored in
  Supabase Storage.
