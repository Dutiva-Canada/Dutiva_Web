/* 0157_agent_audit.sql
   Durable agent audit — one row per executor attempt (success or refusal)
   in production workspaces. The record mirrors `AgentAuditRecord` in
   src/features/app/agent/types.ts: who (org + actor + role), what (tool +
   params), when, and how it ended.

   Append-only by policy: members insert rows for their own org, admins
   read them, and no UPDATE or DELETE policies exist — the log cannot be
   edited through the client surface. `actor_id` is stamped by the database
   from the JWT, so a client cannot attribute an action to someone else.
   The demo workspace never writes here — its records stay in memory by
   design (there is no real organization to scope them to). */

CREATE TABLE IF NOT EXISTS public.agent_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  actor_id uuid NOT NULL DEFAULT auth.uid(),
  tool_id text NOT NULL,
  module text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('read', 'draft', 'commit')),
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  mode text NOT NULL DEFAULT 'production' CHECK (mode IN ('demo', 'production')),
  role text CHECK (
    role IS NULL
    OR role IN ('viewer', 'consultant', 'member', 'professional', 'manager', 'admin', 'owner')
  ),
  status text NOT NULL CHECK (status IN ('completed', 'failed')),
  error_code text,
  started_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_audit_organization_id_idx
  ON public.agent_audit(organization_id);
CREATE INDEX IF NOT EXISTS agent_audit_created_at_idx
  ON public.agent_audit(created_at);
CREATE INDEX IF NOT EXISTS agent_audit_tool_id_idx
  ON public.agent_audit(tool_id);

ALTER TABLE public.agent_audit ENABLE ROW LEVEL SECURITY;

/* Admins read their org's log — params can carry payloads a viewer
   shouldn't see. */
CREATE POLICY agent_audit_select ON public.agent_audit
  FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()));

/* Members append for their own org; the actor is always themselves —
   the database stamps it, and this check rejects anything else. */
CREATE POLICY agent_audit_insert ON public.agent_audit
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id, auth.uid())
    AND actor_id = auth.uid()
  );

/* Deliberately no UPDATE or DELETE policies — the log is append-only. */
