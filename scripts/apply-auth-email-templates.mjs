/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
/**
 * Applies the sign-in email templates to the live Supabase project.
 *
 * These templates are the other half of the 2026-08-08 sign-in fix. The code
 * side shipped in #184: /app/auth/confirm now spends its one-time token only on
 * a click, and a typed 6-digit code can complete a sign-in on its own. But the
 * code path is inert until the email actually contains the code, and Supabase's
 * auth email templates live in project config — not in Postgres, not in a
 * migration, and not in supabase/config.toml (whose [auth.email.template.*]
 * entries configure the LOCAL stack only). The one way to set them
 * programmatically is the Management API, which needs a personal access token.
 *
 * Hence this script rather than a paragraph of dashboard instructions: it makes
 * the change reviewable in git, repeatable after any project restore, and
 * verified rather than assumed.
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_... SUPABASE_PROJECT_REF=... \
 *     node scripts/apply-auth-email-templates.mjs
 *
 * Add --dry-run to print the current templates and exit without writing.
 *
 * It PATCHes only the four fields below, so unrelated auth settings (site URL,
 * redirect allow-list, token expiry) are never touched — unlike `supabase
 * config push`, which would push a whole [auth] block this repo does not have.
 * Afterwards it re-reads the config and fails unless both templates really
 * contain {{ .Token }}, so a silently-ignored field cannot read as success.
 *
 * Dependency-free (global fetch only), same house style as check-migrations.mjs
 * and check-rls.mjs.
 */

import { ACCESS_TOKEN_HELP, cleanSecret, describeSecret } from './lib/secrets.mjs'

const API = 'https://api.supabase.com'

/**
 * Why both a code and a link, in that order:
 *
 * {{ .Token }} is the 6-digit code and {{ .TokenHash }} is the same one-time
 * credential in hashed form — spending either spends both. A mailbox security
 * scanner can spend a link (Google Workspace's runs JavaScript and did exactly
 * that, burning the token 33s after send and locking the admin out), but it
 * cannot type a code. The link is kept because it is the fast path and is safe
 * now that the confirm route waits for a click — if that click gate is ever
 * removed, the link has to go with it.
 */
const MAGIC_LINK_HTML = `<h2>Sign in to Dutiva</h2>

<p>Your sign-in code:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;">{{ .Token }}</p>
<p>Enter it on the sign-in screen. It can be used once and expires shortly.</p>

<p style="margin-top:24px;">Or <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=magiclink">sign in on this device</a>.</p>

<p style="color:#6b7280;font-size:12px;margin-top:24px;">If you didn't request this, you can ignore this email.</p>`

const CONFIRMATION_HTML = `<h2>Confirm your email</h2>

<p>Your confirmation code:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;">{{ .Token }}</p>
<p>Enter it on the sign-in screen. It can be used once and expires shortly.</p>

<p style="margin-top:24px;">Or <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=signup">confirm on this device</a>.</p>

<p style="color:#6b7280;font-size:12px;margin-top:24px;">If you didn't request this, you can ignore this email.</p>`

/* Management API field names for the two templates this project sends. */
const PATCH_BODY = {
  mailer_subjects_magic_link: 'Your Dutiva sign-in code',
  mailer_templates_magic_link_content: MAGIC_LINK_HTML,
  mailer_subjects_confirmation: 'Confirm your Dutiva email',
  mailer_templates_confirmation_content: CONFIRMATION_HTML,
}

/* The fields whose value must end up containing the code placeholder. */
const MUST_CONTAIN_TOKEN = [
  'mailer_templates_magic_link_content',
  'mailer_templates_confirmation_content',
]

const token = cleanSecret(process.env.SUPABASE_ACCESS_TOKEN)
const projectRef = cleanSecret(process.env.SUPABASE_PROJECT_REF)
const dryRun = process.argv.includes('--dry-run')

if (!token || !projectRef) {
  console.error(
    'apply-auth-email-templates: set SUPABASE_ACCESS_TOKEN (a personal access\n' +
      'token from https://supabase.com/dashboard/account/tokens) and\n' +
      'SUPABASE_PROJECT_REF, then re-run.',
  )
  process.exit(1)
}

async function authConfig(method, body) {
  const response = await fetch(`${API}/v1/projects/${projectRef}/config/auth`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await response.text()
  if (!response.ok) {
    /* The same malformed-token symptom the CI drift check hits
       (see the open-items doc, item OA19). cleanSecret already removed the
       recoverable paste errors, so a 401 here means the token itself is
       wrong — say so with the shape, not the value. */
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `${method} config/auth → ${response.status} ${text.slice(0, 200)}\n` +
          `  SUPABASE_ACCESS_TOKEN ${describeSecret(process.env.SUPABASE_ACCESS_TOKEN)}.\n` +
          `  ${ACCESS_TOKEN_HELP}`,
      )
    }
    throw new Error(`${method} config/auth → ${response.status} ${text.slice(0, 300)}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`${method} config/auth returned a non-JSON body: ${text.slice(0, 200)}`)
  }
}

const before = await authConfig('GET').catch((error) => {
  console.error(`apply-auth-email-templates: could not read the auth config — ${error.message}`)
  process.exit(1)
})

const describe = (value) => {
  if (typeof value !== 'string' || value.length === 0) return '(empty — Supabase default)'
  const codeStatus = value.includes('{{ .Token }}') ? 'has a code' : 'NO code'
  return `${codeStatus}, ${value.length} chars`
}

console.log('Current templates:')
for (const field of MUST_CONTAIN_TOKEN) console.log(`  ${field}: ${describe(before[field])}`)

if (dryRun) {
  console.log('\n--dry-run: nothing written.')
  process.exit(0)
}

await authConfig('PATCH', PATCH_BODY).catch((error) => {
  console.error(`apply-auth-email-templates: PATCH failed — ${error.message}`)
  process.exit(1)
})

/* Re-read rather than trusting the PATCH response: a field name the API does
   not recognise can be accepted and ignored, which would otherwise look like
   success and leave sign-in relying on the click gate alone. */
const after = await authConfig('GET').catch((error) => {
  console.error(`apply-auth-email-templates: could not verify — ${error.message}`)
  process.exit(1)
})

const missing = MUST_CONTAIN_TOKEN.filter(
  (field) => typeof after[field] !== 'string' || !after[field].includes('{{ .Token }}'),
)

console.log('\nAfter:')
for (const field of MUST_CONTAIN_TOKEN) console.log(`  ${field}: ${describe(after[field])}`)

if (missing.length > 0) {
  console.error(
    `\napply-auth-email-templates: FAILED — ${missing.join(', ')} still carries no ` +
      '{{ .Token }}. The template was not applied; set it in the dashboard ' +
      '(Authentication → Emails → Templates) and see docs/AUTH_EMAIL_TEMPLATES.md.',
  )
  process.exit(1)
}

console.log(
  '\napply-auth-email-templates: OK — both templates carry the 6-digit code.\n' +
    'Send yourself a sign-in email and confirm the code arrives before relying on it.',
)
