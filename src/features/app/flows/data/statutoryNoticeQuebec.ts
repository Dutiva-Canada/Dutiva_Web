import { bi } from '@/i18n/core'
import type { Flow } from '../flowModel'

/**
 * Workspace notice guide — Québec **hedge-only** (TODO.md EF11,
 * notice-bands-decision.md). All FR is [FR self-authored].
 *
 * `NOTICE_SCHEDULES` for QC stays `bands: null` until qualified legal
 * sign-off (L6). This flow therefore never states LNT s. 82 week figures.
 * It names the statutes, explains why a flat table misleads (CCQ art. 2091),
 * and hands off to T03 so the letter is drafted with Document Studio's
 * unavailable-floor hedge.
 */

export const statutoryNoticeQuebecFlow: Flow = {
  slug: 'statutory-notice-quebec',
  ring: 1,
  jurisdictions: ['QC'],
  estMinutes: 4,
  title: bi(
    'Québec termination notice (confirm against statute)',
    'Préavis de cessation au Québec (confirmer dans la loi)',
  ),
  summary: bi(
    'Walk the Québec notice path without quoting week figures — LNT floor plus Civil Code reasonable notice. Confirm against primary sources before you write.',
    'Parcourez le chemin du préavis québécois sans citer de semaines — plancher LNT et préavis raisonnable du Code civil. Confirmez dans les sources officielles avant de rédiger.',
  ),
  start: 'scope',
  steps: [
    {
      id: 'scope',
      kind: 'choice',
      title: bi(
        'Is this employee under Québec provincial standards?',
        'Cet employé relève-t-il des normes provinciales du Québec?',
      ),
      body: bi(
        'Most Québec workplaces fall under the Act respecting labour standards (LNT). Federally regulated employers use the Canada Labour Code instead — use the federal notice workflow for those roles.',
        'La plupart des milieux de travail québécois relèvent de la Loi sur les normes du travail (LNT). Les employeurs de compétence fédérale utilisent le Code canadien du travail — utilisez le processus fédéral pour ces postes.',
      ),
      caution: bi(
        'Dutiva does not ship a Québec week ladder in product tables. Document Studio will not show a numeric statutory floor for QC. Dutiva does not provide legal advice.',
        'Dutiva ne publie pas d’échelle de semaines pour le Québec dans ses tableaux. Le Studio de documents n’affichera pas de plancher légal numérique pour le QC. Dutiva ne fournit pas de conseils juridiques.',
      ),
      options: [
        {
          id: 'lnt',
          label: bi('Yes — LNT / provincial Québec', 'Oui — LNT / provincial Québec'),
          to: 'statutes',
        },
        {
          id: 'federal',
          label: bi('No — federally regulated', 'Non — compétence fédérale'),
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
        'Read both layers before you pick a number',
        'Lisez les deux couches avant de choisir un chiffre',
      ),
      body: bi(
        'Québec notice is not a single product table. Confirm the current primary text yourself.',
        'Le préavis québécois n’est pas un seul tableau produit. Confirmez vous-même le texte officiel en vigueur.',
      ),
      points: [
        bi(
          'Check the Act respecting labour standards (LNT) individual termination notice provisions — including s. 82 — on the official Québec legislation site, for the employee’s completed service.',
          'Vérifiez les dispositions de préavis individuel de cessation de la Loi sur les normes du travail (LNT) — notamment l’art. 82 — sur le site officiel de la législation québécoise, selon le service complété de l’employé.',
        ),
        bi(
          'Separately consider Civil Code of Québec art. 2091 reasonable notice. A statutory floor is a floor; reasonable notice can sit above it and is fact-dependent.',
          'Examinez séparément le préavis raisonnable de l’art. 2091 du Code civil du Québec. Un plancher légal est un plancher; le préavis raisonnable peut le dépasser et dépend des faits.',
        ),
        bi(
          'Contract, policy, and past practice can also set a higher period. Do not treat any software estimate as the amount to put in a letter.',
          'Un contrat, une politique ou une pratique antérieure peut aussi fixer une période plus longue. Ne traitez aucune estimation logicielle comme le montant à mettre dans une lettre.',
        ),
      ],
      caution: bi(
        'This product keeps Québec notice bands unset on purpose (notice-bands-decision). Emitting unreviewed week figures would be worse than hedging.',
        'Ce produit laisse volontairement les tranches de préavis du Québec non renseignées (décision notice-bands). Publier des semaines non révisées serait pire que de rester prudent.',
      ),
      to: 'done',
    },
    {
      id: 'done',
      kind: 'outcome',
      tone: 'caution',
      title: bi(
        'Confirm the floor and reasonable notice, then draft',
        'Confirmez le plancher et le préavis raisonnable, puis rédigez',
      ),
      body: bi(
        'You have the process shape: identify LNT coverage, read the current LNT notice rules for tenure, weigh CCQ art. 2091 and any contract above that floor, then draft. Document Studio will not inject a Québec week figure — enter what you confirmed from primary sources into the letter.',
        'Vous avez la forme du processus : confirmer la couverture LNT, lire les règles de préavis LNT en vigueur selon l’ancienneté, peser l’art. 2091 du C.c.Q. et tout contrat au-dessus de ce plancher, puis rédiger. Le Studio de documents n’injectera pas de semaines pour le Québec — inscrivez ce que vous avez confirmé dans les sources officielles.',
      ),
      documents: ['T03'],
    },
    {
      id: 'wrong_jurisdiction',
      kind: 'outcome',
      tone: 'caution',
      title: bi('Use the federal notice workflow', 'Utilisez le processus de préavis fédéral'),
      body: bi(
        'Federally regulated employees are not under the LNT notice ladder. Open the federal termination-notice workflow (or confirm CLC Part III yourself) before drafting.',
        'Les employés de compétence fédérale ne relèvent pas de l’échelle de préavis de la LNT. Ouvrez le processus fédéral de préavis de cessation (ou confirmez vous-même la Partie III du CCT) avant de rédiger.',
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
        'Jurisdiction decides which statute applies. Use the jurisdiction checker or counsel before treating any notice period as the floor. Do not invent a Québec week figure from this product.',
        'La compétence décide quelle loi s’applique. Utilisez le vérificateur de compétence ou un conseiller avant de traiter une période de préavis comme plancher. N’inventez pas de semaines québécoises à partir de ce produit.',
      ),
      documents: ['T03'],
    },
  ],
}
