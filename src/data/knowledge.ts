import { bi } from '@/i18n/core'
import type { KnowledgeItem } from './types'

/**
 * Advisor Knowledge Base demo fixtures, adapted from the prototype's
 * `buildKnowledgeItems()`. Stable `k1`–`k8` ids are retained for
 * application routes and fixture references. EN/FR content has been
 * revised for jurisdictional and compliance accuracy.
 *
 * Tags scoped to "Canada" / « Canada » mark cross-jurisdictional topics;
 * substantive rules still depend on Ontario, Quebec, federal, or other
 * applicable workplace law.
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
      'Sous la LNE de l’Ontario, le préavis de licenciement et l’indemnité de cessation d’emploi sont des droits distincts, avec des seuils différents — vérifiez les deux avant de calculer les sommes dues lors d’un licenciement.',
    ),
  },
  {
    id: 'k2',
    title: bi(
      'Ontario ESA: mandatory information for new employees',
      'LNE de l’Ontario : renseignements sur l’emploi des nouveaux employés',
    ),
    tag: bi('Hiring · Ontario', 'Embauche · Ontario'),
    summary: bi(
      'Ontario employers with 25 or more employees in Ontario on a new employee’s first day of work must provide specified job information in writing before that day, or as soon afterward as reasonably possible if advance delivery is not practicable.',
      'Les employeurs comptant 25 employés ou plus en Ontario lors du premier jour de travail d’un nouvel employé doivent lui fournir par écrit certains renseignements sur son emploi avant cette journée ou, si cela n’est pas possible, dès que raisonnablement possible par la suite.',
    ),
  },
  {
    id: 'k3',
    title: bi(
      'Quebec Charter of the French Language: employment documents & communications',
      'Charte de la langue française : documents et communications liés à l’emploi',
    ),
    tag: bi('Language · Quebec', 'Langue · Québec'),
    summary: bi(
      'Quebec’s Charter of the French Language governs the language of many employment documents and communications — French requirements, conditions, and exceptions vary by document or communication type.',
      'La Charte de la langue française du Québec régit la langue de nombreux documents et communications liés à l’emploi — les exigences, conditions et exceptions relatives au français varient selon le type de document ou de communication.',
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
      'Accommodation generally focuses on functional limitations, accommodation needs, and workplace barriers rather than diagnosis; the medical information an employer may require depends on the circumstances and applicable human-rights and employment law.',
      'L’accommodement porte généralement sur les limitations fonctionnelles, les besoins d’accommodement et les obstacles en milieu de travail plutôt que sur le diagnostic; les renseignements médicaux qu’un employeur peut demander dépendent des circonstances et des règles applicables en Ontario, au Québec, dans les milieux sous réglementation fédérale ou ailleurs.',
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
      'Culpable and non-culpable absence framing helps structure attendance management, but discipline steps and accommodation duties differ among Ontario, Quebec, federally regulated workplaces, and other applicable regimes.',
      'La distinction entre absentéisme fautif et non fautif aide à structurer la gestion de l’assiduité, mais les mesures disciplinaires et les obligations d’accommodement varient en Ontario, au Québec, dans les milieux sous réglementation fédérale et selon les autres régimes applicables.',
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
      'Les employeurs sous réglementation fédérale suivent les règles de préavis de licenciement du Code canadien du travail — distinctes des normes minimales d’emploi provinciales.',
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
      'Remote and home-office work raises OHS considerations that differ among Ontario, Quebec, federally regulated workplaces, and other provincial or territorial regimes — policies should reflect the rules that apply to each employee’s workplace.',
      'Le télétravail soulève des considérations de SST qui diffèrent en Ontario, au Québec, dans les milieux sous réglementation fédérale et selon les autres régimes provinciaux ou territoriaux — les politiques doivent refléter les règles applicables au milieu de travail de chaque employé.',
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
      'Probationary periods interact with employment standards minima, contract terms, and termination risk — length and enforceability differ among Ontario, Quebec, federally regulated workplaces, and other applicable provincial or territorial regimes.',
      'Les périodes de probation interagissent avec les minima des normes d’emploi, les conditions contractuelles et les risques de licenciement — leur durée et leurs effets juridiques varient selon la compétence applicable.',
    ),
  },
]
