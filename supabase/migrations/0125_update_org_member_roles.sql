/* 0125_update_org_member_roles.sql
   Extend the org membership role enum to support professional employees and
   consultants, and add the scoped-access columns used by the new business-
   function modules. */

/* organization_members */
ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_check;

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_role_check
  CHECK (role = ANY (ARRAY['owner', 'admin', 'manager', 'professional', 'member', 'consultant', 'viewer']));

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS granted_modules text[] DEFAULT '{}';

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS access_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_organization_members_role ON public.organization_members(role);
CREATE INDEX IF NOT EXISTS idx_organization_members_expiry ON public.organization_members(access_expires_at)
  WHERE access_expires_at IS NOT NULL;

/* organization_invitations should allow the same set, since invites are the
   source of the eventual membership role. */
ALTER TABLE public.organization_invitations
  DROP CONSTRAINT IF EXISTS organization_invitations_role_check;

ALTER TABLE public.organization_invitations
  ADD CONSTRAINT organization_invitations_role_check
  CHECK (role = ANY (ARRAY['owner', 'admin', 'manager', 'professional', 'member', 'consultant', 'viewer']));
