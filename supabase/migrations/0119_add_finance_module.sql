-- Finance Module: Integration-led Finance workspace
-- Migration 0119: Add tables for the /app/finance workspace
--
-- Architecture: integration-led. The customer's accounting system remains
-- authoritative for posted books; its payroll provider remains authoritative
-- for completed pay runs. Dutiva owns budgets, forecasts, review work,
-- approvals, evidence, and links to source records.
--
-- Money is stored as numeric(18,2) to preserve currency precision.
-- Bilingual labels are stored as JSONB {en, fr} pairs.
-- Sensitive fields (payroll, banking, tax identifiers) are column-level
-- restricted via a separate RLS policy that requires admin role.

-- ============================================================================
-- Core structural tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  legal_form TEXT NOT NULL CHECK (legal_form IN ('corporation', 'partnership', 'sole_proprietor', 'nonprofit')),
  fiscal_year_start TEXT NOT NULL,
  functional_currency TEXT NOT NULL DEFAULT 'CAD' CHECK (functional_currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  jurisdictions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  accounting_source_id TEXT,
  payroll_source_id TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  label JSONB NOT NULL,
  basis TEXT NOT NULL CHECK (basis IN ('accrual', 'cash')),
  authoritative_source JSONB NOT NULL,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_fiscal_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closing', 'closed', 'locked'))
);

-- ============================================================================
-- Parties and accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('customer', 'supplier', 'employee', 'bank', 'advisor')),
  external_id TEXT,
  banking_details_on_file BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  label JSONB NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  last4 TEXT,
  restricted BOOLEAN NOT NULL DEFAULT FALSE,
  earmarked_amount NUMERIC(18,2),
  maturity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES finance_books(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name JSONB NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense', 'contra')),
  sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Commercial documents
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES finance_parties(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(18,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'partial', 'paid', 'overdue', 'disputed', 'written_off', 'cancelled')),
  project_id TEXT,
  source_system JSONB,
  notes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES finance_parties(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(18,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'partial', 'paid', 'overdue', 'disputed', 'cancelled')),
  purchase_order_id TEXT,
  project_id TEXT,
  source_system JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES finance_parties(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('receivable', 'payable')),
  number TEXT NOT NULL,
  date DATE NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  applied_to_id TEXT,
  reason JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'applied', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Spend and procurement
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_spend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  requester TEXT NOT NULL,
  purpose JSONB NOT NULL,
  supplier_id UUID REFERENCES finance_parties(id) ON DELETE SET NULL,
  project_id TEXT,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  evidence_ref TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'committed', 'cancelled')),
  approver TEXT,
  approved_at TIMESTAMPTZ,
  approval_version TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES finance_parties(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  date DATE NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  matched_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partial', 'received', 'closed', 'cancelled')),
  project_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  employee_id TEXT,
  requester TEXT NOT NULL,
  purpose JSONB NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  project_id TEXT,
  receipt_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'reimbursed', 'rejected')),
  taxable BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  label JSONB NOT NULL,
  supplier_id UUID NOT NULL REFERENCES finance_parties(id) ON DELETE CASCADE,
  cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  renewal_term JSONB NOT NULL,
  next_renewal_date DATE NOT NULL,
  notice_date DATE,
  owner TEXT NOT NULL,
  cancellation_evidence TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Accounting and matching
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES finance_books(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  date DATE NOT NULL,
  description JSONB NOT NULL,
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  source TEXT NOT NULL CHECK (source IN ('import', 'manual', 'adjustment', 'payroll', 'close')),
  reversed_by_id TEXT,
  balanced BOOLEAN NOT NULL DEFAULT FALSE,
  period_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_bank_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES finance_bank_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  description TEXT NOT NULL,
  match_status TEXT NOT NULL DEFAULT 'unmatched' CHECK (match_status IN ('unmatched', 'suggested', 'matched', 'exception')),
  matched_journal_id TEXT,
  matched_invoice_id TEXT,
  matched_bill_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES finance_bank_accounts(id) ON DELETE CASCADE,
  period_id TEXT NOT NULL,
  opening_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  statement_total NUMERIC(18,2) NOT NULL DEFAULT 0,
  book_total NUMERIC(18,2) NOT NULL DEFAULT 0,
  difference NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'reconciled', 'exception')),
  reviewer TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_close_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES finance_books(id) ON DELETE CASCADE,
  period_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'approved', 'locked')),
  approver TEXT,
  approved_at TIMESTAMPTZ,
  reopen_reason JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Payroll (sensitive — admin-only RLS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_pay_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pay_date DATE NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'semimonthly', 'monthly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_pay_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES finance_pay_periods(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inputs_open' CHECK (status IN ('inputs_open', 'inputs_approved', 'submitted', 'results_imported', 'reconciled', 'exception')),
  gross_pay NUMERIC(18,2) NOT NULL DEFAULT 0,
  employee_deductions NUMERIC(18,2) NOT NULL DEFAULT 0,
  employer_contributions NUMERIC(18,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(18,2) NOT NULL DEFAULT 0,
  provider_fees NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  jurisdictions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  calculation_source JSONB NOT NULL,
  rule_version TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  exceptions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_payroll_liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  pay_run_id UUID REFERENCES finance_pay_runs(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('source_deductions', 'employer_contributions', 'remittance', 'other')),
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  due_date DATE NOT NULL,
  settled BOOLEAN NOT NULL DEFAULT FALSE,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Budgets and planning
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  label JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'revised', 'archived')),
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner TEXT NOT NULL,
  approved_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  label JSONB NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('baseline', 'hiring', 'capital_purchase', 'financing', 'operating_change', 'tax')),
  assumptions JSONB NOT NULL,
  cutoff_date DATE NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  projected_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  projected_expense NUMERIC(18,2) NOT NULL DEFAULT 0,
  projected_cash_flow NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'accepted', 'stale')),
  reviewer TEXT,
  reviewed_at TIMESTAMPTZ,
  stale_reason JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  label JSONB NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('13_week_cash', 'monthly_operating', 'custom')),
  baseline_scenario_id TEXT,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  periods JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner TEXT NOT NULL,
  frozen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Treasury
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_reserve_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payroll', 'tax', 'emergency_operating', 'capital_purchase', 'other')),
  label JSONB NOT NULL,
  target_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  current_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  linked_bank_account_id TEXT,
  due_date DATE,
  owner TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  label JSONB NOT NULL,
  institution JSONB NOT NULL,
  units TEXT,
  cost_basis NUMERIC(18,2),
  carrying_value NUMERIC(18,2),
  market_value NUMERIC(18,2),
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  as_of_date DATE NOT NULL,
  realized_result NUMERIC(18,2),
  unrealized_change NUMERIC(18,2),
  income_ytd NUMERIC(18,2),
  fees_ytd NUMERIC(18,2),
  valuation_source JSONB NOT NULL,
  stale BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  label JSONB NOT NULL,
  lender JSONB NOT NULL,
  principal NUMERIC(18,2) NOT NULL DEFAULT 0,
  balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  interest_rate TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  maturity_date DATE NOT NULL,
  notice_period TEXT,
  collateral_ref TEXT,
  covenant_ref TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'defaulted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Tax
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_tax_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income_tax', 'gst_hst', 'qst', 'payroll_source_deductions', 'employer_contributions', 'other')),
  jurisdiction JSONB NOT NULL,
  period TEXT NOT NULL,
  due_date DATE NOT NULL,
  payment_due_date DATE,
  estimated_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  confirmed_amount NUMERIC(18,2),
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  preparer TEXT,
  reviewer TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_preparation', 'reviewed', 'filed', 'paid', 'confirmed', 'overdue', 'withdrawn')),
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  filing_ref TEXT,
  notes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_tax_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  label JSONB NOT NULL,
  baseline TEXT NOT NULL,
  proposed_decision JSONB NOT NULL,
  projected_profit NUMERIC(18,2) NOT NULL DEFAULT 0,
  projected_taxable_income NUMERIC(18,2) NOT NULL DEFAULT 0,
  projected_tax NUMERIC(18,2) NOT NULL DEFAULT 0,
  projected_cash_flow NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK (currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  assumptions JSONB NOT NULL,
  law_version JSONB NOT NULL,
  enacted BOOLEAN NOT NULL DEFAULT TRUE,
  reviewer TEXT,
  reviewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'accepted', 'stale')),
  stale_reason JSONB,
  disclaimer JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Approvals and audit
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('spend_request', 'expense', 'journal', 'pay_run', 'close_period', 'tax_scenario')),
  record_id TEXT NOT NULL,
  approver TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'changes_requested')),
  approved_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  approved_currency TEXT NOT NULL CHECK (approved_currency IN ('CAD', 'USD', 'EUR', 'GBP')),
  payee_version TEXT,
  rationale JSONB,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action JSONB NOT NULL,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  outcome JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_external_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('payment', 'filing', 'remittance', 'payroll_submission')),
  record_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'internal_approval' CHECK (status IN ('internal_approval', 'export_prepared', 'provider_accepted', 'settled', 'filing_accepted', 'failed', 'returned', 'unknown')),
  payload_version TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  provider_ref TEXT,
  confirmed_at TIMESTAMPTZ,
  notes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Evidence storage (receipts and source documents)
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES finance_entities(id) ON DELETE CASCADE,
  bill_id TEXT,
  expense_id TEXT,
  file_name JSONB NOT NULL,
  storage_path TEXT NOT NULL,
  file_sha256 TEXT,
  size_bytes BIGINT,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Private Storage bucket for finance evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'finance-evidence', 'finance-evidence', FALSE, 52428800,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS finance_entities_organization_id_idx ON finance_entities(organization_id);
CREATE INDEX IF NOT EXISTS finance_books_organization_id_idx ON finance_books(organization_id);
CREATE INDEX IF NOT EXISTS finance_books_entity_id_idx ON finance_books(entity_id);
CREATE INDEX IF NOT EXISTS finance_fiscal_periods_organization_id_idx ON finance_fiscal_periods(organization_id);
CREATE INDEX IF NOT EXISTS finance_parties_organization_id_idx ON finance_parties(organization_id);
CREATE INDEX IF NOT EXISTS finance_bank_accounts_organization_id_idx ON finance_bank_accounts(organization_id);
CREATE INDEX IF NOT EXISTS finance_ledger_accounts_organization_id_idx ON finance_ledger_accounts(organization_id);
CREATE INDEX IF NOT EXISTS finance_ledger_accounts_book_id_idx ON finance_ledger_accounts(book_id);
CREATE INDEX IF NOT EXISTS finance_invoices_organization_id_idx ON finance_invoices(organization_id);
CREATE INDEX IF NOT EXISTS finance_invoices_status_idx ON finance_invoices(status);
CREATE INDEX IF NOT EXISTS finance_invoices_due_date_idx ON finance_invoices(due_date);
CREATE INDEX IF NOT EXISTS finance_bills_organization_id_idx ON finance_bills(organization_id);
CREATE INDEX IF NOT EXISTS finance_bills_status_idx ON finance_bills(status);
CREATE INDEX IF NOT EXISTS finance_credits_organization_id_idx ON finance_credits(organization_id);
CREATE INDEX IF NOT EXISTS finance_spend_requests_organization_id_idx ON finance_spend_requests(organization_id);
CREATE INDEX IF NOT EXISTS finance_spend_requests_status_idx ON finance_spend_requests(status);
CREATE INDEX IF NOT EXISTS finance_purchase_orders_organization_id_idx ON finance_purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS finance_expenses_organization_id_idx ON finance_expenses(organization_id);
CREATE INDEX IF NOT EXISTS finance_subscriptions_organization_id_idx ON finance_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS finance_journals_organization_id_idx ON finance_journals(organization_id);
CREATE INDEX IF NOT EXISTS finance_journals_book_id_idx ON finance_journals(book_id);
CREATE INDEX IF NOT EXISTS finance_journals_status_idx ON finance_journals(status);
CREATE INDEX IF NOT EXISTS finance_bank_items_organization_id_idx ON finance_bank_items(organization_id);
CREATE INDEX IF NOT EXISTS finance_bank_items_match_status_idx ON finance_bank_items(match_status);
CREATE INDEX IF NOT EXISTS finance_reconciliations_organization_id_idx ON finance_reconciliations(organization_id);
CREATE INDEX IF NOT EXISTS finance_close_periods_organization_id_idx ON finance_close_periods(organization_id);
CREATE INDEX IF NOT EXISTS finance_pay_periods_organization_id_idx ON finance_pay_periods(organization_id);
CREATE INDEX IF NOT EXISTS finance_pay_runs_organization_id_idx ON finance_pay_runs(organization_id);
CREATE INDEX IF NOT EXISTS finance_pay_runs_status_idx ON finance_pay_runs(status);
CREATE INDEX IF NOT EXISTS finance_payroll_liabilities_organization_id_idx ON finance_payroll_liabilities(organization_id);
CREATE INDEX IF NOT EXISTS finance_budgets_organization_id_idx ON finance_budgets(organization_id);
CREATE INDEX IF NOT EXISTS finance_scenarios_organization_id_idx ON finance_scenarios(organization_id);
CREATE INDEX IF NOT EXISTS finance_forecasts_organization_id_idx ON finance_forecasts(organization_id);
CREATE INDEX IF NOT EXISTS finance_reserve_goals_organization_id_idx ON finance_reserve_goals(organization_id);
CREATE INDEX IF NOT EXISTS finance_holdings_organization_id_idx ON finance_holdings(organization_id);
CREATE INDEX IF NOT EXISTS finance_debts_organization_id_idx ON finance_debts(organization_id);
CREATE INDEX IF NOT EXISTS finance_tax_obligations_organization_id_idx ON finance_tax_obligations(organization_id);
CREATE INDEX IF NOT EXISTS finance_tax_obligations_status_idx ON finance_tax_obligations(status);
CREATE INDEX IF NOT EXISTS finance_tax_obligations_due_date_idx ON finance_tax_obligations(due_date);
CREATE INDEX IF NOT EXISTS finance_tax_scenarios_organization_id_idx ON finance_tax_scenarios(organization_id);
CREATE INDEX IF NOT EXISTS finance_approvals_organization_id_idx ON finance_approvals(organization_id);
CREATE INDEX IF NOT EXISTS finance_audit_events_organization_id_idx ON finance_audit_events(organization_id);
CREATE INDEX IF NOT EXISTS finance_external_actions_organization_id_idx ON finance_external_actions(organization_id);
CREATE INDEX IF NOT EXISTS finance_external_actions_idempotency_key_idx ON finance_external_actions(idempotency_key);
CREATE INDEX IF NOT EXISTS finance_receipts_organization_id_idx ON finance_receipts(organization_id);
CREATE INDEX IF NOT EXISTS finance_receipts_storage_path_idx ON finance_receipts(storage_path) WHERE storage_path IS NOT NULL;

-- ============================================================================
-- RLS: Enable on all finance tables
-- ============================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'finance_entities', 'finance_books', 'finance_fiscal_periods',
    'finance_parties', 'finance_bank_accounts', 'finance_ledger_accounts',
    'finance_invoices', 'finance_bills', 'finance_credits',
    'finance_spend_requests', 'finance_purchase_orders', 'finance_expenses',
    'finance_subscriptions',
    'finance_journals', 'finance_bank_items', 'finance_reconciliations',
    'finance_close_periods',
    'finance_pay_periods', 'finance_pay_runs', 'finance_payroll_liabilities',
    'finance_budgets', 'finance_scenarios', 'finance_forecasts',
    'finance_reserve_goals', 'finance_holdings', 'finance_debts',
    'finance_tax_obligations', 'finance_tax_scenarios',
    'finance_approvals', 'finance_audit_events', 'finance_external_actions',
    'finance_receipts'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END
$$;

-- ============================================================================
-- RLS: Standard org-member read / org-admin write policies
-- ============================================================================

-- Helper: apply standard policies to a table
-- Org members can read; org admins can insert/update/delete.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'finance_entities', 'finance_books', 'finance_fiscal_periods',
    'finance_parties', 'finance_bank_accounts', 'finance_ledger_accounts',
    'finance_invoices', 'finance_bills', 'finance_credits',
    'finance_spend_requests', 'finance_purchase_orders', 'finance_expenses',
    'finance_subscriptions',
    'finance_journals', 'finance_bank_items', 'finance_reconciliations',
    'finance_close_periods',
    'finance_budgets', 'finance_scenarios', 'finance_forecasts',
    'finance_reserve_goals', 'finance_holdings', 'finance_debts',
    'finance_tax_obligations', 'finance_tax_scenarios',
    'finance_approvals', 'finance_audit_events', 'finance_external_actions',
    'finance_receipts'
  ]
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

-- ============================================================================
-- RLS: Sensitive payroll tables — admin-only read
-- Payroll details, pay runs, and payroll liabilities contain personal and
-- financial data. Only org admins can read them; non-admins get no rows.
-- ============================================================================

-- Drop the org-member read policies on sensitive tables and replace with admin-only
ALTER POLICY "Org members can read finance_pay_runs" ON public.finance_pay_runs
  USING (public.is_org_admin(organization_id, (select auth.uid())));

ALTER POLICY "Org members can read finance_payroll_liabilities" ON public.finance_payroll_liabilities
  USING (public.is_org_admin(organization_id, (select auth.uid())));

ALTER POLICY "Org members can read finance_pay_periods" ON public.finance_pay_periods
  USING (public.is_org_admin(organization_id, (select auth.uid())));

-- ============================================================================
-- RLS: Storage bucket for finance evidence
-- Object keys: <organization_id>/<entity_id>/<receipt_id>.<ext>
-- ============================================================================

CREATE POLICY "Org members read finance evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'finance-evidence'
    AND public.is_org_member(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  );

CREATE POLICY "Org admins upload finance evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'finance-evidence'
    AND public.is_org_admin(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  );

CREATE POLICY "Org admins update finance evidence"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'finance-evidence'
    AND public.is_org_admin(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  )
  WITH CHECK (
    bucket_id = 'finance-evidence'
    AND public.is_org_admin(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  );

CREATE POLICY "Org admins delete finance evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'finance-evidence'
    AND public.is_org_admin(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  );

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN THE PUBLIC SCHEMA TO authenticated;
