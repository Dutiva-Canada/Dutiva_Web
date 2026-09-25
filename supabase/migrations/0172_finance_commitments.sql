/* 0172_finance_commitments.sql
   Capital-partner commitments for orgs acting like a holding / investment
   firm: the amount an investor or lender has committed to an entity, how
   much has actually been called, and when the next call is due. Rows hang
   off finance_parties (investor/lender types from 0171) and
   finance_entities, same org-scoped model as the rest of finance: members
   read, admins write.

   Dutiva records the commitment ledger — it does not process capital
   calls, move money, or advise on allocations.

   RLS mirrors 0160/0171 exactly. */

CREATE TABLE IF NOT EXISTS public.finance_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.finance_entities(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES public.finance_parties(id) ON DELETE CASCADE,
  label JSONB,
  committed NUMERIC(18,2) NOT NULL DEFAULT 0,
  called NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  next_call_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  notes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (committed >= 0 AND called >= 0 AND called <= committed)
);

CREATE INDEX IF NOT EXISTS finance_commitments_organization_id_idx
  ON public.finance_commitments(organization_id);
CREATE INDEX IF NOT EXISTS finance_commitments_party_id_idx
  ON public.finance_commitments(party_id);

ALTER TABLE public.finance_commitments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['finance_commitments']
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
