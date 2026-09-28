/**
 * Finance create/lifecycle mutations against Supabase.
 *
 * Split into sibling modules under the 800-line source budget:
 * supabaseCreateEntities / supabaseCreatePlanning / supabaseCreateInvest.
 * Re-exported here so `from './supabaseCreates'` keeps working for every
 * existing import site.
 */

/* Entity/book/account/party setup creates — ./supabaseCreateEntities */
export {
  addEntityInSupabase,
  updateEntityInSupabase,
  deleteEntityInSupabase,
  addBankAccountInSupabase,
  addLedgerAccountInSupabase,
  addPartyInSupabase,
  addSubscriptionInSupabase,
  seedDefaultCategoryRulesInSupabase,
} from './supabaseCreateEntities'

/* Scenario/forecast/reserve/holding/debt lifecycle + status transitions — ./supabaseCreatePlanning */
export {
  addScenarioInSupabase,
  addForecastInSupabase,
  addReserveGoalInSupabase,
  updateReserveGoalProgressInSupabase,
  setHoldingStaleInSupabase,
  transitionDebtStatusInSupabase,
  transitionBudgetStatusInSupabase,
  transitionScenarioStatusInSupabase,
  freezeForecastInSupabase,
  updateForecastPeriodsInSupabase,
  addExternalActionInSupabase,
} from './supabaseCreatePlanning'

/* Watchlist, deals, commitments, sweeps, capital calls, document links — ./supabaseCreateInvest */
export {
  addWatchlistItemInSupabase,
  transitionWatchlistStatusInSupabase,
  addDecisionEntryInSupabase,
  updateDecisionOutcomeInSupabase,
  addDealInSupabase,
  updateDealInSupabase,
  transitionDealStageInSupabase,
  removeDealInSupabase,
  addCommitmentInSupabase,
  updateCommitmentInSupabase,
  removeCommitmentInSupabase,
  addCashSweepInSupabase,
  updateCashSweepInSupabase,
  removeCashSweepInSupabase,
  transitionCashSweepStatusInSupabase,
  addCapitalCallInSupabase,
  updateCapitalCallInSupabase,
  removeCapitalCallInSupabase,
  transitionCapitalCallStatusInSupabase,
  addDocumentLinkInSupabase,
  removeDocumentLinkInSupabase,
} from './supabaseCreateInvest'
