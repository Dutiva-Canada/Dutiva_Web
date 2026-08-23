import { supabase } from '@/lib/supabaseClient'
import type { Lang } from '@/i18n/core'

export interface SendSigningInviteInput {
  organizationId: string
  documentId: string
  /** When omitted, emails every pending/sent/viewed recipient on the envelope. */
  recipientId?: string
  actorLabel: string
  language: Lang
}

export interface SendSigningInviteResult {
  ok: true
  sent: Array<{ recipientId: string; email: string }>
  failed: Array<{ recipientId: string; email: string; error: string }>
}

type InviteErrorBody = {
  ok?: boolean
  code?: string
  error?: string
  sent?: Array<{ recipient_id: string; email: string }>
  failed?: Array<{ recipient_id: string; email: string; error: string }>
}

function inviteError(message: string, code?: string): Error & { code?: string } {
  const err = new Error(message) as Error & { code?: string }
  err.code = code
  return err
}

async function readFunctionErrorBody(error: unknown): Promise<InviteErrorBody | null> {
  const ctx = (error as { context?: Response } | null)?.context
  if (!ctx || typeof ctx.json !== 'function') return null
  try {
    return (await ctx.json()) as InviteErrorBody
  } catch {
    return null
  }
}

/**
 * Ask the `send-signing-invite` edge function to email external signing links.
 * Requires an org-admin session and a configured Resend key on the project.
 */
export async function sendSigningInviteEmail(
  input: SendSigningInviteInput,
): Promise<SendSigningInviteResult> {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.functions.invoke('send-signing-invite', {
    body: {
      organization_id: input.organizationId,
      document_id: input.documentId,
      recipient_id: input.recipientId ?? null,
      actor_label: input.actorLabel,
      language: input.language,
    },
  })

  if (error) {
    const body = await readFunctionErrorBody(error)
    throw inviteError(body?.error ?? error.message, body?.code)
  }

  const body = data as InviteErrorBody | null
  if (!body?.ok) {
    throw inviteError(body?.error ?? 'Could not send signing invite', body?.code)
  }

  return {
    ok: true,
    sent: (body.sent ?? []).map((r) => ({
      recipientId: r.recipient_id,
      email: r.email,
    })),
    failed: (body.failed ?? []).map((r) => ({
      recipientId: r.recipient_id,
      email: r.email,
      error: r.error,
    })),
  }
}
