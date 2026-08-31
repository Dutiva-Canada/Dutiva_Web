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
  },
  {
    id: 'k2',
    title: bi(
      'BC Employment Standards: hiring rules & employment terms',
      'Normes d’emploi de la C.-B. : règles d’embauche et conditions d’emploi',
    ),
    tag: bi('Hiring · British Columbia', 'Embauche · Colombie-Britannique'),
  },
  {
    id: 'k3',
    title: bi(
      'Quebec Charter of the French Language: employment documents in French',
      'Charte de la langue française du Québec : documents d’emploi en français',
    ),
    tag: bi('Language · Quebec', 'Langue · Québec'),
  },
  {
    id: 'k4',
    title: bi(
      'Duty to accommodate: functional limitations vs. diagnosis',
      'Obligation d’accommodement : limitations fonctionnelles et diagnostic',
    ),
    tag: bi('Accommodation · Canada', 'Accommodement · Canada'),
  },
  {
    id: 'k5',
    title: bi(
      'Culpable vs. innocent absenteeism: discipline & accommodation',
      'Absentéisme fautif et non fautif : discipline et accommodement',
    ),
    tag: bi('Attendance · Canada', 'Assiduité · Canada'),
  },
  {
    id: 'k6',
    title: bi(
      'Federally regulated employers: Canada Labour Code termination notice',
      'Employeurs sous réglementation fédérale : préavis de licenciement prévu par le Code canadien du travail',
    ),
    tag: bi('Termination · Federal', 'Licenciement · Fédéral'),
  },
  {
    id: 'k7',
    title: bi(
      'Remote work: OHS considerations for home offices',
      'Télétravail : considérations de SST pour le travail à domicile',
    ),
    tag: bi('Health & safety · Canada', 'Santé et sécurité · Canada'),
  },
  {
    id: 'k8',
    title: bi(
      'Probationary periods: employment standards & termination risk',
      'Périodes de probation : normes d’emploi et risques liés au licenciement',
    ),
    tag: bi('Hiring · Canada', 'Embauche · Canada'),
  },
]
