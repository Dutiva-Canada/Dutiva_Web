import { supabase } from '@/lib/supabaseClient'

export async function reissueSigningToken(
  recipientId: string,
): Promise<{ signingToken: string; tokenExpiresAt: string }> {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('reissue_hr_document_signing_token', {
    p_recipient_id: recipientId,
  })
  if (error) throw error

  const body = data as {
    signing_token?: string
    token_expires_at?: string
  } | null

  if (!body?.signing_token || !body.token_expires_at) {
    throw new Error('Could not reissue signing link')
  }

  return {
    signingToken: body.signing_token,
    tokenExpiresAt: body.token_expires_at,
  }
}
