import type { LucideIcon } from 'lucide-react'
import { Github, Gitlab, Inbox, Mail, MailOpen, MailPlus } from 'lucide-react'
import type { Bi } from '@/i18n/core'
import { integrationsMessages as M } from '@/i18n/messages/integrations'

/**
 * Provider catalog for Settings → Connections — the single place that says
 * which providers exist, how they authenticate, and whether phase 1 can
 * actually connect them. The DB check constraint on
 * workspace_integrations.provider (0161) mirrors `key` below; adding a
 * provider means changing both.
 *
 * `auth`:
 *   'pat'     — user pastes a token; the workspace-integration edge function
 *               probes the provider API and Vaults it only on success
 *   'smtp'    — host/port/user/password stored in Vault, never probed (edge
 *               functions can't open TCP), status stays 'pending'
 *   'webhook' — no user credential: connect mints a signed ingest URL +
 *               HMAC secret in Vault and shows them once
 *   'email'   — no user credential: connect mints a workspace inbound
 *               address; Resend delivers mail to inbound_emails (0164)
 *   'planned' — catalogued, no working flow yet (OAuth or a supported API
 *               that doesn't exist, e.g. Signal)
 */
export type IntegrationProviderKey =
  'github' | 'gitlab' | 'gmail' | 'outlook' | 'smtp_email' | 'inbound_webhook' | 'inbound_email'

export type IntegrationAuth = 'pat' | 'smtp' | 'webhook' | 'email' | 'planned'

export type IntegrationConfigField = 'instance_url' | 'smtp_host' | 'smtp_port' | 'smtp_user'

export interface IntegrationProviderSpec {
  key: IntegrationProviderKey
  icon: LucideIcon
  name: Bi
  blurb: Bi
  auth: IntegrationAuth
  /** Non-secret config fields shown in the setup form, in order. */
  configFields?: readonly IntegrationConfigField[]
  tokenHint?: Bi
}

export const INTEGRATION_CATALOG: readonly IntegrationProviderSpec[] = [
  {
    key: 'github',
    icon: Github,
    name: M.integ_provider_github_name,
    blurb: M.integ_provider_github_blurb,
    auth: 'pat',
    tokenHint: M.integ_token_hint_github,
  },
  {
    key: 'gitlab',
    icon: Gitlab,
    name: M.integ_provider_gitlab_name,
    blurb: M.integ_provider_gitlab_blurb,
    auth: 'pat',
    configFields: ['instance_url'],
    tokenHint: M.integ_token_hint_gitlab,
  },
  {
    key: 'smtp_email',
    icon: MailOpen,
    name: M.integ_provider_smtp_name,
    blurb: M.integ_provider_smtp_blurb,
    auth: 'smtp',
    configFields: ['smtp_host', 'smtp_port', 'smtp_user'],
  },
  {
    key: 'gmail',
    icon: Mail,
    name: M.integ_provider_gmail_name,
    blurb: M.integ_provider_gmail_blurb,
    auth: 'planned',
  },
  {
    key: 'outlook',
    icon: Mail,
    name: M.integ_provider_outlook_name,
    blurb: M.integ_provider_outlook_blurb,
    auth: 'planned',
  },
  {
    key: 'inbound_webhook',
    icon: Inbox,
    name: M.integ_provider_webhook_name,
    blurb: M.integ_provider_webhook_blurb,
    auth: 'webhook',
  },
  {
    key: 'inbound_email',
    icon: MailPlus,
    name: M.integ_provider_inbound_name,
    blurb: M.integ_provider_inbound_blurb,
    auth: 'email',
  },
] as const

export function providerSpec(key: string): IntegrationProviderSpec | undefined {
  return INTEGRATION_CATALOG.find((p) => p.key === key)
}
