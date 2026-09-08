/* 0151_add_entity_links.sql
   Generic cross-module relationship table. Links any workspace record to any
   other record without replacing table-specific foreign keys. */

CREATE TABLE IF NOT EXISTS public.entity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  from_table text NOT NULL,
  from_id uuid NOT NULL,
  to_table text NOT NULL,
  to_id uuid NOT NULL,
  relationship text NOT NULL DEFAULT 'relates_to',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT entity_links_unique_pair UNIQUE (organization_id, from_table, from_id, to_table, to_id, relationship)
);

CREATE INDEX IF NOT EXISTS entity_links_organization_id_idx ON public.entity_links(organization_id);
CREATE INDEX IF NOT EXISTS entity_links_from_idx ON public.entity_links(from_table, from_id);
CREATE INDEX IF NOT EXISTS entity_links_to_idx ON public.entity_links(to_table, to_id);

ALTER TABLE public.entity_links ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_entity_links_updated_at ON public.entity_links;
CREATE TRIGGER update_entity_links_updated_at
  BEFORE UPDATE ON public.entity_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY entity_links_select ON public.entity_links
  FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR public.is_org_member(organization_id, auth.uid())
  );

CREATE POLICY entity_links_write ON public.entity_links
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));
