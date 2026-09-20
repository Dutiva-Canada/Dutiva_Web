-- 0161_workspace_integrations.sql
--
-- Phase 1 of workspace integrations (docs/INTEGRATIONS.md): one org-scoped
-- connection registry, `workspace_integrations`, plus three service-role-only
-- wrappers over Supabase Vault so credentials never land in a table column.
--
-- `comms_integrations` (0145) stays what it is — a comms-module registry of
-- source names/statuses. This table is the workspace-level *connection*
-- record: which provider, which org, what non-secret config, and a
-- `secret_ref` pointing at a Vault entry the `workspace-integration` edge
-- function manages. Nothing readable by `authenticated` ever contains a
-- credential.
--
-- Provider reachability in phase 1:
--   github / gitlab   — PAT probe in the edge function (connect/test/disconnect)
--   gmail / outlook   — catalogued but OAuth-deferred; rows may exist as
--                       'pending' placeholders only
--   smtp_email        — credentials stored, no probe possible from an edge
--                       function (no raw TCP); status stays 'pending'
--   inbound_webhook   — catalogued; URL minting deferred

CREATE TABLE IF NOT EXISTS public.workspace_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL
    CHECK (provider IN ('github', 'gitlab', 'gmail', 'outlook', 'smtp_email', 'inbound_webhook')),
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'connected', 'error', 'disconnected')),
  -- Non-secret config only: instance URLs, account logins, mailbox labels.
  -- The edge function rejects writes carrying keys outside an allowlist.
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Vault secret *name* (e.g. 'wi_<uuid>'), never the credential itself.
  secret_ref TEXT,
  last_checked_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, provider, display_name)
);

CREATE INDEX IF NOT EXISTS workspace_integrations_organization_id_idx
  ON public.workspace_integrations(organization_id);
CREATE INDEX IF NOT EXISTS workspace_integrations_provider_idx
  ON public.workspace_integrations(provider);

ALTER TABLE public.workspace_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read workspace_integrations"
  ON public.workspace_integrations FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can insert workspace_integrations"
  ON public.workspace_integrations FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can update workspace_integrations"
  ON public.workspace_integrations FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id, (select auth.uid())))
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can delete workspace_integrations"
  ON public.workspace_integrations FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id, (select auth.uid())));

DROP TRIGGER IF EXISTS workspace_integrations_set_updated_at ON public.workspace_integrations;
CREATE TRIGGER workspace_integrations_set_updated_at
  BEFORE UPDATE ON public.workspace_integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Vault wrappers. Edge functions reach PostgREST, which only exposes
-- `public`, so the vault schema needs a bridge. These are SECURITY DEFINER
-- with EXECUTE revoked from everything except service_role — the
-- `workspace-integration` function (which runs under service role after its
-- own is_org_admin check) is the only caller. A compromised or buggy client
-- JWT can therefore never read or write credentials, even though it can see
-- the function names.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

CREATE OR REPLACE FUNCTION public.store_integration_secret(p_name TEXT, p_secret TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_secret IS NULL OR length(btrim(p_secret)) = 0 THEN
    RAISE EXCEPTION 'secret must not be empty';
  END IF;
  RETURN vault.create_secret(p_secret, p_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_integration_secret(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
   WHERE name = p_name;
  RETURN v_secret;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_integration_secret(p_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  DELETE FROM vault.secrets WHERE name = p_name;
END;
$$;

REVOKE ALL ON FUNCTION public.store_integration_secret(TEXT, TEXT) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_integration_secret(TEXT) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_integration_secret(TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_integration_secret(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_integration_secret(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_integration_secret(TEXT) TO service_role;
