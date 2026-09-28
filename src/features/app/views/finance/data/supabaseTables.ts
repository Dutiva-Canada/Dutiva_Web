/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase as supabaseTyped } from '@/lib/supabaseClient'

/* Supabase client + table map shared by the supabaseCreate* sibling modules
   (split from supabaseCreates.ts under the 800-line source budget). */
const supabase: any = supabaseTyped

const TABLES = {
  entities: 'finance_entities',
  books: 'finance_books',
  budgets: 'finance_budgets',
  scenarios: 'finance_scenarios',
  forecasts: 'finance_forecasts',
  reserveGoals: 'finance_reserve_goals',
  holdings: 'finance_holdings',
  watchlistItems: 'finance_watchlist_items',
  decisionEntries: 'finance_decision_entries',
  deals: 'finance_deals',
  commitments: 'finance_commitments',
  capitalCalls: 'finance_capital_calls',
  cashSweeps: 'finance_cash_sweeps',
  documentLinks: 'finance_document_links',
  debts: 'finance_debts',
  externalActions: 'finance_external_actions',
  bankAccounts: 'finance_bank_accounts',
  ledgerAccounts: 'finance_ledger_accounts',
  categoryRules: 'finance_category_rules',
  parties: 'finance_parties',
  subscriptions: 'finance_subscriptions',
} as const

export { supabase, TABLES }
