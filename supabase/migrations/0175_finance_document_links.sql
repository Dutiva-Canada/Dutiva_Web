/* 0175_finance_document_links.sql
   Deal/holding document linkage — a link table between finance deals /
   finance holdings and generated documents (hr_generated_documents).

   The linked document lives in the HR Documents module; this row is a
   finance-side pointer that snapshots the document ref + bilingual title
   so the finance screens can render the link without joining across
   modules. Deep links resolve to /app/documents/<document_id>.

   At least one target is required (a link hangs off a deal or a holding,
   never both, never neither). RLS mirrors 0171–0174: members read,
   admins write. */

CREATE TABLE IF NOT EXISTS public.finance_document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.finance_deals(id) ON DELETE CASCADE,
  holding_id UUID REFERENCES public.finance_holdings(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  document_ref TEXT,
  title JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT finance_document_links_one_target
    CHECK (deal_id IS NOT NULL OR holding_id IS NOT NULL),
  CONSTRAINT finance_document_links_not_both
    CHECK (NOT (deal_id IS NOT NULL AND holding_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS finance_document_links_organization_id_idx
  ON public.finance_document_links(organization_id);
CREATE INDEX IF NOT EXISTS finance_document_links_deal_id_idx
  ON public.finance_document_links(deal_id);
CREATE INDEX IF NOT EXISTS finance_document_links_holding_id_idx
  ON public.finance_document_links(holding_id);

ALTER TABLE public.finance_document_links ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['finance_document_links']
  LOOP
    EXECUTE format(
      'CREATE POLICY "Org members can read %I" ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id, (select auth.uid())))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Org admins can insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Org admins can update %I" ON public.%I FOR UPDATE TO authenticated USING (public.is_org_admin(organization_id, (select auth.uid()))) WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Org admins can delete %I" ON public.%I FOR DELETE TO authenticated USING (public.is_org_admin(organization_id, (select auth.uid())))',
      t, t
    );
  END LOOP;
END
$$;
