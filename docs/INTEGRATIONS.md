# Workspace integrations

Connecting the workspace to outside tools. This doc is the contract: what
exists, what each status word means, and what is deliberately not built.

## What ships

- **`workspace_integrations`** table (migration `0161_workspace_integrations.sql`)
  — org-scoped connection records: provider, display name, status, non-secret
  `config`, `secret_ref`, `last_checked_at`. RLS: members read, org admins write.
- **`integration_events`** table (migration `0162_integration_events.sql`) —
  verified inbound-webhook deliveries; service-role insert only.
- **Provider catalog** — `src/features/app/views/settings/integrationsCatalog.ts`,
  the single list the Settings UI renders and the shape the DB CHECK constraint
  mirrors.
- **Settings → Connections** — `IntegrationsSection.tsx`, mounted in the
  Settings view. Admins set up, test, disconnect, remove; members see
  statuses read-only; demo mode shows the catalog with no rows.
- **`workspace-integration` edge function** — the only code path that
  touches a credential. Actions: `connect`, `test`, `disconnect`.
- **Vault secret wrappers** — `store_/read_/revoke_integration_secret`,
  SECURITY DEFINER functions executable by `service_role` only (0161).

## Security model

Credentials never pass through the table. The flow on connect:

1. Admin pastes a token in Settings → Connections. The client sends it once
   to `workspace-integration`.
2. The function authenticates the caller's JWT and checks
   `is_org_admin(organization_id, user.id)` via the caller's own JWT client.
3. It probes the provider API with the token:
   - **GitHub** — `GET https://api.github.com/user`
   - **GitLab** — `GET {instance_url|gitlab.com}/api/v4/user` (`PRIVATE-TOKEN`)
4. Only on a 200 does it store the token in Supabase Vault under the
   deterministic name `wi_<integration_id>` and write `status='connected'`
   plus the probed `account_login` into `config`.
5. Probe failure → `status='error'`; the row's `secret_ref` stays null and
   the token is discarded.
6. `disconnect` deletes the Vault entry and clears `secret_ref`. `remove`
   in the UI always disconnects first so no orphan secrets survive the row.

What a client-side reader can ever see: provider, name, status, config,
a Vault _name_ — never a secret. The wrappers are not executable by
`authenticated`, so even a fully compromised user JWT cannot read or write
credentials.

## Status words mean what they say

| Status         | Meaning                                                         |
| -------------- | --------------------------------------------------------------- |
| `pending`      | Row exists; no probe has succeeded (or store-only, see SMTP).   |
| `connected`    | A live provider probe succeeded — written only by the function. |
| `error`        | A probe ran and failed (bad token, unreachable instance).       |
| `disconnected` | Secret revoked from Vault; `secret_ref` cleared.                |

## Providers

| Provider          | Auth     | Phase 1 state                                             |
| ----------------- | -------- | --------------------------------------------------------- |
| `github`          | PAT      | Connectable — probe against github.com.                   |
| `gitlab`          | PAT      | Connectable — gitlab.com or self-managed `instance_url`.  |
| `smtp_email`      | password | Credentials stored in Vault; **never probed** — edge      |
|                   |          | functions can't open TCP. Status stays `pending` and the  |
|                   |          | UI says "saved, not verified".                            |
| `gmail`           | OAuth    | **Planned** — needs the Google OAuth flow; not started.   |
| `outlook`         | OAuth    | **Planned** — needs Microsoft OAuth; not started.         |
| `inbound_webhook` | minted   | **Connectable (phase 2)** — the function mints a signed   |
|                   |          | endpoint + HMAC secret; deliveries land in                |
|                   |          | `integration_events` (0162).                              |
| `inbound_email`   | minted   | **Connectable** — the function mints a receiving address; |
|                   |          | mail forwarded to it lands in `inbound_emails` (0164) via |
|                   |          | Resend's `email.received` webhook.                        |

**Signal is intentionally absent from the catalog.** It has no supported
public API for this use case; unofficial bridges are fragile and sit in a
ToS grey zone. The Settings UI names it in the deferred note so the gap is
visible rather than silently missing.

## Inbound webhooks (phase 2)

Admins create an endpoint in Settings → Connections → Incoming webhook.
`connect` on an `inbound_webhook` row takes **no** user credential — the
`workspace-integration` function mints an unguessable `webhook_key`
(48-hex URL segment) plus a `dwhsec_…` HMAC signing secret, Vaults the
secret under the usual `wi_<id>` name, and returns the URL + secret once.
Re-running connect on a live row rotates both ("Regenerate" in the UI).

Senders POST to `…/functions/v1/integration-webhook/<webhook_key>`:

```
X-Dutiva-Signature: t=<unix_seconds>,v1=<hex>
X-Dutiva-Event: <event type>            # optional; falls back to payload.type
```

`v1` is `hex(HMAC_SHA256(signing_secret, "${t}.${raw_body}"))` — the same
scheme Stripe uses, verified by a WebCrypto-only helper
(`supabase/functions/integration-webhook/verify-signature.ts`) with a
5-minute replay window and constant-time compare. `integration-webhook`
runs with `verify_jwt = false` (config.toml) because there is no user JWT
in the flow — the signature is the auth.

Valid deliveries insert one row into `integration_events`
(org-scoped, members read, admins delete, service-role-only insert).

**Consumption (migration `0163`).** After storing the row the ingest calls
`_integration_event_notify_admins(event_id)` — a service-role-only
function that mirrors the signing-notification fan-out: one
`hr_workspace_notifications` row (`kind = 'integration_event'`, bilingual
title, body = `event_type — payload.summary|title|message` truncated to
180 chars, href → `/app/settings`) per active owner/admin member, then
`processed_at` is stamped. The kind check on that table gained
`'integration_event'` in the same migration. If the notify RPC fails the
delivery still returns 202 and `processed_at` stays NULL — the
`integration_events_unprocessed_idx` partial index keeps those rows
findable for a later consumer. A connected webhook row in Settings →
Connections also shows its last 10 deliveries with a stored/notified
state chip.

What events do **not** yet do: create or update business records
(CRM contacts, comms items, …). The notification is the first consumer —
routing specific `event_type`s into domain tables is the next slice and
should land beside the notify function, not in the client.

## Inbound email — the practical alternative to mailbox OAuth

Gmail/Outlook OAuth stays **planned**: it needs Google/Azure app
registrations and review, and most of what a workspace wants — "mail that
matters lands where the team can see it" — doesn't need it. `inbound_email`
covers that share with a receiving address instead of mailbox access.

Admins create it in Settings → Connections → Inbound email. `connect` on an
`inbound_email` row takes **no** credential — `workspace-integration`
mints an unguessable `email_key` (48-hex), writes `config.email_key` +
`config.inbound_address`, marks the row `connected`, and returns the full
address once: `in-<key>@<inbound-domain>` (`INBOUND_EMAIL_DOMAIN` env,
default `in.dutiva.ca`). The address stays readable in `config` — it isn't
a secret, just unguessable. Users forward or BCC mail to it from any mail
client.

The receive path:

1. **MX** — the inbound domain's MX records point at Resend's inbound
   servers (Resend dashboard → Domains → receiving). One-time DNS setup.
2. **Webhook** — a Resend webhook subscribed to `email.received` posts to
   `…/functions/v1/inbound-email`. That webhook's signing secret goes in
   `RESEND_INBOUND_WEBHOOK_SECRET` (the function falls back to
   `RESEND_WEBHOOK_SECRET`, but the delivery webhook and the inbound
   webhook are separate Resend endpoints with separate secrets — set the
   dedicated one).
3. **Verify** — `inbound-email` runs `verify_jwt = false` (config.toml);
   auth is the Svix signature (`svix-id` / `svix-timestamp` /
   `svix-signature`, 5-minute tolerance, constant-time compare — the same
   scheme `resend-webhook` verifies). Missing secret → 503; bad or stale
   signature → 401; non-`email.received` types → ignored with 200.
4. **Route** — the `email.received` payload is **metadata only** (no
   body). The function extracts the `in-<key>` local part from `to` /
   `received_for` (`addressKey.ts`) and resolves it to the connected
   `inbound_email` row via `config->>email_key`. Unknown key → 404.
5. **Fetch** — the body is pulled from Resend's Receiving API
   (`GET /emails/receiving/<email_id>`) with `RESEND_API_KEY`, truncated
   at 200 KB text / 500 KB HTML. Best-effort: if the fetch fails the row
   still stores with null bodies — the delivery isn't lost and the
   metadata (from, subject, attachment list) is intact.
6. **Store + notify** — one `inbound_emails` row (org-scoped; members
   read, admins delete, service-role-only insert) then
   `_inbound_email_notify_admins(email_id)` fans out a bilingual
   `hr_workspace_notifications` row (`kind = 'inbound_email'`) to active
   owner/admins and stamps `processed_at`. A unique
   `(integration_id, provider_email_id)` index makes Resend retries
   return `202 {duplicate:true}` without re-notifying. Settings shows the
   last 10 received messages on the connected row.

What this is **not**: it does not read or sync an existing Gmail/Outlook
mailbox, does not send as the user, and does not replace provider OAuth —
if full two-way mailbox sync ships later it's a separate flow. Attachment
bodies aren't stored (metadata only); they're fetchable later by
`provider_email_id` if a download surface ships.

## Deploy status

Applied and deployed: migrations `0161`–`0164` ran against project
`khtwpxnvziiyplaflwru` via `scripts/apply-migration.mjs` and are recorded
in `schema_migrations` (`check:migrations` reconciles clean);
`workspace-integration`, `integration-webhook`, and `inbound-email` are
deployed via `supabase functions deploy`. `integration-webhook` and
`inbound-email` carry explicit `verify_jwt = false` in
`supabase/config.toml`; `workspace-integration` keeps the default (JWT on).

Verified: POST to the ingest endpoints unsigned returns 401;
`check:migrations` OK; signature verifiers and the address-key extractor
covered by vitest cases.

Live inbound-email smoke (2026-09-20, since torn down): a throwaway org +
owner drove the real path — `connect` minted `in-<48-hex>@in.dutiva.ca`;
a Svix-signed `email.received` POST returned 202, stored the row (null
bodies — synthetic `email_id` 404s on the Receiving API, the best-effort
fallback working as designed), fanned out the bilingual admin
notification, and stamped `processed_at`; a repeat delivery returned
`202 duplicate`; bad signature → 401; unknown key → 404; non-received
event type → ignored. All fixtures and the temporary signing secret were
removed afterward.

Live smoke (2026-09-20, since torn down): a temporary owner/admin user
in a throwaway org drove the real client path — `workspace_integrations`
insert over REST (RLS), `connect` with a real GitHub token probed
`api.github.com/user` and returned `connected` / `account:
martinconstantineau`, `test` re-probed the Vault-held secret, webhook
`connect` minted endpoint + `dwhsec_` secret, a signed POST landed a
`smoke_test` `integration_events` row (processed_at stamped) and an
`integration_event` notification for the org owner; a bad signature got 401. Test org, user, rows and Vault secrets were deleted afterward.
