/* 0150_add_revenue_module.sql
   Revenue tracking — streams and invoices. A lightweight layer over the
   customer's own billing; it is not an accounting system. */

CREATE TABLE IF NOT EXISTS public.revenue_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  stream_type text NOT NULL DEFAULT 'recurring' CHECK (stream_type IN ('recurring', 'one_time')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  amount numeric(18,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  frequency text CHECK (frequency IS NULL OR frequency IN ('monthly', 'quarterly', 'annually')),
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT revenue_streams_dates_check CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS public.revenue_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  stream_id uuid REFERENCES public.revenue_streams(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  amount numeric(18,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date date,
  due_date date,
  paid_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS revenue_streams_organization_id_idx ON public.revenue_streams(organization_id);
CREATE INDEX IF NOT EXISTS revenue_invoices_organization_id_idx ON public.revenue_invoices(organization_id);
CREATE INDEX IF NOT EXISTS revenue_invoices_stream_id_idx ON public.revenue_invoices(stream_id);

ALTER TABLE public.revenue_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_invoices ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_revenue_streams_updated_at ON public.revenue_streams;
CREATE TRIGGER update_revenue_streams_updated_at
  BEFORE UPDATE ON public.revenue_streams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_revenue_invoices_updated_at ON public.revenue_invoices;
CREATE TRIGGER update_revenue_invoices_updated_at
  BEFORE UPDATE ON public.revenue_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY revenue_streams_select ON public.revenue_streams
  FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (
      public.is_org_member(organization_id, auth.uid())
      AND public.active_org_member_role(organization_id) <> 'viewer'
    )
  );

CREATE POLICY revenue_streams_write ON public.revenue_streams
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY revenue_invoices_select ON public.revenue_invoices
  FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (
      public.is_org_member(organization_id, auth.uid())
      AND public.active_org_member_role(organization_id) <> 'viewer'
    )
  );

CREATE POLICY revenue_invoices_write ON public.revenue_invoices
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));
