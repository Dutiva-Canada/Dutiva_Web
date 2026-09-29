import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { advisorWorkspaceMessages } from '@/i18n/messages/advisorWorkspace'
import type { ScenarioId } from './advisorScenarioTypes'

/**
 * The six demonstrated response modes from the Advisor chat handoff
 * (`docs/design-handoff-advisor-chat/` — `Advisor Response Experience.dc.html`
 * `scenarios()`; `AGENT.md` is the normative spec these turns follow): HR
 * compliance (termination), high-risk escalation, HR accommodation,
 * jurisdiction-unknown, supportive triage, and current-info with live web
 * sources.
 *
 * These are the signed-out / engine-unavailable preview conversations and the
 * reference fixtures for the response contract — the live engine returns the
 * same `AdvisorResponse` shape (see `advisor/contract.ts`). EN verbatim from
 * the prototype; FR [self-authored] (the prototype's FR toggle is decorative).
 */

export * from './advisorScenarioTypes'
export * from './advisorScenarioData'

/**
 * Demo trigger routing (prototype `routeHome` — reference triggers for the
 * engine's classifier, AGENT.md §2). No jurisdiction cue → jurisdiction-
 * unknown (s4): the Advisor never falls through to "assume Ontario".
 */
export function routeScenarioFromText(text: string): ScenarioId {
  const t = text.toLowerCase()
  if (/terminat|dismiss|fire|let go|congédi|licenci/.test(t)) return 's1'
  if (/harass|violence|complaint|harcèl|plainte/.test(t)) return 's2'
  if (/accommodat|medical|disab|doctor|leave|accommod|médical|congé/.test(t)) return 's3'
  if (/overwhelm|burnt|burn out|stress|depress|débord|épuis|déprim/.test(t)) return 's5'
  if (/chang|update|latest|current|this year|2026|nouveau|récent/.test(t)) return 's6'
  return 's4'
}

/** Collect-jurisdiction chips (prototype: Ontario / Quebec / Federal / Other). */
export const PROVINCE_CHIPS: Bi[] = [
  advisorWorkspaceMessages.advws_province_on,
  advisorWorkspaceMessages.advws_province_qc,
  advisorWorkspaceMessages.advws_province_fed,
  advisorWorkspaceMessages.advws_province_other,
]

/** Follow-up chip labels for scenario chips with no canned reply fixture. */
export const scenarioFollowupLabels: Record<string, Bi> = {
  'Draft an investigation plan': bi('Draft an investigation plan', 'Rédiger un plan d’enquête'),
  'Assign an impartial investigator': bi(
    'Assign an impartial investigator',
    'Nommer un enquêteur impartial',
  ),
  'Open a case file': bi('Open a case file', 'Ouvrir un dossier'),
  'What counts as undue hardship?': bi(
    'What counts as undue hardship?',
    'Qu’est-ce qu’une contrainte excessive?',
  ),
  'Set a functional-review date': bi(
    'Set a functional-review date',
    'Fixer une date de révision fonctionnelle',
  ),
  'Summarize the minimum-wage change': bi(
    'Summarize the minimum-wage change',
    'Résumer le changement au salaire minimum',
  ),
  'What are the new leave rules?': bi(
    'What are the new leave rules?',
    'Quelles sont les nouvelles règles de congé?',
  ),
  'Cite the exact section': bi('Cite the exact section', 'Citer l’article exact'),
}

/** Advisor-home suggestion grid — the six demo starters (prototype `suggDefs`). */
interface ScenarioSuggestion {
  scenarioId: ScenarioId
  label: Bi
  sub: Bi
}

export const scenarioSuggestions: ScenarioSuggestion[] = [
  {
    scenarioId: 's1',
    label: bi('Terminate an employee', 'Mettre fin à un emploi'),
    sub: bi('Ontario · no clause', 'Ontario · sans clause'),
  },
  {
    scenarioId: 's2',
    label: bi('Respond to a harassment complaint', 'Répondre à une plainte de harcèlement'),
    sub: bi('High-risk escalation', 'Escalade à risque élevé'),
  },
  {
    scenarioId: 's3',
    label: bi('Manage a medical accommodation', 'Gérer un accommodement médical'),
    sub: bi('Duty to accommodate', 'Obligation d’accommodement'),
  },
  {
    scenarioId: 's4',
    label: bi('Notice period', 'Période de préavis'),
    sub: bi('Jurisdiction to confirm', 'Compétence à confirmer'),
  },
  {
    scenarioId: 's5',
    label: bi('Support an overwhelmed teammate', 'Soutenir un collègue débordé'),
    sub: bi('Wellbeing · sensitive', 'Bien-être · délicat'),
  },
  {
    scenarioId: 's6',
    label: bi('What changed this year?', 'Quoi de neuf cette année?'),
    sub: bi('Live web sources', 'Sources Web en direct'),
  },
]

/** In-thread ack when the user keeps typing in a demo scenario (prototype `sendChat`). */
export const scenarioAck: Bi = bi(
  "Noted — I've added that to this thread. I can generate a document, work out an estimate, or loop in counsel whenever you're ready.",
  'Noté — je l’ai ajouté à ce fil. Je peux générer un document, préparer une estimation ou impliquer un conseiller juridique dès que vous êtes prêt.',
)

/** Signed-out ack (workspace stays in preview mode). */
export const scenarioAckSignedOut: Bi = bi(
  "I've noted that. Sign in to run the live engine — it'll pull jurisdiction-aware guidance, risk and citations into your workspace.",
  'C’est noté. Connectez-vous pour lancer le moteur — il affichera dans votre espace les conseils selon la compétence, le risque et les citations.',
)
