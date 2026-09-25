/* 0173_finance_capital_calls.sql
   Two pieces of capital-partner depth:

   1. finance_capital_calls — discrete call events against a
      finance_commitments row (scheduled → notified → received |
      cancelled). The commitment's `called` stays the ledger figure; the
      client bumps it when a call is marked received so the event log and
      the ledger cannot silently diverge.

   2. finance_parties contact fields — name/email/phone for the person at
      an investor/lender (or any party) who actually answers.

   Dutiva records the call ledger — it does not send notices or move
   money. RLS mirrors 0171/0172 exactly: members read, admins write. */

CREATE TABLE IF NOT EXISTS public.finance_capital_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  commitment_id UUID NOT NULL REFERENCES public.finance_commitments(id) ON DELETE CASCADE,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'notified', 'received', 'cancelled')),
  reference TEXT,
  received_date DATE,
  notes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_capital_calls_organization_id_idx
  ON public.finance_capital_calls(organization_id);
CREATE INDEX IF NOT EXISTS finance_capital_calls_commitment_id_idx
  ON public.finance_capital_calls(commitment_id);

ALTER TABLE public.finance_capital_calls ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['finance_capital_calls']
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

/* Party contact fields — plain TEXT; the same columns serve every party
   type, not just capital partners. */
ALTER TABLE public.finance_parties
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;
