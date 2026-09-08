/* 0128_add_operations_module.sql
   Operational command register — projects, vendors, quality checks, technology,
   and logistics. Not an ERP. */

CREATE TABLE IF NOT EXISTS public.operations_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  owner_id uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'planning',
  start_date date,
  target_date date,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT operations_projects_status_check CHECK (status = ANY (ARRAY['planning', 'active', 'on_hold', 'completed', 'cancelled']))
);

CREATE TABLE IF NOT EXISTS public.operations_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  finance_party_id uuid REFERENCES public.finance_parties(id),
  name text NOT NULL,
  vendor_type text,
  status text NOT NULL DEFAULT 'active',
  contract_expiry date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT operations_vendors_vendor_type_check CHECK (vendor_type IS NULL OR vendor_type = ANY (ARRAY['supplier', 'logistics', 'technology', 'professional_service'])),
  CONSTRAINT operations_vendors_status_check CHECK (status = ANY (ARRAY['active', 'inactive', 'under_review']))
);

CREATE TABLE IF NOT EXISTS public.operations_quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  assigned_to uuid REFERENCES public.profiles(id),
  reviewer_id uuid REFERENCES public.profiles(id),
  checklist jsonb DEFAULT '[]'::jsonb,
  due_date date,
  completed_date date,
  status text NOT NULL DEFAULT 'pending',
  non_conformance text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT operations_quality_checks_status_check CHECK (status = ANY (ARRAY['pending', 'passed', 'failed', 'overdue']))
);

CREATE TABLE IF NOT EXISTS public.operations_technology (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  system_type text,
  owner_id uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'active',
  renewal_date date,
  integration_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT operations_technology_system_type_check CHECK (system_type IS NULL OR system_type = ANY (ARRAY['internal', 'customer_facing', 'integration', 'infrastructure'])),
  CONSTRAINT operations_technology_status_check CHECK (status = ANY (ARRAY['active', 'deprecated', 'planned']))
);

CREATE TABLE IF NOT EXISTS public.operations_logistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  owner_id uuid REFERENCES public.profiles(id),
  assigned_to uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'in_transit',
  expected_date date,
  delivered_date date,
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT operations_logistics_status_check CHECK (status = ANY (ARRAY['in_transit', 'delivered', 'delayed', 'returned']))
);

CREATE INDEX idx_operations_projects_org ON public.operations_projects(organization_id);
CREATE INDEX idx_operations_vendors_org ON public.operations_vendors(organization_id);
CREATE INDEX idx_operations_quality_checks_org ON public.operations_quality_checks(organization_id);
CREATE INDEX idx_operations_technology_org ON public.operations_technology(organization_id);
CREATE INDEX idx_operations_logistics_org ON public.operations_logistics(organization_id);

ALTER TABLE public.operations_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_technology ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_logistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY operations_projects_select ON public.operations_projects
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY operations_projects_write ON public.operations_projects
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY operations_vendors_select ON public.operations_vendors
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY operations_vendors_write ON public.operations_vendors
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY operations_quality_checks_select ON public.operations_quality_checks
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY operations_quality_checks_write ON public.operations_quality_checks
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY operations_technology_select ON public.operations_technology
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY operations_technology_write ON public.operations_technology
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY operations_logistics_select ON public.operations_logistics
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY operations_logistics_write ON public.operations_logistics
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));
