import { defineMessages } from '../../core'
import { financeAccounting } from './accounting'
import { financeChrome } from './chrome'
import { financeEntities } from './entities'
import { financeEvidence } from './evidence'
import { financeExternal } from './external'
import { financeImportExport } from './importExport'
import { financeOverview } from './overview'
import { financePayroll } from './payroll'
import { financePlans } from './plans'
import { financePortfolio } from './portfolio'
import { financePurchases } from './purchases'
import { financeSales } from './sales'
import { financeTax } from './tax'
import { financeTransactions } from './transactions'
import { financeTreasury } from './treasury'

/**
 * Finance workspace chrome. These keys are workspace-scoped and used by
 * the `/app/finance` feature area only — split by screen for
 * maintainability, same convention as `messages/landing/`.
 *
 * [FR self-authored — not from a design handoff; reviewed against the blueprint.]
 */
export const financeMessages = defineMessages({
  ...financeChrome,
  ...financeOverview,
  ...financeTransactions,
  ...financeSales,
  ...financePurchases,
  ...financePayroll,
  ...financeAccounting,
  ...financePlans,
  ...financeTreasury,
  ...financeTax,
  ...financeEntities,
  ...financeEvidence,
  ...financeExternal,
  ...financeImportExport,
  ...financePortfolio,
})
