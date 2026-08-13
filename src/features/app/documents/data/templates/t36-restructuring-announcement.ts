/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 3, Layoff & restructuring (docs/FOUR_RING_FRAMEWORK.md).

   The written follow-up to T35, and it is a separate document rather than a
   section of it because the two have different readers and different lives.
   The script is spoken once to a room; this is circulated, forwarded, kept,
   and read months later by people who were not there — including, sometimes,
   in a proceeding. It is the version that becomes the record.

   Deliberately about the structure and not about the people. Who left, and
   why, is absent by design: an announcement that characterises a departure is
   how an employer publishes something it cannot substantiate to an audience
   with no need for it. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT36: DocTemplate = {
  id: 'tpl_t36',
  tid: 'T36',
  key: 'restructuring_announcement',
  kind: 'notice',
  category: 'communications',
  core: false,
  name: {
    en: 'Team restructuring announcement',
    fr: 'Annonce de réorganisation d’équipe',
  },
  desc: {
    en: 'The written follow-up to the meeting — the new structure, what is not changing, and when people will hear more.',
    fr: 'Le suivi écrit de la rencontre : la nouvelle structure, ce qui ne change pas et le moment où l’équipe en saura plus.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 5,
  usageCount: 0,
  statutory: [
    {
      en: 'A material change to someone’s own role is a change to their terms, and needs their agreement',
      fr: 'Une modification substantielle du poste d’une personne modifie ses conditions et requiert son accord',
    },
    {
      en: 'Privacy — a departure is not characterised, and no reason is published',
      fr: 'Vie privée — un départ n’est pas qualifié et aucun motif n’est publié',
    },
    {
      en: 'An announcement is not notice of anything',
      fr: 'Une annonce ne constitue un préavis de rien',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Announcing a new structure does not by itself change anyone’s terms. Where the new structure materially alters an individual’s role, reporting line, pay or hours, that is a change to their employment contract. Their agreement is necessary but is not on its own sufficient: at common law a variation that reduces what an existing employee already has needs fresh consideration to bind them — something of value they were not already entitled to — and a signature without it is generally unenforceable. Imposing the change instead can amount to constructive dismissal. Confirm it individually with the promotion and salary adjustment letter (T26) rather than by circulating an organisation chart.',
      fr: 'Annoncer une nouvelle structure ne modifie en soi les conditions de personne. Lorsque la nouvelle structure modifie substantiellement le poste, le lien hiérarchique, la rémunération ou les heures d’une personne, il s’agit d’une modification de son contrat de travail. Son accord est nécessaire mais non suffisant à lui seul : en common law, une modification réduisant ce dont bénéficie déjà une personne en poste exige une contrepartie nouvelle pour la lier — un avantage auquel elle n’avait pas déjà droit — et une signature sans contrepartie est généralement inexécutoire. Imposer le changement peut par ailleurs constituer un congédiement déguisé. Confirmez-la individuellement au moyen de la lettre de promotion et d’ajustement salarial (T26) plutôt qu’en diffusant un organigramme.',
    },
    QC: {
      en: 'The same caution applies through a different route. Québec is a civil-law jurisdiction, and a unilateral change to an essential condition of employment is governed by the Civil Code and the Act respecting labour standards rather than by the common law of constructive dismissal — do not import the common-law analysis. The announcement must be in French where French is the language of work.',
      fr: 'La même prudence s’impose par une autre voie. Le Québec est une juridiction de droit civil, et la modification unilatérale d’une condition essentielle du travail relève du Code civil et de la Loi sur les normes du travail plutôt que de la common law du congédiement déguisé — n’importez pas l’analyse de common law. L’annonce doit être en français lorsque le français est la langue du travail.',
    },
    FED: {
      en: 'The Canada Labour Code, Part III governs, and where a restructuring accompanies terminations reaching the group threshold, the Minister notice and joint planning committee obligations run on their own timetable regardless of what has been announced internally. In a unionised workplace the collective agreement governs the structure change and the announcement does not displace it.',
      fr: 'Le Code canadien du travail, Partie III s’applique et, lorsqu’une réorganisation s’accompagne de cessations atteignant le seuil collectif, les obligations d’avis au ministre et de comité mixte de planification suivent leur propre échéancier, indépendamment de ce qui a été annoncé à l’interne. En milieu syndiqué, la convention collective régit le changement de structure et l’annonce ne s’y substitue pas.',
    },
  },
  includes: [
    {
      en: 'What has changed and from when',
      fr: 'Ce qui a changé et à compter de quand',
    },
    {
      en: 'The new reporting structure',
      fr: 'La nouvelle structure hiérarchique',
    },
    {
      en: 'What is not changing',
      fr: 'Ce qui ne change pas',
    },
    {
      en: 'Where the work goes in the meantime',
      fr: 'Où va le travail entre-temps',
    },
    {
      en: 'When the team will hear more',
      fr: 'Quand l’équipe en saura davantage',
    },
  ],
  questions: [
    {
      id: 'summary',
      section: {
        en: 'The change',
        fr: 'Le changement',
      },
      label: {
        en: 'What has changed',
        fr: 'Ce qui a changé',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The structural change, in two or three sentences.',
        fr: 'Le changement structurel, en deux ou trois phrases.',
      },
      hint: {
        en: 'Structure, not people. "Operations and logistics have merged into one team" — not who is no longer here.',
        fr: 'La structure, pas les personnes. « Les opérations et la logistique sont fusionnées en une seule équipe » — et non qui n’est plus là.',
      },
    },
    {
      id: 'effective_date',
      section: {
        en: 'The change',
        fr: 'Le changement',
      },
      label: {
        en: 'Effective date',
        fr: 'Date de prise d’effet',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'structure',
      section: {
        en: 'The new shape',
        fr: 'La nouvelle structure',
      },
      label: {
        en: 'The new reporting lines',
        fr: 'Les nouveaux liens hiérarchiques',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Which teams exist now, and who leads each.',
        fr: 'Quelles équipes existent désormais, et qui dirige chacune.',
      },
      hint: {
        en: 'Name roles and leads. If an individual’s own reporting line changes, that is confirmed to them directly as well — this announcement does not do it.',
        fr: 'Nommez les postes et les responsables. Si le lien hiérarchique d’une personne change, cela lui est aussi confirmé directement — la présente annonce ne le fait pas.',
      },
    },
    {
      id: 'unchanged',
      section: {
        en: 'The new shape',
        fr: 'La nouvelle structure',
      },
      label: {
        en: 'What is not changing',
        fr: 'Ce qui ne change pas',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Pay dates, benefits, locations, the systems people use, anything else the team is quietly worried about.',
        fr: 'Dates de paie, avantages, lieux de travail, systèmes utilisés, et tout autre sujet d’inquiétude sourde de l’équipe.',
      },
      hint: {
        en: 'The most-read paragraph in the whole document. In the absence of this list, people assume everything is in play.',
        fr: 'Le paragraphe le plus lu de tout le document. Sans cette liste, chacun présume que tout est remis en question.',
      },
    },
    {
      id: 'next_update',
      section: {
        en: 'What follows',
        fr: 'La suite',
      },
      label: {
        en: 'When the team hears more, and from whom',
        fr: 'Quand l’équipe en saura plus, et de qui',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. Team meetings on the 12th; questions to Dana in the meantime.',
        fr: 'p. ex. Réunions d’équipe le 12 ; d’ici là, questions à Dana.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'A change to how our team is organised',
        fr: 'Un changement dans l’organisation de notre équipe',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}} · To everyone in the affected teams',
        fr: '{{org}} · {{today}} · À l’ensemble des équipes visées',
      },
    },
    {
      type: 'para',
      text: {
        en: 'This confirms in writing what was said earlier today, so that everyone has the same version and nobody is relying on what they remember.',
        fr: 'Le présent document confirme par écrit ce qui a été dit plus tôt aujourd’hui, afin que chacun dispose de la même version et que personne n’ait à se fier à ses souvenirs.',
      },
    },
    {
      type: 'clause',
      n: 1,
      heading: {
        en: 'What has changed',
        fr: 'Ce qui a changé',
      },
      text: {
        en: '{{summary}} This takes effect on {{effective_date}}.',
        fr: '{{summary}} Cela prend effet le {{effective_date}}.',
      },
    },
    {
      type: 'clause',
      n: 2,
      heading: {
        en: 'How the team is organised now',
        fr: 'L’organisation actuelle de l’équipe',
      },
      text: {
        en: '{{structure}} If your own role, reporting line or terms are affected, you will hear that from your manager directly and in writing. Nothing in this announcement changes anyone’s terms of employment on its own.',
        fr: '{{structure}} Si votre poste, votre lien hiérarchique ou vos conditions sont touchés, votre gestionnaire vous en informera directement et par écrit. Rien dans la présente annonce ne modifie à lui seul les conditions d’emploi de quiconque.',
      },
    },
    {
      type: 'clause',
      n: 3,
      heading: {
        en: 'What is not changing',
        fr: 'Ce qui ne change pas',
      },
      text: {
        en: '{{unchanged}}',
        fr: '{{unchanged}}',
      },
    },
    {
      type: 'clause',
      n: 4,
      heading: {
        en: 'Colleagues who are leaving',
        fr: 'Les collègues qui nous quittent',
      },
      text: {
        en: 'We are not naming anyone here. People will tell their own colleagues in their own time, and how and when to do that is theirs to decide. We would ask everyone to leave that with them.',
        fr: 'Nous ne nommons personne ici. Chacun en parlera à ses collègues au moment qui lui convient, et il lui revient de décider comment et quand. Nous demandons à tous de le leur laisser.',
      },
    },
    {
      type: 'clause',
      n: 5,
      heading: {
        en: 'What happens next',
        fr: 'La suite',
      },
      text: {
        en: '{{next_update}} If something is unclear before then, ask rather than assume — we would rather answer the same question twenty times than have twenty different answers circulating.',
        fr: '{{next_update}} Si quelque chose demeure obscur d’ici là, posez la question plutôt que de présumer — nous préférons répondre vingt fois à la même question que voir circuler vingt réponses différentes.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: {
        en: 'This announcement is information about how the organisation is structured. It is not notice of termination, does not alter any individual’s terms of employment, and does not replace anything that must be given to an employee in writing.',
        fr: 'La présente annonce est une information sur la structure de l’organisation. Elle ne constitue pas un préavis de cessation d’emploi, ne modifie les conditions d’emploi de personne et ne remplace rien de ce qui doit être remis par écrit à un employé.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: DOC_DISCLAIMER_NOTE,
    },
  ],
  subject: 'org',
}
