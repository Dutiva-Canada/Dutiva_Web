import { bi } from '@/i18n/core'
import type { Flow, FlowFormulaLine } from '../flowModel'
import {
  formatCad,
  formatWeeks,
  ontarioEsaSeveranceAmount,
  ontarioEsaSeveranceWeeks,
} from './ontarioEsaSeverance'

/**
 * Workspace calculator — Ontario ESA s. 64 severance **amount** (EF11 Option A).
 * All FR is [FR self-authored].
 *
 * Does not decide eligibility — run `severance-eligibility-ontario` first (or
 * confirm both gates + no exclusion yourself). Collects tenure and regular
 * weekly wages from the user, then applies the guide formula with a 26-week
 * cap. Org-level payroll storage and a product-tracked mass-termination count
 * remain future work; this flow uses self-reported inputs only.
 *
 * Confirm against ESA ss. 63–65 before stating a figure to an employee.
 */

function severanceLines(getInput: (id: string) => number | undefined): FlowFormulaLine[] | null {
  const years = getInput('years')
  const months = getInput('months')
  const wages = getInput('wages')
  if (years === undefined || months === undefined || wages === undefined) return null
  const weeks = ontarioEsaSeveranceWeeks(years, months)
  if (weeks === null) return null
  const amount = ontarioEsaSeveranceAmount(wages, weeks)
  if (amount === null) return null
  return [
    {
      label: bi('ESA severance weeks (capped at 26)', 'Semaines d’indemnité LNE (plafond de 26)'),
      value: bi(formatWeeks(weeks, 'en'), formatWeeks(weeks, 'fr')),
    },
    {
      label: bi('Estimated amount (regular weekly wages × weeks)', 'Montant estimé (salaire hebdomadaire régulier × semaines)'),
      value: bi(formatCad(amount, 'en'), formatCad(amount, 'fr')),
    },
  ]
}

export const severanceAmountOntarioFlow: Flow = {
  slug: 'severance-amount-ontario',
  ring: 1,
  jurisdictions: ['ON'],
  estMinutes: 5,
  title: bi('Ontario ESA severance amount', 'Montant de l’indemnité de cessation (LNE Ontario)'),
  summary: bi(
    'Estimate ESA severance dollars from tenure and regular weekly wages — only after eligibility is confirmed. Not common-law damages.',
    'Estimez les dollars d’indemnité de cessation de la LNE selon l’ancienneté et le salaire hebdomadaire régulier — seulement après confirmation d’admissibilité. Pas des dommages de common law.',
  ),
  start: 'eligible',
  steps: [
    {
      id: 'eligible',
      kind: 'choice',
      title: bi('Have you confirmed ESA severance likely applies?', 'Avez-vous confirmé que l’indemnité LNE s’applique probablement?'),
      body: bi(
        'This calculator assumes both gates are met (five or more years with this employer, plus global payroll of at least $2.5 million or the 50-employee permanent-closure test) and that no ESA exclusion applies. Use the eligibility workflow if you have not checked.',
        'Ce calculateur suppose que les deux conditions sont remplies (cinq ans ou plus chez cet employeur, plus masse salariale mondiale d’au moins 2,5 M$ ou le test des 50 employés lors d’une fermeture permanente) et qu’aucune exclusion de la LNE ne s’applique. Utilisez le processus d’admissibilité si vous n’avez pas vérifié.',
      ),
      caution: bi(
        'Wrong inputs produce a wrong dollar figure with no automatic warning. Confirm tenure and regular weekly wages from payroll records. Dutiva does not provide legal advice.',
        'De mauvaises entrées produisent un mauvais montant sans avertissement automatique. Confirmez l’ancienneté et le salaire hebdomadaire régulier dans les dossiers de paie. Dutiva ne fournit pas de conseils juridiques.',
      ),
      options: [
        {
          id: 'yes',
          label: bi('Yes — eligibility confirmed; continue to amount', 'Oui — admissibilité confirmée; passer au montant'),
          to: 'years',
        },
        {
          id: 'no',
          label: bi('Not yet — open eligibility first', 'Pas encore — ouvrir d’abord l’admissibilité'),
          to: 'need_eligibility',
        },
      ],
    },
    {
      id: 'years',
      kind: 'input',
      title: bi('Completed years of employment', 'Années d’emploi complétées'),
      body: bi(
        'Enter whole completed years with this employer. Do not round up. Months in an incomplete final year are asked next.',
        'Entrez les années entières complétées chez cet employeur. N’arrondissez pas à la hausse. Les mois de l’année finale incomplète sont demandés ensuite.',
      ),
      label: bi('Completed years', 'Années complétées'),
      unit: bi('years', 'années'),
      destinations: ['months'],
      resolve: () => 'months',
    },
    {
      id: 'months',
      kind: 'input',
      title: bi('Completed months in the incomplete final year', 'Mois complétés dans l’année finale incomplète'),
      body: bi(
        'If the final year is incomplete, enter how many whole months were completed in that year (0 through 11). Enter 0 if tenure ends on an exact year boundary.',
        'Si l’année finale est incomplète, entrez combien de mois entiers ont été complétés dans cette année (0 à 11). Entrez 0 si l’ancienneté se termine pile sur une année.',
      ),
      label: bi('Months in final year', 'Mois de l’année finale'),
      unit: bi('months (0–11)', 'mois (0–11)'),
      destinations: ['wages', 'bad_months'],
      resolve: (n) => (n <= 11 ? 'wages' : 'bad_months'),
    },
    {
      id: 'wages',
      kind: 'input',
      numberKind: 'decimal',
      title: bi('Regular wages for a regular work week', 'Salaire régulier pour une semaine de travail régulière'),
      body: bi(
        'Use the employee’s regular weekly wages in Canadian dollars — the same concept the ESA guide uses for the severance formula. Confirm from payroll; do not guess.',
        'Utilisez le salaire hebdomadaire régulier de l’employé en dollars canadiens — le même concept que le guide de la LNE pour la formule d’indemnité. Confirmez auprès de la paie; ne devinez pas.',
      ),
      label: bi('Regular weekly wages', 'Salaire hebdomadaire régulier'),
      unit: bi('CAD / week', 'CAD / semaine'),
      destinations: ['amount'],
      resolve: () => 'amount',
    },
    {
      id: 'amount',
      kind: 'formula',
      tone: 'caution',
      title: bi('ESA severance estimate', 'Estimation de l’indemnité LNE'),
      body: bi(
        'This is the ESA statutory severance estimate from the inputs you entered — regular weekly wages × (years + months/12), capped at 26 weeks. It is not termination notice, not common-law damages, and not a promise of what to pay. Verify every input and the statute before putting a figure in a letter.',
        'Voici l’estimation d’indemnité de cessation légale de la LNE d’après vos entrées — salaire hebdomadaire régulier × (années + mois/12), plafonnée à 26 semaines. Ce n’est pas le préavis, ni des dommages de common law, ni une promesse de paiement. Vérifiez chaque entrée et la loi avant d’inscrire un chiffre dans une lettre.',
      ),
      inputs: ['years', 'months', 'wages'],
      evaluate: severanceLines,
      documents: ['T03'],
    },
    {
      id: 'bad_months',
      kind: 'outcome',
      tone: 'caution',
      title: bi('Months must be 0 through 11', 'Les mois doivent être de 0 à 11'),
      body: bi(
        'The incomplete final year is measured in whole months from 0 to 11. Go back and enter a value in that range, or convert longer residual service into completed years first.',
        'L’année finale incomplète se mesure en mois entiers de 0 à 11. Revenez et entrez une valeur dans cette fourchette, ou convertissez d’abord un résidu plus long en années complétées.',
      ),
      noDocument: bi(
        'No amount is computed until the month input is in range. Fix the months field, then continue.',
        'Aucun montant n’est calculé tant que les mois ne sont pas dans la fourchette. Corrigez le champ des mois, puis continuez.',
      ),
    },
    {
      id: 'need_eligibility',
      kind: 'outcome',
      tone: 'caution',
      title: bi('Confirm eligibility before computing an amount', 'Confirmez l’admissibilité avant de calculer un montant'),
      body: bi(
        'Open the Ontario ESA severance eligibility workflow first. Computing dollars before the gates are checked invites paying (or refusing) the wrong entitlement.',
        'Ouvrez d’abord le processus d’admissibilité à l’indemnité de cessation de la LNE de l’Ontario. Calculer des dollars avant de vérifier les conditions invite à verser (ou refuser) la mauvaise prestation.',
      ),
      noDocument: bi(
        'Use /app/workflows/severance-eligibility-ontario, then return here if both gates are met and no exclusion applies.',
        'Utilisez /app/workflows/severance-eligibility-ontario, puis revenez ici si les deux conditions sont remplies et qu’aucune exclusion ne s’applique.',
      ),
    },
  ],
}
