-- 0162_integration_events.sql
--
-- Phase 2 of workspace integrations (docs/INTEGRATIONS.md): the landing
-- table for inbound-webhook deliveries. External tools POST to
-- /functions/v1/integration-webhook/<webhook_key> with an
-- X-Dutiva-Signature HMAC; the edge function verifies the signature
-- against the Vault-held signing secret and inserts one row here.
--
-- Inserts happen only through the service role inside that function —
-- there is deliberately no INSERT policy for authenticated. Members can
-- read their org's events; org admins can delete them for hygiene.

CREATE TABLE IF NOT EXISTS public.integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.workspace_integrations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  event_type TEXT,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS integration_events_organization_id_idx
  ON public.integration_events(organization_id, received_at DESC);
CREATE INDEX IF NOT EXISTS integration_events_integration_id_idx
  ON public.integration_events(integration_id, received_at DESC);
CREATE INDEX IF NOT EXISTS integration_events_unprocessed_idx
  ON public.integration_events(integration_id) WHERE processed_at IS NULL;

ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read integration_events"
  ON public.integration_events FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, (select auth.uid())));

CREATE POLICY "Org admins can delete integration_events"
  ON public.integration_events FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id, (select auth.uid())));
