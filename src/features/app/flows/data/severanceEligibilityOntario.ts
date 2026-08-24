import { bi } from '@/i18n/core'
import type { Flow } from '../flowModel'

/**
 * Workspace calculator — Ontario ESA s. 64 severance **eligibility gate**
 * (TODO.md EF11, notice-bands-review-pack §3 Option B). All FR is
 * [FR self-authored].
 *
 * Answers "does this employee likely qualify for ESA severance?" without
 * stating a dollar or week figure. Computing the amount (years × regular
 * weekly wages, 26-week cap) stays out of scope until payroll and mass-
 * termination data can be collected reliably (Option A deferred).
 *
 * Substance of the two-condition test is from ontario.ca's official ESA
 * guide (see notice-bands-review-pack §3 sourcing caveat). Confirm against
 * ESA ss. 63–65 before relying on an outcome in a live file.
 */

export const severanceEligibilityOntarioFlow: Flow = {
  slug: 'severance-eligibility-ontario',
  ring: 1,
  jurisdictions: ['ON'],
  estMinutes: 4,
  title: bi('Ontario ESA severance eligibility', 'Admissibilité à l’indemnité de cessation (LNE Ontario)'),
  summary: bi(
    'Check whether ESA severance may apply — five years’ service plus payroll or mass-closure tests. Does not compute an amount.',
    'Vérifiez si l’indemnité de cessation de la LNE peut s’appliquer — cinq ans de service plus les tests de masse salariale ou de fermeture. Ne calcule pas de montant.',
  ),
  start: 'tenure',
  steps: [
    {
      id: 'tenure',
      kind: 'choice',
      title: bi('Has the employee completed five or more years with this employer?', 'L’employé a-t-il complété cinq ans ou plus chez cet employeur?'),
      body: bi(
        'ESA severance (distinct from termination notice) generally requires five or more years of employment with the employer. This is the first gate — both gates must be met.',
        'L’indemnité de cessation de la LNE (distincte du préavis) exige généralement cinq ans ou plus d’emploi chez l’employeur. C’est la première condition — les deux conditions doivent être remplies.',
      ),
      caution: bi(
        'Severance under the ESA is not the same as termination notice, and it is not common-law damages. This tool never states an amount. Dutiva does not provide legal advice.',
        'L’indemnité de cessation sous la LNE n’est pas le préavis, ni des dommages de common law. Cet outil n’énonce jamais de montant. Dutiva ne fournit pas de conseils juridiques.',
      ),
      options: [
        {
          id: 'five_plus',
          label: bi('Yes — five or more completed years', 'Oui — cinq années complétées ou plus'),
          to: 'employer',
        },
        {
          id: 'under_five',
          label: bi('No — under five completed years', 'Non — moins de cinq années complétées'),
          to: 'out_tenure',
        },
        {
          id: 'unsure_tenure',
          label: bi('Not sure yet', 'Pas encore certain'),
          to: 'out_unclear',
        },
      ],
    },
    {
      id: 'employer',
      kind: 'choice',
      title: bi('Does either employer condition apply?', 'L’une des conditions liées à l’employeur s’applique-t-elle?'),
      body: bi(
        'Alongside five years’ service, ESA severance generally also requires one of: the employer’s global payroll is at least $2.5 million, or the employer severed 50 or more employees in a six-month period because all or part of the business permanently closed.',
        'En plus des cinq ans de service, l’indemnité de cessation de la LNE exige généralement aussi l’une des conditions suivantes : la masse salariale mondiale de l’employeur est d’au moins 2,5 millions de dollars, ou l’employeur a mis fin à l’emploi de 50 employés ou plus en six mois parce que tout ou partie de l’entreprise a fermé de façon permanente.',
      ),
      caution: bi(
        'Payroll and mass-closure facts are easy to get wrong. If you are unsure, stop and confirm from books or counsel before treating severance as owed or not owed.',
        'La masse salariale et les faits de fermeture collective sont faciles à mal évaluer. En cas de doute, arrêtez et confirmez auprès de la comptabilité ou d’un conseiller avant de traiter l’indemnité comme due ou non due.',
      ),
      options: [
        {
          id: 'payroll',
          label: bi(
            'Yes — global payroll is at least $2.5 million',
            'Oui — masse salariale mondiale d’au moins 2,5 M$',
          ),
          to: 'exclusions',
        },
        {
          id: 'mass',
          label: bi(
            'Yes — 50+ employees severed in six months on a permanent closure',
            'Oui — 50 employés ou plus licenciés en six mois lors d’une fermeture permanente',
          ),
          to: 'exclusions',
        },
        {
          id: 'neither',
          label: bi('Neither condition applies', 'Aucune des deux conditions ne s’applique'),
          to: 'out_employer',
        },
        {
          id: 'unsure_employer',
          label: bi('Not sure', 'Pas certain'),
          to: 'out_unclear',
        },
      ],
    },
    {
      id: 'exclusions',
      kind: 'choice',
      title: bi('Does an ESA exclusion likely apply?', 'Une exclusion de la LNE s’applique-t-elle probablement?'),
      body: bi(
        'Even when the two gates are met, ESA severance can be excluded — for example refusing reasonable alternative employment, retiring on a full pension, certain construction or on-site building-maintenance roles, wilful misconduct, or where performance of the contract becomes impossible. Confirm the current statute list before relying on an exclusion.',
        'Même lorsque les deux conditions sont remplies, l’indemnité de cessation de la LNE peut être exclue — par exemple refus d’un autre emploi raisonnable, retraite avec pension complète, certains rôles en construction ou d’entretien d’immeubles sur place, inconduite délibérée, ou impossibilité d’exécuter le contrat. Confirmez la liste actuelle dans la loi avant de vous fier à une exclusion.',
      ),
      options: [
        {
          id: 'no_exclusion',
          label: bi('No exclusion appears to apply', 'Aucune exclusion ne semble s’appliquer'),
          to: 'out_may_qualify',
        },
        {
          id: 'exclusion',
          label: bi('An exclusion may apply', 'Une exclusion peut s’appliquer'),
          to: 'out_exclusion',
        },
        {
          id: 'unsure_exclusion',
          label: bi('Not sure — need advice', 'Pas certain — besoin d’avis'),
          to: 'out_unclear',
        },
      ],
    },
    {
      id: 'out_may_qualify',
      kind: 'outcome',
      tone: 'caution',
      title: bi('ESA severance may apply — compute the amount next', 'L’indemnité LNE peut s’appliquer — calculez le montant ensuite'),
      body: bi(
        'On the answers given, both eligibility gates appear met and no exclusion was asserted. Treat ESA severance as potentially owed. Open the Ontario ESA severance amount workflow to apply the guide formula (regular weekly wages × completed years with a partial-year proration, capped at 26 weeks) using verified payroll figures. Document the termination carefully and obtain advice before stating a figure to the employee.',
        'Selon les réponses données, les deux conditions d’admissibilité semblent remplies et aucune exclusion n’a été alléguée. Traitez l’indemnité de cessation de la LNE comme potentiellement due. Ouvrez le processus de montant d’indemnité LNE de l’Ontario pour appliquer la formule du guide (salaire hebdomadaire régulier × années complétées avec prorata de l’année partielle, plafonnée à 26 semaines) à partir de chiffres de paie vérifiés. Documentez soigneusement la cessation et obtenez un avis avant d’énoncer un chiffre à l’employé.',
      ),
      documents: ['T03'],
    },
    {
      id: 'out_tenure',
      kind: 'outcome',
      tone: 'ok',
      title: bi('ESA severance gate not met on tenure', 'Condition d’ancienneté de l’indemnité LNE non remplie'),
      body: bi(
        'With under five completed years of employment with this employer, the first ESA severance gate is generally not met. Termination notice (ESA s. 57) is a separate question — run the Ontario statutory notice workflow if you need the notice floor. Contractual or common-law amounts may still apply.',
        'Avec moins de cinq années d’emploi complétées chez cet employeur, la première condition d’indemnité de cessation de la LNE n’est généralement pas remplie. Le préavis (art. 57 de la LNE) est une question distincte — utilisez le processus de préavis légal de l’Ontario si vous avez besoin du plancher de préavis. Des montants contractuels ou de common law peuvent tout de même s’appliquer.',
      ),
      documents: ['T03'],
    },
    {
      id: 'out_employer',
      kind: 'outcome',
      tone: 'ok',
      title: bi('ESA severance gate not met on employer conditions', 'Conditions liées à l’employeur non remplies'),
      body: bi(
        'Five years’ service alone is not enough. On the answers given, neither the $2.5 million global payroll test nor the 50-employee permanent-closure test applies, so ESA severance generally does not. Re-check payroll facts before treating that as final. Notice obligations remain a separate analysis.',
        'Cinq ans de service ne suffisent pas à eux seuls. Selon les réponses données, ni le test de masse salariale mondiale de 2,5 M$ ni celui des 50 employés lors d’une fermeture permanente ne s’applique, de sorte que l’indemnité de cessation de la LNE ne s’applique généralement pas. Revérifiez les faits de masse salariale avant de traiter cela comme définitif. Les obligations de préavis restent une analyse distincte.',
      ),
      documents: ['T03'],
    },
    {
      id: 'out_exclusion',
      kind: 'outcome',
      tone: 'caution',
      title: bi('Exclusion may remove ESA severance', 'Une exclusion peut écarter l’indemnité LNE'),
      body: bi(
        'You indicated an ESA exclusion may apply. Exclusions are fact-specific and easy to misapply — especially wilful misconduct and “impossible to perform.” Do not rely on an exclusion without checking the current statute and getting advice. If the exclusion does not hold, return to the may-qualify path.',
        'Vous avez indiqué qu’une exclusion de la LNE peut s’appliquer. Les exclusions sont factuelles et faciles à mal appliquer — surtout l’inconduite délibérée et l’« impossibilité d’exécuter ». Ne vous fiez pas à une exclusion sans vérifier la loi à jour et obtenir un avis. Si l’exclusion ne tient pas, revenez à la voie « peut s’appliquer ».',
      ),
      documents: ['T03'],
    },
    {
      id: 'out_unclear',
      kind: 'outcome',
      tone: 'caution',
      title: bi('Not enough to decide — confirm facts', 'Pas assez pour décider — confirmez les faits'),
      body: bi(
        'One or more answers were uncertain. Do not tell the employee that ESA severance is or is not owed until tenure, payroll or mass-closure facts, and any exclusion are confirmed against the ESA. Use Document Studio for the letter once counsel or payroll has the numbers.',
        'Une ou plusieurs réponses étaient incertaines. Ne dites pas à l’employé que l’indemnité de cessation de la LNE est due ou non tant que l’ancienneté, la masse salariale ou les faits de fermeture collective, et toute exclusion, n’ont pas été confirmés par rapport à la LNE. Utilisez le Studio de documents pour la lettre une fois que le conseiller ou la paie a les chiffres.',
      ),
      documents: ['T03'],
    },
  ],
}
