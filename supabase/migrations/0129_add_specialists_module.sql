/* 0129_add_specialists_module.sql
   External specialists directory and engagement log. */

CREATE TABLE IF NOT EXISTS public.specialists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  specialty text NOT NULL,
  company text,
  email text,
  phone text,
  crm_contact_id uuid,
  finance_party_id uuid REFERENCES public.finance_parties(id),
  workspace_access boolean DEFAULT false,
  workspace_role text DEFAULT 'consultant',
  granted_modules text[] DEFAULT '{}',
  access_expires_at timestamptz,
  organization_member_id uuid REFERENCES public.organization_members(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT specialists_specialty_check CHECK (specialty = ANY (ARRAY['lawyer', 'accountant', 'tax', 'insurance', 'it_security', 'hr_consultant', 'bookkeeper', 'other'])),
  CONSTRAINT specialists_workspace_role_check CHECK (workspace_role = ANY (ARRAY['consultant', 'viewer']))
);

CREATE TABLE IF NOT EXISTS public.specialist_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  specialist_id uuid NOT NULL REFERENCES public.specialists(id),
  engagement_date date,
  engagement_type text,
  summary text,
  follow_up_date date,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT specialist_engagements_type_check CHECK (engagement_type IS NULL OR engagement_type = ANY (ARRAY['call', 'email', 'meeting', 'contract', 'task']))
);

CREATE INDEX idx_specialists_org ON public.specialists(organization_id);
CREATE INDEX idx_specialist_engagements_org ON public.specialist_engagements(organization_id);
CREATE INDEX idx_specialist_engagements_specialist ON public.specialist_engagements(specialist_id);

ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY specialists_select ON public.specialists
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY specialists_write ON public.specialists
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY specialist_engagements_select ON public.specialist_engagements
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY specialist_engagements_write ON public.specialist_engagements
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));
