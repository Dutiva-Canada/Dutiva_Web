import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { resendSend } from '../_shared/resendSend.ts'

/**
 * send-org-invite — emails an organization_invitations row to its recipient.
 *
 * The client inserts the invitation row itself (RLS: org admins only), then
 * calls this function with the invitation id purely for delivery — so a mail
 * failure never blocks the invite itself, and the caller's admin role on the
 * invitation's org is re-verified here with the service client (the caller's
 * JWT is only proof of identity; the membership check is the authorization).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface InvitationRow {
  id: string
  organization_id: string
  email: string
  role: string
  status: string
  expires_at: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }

  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401)
  const token = auth.slice('Bearer '.length).trim()

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser(token)
  const caller = userData?.user
  if (userError || !caller) return json({ error: 'Invalid user token' }, 401)

  let body: { invitationId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const invitationId = body.invitationId ?? ''
  if (!UUID_RE.test(invitationId)) return json({ error: 'invitationId must be a uuid' }, 400)

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: invitation, error: inviteError } = await adminClient
    .from('organization_invitations')
    .select('id, organization_id, email, role, status, expires_at')
    .eq('id', invitationId)
    .maybeSingle<InvitationRow>()
  if (inviteError || !invitation) return json({ error: 'Invitation not found' }, 404)
  if (invitation.status !== 'pending') return json({ error: 'Invitation is not pending' }, 409)
  if (new Date(invitation.expires_at).getTime() <= Date.now()) {
    return json({ error: 'Invitation has expired' }, 409)
  }

  /* Authorization: the caller must be an owner/admin of the invitation's org
     — the same roles is_org_admin treats as writers. */
  const { data: membership } = await adminClient
    .from('organization_members')
    .select('role')
    .eq('organization_id', invitation.organization_id)
    .eq('user_id', caller.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin'])
    .maybeSingle()
  if (!membership) return json({ error: 'Not an admin of this organization' }, 403)

  const { data: org } = await adminClient
    .from('organizations')
    .select('name')
    .eq('id', invitation.organization_id)
    .maybeSingle<{ name: string }>()
  const orgName = org?.name?.trim() || 'your organization'

  const apiKey = Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('SUPPORT_EMAIL_PROVIDER_API_KEY')
  const from =
    Deno.env.get('SIGNING_EMAIL_FROM') ??
    Deno.env.get('SUPPORT_EMAIL_FROM') ??
    'Dutiva <noreply@dutiva.ca>'
  const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://dutiva.ca').replace(/\/+$/, '')

  /* No mail provider configured → the invite still exists and claims on
     sign-in; tell the caller delivery was skipped rather than pretending. */
  if (!apiKey) return json({ ok: true, emailed: false })

  const text = [
    `You've been invited to join ${orgName} on Dutiva.`,
    ``,
    `Sign in with this email address to get access:`,
    `${siteUrl}/app/welcome`,
    ``,
    `No password needed — we'll email you a one-time sign-in code.`,
    `This invitation expires on ${new Date(invitation.expires_at).toDateString()}.`,
  ].join('\n')

  try {
    await resendSend(apiKey, from, {
      to: invitation.email,
      subject: `You're invited to ${orgName} on Dutiva`,
      text,
    })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Send failed' }, 502)
  }

  return json({ ok: true, emailed: true })
})
