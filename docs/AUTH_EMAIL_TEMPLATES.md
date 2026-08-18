# Auth email templates

> **Owner action required — one command.** Auth email templates live in project
> config, not in Postgres, not in a migration, and not in `supabase/config.toml`
> (whose `[auth.email.template.*]` entries configure the **local** stack only).
> They can be set through the Management API, which needs a personal access
> token — so this repo ships the change as a script rather than as a paragraph
> of click-here instructions:
>
> ```bash
> SUPABASE_ACCESS_TOKEN=sbp_… SUPABASE_PROJECT_REF=… npm run auth:email-templates
> ```
>
> Get a token at <https://supabase.com/dashboard/account/tokens>. Add
> `-- --dry-run` to print the current templates without writing. The script
> PATCHes only the four template fields — unrelated auth settings (site URL,
> redirect allow-list, token expiry) are untouched — then re-reads the config
> and fails unless both templates really contain `{{ .Token }}`, so a field the
> API ignored cannot read as success.
>
> The equivalent paste-into-the-dashboard route (**Authentication → Emails →
> Templates**) is below and produces the same result.
>
> Everything else described here already ships in the code.

## Why this file exists

On **2026-08-08** sign-in was broken for the admin account. The auth logs told
the whole story:

| Time (UTC) | Event | Source |
| --- | --- | --- |
| 17:02:05 | magic link emailed | — |
| 17:02:38 | `POST /verify` → **200, login succeeded** | 74.125.184.186 (**Google**) |
| 17:02:39 | `GET /user` → 200, then silence | 74.125.184.186 (**Google**) |
| 17:03:40 | `POST /verify` → **403** `otp_expired` | 104.28.132.22 (the user) |
| 17:04:51 | `POST /verify` → **403** `otp_expired` | 172.253.15.224 (Google) |
| 17:05:15 | `POST /verify` → **403** `otp_expired` | 104.28.132.27 (the user) |

Google Workspace's pre-delivery link scanner opened the link 33 seconds after
the email was sent, **ran the page's JavaScript**, completed `verifyOtp`, and
threw the resulting session away. The one-time token was spent, so every real
click afterwards failed with "One-time token not found".

`AuthConfirm.tsx` had already been built to defeat *prefetching* scanners — it
uses `token_hash` + `verifyOtp` in the browser rather than Supabase's default
GET `/auth/v1/verify` link. The assumption it rested on, stated in its own
comment, was that a scanner has "no JS". That assumption was wrong.

## What the code does now

1. **`AuthConfirm` spends the token only on a click.** Landing on
   `/app/auth/confirm` with a `token_hash` renders a "Confirm sign-in" button
   and verifies nothing until it is pressed. Scanners render pages; they do not
   press buttons. (The `?code=` PKCE branch stays one-click — it already
   requires a `code_verifier` from the requesting browser's storage, which a
   scanner does not have.)
2. **A typed 6-digit code can complete a sign-in on its own**
   (`verifyEmailCode` in `authContext`/`AuthProvider`, surfaced by `AuthPanel`
   and `AuthSignInForm`). This is the robust path: a code cannot be spent by
   anything that merely fetches or renders a URL, on any mail provider.

## What the templates need to say

The code path only works if the email actually contains the code — `{{ .Token }}`
in both templates below. `npm run auth:email-templates` applies exactly this;
the markup here is the same content, for pasting into the dashboard instead.

> The Management API field names the script writes
> (`mailer_templates_magic_link_content`, `mailer_subjects_magic_link`, and the
> `…_confirmation…` pair) could not be exercised from the environment this was
> written in — its egress policy blocks `api.supabase.com`. That is exactly why
> the script verifies by re-reading the config afterwards instead of trusting
> the PATCH: if a name is wrong, it exits non-zero and says so rather than
> reporting success. If that happens, use the dashboard route below.

---

> **Note.** `{{ .Token }}` (the 6-digit code) and `{{ .TokenHash }}` (used in
> the link) are two representations of the *same* one-time credential —
> spending either spends both. That is safe now only because the link no longer
> auto-spends. Keep both in the email: the link is the fast path, the code is
> the one that always works.

### Magic Link

```html
<h2>Sign in to Dutiva</h2>

<p>Your sign-in code:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;">{{ .Token }}</p>
<p>Enter it on the sign-in screen. It expires shortly and can be used once.</p>

<p>Or <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=magiclink">sign in on this device</a>.</p>
```

### Confirm signup

Identical, but `type=signup`:

```html
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a></p>
```

`{{ .RedirectTo }}` resolves to the `emailRedirectTo` set in `AuthProvider` —
the current origin's `/app/auth/confirm`. Keep the templates pointing there
rather than at the default `{{ .ConfirmationURL }}`, which is the GET verify
endpoint that any prefetch will spend.

`verifyEmailCode` tries OTP type `email` first and falls back to `signup`, so a
first-time account and an existing one both work from the one sign-in form. A
type mismatch is a lookup miss, not a spend, so the fallback costs nothing.

## Also worth doing (not code)

**Google Admin console → Apps → Google Workspace → Gmail → Safety → Links and
external images.** Turning off link pre-scanning (or scoping it so it does not
apply to internal mail) stops Google opening these links at all. The code
changes above make sign-in work regardless, but this removes the cause rather
than tolerating it.

Microsoft 365's Safe Links behaves the same way for any future customer on
Outlook — which is the reason the typed code exists rather than relying on the
click gate alone.
