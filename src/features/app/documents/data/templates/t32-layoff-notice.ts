/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 1, Separation (docs/FOUR_RING_FRAMEWORK.md). One of the eight Ring 1
   tools the framework lists that had no template. Distinct from T15, which
   is the group termination notice a mass termination triggers — this is the
   individual temporary layoff.

   The trap this document is built around: employment standards legislation
   permitting a temporary layoff does not give the employer a contractual
   right to impose one. Absent that right in the contract or by past practice,
   a layoff can be a constructive dismissal from the day it starts, whatever
   the statutory limit allows. Deadlines are described by shape, not by
   number, because the limits differ by jurisdiction and by whether benefits
   continue. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT32: DocTemplate = {
  id: 'tpl_t32',
  tid: 'T32',
  key: 'layoff_notice',
  kind: 'notice',
  category: 'termination',
  core: true,
  name: {
    en: 'Temporary layoff notice',
    fr: 'Avis de mise à pied temporaire',
  },
  desc: {
    en: 'Notice of an individual temporary layoff — start date, expected recall, what continues, and the point at which it becomes a termination.',
    fr: 'Avis de mise à pied temporaire individuelle : date de début, rappel prévu, ce qui se poursuit et le moment où elle devient une cessation d’emploi.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'high',
  review: 'lawyer_review_recommended',
  requiresLawyerReview: true,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 10,
  usageCount: 0,
  statutory: [
    {
      en: 'Employment standards — a layoff past the statutory limit becomes a termination',
      fr: 'Normes du travail — une mise à pied dépassant la limite légale devient une cessation d’emploi',
    },
    {
      en: 'Contract law — permission in the statute is not a right to lay off',
      fr: 'Droit des contrats — l’autorisation prévue par la loi n’est pas un droit de mise à pied',
    },
    {
      en: 'Human rights legislation — selection for layoff must be non-discriminatory',
      fr: 'Législation sur les droits de la personne — la sélection aux fins de mise à pied doit être exempte de discrimination',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'The Employment Standards Act, 2000 caps how long a temporary layoff can run, with a longer cap where benefits or certain payments continue. Past the cap the employment is terminated by operation of the Act, and notice and severance are calculated from the first day of the layoff — not from the day you noticed. Confirm the current limits before setting an end date.',
      fr: 'La Loi de 2000 sur les normes d’emploi plafonne la durée d’une mise à pied temporaire, avec un plafond plus long lorsque les avantages ou certains versements se poursuivent. Au-delà du plafond, l’emploi prend fin par l’effet de la Loi, et le préavis et l’indemnité de départ se calculent à compter du premier jour de la mise à pied — non du jour où vous vous en apercevez. Validez les limites en vigueur avant de fixer une date de fin.',
    },
    QC: {
      en: 'Under the Act respecting labour standards a layoff that reaches the statutory duration requires the notice a termination requires, and the notice obligation is assessed from the layoff itself. The Civil Code obligation of good faith applies to how the layoff is imposed and communicated.',
      fr: 'Sous la Loi sur les normes du travail, une mise à pied atteignant la durée prévue par la loi exige le préavis requis pour une cessation d’emploi, et l’obligation de préavis s’apprécie à compter de la mise à pied elle-même. L’obligation de bonne foi du Code civil s’applique à la manière dont la mise à pied est imposée et communiquée.',
    },
    FED: {
      en: 'The Canada Labour Code, Part III and its regulations set when a layoff is not a termination — the conditions turn on duration, recall arrangements and benefit continuation. Where they are not met, the layoff is a termination and Part III notice applies.',
      fr: 'Le Code canadien du travail, Partie III et ses règlements précisent les cas où une mise à pied ne constitue pas une cessation d’emploi — les conditions tiennent à la durée, aux modalités de rappel et au maintien des avantages. Lorsqu’elles ne sont pas remplies, la mise à pied constitue une cessation d’emploi et le préavis de la Partie III s’applique.',
    },
  },
  includes: [
    {
      en: 'Layoff start and expected recall',
      fr: 'Début de la mise à pied et rappel prévu',
    },
    {
      en: 'Why this role, and how it was selected',
      fr: 'Pourquoi ce poste et comment il a été retenu',
    },
    {
      en: 'What continues during the layoff',
      fr: 'Ce qui se poursuit pendant la mise à pied',
    },
    {
      en: 'Record of Employment and EI',
      fr: 'Relevé d’emploi et assurance-emploi',
    },
    {
      en: 'What happens if recall does not come',
      fr: 'Ce qui arrive en l’absence de rappel',
    },
  ],
  questions: [
    {
      id: 'employee_name',
      section: {
        en: 'Employee',
        fr: 'Employé',
      },
      label: {
        en: 'Employee full name',
        fr: 'Nom complet de l’employé(e)',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Full name',
        fr: 'Nom complet',
      },
    },
    {
      id: 'layoff_start',
      section: {
        en: 'Dates',
        fr: 'Dates',
      },
      label: {
        en: 'Layoff starts',
        fr: 'Début de la mise à pied',
      },
      type: 'date',
      required: true,
      hint: {
        en: 'Every statutory clock runs from this date, including the one that converts the layoff into a termination.',
        fr: 'Tous les délais légaux courent à compter de cette date, y compris celui qui transforme la mise à pied en cessation d’emploi.',
      },
    },
    {
      id: 'expected_recall',
      section: {
        en: 'Dates',
        fr: 'Dates',
      },
      label: {
        en: 'Expected recall date',
        fr: 'Date de rappel prévue',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'outside_limit_date',
      section: {
        en: 'Dates',
        fr: 'Dates',
      },
      label: {
        en: 'Date the statutory limit is reached',
        fr: 'Date d’atteinte de la limite légale',
      },
      type: 'date',
      required: true,
      hint: {
        en: 'Compute this against your jurisdiction’s current limit and diarise it. Passing it converts the layoff into a termination whether or not anyone acts.',
        fr: 'Calculez cette date selon la limite en vigueur dans votre juridiction et inscrivez-la à l’agenda. Son dépassement transforme la mise à pied en cessation d’emploi, que quiconque agisse ou non.',
      },
    },
    {
      id: 'reason',
      section: {
        en: 'Basis',
        fr: 'Fondement',
      },
      label: {
        en: 'Why this role, and how it was selected',
        fr: 'Pourquoi ce poste et comment il a été retenu',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The business reason, and the criteria applied across the group considered.',
        fr: 'Le motif d’affaires et les critères appliqués à l’ensemble du groupe considéré.',
      },
      hint: {
        en: 'Selection criteria are what a discrimination claim is tested against. Write them down before the decision, not after.',
        fr: 'Les critères de sélection sont ce à quoi une réclamation pour discrimination est confrontée. Consignez-les avant la décision, non après.',
      },
    },
    {
      id: 'continuing',
      section: {
        en: 'During the layoff',
        fr: 'Pendant la mise à pied',
      },
      label: {
        en: 'What continues',
        fr: 'Ce qui se poursuit',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Benefits, pension contributions, any payments — and for how long.',
        fr: 'Avantages, cotisations de retraite, versements éventuels — et pour quelle durée.',
      },
      hint: {
        en: 'What continues can change how long the layoff may lawfully run, so state it accurately.',
        fr: 'Ce qui se poursuit peut modifier la durée licite de la mise à pied ; énoncez-le avec exactitude.',
      },
    },
    {
      id: 'contact',
      section: {
        en: 'During the layoff',
        fr: 'Pendant la mise à pied',
      },
      label: {
        en: 'Who to contact',
        fr: 'Personne-ressource',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Name, role and how to reach them.',
        fr: 'Nom, fonction et coordonnées.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Notice of Temporary Layoff',
        fr: 'Avis de mise à pied temporaire',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{employee_name}} · Effective {{layoff_start}} · {{jurisdiction}}',
        fr: '{{org}} · {{employee_name}} · En vigueur le {{layoff_start}} · {{jurisdiction}}',
      },
    },
    {
      type: 'para',
      text: {
        en: 'Dear {{employee_name}}, this letter confirms that your employment with {{org}} is temporarily laid off effective {{layoff_start}}. This is a layoff, not a termination — your employment continues and we expect to recall you on {{expected_recall}}.',
        fr: 'Bonjour {{employee_name}}, la présente lettre confirme que votre emploi chez {{org}} fait l’objet d’une mise à pied temporaire à compter du {{layoff_start}}. Il s’agit d’une mise à pied et non d’une cessation d’emploi : votre lien d’emploi se poursuit et nous prévoyons vous rappeler le {{expected_recall}}.',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{reason}}',
        fr: '{{reason}}',
      },
      n: 1,
      heading: {
        en: 'Why this is happening',
        fr: 'Pourquoi cette décision',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{continuing}} Your service continues to accrue for the purposes of {{statute}} throughout the layoff.',
        fr: '{{continuing}} Votre service continue de s’accumuler aux fins de {{statute}} pendant toute la mise à pied.',
      },
      n: 2,
      heading: {
        en: 'What continues',
        fr: 'Ce qui se poursuit',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'A Record of Employment will be filed with Service Canada so you can apply for Employment Insurance. Applying does not affect your recall, and being recalled does not require you to have applied.',
        fr: 'Un relevé d’emploi sera transmis à Service Canada afin que vous puissiez présenter une demande d’assurance-emploi. Présenter une demande n’a aucune incidence sur votre rappel, et le rappel n’exige pas que vous en ayez présenté une.',
      },
      n: 3,
      heading: {
        en: 'Record of Employment',
        fr: 'Relevé d’emploi',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Under {{statute}} a temporary layoff can only run for a limited period. For this layoff that limit falls on {{outside_limit_date}}. If we have not recalled you by then, your employment is treated as terminated as of {{layoff_start}}, and any notice and severance you are owed are calculated from that date.',
        fr: 'Sous {{statute}}, une mise à pied temporaire ne peut durer qu’une période limitée. Pour la présente mise à pied, cette limite est atteinte le {{outside_limit_date}}. Si nous ne vous avons pas rappelé(e) d’ici là, votre emploi est réputé avoir pris fin le {{layoff_start}}, et tout préavis et toute indemnité de départ qui vous sont dus se calculent à compter de cette date.',
      },
      n: 4,
      heading: {
        en: 'If we cannot recall you',
        fr: 'Si nous ne pouvons vous rappeler',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Questions go to {{contact}}. We will keep you updated if the expected recall date changes, either way.',
        fr: 'Adressez vos questions à {{contact}}. Nous vous tiendrons informé(e) si la date de rappel prévue change, dans un sens comme dans l’autre.',
      },
      n: 5,
      heading: {
        en: 'Staying in touch',
        fr: 'Rester en contact',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This workplace is unionized: the collective agreement governs layoff selection, bumping rights, the recall list and the period recall rights are held for. Those terms prevail over this notice.',
        fr: 'Ce milieu de travail est syndiqué : la convention collective régit la sélection aux fins de mise à pied, les droits de supplantation, la liste de rappel et la période de conservation des droits de rappel. Ces dispositions ont préséance sur le présent avis.',
      },
      heading: {
        en: 'Collective agreement',
        fr: 'Convention collective',
      },
      when: {
        union: true,
      },
    },
    {
      type: 'sig',
      roles: [
        {
          en: 'Employer representative',
          fr: 'Représentant de l’employeur',
        },
      ],
    },
    {
      type: 'note',
      text: {
        en: 'Employment standards legislation permitting a temporary layoff does not give you the right to impose one. Unless the employment contract allows it, or layoff is an established practice in your workplace, imposing a layoff can be a constructive dismissal from the first day — with the statutory limits never reached because the claim does not depend on them. Confirm you have the right before sending this.',
        fr: 'Le fait que la législation sur les normes du travail permette une mise à pied temporaire ne vous confère pas le droit de l’imposer. À moins que le contrat de travail ne le permette ou que la mise à pied ne soit une pratique établie dans votre milieu, l’imposer peut constituer un congédiement déguisé dès le premier jour — sans que les limites légales n’entrent jamais en jeu, la réclamation n’en dépendant pas. Vérifiez que vous détenez ce droit avant d’envoyer la présente.',
      },
      tone: 'risk',
    },
    {
      type: 'note',
      tone: 'risk',
      text: {
        en: 'Higher-risk document. If this layoff is one of several within a short window, check whether the group termination rules are engaged and use the group termination notice (T15) instead. Lawyer review is recommended before this is sent.',
        fr: 'Document à risque élevé. Si cette mise à pied s’inscrit parmi plusieurs sur une courte période, vérifiez si les règles de licenciement collectif s’appliquent et utilisez plutôt l’avis de licenciement collectif (T15). Une révision juridique est recommandée avant l’envoi.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: DOC_DISCLAIMER_NOTE,
    },
  ],
  subject: 'employee',
}
