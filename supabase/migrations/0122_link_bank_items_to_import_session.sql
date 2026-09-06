-- ============================================================================
-- Migration 0121: Link bank items to import sessions
--
-- Adds import_session_id to finance_bank_items so an import session can be
-- deleted along with the bank items it created.
-- ============================================================================

ALTER TABLE public.finance_bank_items
  ADD COLUMN IF NOT EXISTS import_session_id UUID
    REFERENCES public.finance_import_sessions(id)
    ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS finance_bank_items_import_session_id_idx
  ON public.finance_bank_items(import_session_id);
