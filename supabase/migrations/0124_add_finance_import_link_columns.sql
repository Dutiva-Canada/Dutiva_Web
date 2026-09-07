-- Migration 0124: add missing import session columns
--
-- Adds the columns the Supabase import path actually writes but which were
-- not present in the earlier migration that created these tables:
--   - finance_bank_items.import_session_id  — ties each bank item to its import
--   - finance_import_sessions.error_details — stores row-level parse errors
-- ============================================================================

ALTER TABLE public.finance_bank_items
  ADD COLUMN IF NOT EXISTS import_session_id UUID REFERENCES public.finance_import_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.finance_import_sessions
  ADD COLUMN IF NOT EXISTS error_details JSONB;

-- The existing updated_at column on finance_bank_items should be kept at
-- DEFAULT NOW() and updated by triggers/application code. If an earlier
-- migration omitted it, the above ADD COLUMN IF NOT EXISTS covers it.
