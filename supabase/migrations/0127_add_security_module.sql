/* 0127_add_security_module.sql
   Security posture cockpit — assets, access reviews, incidents, risks, and
   vendor reviews. This is a governance tracker, not a scanner. */

CREATE TABLE IF NOT EXISTS public.security_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  asset_type text NOT NULL,
  owner_id uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'active',
  criticality text,
  renewal_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT security_assets_asset_type_check CHECK (asset_type = ANY (ARRAY['hardware', 'software', 'cloud_service', 'domain', 'data_store'])),
  CONSTRAINT security_assets_status_check CHECK (status = ANY (ARRAY['active', 'decommissioned', 'at_risk'])),
  CONSTRAINT security_assets_criticality_check CHECK (criticality IS NULL OR criticality = ANY (ARRAY['critical', 'high', 'medium', 'low']))
);

CREATE TABLE IF NOT EXISTS public.security_access_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  assigned_to uuid REFERENCES public.profiles(id),
  reviewer_id uuid REFERENCES public.profiles(id),
  review_due_date date,
  completed_date date,
  status text NOT NULL DEFAULT 'pending',
  findings text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT security_access_reviews_status_check CHECK (status = ANY (ARRAY['pending', 'in_progress', 'completed', 'overdue']))
);

CREATE TABLE IF NOT EXISTS public.security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  reported_by uuid REFERENCES public.profiles(id),
  assigned_to uuid REFERENCES public.profiles(id),
  reported_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  summary text,
  impact text,
  remediation text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT security_incidents_severity_check CHECK (severity = ANY (ARRAY['critical', 'high', 'medium', 'low'])),
  CONSTRAINT security_incidents_status_check CHECK (status = ANY (ARRAY['open', 'contained', 'resolved', 'closed']))
);

CREATE TABLE IF NOT EXISTS public.security_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  likelihood text,
  impact text,
  owner text,
  mitigation text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT security_risks_likelihood_check CHECK (likelihood IS NULL OR likelihood = ANY (ARRAY['high', 'medium', 'low'])),
  CONSTRAINT security_risks_impact_check CHECK (impact IS NULL OR impact = ANY (ARRAY['high', 'medium', 'low'])),
  CONSTRAINT security_risks_status_check CHECK (status = ANY (ARRAY['open', 'mitigated', 'accepted', 'closed']))
);

CREATE TABLE IF NOT EXISTS public.security_vendor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  vendor_name text NOT NULL,
  vendor_type text,
  privacy_agreement boolean,
  security_review_date date,
  next_review_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT security_vendor_reviews_vendor_type_check CHECK (vendor_type IS NULL OR vendor_type = ANY (ARRAY['lawyer', 'accountant', 'insurance', 'it_security', 'other']))
);

CREATE INDEX idx_security_assets_org ON public.security_assets(organization_id);
CREATE INDEX idx_security_access_reviews_org ON public.security_access_reviews(organization_id);
CREATE INDEX idx_security_incidents_org ON public.security_incidents(organization_id);
CREATE INDEX idx_security_risks_org ON public.security_risks(organization_id);
CREATE INDEX idx_security_vendor_reviews_org ON public.security_vendor_reviews(organization_id);

/* Role-aware org isolation. Viewer gets no access to security data.
   Manager/professional/member/consultant can read; admin can write.
   Members can also report incidents (reported_by = auth.uid()). */

ALTER TABLE public.security_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_access_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_vendor_reviews ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.active_org_member_role(target_organization_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT role
  FROM public.organization_members
  WHERE organization_id = target_organization_id
    AND user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

CREATE POLICY security_assets_select ON public.security_assets
  FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (
      public.is_org_member(organization_id, auth.uid())
      AND public.active_org_member_role(organization_id) <> 'viewer'
    )
  );

CREATE POLICY security_assets_write ON public.security_assets
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY security_access_reviews_select ON public.security_access_reviews
  FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (
      public.is_org_member(organization_id, auth.uid())
      AND public.active_org_member_role(organization_id) <> 'viewer'
    )
  );

CREATE POLICY security_access_reviews_write ON public.security_access_reviews
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY security_incidents_select ON public.security_incidents
  FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (
      public.is_org_member(organization_id, auth.uid())
      AND public.active_org_member_role(organization_id) <> 'viewer'
    )
  );

CREATE POLICY security_incidents_write ON public.security_incidents
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY security_incidents_report ON public.security_incidents
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id, auth.uid())
    AND public.active_org_member_role(organization_id) <> 'viewer'
    AND reported_by = auth.uid()
  );

CREATE POLICY security_risks_select ON public.security_risks
  FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (
      public.is_org_member(organization_id, auth.uid())
      AND public.active_org_member_role(organization_id) <> 'viewer'
    )
  );

CREATE POLICY security_risks_write ON public.security_risks
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY security_vendor_reviews_select ON public.security_vendor_reviews
  FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (
      public.is_org_member(organization_id, auth.uid())
      AND public.active_org_member_role(organization_id) <> 'viewer'
    )
  );

CREATE POLICY security_vendor_reviews_write ON public.security_vendor_reviews
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));
