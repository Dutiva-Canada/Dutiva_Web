import { bi } from '@/i18n/core'
import { lookupStatutoryNoticeWeeks } from '@/features/app/advisor/safety/statutoryNotice'
import type { Flow, FlowStepId } from '../flowModel'

/**
 * Workspace calculator — Ontario ESA s. 57 statutory notice floor
 * (TODO.md EF11). All FR is [FR self-authored].
 *
 * Two entry paths into the same floor outcomes: tenure **bands** (choice) or
 * typed **completed months** (`input` → `lookupStatutoryNoticeWeeks`). Each
 * outcome states the statutory floor weeks for that tenure only — never
 * common-law reasonable notice.
 *
 * Public marketing pages must not publish these figures
 * (SEO_AUTHORITY_PLAYBOOK / articleModel). This flow lives under
 * `/app/workflows/` behind the standing Disclaimer on the runner.
 *
 * Colocated `statutoryNoticeOntario.test.ts` asserts every band weeks figure
 * matches the grounded table so copy cannot drift from the lookup.
 */

/** Tenure bands → completed months used to look up the floor (band minimum). */
export const NOTICE_TENURE_BANDS = [
  { id: 'under_3m', completedMonths: 0, weeks: 0 },
  { id: 'm3_under_1y', completedMonths: 3, weeks: 1 },
  { id: 'y1_under_3', completedMonths: 12, weeks: 2 },
  { id: 'y3_under_4', completedMonths: 36, weeks: 3 },
  { id: 'y4_under_5', completedMonths: 48, weeks: 4 },
  { id: 'y5_under_6', completedMonths: 60, weeks: 5 },
  { id: 'y6_under_7', completedMonths: 72, weeks: 6 },
  { id: 'y7_under_8', completedMonths: 84, weeks: 7 },
  { id: 'y8_plus', completedMonths: 96, weeks: 8 },
] as const

const FLOOR_DESTINATIONS = [
  'floor_0',
  'floor_1',
  'floor_2',
  'floor_3',
  'floor_4',
  'floor_5',
  'floor_6',
  'floor_7',
  'floor_8',
] as const satisfies readonly FlowStepId[]

/** Map completed months to the matching floor outcome id. */
export function ontarioFloorStepId(completedMonths: number): FlowStepId {
  const weeks = lookupStatutoryNoticeWeeks('ON', completedMonths)
  if (weeks === null) return 'floor_0'
  return `floor_${weeks}`
}

export const statutoryNoticeOntarioFlow: Flow = {
  slug: 'statutory-notice-ontario',
  ring: 1,
  jurisdictions: ['ON'],
  estMinutes: 3,
  title: bi('Ontario statutory notice (ESA floor)', 'Préavis légal de l’Ontario (plancher LNE)'),
  summary: bi(
    'Look up the ESA s. 57 minimum notice weeks for completed tenure — a floor, not common-law reasonable notice.',
    'Repérez les semaines de préavis minimales de l’art. 57 de la LNE selon l’ancienneté complétée — un plancher, pas le préavis raisonnable de common law.',
  ),
  start: 'method',
  steps: [
    {
      id: 'method',
      kind: 'choice',
      title: bi('How do you want to look up tenure?', 'Comment voulez-vous repérer l’ancienneté?'),
      body: bi(
        'ESA s. 57 steps on completed service. Use completed months and years — do not round up. This tool only covers Ontario individual termination notice under the Employment Standards Act, 2000.',
        'L’art. 57 de la LNE s’applique selon le service complété. Comptez les mois et années complétés — n’arrondissez pas à la hausse. Cet outil ne couvre que le préavis individuel de cessation en Ontario sous la Loi de 2000 sur les normes d’emploi.',
      ),
      caution: bi(
        'This is the statutory floor only. Common-law reasonable notice is often higher and fact-dependent. Contractual notice may also exceed the ESA. Dutiva does not provide legal advice.',
        'Il ne s’agit que du plancher légal. Le préavis raisonnable de common law est souvent plus élevé et dépend des faits. Un préavis contractuel peut aussi dépasser la LNE. Dutiva ne fournit pas de conseils juridiques.',
      ),
      options: [
        {
          id: 'band',
          label: bi('Pick a completed-tenure band', 'Choisir une tranche d’ancienneté complétée'),
          to: 'tenure',
        },
        {
          id: 'months',
          label: bi('Enter completed months', 'Saisir les mois complétés'),
          detail: bi(
            'Whole months only — the same lookup Document Studio uses.',
            'Mois entiers seulement — le même repérage que le Studio de documents.',
          ),
          to: 'months',
        },
      ],
    },
    {
      id: 'months',
      kind: 'input',
      title: bi('Completed months of employment', 'Mois d’emploi complétés'),
      body: bi(
        'Enter the number of whole months completed with this employer. Partial months do not count. The product looks up the ESA s. 57 floor from the grounded Ontario table — not a common-law estimate.',
        'Entrez le nombre de mois entiers complétés chez cet employeur. Les mois partiels ne comptent pas. Le produit repère le plancher de l’art. 57 de la LNE dans le tableau ontarien fondé — pas une estimation de common law.',
      ),
      label: bi('Completed months', 'Mois complétés'),
      unit: bi('months', 'mois'),
      destinations: FLOOR_DESTINATIONS,
      resolve: ontarioFloorStepId,
    },
    {
      id: 'tenure',
      kind: 'choice',
      title: bi('How much service has the employee completed?', 'Quelle ancienneté l’employé a-t-il complétée?'),
      body: bi(
        'Choose the band that matches completed service. Do not round up into the next band.',
        'Choisissez la tranche qui correspond au service complété. N’arrondissez pas à la hausse vers la tranche suivante.',
      ),
      options: [
        {
          id: 'under_3m',
          label: bi('Less than 3 months completed', 'Moins de 3 mois complétés'),
          to: 'floor_0',
        },
        {
          id: 'm3_under_1y',
          label: bi('3 months to under 1 year', 'De 3 mois à moins d’un an'),
          to: 'floor_1',
        },
        {
          id: 'y1_under_3',
          label: bi('1 year to under 3 years', 'D’un an à moins de 3 ans'),
          to: 'floor_2',
        },
        {
          id: 'y3_under_4',
          label: bi('3 years to under 4 years', 'De 3 ans à moins de 4 ans'),
          to: 'floor_3',
        },
        {
          id: 'y4_under_5',
          label: bi('4 years to under 5 years', 'De 4 ans à moins de 5 ans'),
          to: 'floor_4',
        },
        {
          id: 'y5_under_6',
          label: bi('5 years to under 6 years', 'De 5 ans à moins de 6 ans'),
          to: 'floor_5',
        },
        {
          id: 'y6_under_7',
          label: bi('6 years to under 7 years', 'De 6 ans à moins de 7 ans'),
          to: 'floor_6',
        },
        {
          id: 'y7_under_8',
          label: bi('7 years to under 8 years', 'De 7 ans à moins de 8 ans'),
          to: 'floor_7',
        },
        {
          id: 'y8_plus',
          label: bi('8 years or more', '8 ans ou plus'),
          to: 'floor_8',
        },
      ],
    },
    {
      id: 'floor_0',
      kind: 'outcome',
      tone: 'caution',
      title: bi('ESA floor: 0 weeks', 'Plancher LNE : 0 semaine'),
      body: bi(
        'Under ESA s. 57, employees with less than three completed months of employment generally have no statutory individual termination notice. That does not mean nothing is owed — a contract, policy, or common-law claim may still require notice or pay in lieu. Confirm against the statute and get advice before acting.',
        'Sous l’art. 57 de la LNE, un employé qui a moins de trois mois d’emploi complétés n’a généralement pas de préavis individuel légal. Cela ne signifie pas qu’aucune somme n’est due — un contrat, une politique ou une réclamation de common law peut encore exiger un préavis ou une indemnité. Vérifiez la loi et obtenez un avis avant d’agir.',
      ),
      documents: ['T03'],
    },
    {
      id: 'floor_1',
      kind: 'outcome',
      tone: 'ok',
      title: bi('ESA floor: 1 week', 'Plancher LNE : 1 semaine'),
      body: bi(
        'For this tenure, the ESA s. 57 statutory floor is 1 week of notice (or pay in lieu). Treat this as a minimum to meet or exceed — not as the right answer for every case. Common-law reasonable notice is often higher. Verify tenure and the statute before issuing a letter.',
        'Pour cette ancienneté, le plancher légal de l’art. 57 de la LNE est de 1 semaine de préavis (ou d’indemnité). Traitez-le comme un minimum à respecter ou dépasser — pas comme la bonne réponse dans tous les cas. Le préavis raisonnable de common law est souvent plus élevé. Vérifiez l’ancienneté et la loi avant d’émettre une lettre.',
      ),
      documents: ['T03'],
    },
    {
      id: 'floor_2',
      kind: 'outcome',
      tone: 'ok',
      title: bi('ESA floor: 2 weeks', 'Plancher LNE : 2 semaines'),
      body: bi(
        'For this tenure, the ESA s. 57 statutory floor is 2 weeks of notice (or pay in lieu). Treat this as a minimum to meet or exceed — not as the right answer for every case. Common-law reasonable notice is often higher. Verify tenure and the statute before issuing a letter.',
        'Pour cette ancienneté, le plancher légal de l’art. 57 de la LNE est de 2 semaines de préavis (ou d’indemnité). Traitez-le comme un minimum à respecter ou dépasser — pas comme la bonne réponse dans tous les cas. Le préavis raisonnable de common law est souvent plus élevé. Vérifiez l’ancienneté et la loi avant d’émettre une lettre.',
      ),
      documents: ['T03'],
    },
    {
      id: 'floor_3',
      kind: 'outcome',
      tone: 'ok',
      title: bi('ESA floor: 3 weeks', 'Plancher LNE : 3 semaines'),
      body: bi(
        'For this tenure, the ESA s. 57 statutory floor is 3 weeks of notice (or pay in lieu). Treat this as a minimum to meet or exceed — not as the right answer for every case. Common-law reasonable notice is often higher. Verify tenure and the statute before issuing a letter.',
        'Pour cette ancienneté, le plancher légal de l’art. 57 de la LNE est de 3 semaines de préavis (ou d’indemnité). Traitez-le comme un minimum à respecter ou dépasser — pas comme la bonne réponse dans tous les cas. Le préavis raisonnable de common law est souvent plus élevé. Vérifiez l’ancienneté et la loi avant d’émettre une lettre.',
      ),
      documents: ['T03'],
    },
    {
      id: 'floor_4',
      kind: 'outcome',
      tone: 'ok',
      title: bi('ESA floor: 4 weeks', 'Plancher LNE : 4 semaines'),
      body: bi(
        'For this tenure, the ESA s. 57 statutory floor is 4 weeks of notice (or pay in lieu). Treat this as a minimum to meet or exceed — not as the right answer for every case. Common-law reasonable notice is often higher. Verify tenure and the statute before issuing a letter.',
        'Pour cette ancienneté, le plancher légal de l’art. 57 de la LNE est de 4 semaines de préavis (ou d’indemnité). Traitez-le comme un minimum à respecter ou dépasser — pas comme la bonne réponse dans tous les cas. Le préavis raisonnable de common law est souvent plus élevé. Vérifiez l’ancienneté et la loi avant d’émettre une lettre.',
      ),
      documents: ['T03'],
    },
    {
      id: 'floor_5',
      kind: 'outcome',
      tone: 'ok',
      title: bi('ESA floor: 5 weeks', 'Plancher LNE : 5 semaines'),
      body: bi(
        'For this tenure, the ESA s. 57 statutory floor is 5 weeks of notice (or pay in lieu). Treat this as a minimum to meet or exceed — not as the right answer for every case. Common-law reasonable notice is often higher. Verify tenure and the statute before issuing a letter.',
        'Pour cette ancienneté, le plancher légal de l’art. 57 de la LNE est de 5 semaines de préavis (ou d’indemnité). Traitez-le comme un minimum à respecter ou dépasser — pas comme la bonne réponse dans tous les cas. Le préavis raisonnable de common law est souvent plus élevé. Vérifiez l’ancienneté et la loi avant d’émettre une lettre.',
      ),
      documents: ['T03'],
    },
    {
      id: 'floor_6',
      kind: 'outcome',
      tone: 'ok',
      title: bi('ESA floor: 6 weeks', 'Plancher LNE : 6 semaines'),
      body: bi(
        'For this tenure, the ESA s. 57 statutory floor is 6 weeks of notice (or pay in lieu). Treat this as a minimum to meet or exceed — not as the right answer for every case. Common-law reasonable notice is often higher. Verify tenure and the statute before issuing a letter.',
        'Pour cette ancienneté, le plancher légal de l’art. 57 de la LNE est de 6 semaines de préavis (ou d’indemnité). Traitez-le comme un minimum à respecter ou dépasser — pas comme la bonne réponse dans tous les cas. Le préavis raisonnable de common law est souvent plus élevé. Vérifiez l’ancienneté et la loi avant d’émettre une lettre.',
      ),
      documents: ['T03'],
    },
    {
      id: 'floor_7',
      kind: 'outcome',
      tone: 'ok',
      title: bi('ESA floor: 7 weeks', 'Plancher LNE : 7 semaines'),
      body: bi(
        'For this tenure, the ESA s. 57 statutory floor is 7 weeks of notice (or pay in lieu). Treat this as a minimum to meet or exceed — not as the right answer for every case. Common-law reasonable notice is often higher. Verify tenure and the statute before issuing a letter.',
        'Pour cette ancienneté, le plancher légal de l’art. 57 de la LNE est de 7 semaines de préavis (ou d’indemnité). Traitez-le comme un minimum à respecter ou dépasser — pas comme la bonne réponse dans tous les cas. Le préavis raisonnable de common law est souvent plus élevé. Vérifiez l’ancienneté et la loi avant d’émettre une lettre.',
      ),
      documents: ['T03'],
    },
    {
      id: 'floor_8',
      kind: 'outcome',
      tone: 'ok',
      title: bi('ESA floor: 8 weeks (statutory maximum)', 'Plancher LNE : 8 semaines (maximum légal)'),
      body: bi(
        'For eight or more completed years, the ESA s. 57 statutory floor is 8 weeks of notice (or pay in lieu) — the ESA individual-termination maximum. Common-law reasonable notice can still be substantially higher. Verify tenure and the statute before issuing a letter.',
        'Pour huit années complétées ou plus, le plancher légal de l’art. 57 de la LNE est de 8 semaines de préavis (ou d’indemnité) — le maximum LNE pour une cessation individuelle. Le préavis raisonnable de common law peut encore être nettement plus élevé. Vérifiez l’ancienneté et la loi avant d’émettre une lettre.',
      ),
      documents: ['T03'],
    },
  ],
}
