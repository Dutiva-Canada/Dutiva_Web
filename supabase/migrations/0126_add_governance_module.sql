/* 0126_add_governance_module.sql
   Lightweight corporate governance register — records, decisions, officers,
   and shareholders. Not a board portal; just a structured register. */

CREATE TABLE IF NOT EXISTS public.governance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  record_type text NOT NULL,
  jurisdiction text,
  effective_date date,
  review_due_date date,
  status text NOT NULL DEFAULT 'active',
  viewer_visible boolean NOT NULL DEFAULT false,
  document_id uuid REFERENCES public.documents(id),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT governance_records_record_type_check CHECK (record_type = ANY (ARRAY['articles', 'bylaw', 'resolution', 'minutes', 'register'])),
  CONSTRAINT governance_records_status_check CHECK (status = ANY (ARRAY['active', 'superseded', 'pending_review']))
);

CREATE TABLE IF NOT EXISTS public.governance_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  decision_date date,
  decided_by text,
  rationale text,
  status text NOT NULL DEFAULT 'adopted',
  viewer_visible boolean NOT NULL DEFAULT false,
  related_record_id uuid REFERENCES public.governance_records(id),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT governance_decisions_status_check CHECK (status = ANY (ARRAY['proposed', 'adopted', 'rescinded']))
);

CREATE TABLE IF NOT EXISTS public.governance_officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  role text NOT NULL,
  appointed_date date,
  resigned_date date,
  contact_email text,
  is_active boolean NOT NULL DEFAULT true,
  viewer_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT governance_officers_role_check CHECK (role = ANY (ARRAY['director', 'officer_president', 'officer_secretary', 'officer_treasurer']))
);

CREATE TABLE IF NOT EXISTS public.governance_shareholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  share_class text,
  shares_issued integer,
  issue_date date,
  contact_email text,
  viewer_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_governance_records_org ON public.governance_records(organization_id);
CREATE INDEX idx_governance_records_type ON public.governance_records(record_type);
CREATE INDEX idx_governance_decisions_org ON public.governance_decisions(organization_id);
CREATE INDEX idx_governance_officers_org ON public.governance_officers(organization_id);
CREATE INDEX idx_governance_shareholders_org ON public.governance_shareholders(organization_id);

/* Row-level security — org-scoped, admin-writer, viewer-limited reader. */

ALTER TABLE public.governance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_shareholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY governance_records_select ON public.governance_records
  FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (
      public.is_org_member(organization_id, auth.uid())
      AND viewer_visible = true
      AND EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = governance_records.organization_id
          AND om.user_id = auth.uid()
          AND om.status = 'active'
          AND om.role = 'viewer'
      )
    )
  );

CREATE POLICY governance_records_write ON public.governance_records
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY governance_decisions_select ON public.governance_decisions
  FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (
      public.is_org_member(organization_id, auth.uid())
      AND viewer_visible = true
      AND EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = governance_decisions.organization_id
          AND om.user_id = auth.uid()
          AND om.status = 'active'
          AND om.role = 'viewer'
      )
    )
  );

CREATE POLICY governance_decisions_write ON public.governance_decisions
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY governance_officers_select ON public.governance_officers
  FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (
      public.is_org_member(organization_id, auth.uid())
      AND viewer_visible = true
      AND EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = governance_officers.organization_id
          AND om.user_id = auth.uid()
          AND om.status = 'active'
          AND om.role = 'viewer'
      )
    )
  );

CREATE POLICY governance_officers_write ON public.governance_officers
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY governance_shareholders_select ON public.governance_shareholders
  FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (
      public.is_org_member(organization_id, auth.uid())
      AND viewer_visible = true
      AND EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = governance_shareholders.organization_id
          AND om.user_id = auth.uid()
          AND om.status = 'active'
          AND om.role = 'viewer'
      )
    )
  );

CREATE POLICY governance_shareholders_write ON public.governance_shareholders
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));
