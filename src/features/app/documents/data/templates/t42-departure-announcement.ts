/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 3, Crisis communications (docs/FOUR_RING_FRAMEWORK.md).

   The framework calls this the "sudden departure announcement", and the
   sudden ones are where the damage happens — but the document is written for
   every departure, because the discipline is identical and an organisation
   that announces resignations warmly and terminations tersely has published
   the difference without meaning to. A reader who has seen five of these
   knows exactly what the sixth one's silence means.

   The whole document is one rule: say that the person has left, say when,
   say who to contact. No reason, no characterisation, no thanks that reads
   as pointed by its absence next time.

   That is not squeamishness. A stated or implied reason is published to an
   audience with no need for it, by an employer who would have to prove it if
   challenged, about a person who is not present to answer — and where the
   departure was a termination, an implication of cause is the version that
   follows them to their next interview. Nothing in the announcement is worth
   that. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT42: DocTemplate = {
  id: 'tpl_t42',
  tid: 'T42',
  key: 'departure_announcement',
  kind: 'notice',
  category: 'communications',
  core: false,
  name: {
    en: 'Departure announcement',
    fr: 'Annonce de départ',
  },
  desc: {
    en: 'Tells the team someone has left — the date, the cover, the contact. Written so that a resignation and a dismissal read the same way.',
    fr: 'Informe l’équipe du départ d’une personne : la date, la relève, le contact. Rédigée pour qu’une démission et un congédiement se lisent de la même façon.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 3,
  usageCount: 0,
  statutory: [
    {
      en: 'A stated or implied reason can be defamatory and is rarely defensible',
      fr: 'Un motif énoncé ou sous-entendu peut être diffamatoire et se défend rarement',
    },
    {
      en: 'Privacy — the reason for a departure is not the workplace’s information',
      fr: 'Vie privée — le motif d’un départ n’est pas une information du milieu de travail',
    },
    {
      en: 'What is said publicly can aggravate damages in a wrongful dismissal claim',
      fr: 'Ce qui est dit publiquement peut aggraver les dommages dans une poursuite pour congédiement injustifié',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Two exposures run together here. A statement about why someone left, made to people who did not need to know, is a defamation risk the employer carries the burden of defending. Separately, the manner of a dismissal can support aggravated damages in a wrongful dismissal claim — an announcement that humiliates someone, or that lets colleagues infer cause, is the kind of conduct that gets weighed. Where the departure followed a human rights complaint or a safety report, an announcement that marks the person out can itself be reprisal.',
      fr: 'Deux risques se conjuguent ici. Une déclaration sur le motif d’un départ, faite à des personnes qui n’avaient pas à le connaître, expose à un risque de diffamation dont l’employeur assume la défense. Par ailleurs, la manière du congédiement peut fonder des dommages majorés dans une poursuite pour congédiement injustifié — une annonce qui humilie une personne, ou qui laisse les collègues déduire un motif, fait partie de ce qui est apprécié. Lorsque le départ fait suite à une plainte en droits de la personne ou à un signalement en sécurité, une annonce qui met la personne en évidence peut elle-même constituer des représailles.',
    },
    QC: {
      en: 'The Charter of human rights and freedoms protects reputation, dignity and private life directly, and the Civil Code makes a person liable for injury caused by fault — so an announcement that characterises a departure is actionable on its own footing here, not only through defamation as understood elsewhere. Publish in French where French is the language of work.',
      fr: 'La Charte des droits et libertés de la personne protège directement la réputation, la dignité et la vie privée, et le Code civil engage la responsabilité pour le préjudice causé par une faute — une annonce qui qualifie un départ est donc actionnable de son propre chef ici, et pas seulement par la voie de la diffamation telle qu’entendue ailleurs. Publiez en français lorsque le français est la langue du travail.',
    },
    FED: {
      en: 'Where the departure is connected to a harassment or violence occurrence, the Work Place Harassment and Violence Prevention Regulations require the parties’ identities to be protected throughout — an announcement that lets colleagues connect a departure to an ongoing or concluded process breaches that even when it names no one. In a unionised workplace, an announcement made while a grievance is live can prejudice it.',
      fr: 'Lorsque le départ est lié à un incident de harcèlement ou de violence, le Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail exige que l’identité des parties soit protégée tout au long du processus — une annonce permettant aux collègues de relier un départ à un processus en cours ou conclu y contrevient, même sans nommer quiconque. En milieu syndiqué, une annonce faite pendant qu’un grief est pendant peut lui porter préjudice.',
    },
  },
  includes: [
    {
      en: 'That the person has left, and from when',
      fr: 'Que la personne est partie, et depuis quand',
    },
    {
      en: 'Who is covering the work',
      fr: 'Qui assure la relève',
    },
    {
      en: 'Who to contact about what',
      fr: 'À qui s’adresser et pour quoi',
    },
    {
      en: 'Nothing about why',
      fr: 'Rien sur le pourquoi',
    },
  ],
  questions: [
    {
      id: 'person_name',
      section: {
        en: 'The departure',
        fr: 'Le départ',
      },
      label: {
        en: 'Name of the person leaving',
        fr: 'Nom de la personne qui part',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'last_day',
      section: {
        en: 'The departure',
        fr: 'Le départ',
      },
      label: {
        en: 'Last day, or the date they left',
        fr: 'Dernier jour, ou date du départ',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'agreed_wording',
      section: {
        en: 'The departure',
        fr: 'Le départ',
      },
      label: {
        en: 'Has the wording been agreed with them?',
        fr: 'La formulation a-t-elle été convenue avec la personne ?',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: 'agreed',
          label: {
            en: 'Yes — they have seen and agreed this',
            fr: 'Oui — elle l’a vue et acceptée',
          },
        },
        {
          value: 'not_agreed',
          label: {
            en: 'No — keep it to the minimum',
            fr: 'Non — s’en tenir au minimum',
          },
        },
      ],
      hint: {
        en: 'Ask them wherever you can, including on a termination. Someone who chooses their own wording rarely wants more than the minimum, and having agreed it removes most of what could be argued about later.',
        fr: 'Demandez-le chaque fois que possible, y compris lors d’un congédiement. Une personne qui choisit sa propre formulation en demande rarement plus que le minimum, et l’avoir convenue écarte l’essentiel de ce qui pourrait être contesté par la suite.',
      },
    },
    {
      id: 'cover',
      section: {
        en: 'The work',
        fr: 'Le travail',
      },
      label: {
        en: 'Who is covering the work, and who to contact',
        fr: 'Qui assure la relève et à qui s’adresser',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Named people, and what each of them now covers.',
        fr: 'Des personnes nommées, et ce que chacune prend en charge.',
      },
      hint: {
        en: 'The only part of this announcement anyone actually needs. Without it the team fills the silence with the question you are not answering.',
        fr: 'La seule partie de cette annonce réellement utile. Sans elle, l’équipe comble le silence avec la question à laquelle vous ne répondez pas.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'A change to the team',
        fr: 'Un changement au sein de l’équipe',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}}',
        fr: '{{org}} · {{today}}',
      },
    },
    {
      type: 'clause',
      n: 1,
      heading: {
        en: 'The change',
        fr: 'Le changement',
      },
      text: {
        en: '{{person_name}} has left {{org}} as of {{last_day}}. We are not going to say anything about why, and that is the same for every departure here rather than a signal about this one.',
        fr: '{{person_name}} a quitté {{org}} en date du {{last_day}}. Nous ne dirons rien sur les motifs, et il en va de même pour tous les départs plutôt qu’il ne s’agisse d’un signal visant celui-ci.',
      },
    },
    {
      type: 'clause',
      n: 2,
      heading: {
        en: 'Who to go to now',
        fr: 'À qui s’adresser désormais',
      },
      text: {
        en: '{{cover}} If you are unsure who now owns something that was theirs, ask rather than letting it sit — the work moving cleanly is the thing that actually affects you.',
        fr: '{{cover}} Si vous ne savez pas qui prend désormais en charge un dossier qui lui revenait, demandez plutôt que de laisser traîner — c’est la continuité du travail qui vous touche réellement.',
      },
    },
    {
      type: 'clause',
      n: 3,
      heading: {
        en: 'What we are asking of you',
        fr: 'Ce que nous vous demandons',
      },
      text: {
        en: 'Please do not speculate, and please do not repeat speculation. If someone asks you why, "I do not know, and it is not mine to say" is a complete answer. {{person_name}} may talk about it themselves or may not — either way, that is theirs to decide, and it stays theirs.',
        fr: 'Merci de ne pas spéculer et de ne pas relayer de spéculations. Si l’on vous demande pourquoi, « je l’ignore, et ce n’est pas à moi de le dire » constitue une réponse complète. {{person_name}} en parlera ou non — dans un cas comme dans l’autre, cela lui appartient et continuera de lui appartenir.',
      },
    },
    {
      type: 'note',
      tone: 'risk',
      text: {
        en: 'Add nothing to this. A reason, a characterisation, a "we wish them well" that will be conspicuously absent from the next one, or a warm note here that a colleague reads against the terse one they got — each of those publishes something about a person to an audience with no need for it, and the employer would have to stand behind it. Where a departure follows a complaint, an investigation or a leave, say less rather than more: an announcement that lets colleagues connect the two can be reprisal even though it names nothing.',
        fr: 'N’ajoutez rien. Un motif, une qualification, un « nous lui souhaitons bonne continuation » dont l’absence sera remarquée la prochaine fois, ou un mot chaleureux ici qu’un collègue comparera au ton sec reçu pour le sien — chacun publie quelque chose sur une personne à un public qui n’en a pas besoin, et l’employeur devrait en répondre. Lorsqu’un départ suit une plainte, une enquête ou un congé, dites-en moins plutôt que plus : une annonce permettant aux collègues d’établir le lien peut constituer des représailles même sans rien nommer.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: {
        en: 'This announcement states no reason and implies none. It is not notice to the departing employee of anything — that is their own letter — and it does not vary anyone’s terms.',
        fr: 'La présente annonce n’énonce ni ne sous-entend aucun motif. Elle ne constitue un préavis de rien à l’égard de la personne qui part — cela relève de sa propre lettre — et ne modifie les conditions de personne.',
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
