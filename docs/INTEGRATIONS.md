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
a Vault *name* — never a secret. The wrappers are not executable by
`authenticated`, so even a fully compromised user JWT cannot read or write
credentials.

## Status words mean what they say

| Status         | Meaning                                                        |
| -------------- | -------------------------------------------------------------- |
| `pending`      | Row exists; no probe has succeeded (or store-only, see SMTP).    |
| `connected`    | A live provider probe succeeded — written only by the function.  |
| `error`        | A probe ran and failed (bad token, unreachable instance).        |
| `disconnected` | Secret revoked from Vault; `secret_ref` cleared.                 |

## Providers

| Provider        | Auth     | Phase 1 state                                              |
| --------------- | -------- | ---------------------------------------------------------- |
| `github`        | PAT      | Connectable — probe against github.com.                    |
| `gitlab`        | PAT      | Connectable — gitlab.com or self-managed `instance_url`.   |
| `smtp_email`    | password | Credentials stored in Vault; **never probed** — edge       |
|                 |          | functions can't open TCP. Status stays `pending` and the   |
|                 |          | UI says "saved, not verified".                             |
| `gmail`         | OAuth    | **Planned** — needs the Google OAuth flow; not started.    |
| `outlook`       | OAuth    | **Planned** — needs Microsoft OAuth; not started.          |
| `inbound_webhook` | minted | **Connectable (phase 2)** — the function mints a signed    |
|                 |          | endpoint + HMAC secret; deliveries land in                 |
|                 |          | `integration_events` (0162).                               |

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
Nothing consumes those rows yet — event processing is follow-up work.

## Deploy status

Applied and deployed: migrations `0161` + `0162` ran against project
`khtwpxnvziiyplaflwru` via `scripts/apply-migration.mjs` and are recorded
in `schema_migrations` (`check:migrations` reconciles clean);
`workspace-integration` and `integration-webhook` are deployed via
`supabase functions deploy`. `integration-webhook` carries an explicit
`verify_jwt = false` in `supabase/config.toml`; `workspace-integration`
keeps the default (JWT on).

Verified: POST to the ingest endpoint with an unknown key returns 404;
`check:migrations` OK; signature verifier covered by 10 vitest cases.
