import { supabase } from '@/lib/supabaseClient'

export async function getAdvisorOverageOptIn(): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return false
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('advisor_overage_opt_in')
    .eq('id', data.user.id)
    .maybeSingle()
  if (profileError) throw profileError
  return profile?.advisor_overage_opt_in === true
}

export async function setAdvisorOverageOptIn(optIn: boolean): Promise<boolean> {
  if (!supabase) throw new Error('Not configured')
  const { data, error } = await supabase.rpc('set_advisor_overage_opt_in', {
    p_opt_in: optIn,
  })
  if (error) throw error
  return data === true
}
