import { bi } from '@/i18n/core'
import type { KnowledgeItem } from './types'

/**
 * Knowledge base articles, transcribed from the prototype's
 * `buildKnowledgeItems()`. The prototype has no ids — stable `k1`–`k8` ids
 * added here.
 */

export const knowledgeItems: KnowledgeItem[] = [
  {
    id: 'k1',
    title: bi(
      'Ontario ESA: notice of termination & severance pay',
      'LNE de l’Ontario : préavis de licenciement et indemnité de cessation d’emploi',
    ),
    tag: bi('Termination · Ontario', 'Licenciement · Ontario'),
    summary: bi(
      'Under Ontario’s ESA, notice of termination and severance pay are separate entitlements with different thresholds — check both before calculating a termination package.',
      'Sous la LNE de l’Ontario, le préavis de licenciement et l’indemnité de cessation d’emploi sont des droits distincts, avec des seuils différents — vérifiez les deux avant de calculer une fin d’emploi.',
    ),
  },
  {
    id: 'k2',
    title: bi(
      'Ontario ESA: hiring information & employment terms',
      'LNE de l’Ontario : informations d’embauche et conditions d’emploi',
    ),
    tag: bi('Hiring · Ontario', 'Embauche · Ontario'),
    summary: bi(
      'Ontario employment standards require certain hiring and pay information to be provided in writing — requirements depend on what is communicated and when employment begins.',
      'La LNE exige que certaines informations d’embauche et de rémunération soient fournies par écrit — les exigences dépendent de ce qui est communiqué et du moment où l’emploi commence.',
    ),
  },
  {
    id: 'k3',
    title: bi(
      'Quebec Charter of the French Language: employment documents in French',
      'Charte de la langue française du Québec : documents d’emploi en français',
    ),
    tag: bi('Language · Quebec', 'Langue · Québec'),
    summary: bi(
      'Quebec’s Charter of the French Language governs the language of many employment documents — French is generally required, with limited document-specific exceptions.',
      'La Charte de la langue française du Québec régit la langue de nombreux documents d’emploi — le français est généralement requis, avec des exceptions limitées selon le type de document.',
    ),
  },
  {
    id: 'k4',
    title: bi(
      'Duty to accommodate: functional limitations vs. diagnosis',
      'Obligation d’accommodement : limitations fonctionnelles et diagnostic',
    ),
    tag: bi('Accommodation · Canada', 'Accommodement · Canada'),
    summary: bi(
      'Accommodation focuses on functional limitations and workplace barriers; diagnosis alone is not always required to begin the process, but rules vary by jurisdiction and federal sector.',
      'L’accommodement porte sur les limitations fonctionnelles et les obstacles en milieu de travail; le diagnostic seul n’est pas toujours requis pour amorcer le processus, mais les règles varient selon la compétence.',
    ),
  },
  {
    id: 'k5',
    title: bi(
      'Culpable vs. innocent absenteeism: discipline & accommodation',
      'Absentéisme fautif et non fautif : discipline et accommodement',
    ),
    tag: bi('Attendance · Canada', 'Assiduité · Canada'),
    summary: bi(
      'Culpable and non-culpable absence framing helps structure attendance management, but discipline and accommodation obligations still depend on the facts and applicable jurisdiction.',
      'La distinction entre absentéisme fautif et non fautif aide à structurer la gestion de l’assiduité, mais la discipline et l’accommodement dépendent toujours des faits et de la compétence applicable.',
    ),
  },
  {
    id: 'k6',
    title: bi(
      'Federally regulated employers: Canada Labour Code termination notice',
      'Employeurs sous réglementation fédérale : préavis de licenciement prévu par le Code canadien du travail',
    ),
    tag: bi('Termination · Federal', 'Licenciement · Fédéral'),
    summary: bi(
      'Federally regulated employers follow Canada Labour Code termination notice rules — distinct from provincial employment standards minima.',
      'Les employeurs sous réglementation fédérale suivent les règles de préavis de licenciement du Code canadien du travail — distinctes des minima des normes d’emploi provinciales.',
    ),
  },
  {
    id: 'k7',
    title: bi(
      'Remote work: OHS considerations for home offices',
      'Télétravail : considérations de SST pour le travail à domicile',
    ),
    tag: bi('Health & safety · Canada', 'Santé et sécurité · Canada'),
    summary: bi(
      'Remote and home-office work raises OHS considerations that vary by jurisdiction — policies should reflect applicable provincial, territorial, or federal rules.',
      'Le télétravail soulève des considérations de SST qui varient selon la compétence — les politiques doivent refléter les règles provinciales, territoriales ou fédérales applicables.',
    ),
  },
  {
    id: 'k8',
    title: bi(
      'Probationary periods: employment standards & termination risk',
      'Périodes de probation : normes d’emploi et risques liés au licenciement',
    ),
    tag: bi('Hiring · Canada', 'Embauche · Canada'),
    summary: bi(
      'Probationary periods interact with employment standards minima, contract terms, and termination risk — length and enforceability vary across Canada.',
      'Les périodes de probation interagissent avec les minima des normes d’emploi, les conditions contractuelles et les risques de licenciement — la durée et l’applicabilité varient au Canada.',
    ),
  },
]
