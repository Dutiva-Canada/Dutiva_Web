import { bi } from '@/i18n/core'
import type { Flow } from '../flowModel'

/**
 * Workspace notice guide — Federal **hedge-only** (TODO.md EF11,
 * notice-bands-decision.md). All FR is [FR self-authored].
 *
 * `NOTICE_SCHEDULES` for FED stays `bands: null` until qualified legal
 * sign-off (L6). This flow never states CLC s. 230 week figures. It names
 * Part III notice and the separate severance layer (s. 235), flags pending
 * group-termination amendments, and hands off to T03 with Document Studio's
 * unavailable-floor hedge.
 */

export const statutoryNoticeFederalFlow: Flow = {
  slug: 'statutory-notice-federal',
  ring: 1,
  jurisdictions: ['FED'],
  estMinutes: 4,
  title: bi(
    'Federal termination notice (confirm against statute)',
    'Préavis de cessation fédéral (confirmer dans la loi)',
  ),
  summary: bi(
    'Walk the Canada Labour Code Part III notice path without quoting week figures. Confirm against primary sources — notice and severance are separate.',
    'Parcourez le chemin du préavis de la Partie III du Code canadien du travail sans citer de semaines. Confirmez dans les sources officielles — préavis et indemnité de départ sont distincts.',
  ),
  start: 'scope',
  steps: [
    {
      id: 'scope',
      kind: 'choice',
      title: bi(
        'Is this employee federally regulated?',
        'Cet employé est-il de compétence fédérale?',
      ),
      body: bi(
        'Banks, interprovincial transportation, telecom, and other federally regulated employers use the Canada Labour Code, Part III — not provincial ESA/LNT ladders.',
        'Les banques, le transport interprovincial, les télécoms et d’autres employeurs de compétence fédérale utilisent le Code canadien du travail, Partie III — pas les échelles provinciales LNE/LNT.',
      ),
      caution: bi(
        'Dutiva does not ship a federal week ladder in product tables. Document Studio will not show a numeric statutory floor for FED. Dutiva does not provide legal advice.',
        'Dutiva ne publie pas d’échelle de semaines fédérale dans ses tableaux. Le Studio de documents n’affichera pas de plancher légal numérique pour le FED. Dutiva ne fournit pas de conseils juridiques.',
      ),
      options: [
        {
          id: 'clc',
          label: bi(
            'Yes — Canada Labour Code Part III',
            'Oui — Code canadien du travail, Partie III',
          ),
          to: 'statutes',
        },
        {
          id: 'provincial',
          label: bi(
            'No — provincial standards (e.g. Ontario or Québec)',
            'Non — normes provinciales (p. ex. Ontario ou Québec)',
          ),
          to: 'wrong_jurisdiction',
        },
        {
          id: 'unsure',
          label: bi('Not sure yet', 'Pas encore certain'),
          to: 'unclear',
        },
      ],
    },
    {
      id: 'statutes',
      kind: 'task',
      title: bi(
        'Confirm notice and severance separately',
        'Confirmez préavis et indemnité séparément',
      ),
      body: bi(
        'Federal individual termination has more than one money layer. Read the current Code text — do not pull weeks from this product.',
        'La cessation individuelle fédérale a plus d’une couche monétaire. Lisez le texte actuel du Code — ne tirez pas de semaines de ce produit.',
      ),
      points: [
        bi(
          'Check Canada Labour Code Part III individual termination notice (including s. 230) on the Justice Laws site for the employee’s completed service.',
          'Vérifiez le préavis individuel de cessation de la Partie III du Code canadien du travail (notamment l’art. 230) sur le site des Lois de justice, selon le service complété de l’employé.',
        ),
        bi(
          'Treat severance under Part III (including s. 235) as a separate entitlement question from notice. Do not collapse them into one week figure.',
          'Traitez l’indemnité de départ sous la Partie III (notamment l’art. 235) comme une question distincte du préavis. Ne les fusionnez pas en un seul chiffre de semaines.',
        ),
        bi(
          'Watch for group-termination rules and any amendments not yet in force — they can change which individual ladder applies. Confirm proclamation status before relying on a table from memory.',
          'Surveillez les règles de cessation collective et toute modification non encore en vigueur — elles peuvent changer quelle échelle individuelle s’applique. Confirmez le statut de proclamation avant de vous fier à un tableau mémorisé.',
        ),
      ],
      caution: bi(
        'This product keeps federal notice bands unset on purpose (notice-bands-decision). Emitting unreviewed week figures would be worse than hedging.',
        'Ce produit laisse volontairement les tranches de préavis fédérales non renseignées (décision notice-bands). Publier des semaines non révisées serait pire que de rester prudent.',
      ),
      to: 'done',
    },
    {
      id: 'done',
      kind: 'outcome',
      tone: 'caution',
      title: bi(
        'Confirm Part III entitlements, then draft',
        'Confirmez les droits de la Partie III, puis rédigez',
      ),
      body: bi(
        'You have the process shape: confirm federal coverage, read current Part III notice for tenure, check severance separately, then draft. Document Studio will not inject a federal week figure — enter what you confirmed from primary sources into the letter.',
        'Vous avez la forme du processus : confirmer la couverture fédérale, lire le préavis actuel de la Partie III selon l’ancienneté, vérifier l’indemnité séparément, puis rédiger. Le Studio de documents n’injectera pas de semaines fédérales — inscrivez ce que vous avez confirmé dans les sources officielles.',
      ),
      documents: ['T03'],
    },
    {
      id: 'wrong_jurisdiction',
      kind: 'outcome',
      tone: 'caution',
      title: bi(
        'Use the matching provincial workflow',
        'Utilisez le processus provincial correspondant',
      ),
      body: bi(
        'Provincial employees are not under CLC Part III individual notice. Open the Ontario or Québec notice workflow for that statute, or confirm the provincial act yourself before drafting.',
        'Les employés provinciaux ne relèvent pas du préavis individuel de la Partie III du CCT. Ouvrez le processus de préavis ontarien ou québécois pour cette loi, ou confirmez vous-même la loi provinciale avant de rédiger.',
      ),
      documents: ['T03'],
    },
    {
      id: 'unclear',
      kind: 'outcome',
      tone: 'caution',
      title: bi(
        'Settle jurisdiction before notice weeks',
        'Trancher la compétence avant les semaines de préavis',
      ),
      body: bi(
        'Jurisdiction decides which statute applies. Use the jurisdiction checker or counsel before treating any notice period as the floor. Do not invent a federal week figure from this product.',
        'La compétence décide quelle loi s’applique. Utilisez le vérificateur de compétence ou un conseiller avant de traiter une période de préavis comme plancher. N’inventez pas de semaines fédérales à partir de ce produit.',
      ),
      documents: ['T03'],
    },
  ],
}
