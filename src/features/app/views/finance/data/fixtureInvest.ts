import { bi } from '@/i18n/core'
import type { FinanceWorkspaceState } from './types'

/**
 * Demo finance fixtures — watchlist, decision journal, commitments, capital calls, doc links, deals.
 *
 * Split from fixtures.ts under the 800-line source budget; assembled into
 * initialFinanceState there.
 */

export const watchlistItem: FinanceWorkspaceState['watchlistItems'][number] = {
  id: 'watch-1',
  entityId: 'ent-1',
  symbol: 'XEQT',
  label: bi(
    'All-equity ETF — surplus sweep candidate',
    'FNB tout-actions — candidat pour le surplus',
  ),
  assetClass: 'fund',
  thesis: bi(
    'Parking operating surplus beyond the GIC ladder; reviewed quarterly against the cash forecast.',
    'Placement du surplus d’exploitation au-delà de l’échelle de CPG; révisé chaque trimestre par rapport aux prévisions de trésorerie.',
  ),
  targetLow: '28.00',
  targetHigh: '32.00',
  currency: 'CAD',
  status: 'under_review',
}

export const watchlistItem2: FinanceWorkspaceState['watchlistItems'][number] = {
  id: 'watch-2',
  entityId: 'ent-1',
  label: bi(
    'Provincial bond ladder — 1 to 3 year',
    'Échelle d’obligations provinciales — 1 à 3 ans',
  ),
  assetClass: 'fixed_income',
  thesis: bi(
    'Match the tax reserve horizon without locking everything into the 90-day GIC.',
    'Aligner l’horizon de la réserve fiscale sans tout immobiliser dans le CPG de 90 jours.',
  ),
  currency: 'CAD',
  status: 'watching',
}

export const decisionEntry: FinanceWorkspaceState['decisionEntries'][number] = {
  id: 'dec-1',
  entityId: 'ent-1',
  holdingId: 'hold-1',
  decision: 'hold',
  decidedAt: '2026-09-01',
  summary: bi(
    'Renew the 90-day GIC at maturity; keep $30k in the instrument.',
    'Renouveler le CPG de 90 jours à l’échéance; conserver 30 000 $ dans l’instrument.',
  ),
  rationale: bi(
    'Rate holds above the money-market sweep and the reserve goal is already funded.',
    'Le taux reste supérieur au compte du marché monétaire et l’objectif de réserve est déjà financé.',
  ),
  reviewDate: '2026-12-01',
}

export const decisionEntry2: FinanceWorkspaceState['decisionEntries'][number] = {
  id: 'dec-2',
  entityId: 'ent-1',
  watchlistItemId: 'watch-1',
  decision: 'review',
  decidedAt: '2026-09-10',
  summary: bi(
    'Evaluate moving the Q4 surplus into XEQT once payroll reserve tops $50k.',
    'Évaluer le transfert du surplus du T4 vers XEQT une fois que la réserve de paie dépasse 50 000 $.',
  ),
  rationale: bi(
    'Surplus is real but lumpy; wait until the payroll reserve goal is fully funded.',
    'Le surplus est réel mais irrégulier; attendre que l’objectif de réserve de paie soit entièrement financé.',
  ),
  reviewDate: '2026-10-15',
}

/* Capital commitments — the investor's subscription is partially called;
   the lender's facility is fully drawn but still open. Both hang off the
   holdco (ent-2) like the parties themselves. */
export const commitmentInvestor: FinanceWorkspaceState['commitments'][number] = {
  id: 'cmt-1',
  entityId: 'ent-2',
  partyId: 'party-inv-1',
  label: bi('Growth equity commitment', 'Engagement en capital de croissance'),
  committed: '1500000.00',
  called: '600000.00',
  currency: 'CAD',
  nextCallDate: '2026-10-10',
  status: 'active',
}

export const commitmentLender: FinanceWorkspaceState['commitments'][number] = {
  id: 'cmt-2',
  entityId: 'ent-2',
  partyId: 'party-len-1',
  label: bi('Acquisition credit facility', 'Facilité de crédit d’acquisition'),
  committed: '750000.00',
  called: '750000.00',
  currency: 'CAD',
  status: 'active',
}

/* Capital calls — the investor's called figure came in as one draw, and
   the next tranche is already notified (due mid-October; the commitment's
   nextCallDate tracks the same tranche). */
export const capitalCallReceived: FinanceWorkspaceState['capitalCalls'][number] = {
  id: 'call-1',
  commitmentId: 'cmt-1',
  amount: '600000.00',
  dueDate: '2026-08-15',
  status: 'received',
  reference: 'Call notice 2026-01',
  receivedDate: '2026-08-12',
}

export const capitalCallScheduled: FinanceWorkspaceState['capitalCalls'][number] = {
  id: 'call-2',
  commitmentId: 'cmt-1',
  amount: '250000.00',
  dueDate: '2026-10-10',
  status: 'notified',
  reference: 'Call notice 2026-02',
}

/* Deal/holding document links (0175) — snapshots of documents in the HR
   Documents module (hr_generated_documents); deep links resolve to
   /app/documents/<documentId>. */
export const linkDeal: FinanceWorkspaceState['documentLinks'][number] = {
  id: 'link-1',
  dealId: 'deal-1',
  documentId: 'doc_002',
  documentRef: 'DOC-2026-0151',
  title: bi('Employment agreement — Grace Osei', 'Contrat de travail — Grace Osei'),
}

export const linkHolding: FinanceWorkspaceState['documentLinks'][number] = {
  id: 'link-2',
  holdingId: 'hold-1',
  documentId: 'doc_003',
  documentRef: 'DOC-2026-0138',
  title: bi('Termination letter — Jordan Mensah', 'Lettre de licenciement — Jordan Mensah'),
}

export const dealAcquisition: FinanceWorkspaceState['deals'][number] = {
  id: 'deal-1',
  entityId: 'ent-2',
  name: bi('Verdun Freight Lines — tuck-in', 'Verdun Freight Lines — acquisition complémentaire'),
  kind: 'acquisition',
  stage: 'diligence',
  counterparty: 'Verdun Freight Lines Ltd.',
  value: '850000.00',
  currency: 'CAD',
  targetDate: '2026-11-30',
  owner: 'Martin Constantineau',
  notes: bi(
    'Fleet overlaps the QC corridor; diligence focused on contracts and equipment liens.',
    'La flotte recoupe le corridor québécois; la vérification porte sur les contrats et les privilèges sur l’équipement.',
  ),
}

export const dealInvestment: FinanceWorkspaceState['deals'][number] = {
  id: 'deal-2',
  entityId: 'ent-2',
  name: bi(
    'Great Lakes Cold Storage — minority stake',
    'Great Lakes Cold Storage — participation minoritaire',
  ),
  kind: 'investment',
  stage: 'negotiation',
  counterparty: 'Great Lakes Cold Storage Inc.',
  value: '250000.00',
  currency: 'CAD',
  targetDate: '2026-12-15',
  owner: 'Martin Constantineau',
  notes: bi(
    'Term sheet circulated; board approval needed before signature.',
    'La convention de principe circule; l’approbation du conseil est requise avant la signature.',
  ),
}

export const dealFinancing: FinanceWorkspaceState['deals'][number] = {
  id: 'deal-3',
  entityId: 'ent-2',
  name: bi('Holdco credit facility', 'Facilité de crédit de la société de portefeuille'),
  kind: 'financing',
  stage: 'agreement',
  counterparty: 'Big Five Bank',
  value: '500000.00',
  currency: 'CAD',
  targetDate: '2026-09-15',
  owner: 'Jordan Lee',
  notes: bi(
    'Secured against holdco assets; funds earmarked for the Verdun closing.',
    'Garantie sur les actifs de la société de portefeuille; fonds réservés à la clôture de Verdun.',
  ),
}

export const dealPassed: FinanceWorkspaceState['deals'][number] = {
  id: 'deal-4',
  entityId: 'ent-2',
  name: bi('Logistics SaaS seed round', 'Premier tour de financement — SaaS logistique'),
  kind: 'other',
  stage: 'passed',
  counterparty: 'RouteBase Software',
  value: '100000.00',
  currency: 'CAD',
  owner: 'Martin Constantineau',
  notes: bi(
    'Passed — valuation ran ahead of the record the round was priced on.',
    'Écarté — la valorisation dépassait ce que justifiait le dossier sur lequel le tour était fixé.',
  ),
}
