/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 2, Pillar B (docs/FOUR_RING_FRAMEWORK.md). The framework's brief for
   this tool is "gather information without requesting a medical diagnosis" —
   that constraint is the whole point of the document, so the prompts are
   written to make asking for a diagnosis the harder thing to do. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT21: DocTemplate = {
  id: 'tpl_t21',
  tid: 'T21',
  key: 'accommodation_request_form',
  kind: 'form',
  category: 'accommodation',
  core: false,
  name: {
    en: 'Accommodation request form',
    fr: 'Formulaire de demande d’accommodement',
  },
  desc: {
    en: 'The form you issue when an employee asks for an adjustment — collects functional limitations and what they need, never a diagnosis.',
    fr: 'Le formulaire remis lorsqu’un employé demande un ajustement : il recueille les limitations fonctionnelles et le besoin exprimé, jamais un diagnostic.',
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
      en: 'Human rights legislation — duty to accommodate',
      fr: 'Législation sur les droits de la personne — obligation d’accommodement',
    },
    {
      en: 'Privacy — functional limitations, not diagnosis',
      fr: 'Vie privée — limitations fonctionnelles, et non diagnostic',
    },
    {
      en: 'Shared duty — the employee participates in finding a workable arrangement',
      fr: 'Obligation partagée — l’employé participe à la recherche d’un arrangement viable',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'A request does not have to be in writing, or use the word "accommodation", to trigger the duty under the Human Rights Code. This form documents a request you already have — it is not a precondition to one.',
      fr: 'Une demande n’a pas à être écrite, ni à employer le mot « accommodement », pour déclencher l’obligation prévue au Code des droits de la personne. Le présent formulaire documente une demande déjà reçue ; il n’en est pas une condition préalable.',
    },
    QC: {
      en: 'Under the Charter of human rights and freedoms the same applies, and the form must be available in French. Where the limitation follows an employment injury, the CNESST process — not this form — drives the file.',
      fr: 'La Charte des droits et libertés de la personne impose la même règle, et le formulaire doit être disponible en français. Lorsque la limitation fait suite à une lésion professionnelle, c’est le processus de la CNESST, et non le présent formulaire, qui pilote le dossier.',
    },
    FED: {
      en: 'The Canadian Human Rights Act applies. Federally regulated employers should also check whether the adjustment engages hours or leave provisions under the Canada Labour Code, Part III.',
      fr: 'La Loi canadienne sur les droits de la personne s’applique. Les employeurs de compétence fédérale devraient aussi vérifier si l’ajustement met en jeu les dispositions sur les heures ou les congés du Code canadien du travail, Partie III.',
    },
  },
  includes: [
    {
      en: 'What part of the work is affected',
      fr: 'La partie du travail touchée',
    },
    {
      en: 'The adjustment being asked for',
      fr: 'L’ajustement demandé',
    },
    {
      en: 'Expected duration',
      fr: 'Durée prévue',
    },
    {
      en: 'Supporting information — limitations only',
      fr: 'Renseignements à l’appui — limitations seulement',
    },
    {
      en: 'What happens next',
      fr: 'Les prochaines étapes',
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
      id: 'position_title',
      section: {
        en: 'Employee',
        fr: 'Employé',
      },
      label: {
        en: 'Position',
        fr: 'Poste',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Job title',
        fr: 'Titre du poste',
      },
    },
    {
      id: 'contact_name',
      section: {
        en: 'Return the form to',
        fr: 'Remettre le formulaire à',
      },
      label: {
        en: 'Who receives the completed form',
        fr: 'Qui reçoit le formulaire rempli',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Name and role',
        fr: 'Nom et fonction',
      },
      hint: {
        en: 'Route it to one named person, not a shared inbox — this document reaches further into someone’s private life than most.',
        fr: 'Acheminez-le à une seule personne nommée, et non à une boîte partagée : ce document touche à la vie privée plus que la plupart des autres.',
      },
    },
    {
      id: 'return_by',
      section: {
        en: 'Return the form to',
        fr: 'Remettre le formulaire à',
      },
      label: {
        en: 'Return by',
        fr: 'À remettre au plus tard le',
      },
      type: 'date',
      required: true,
      hint: {
        en: 'A scheduling date, not a deadline on the request itself — the duty to accommodate is already running.',
        fr: 'Une date de planification, et non un délai imposé à la demande elle-même : l’obligation d’accommodement court déjà.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Accommodation Request',
        fr: 'Demande d’accommodement',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{employee_name}} · {{position_title}} · Confidential',
        fr: '{{org}} · {{employee_name}} · {{position_title}} · Confidentiel',
      },
    },
    {
      type: 'para',
      text: {
        en: 'Use this form to tell us what you need so you can do your job. You do not have to tell us what medical condition you have, and we will not ask. What we need to understand is what parts of the work are affected and what would help.',
        fr: 'Utilisez ce formulaire pour nous indiquer ce dont vous avez besoin pour accomplir votre travail. Vous n’avez pas à nous dire de quelle condition médicale vous êtes atteint(e), et nous ne le demanderons pas. Ce que nous devons comprendre, ce sont les aspects du travail qui sont touchés et ce qui vous aiderait.',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Which parts of your job are difficult right now, and in what way? Describe the tasks or conditions, not the cause.',
        fr: 'Quelles parties de votre travail sont difficiles en ce moment, et de quelle manière ? Décrivez les tâches ou les conditions, et non la cause.',
      },
      n: 1,
      heading: {
        en: 'What is affected',
        fr: 'Ce qui est touché',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'What adjustment are you asking for? If you are not sure what would work, say what you have tried or what makes the task harder, and we will look at the options with you.',
        fr: 'Quel ajustement demandez-vous ? Si vous ne savez pas ce qui fonctionnerait, indiquez ce que vous avez essayé ou ce qui rend la tâche plus difficile, et nous examinerons les options avec vous.',
      },
      n: 2,
      heading: {
        en: 'What you are asking for',
        fr: 'Ce que vous demandez',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'How long do you expect to need this — ongoing, or for a period? An estimate is fine, and it can change.',
        fr: 'Pendant combien de temps prévoyez-vous en avoir besoin — de façon continue ou pour une période ? Une estimation suffit, et elle peut changer.',
      },
      n: 3,
      heading: {
        en: 'How long',
        fr: 'Durée',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'If you have documentation from a health professional, attach it. It should describe your functional limitations, any restrictions, and how long they are expected to last. It should not name your diagnosis, and we will not ask for one. If getting documentation takes time, return this form anyway and send it after.',
        fr: 'Si vous disposez d’un document d’un professionnel de la santé, joignez-le. Il devrait décrire vos limitations fonctionnelles, les restrictions applicables et leur durée prévue. Il ne devrait pas nommer votre diagnostic, et nous n’en demanderons pas. Si l’obtention du document prend du temps, remettez tout de même ce formulaire et transmettez-le ensuite.',
      },
      n: 4,
      heading: {
        en: 'Supporting information',
        fr: 'Renseignements à l’appui',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Return this form to {{contact_name}}. We will meet with you to talk it through, look at what is workable, and give you a written answer setting out what we decided and why. Finding an arrangement is something we work out together — if an option we suggest will not work for you, tell us so we can look at another.',
        fr: 'Remettez ce formulaire à {{contact_name}}. Nous vous rencontrerons pour en discuter, examiner ce qui est réalisable et vous remettre une réponse écrite exposant notre décision et ses motifs. La recherche d’un arrangement se fait ensemble : si une option que nous proposons ne vous convient pas, dites-le-nous afin que nous en examinions une autre.',
      },
      n: 5,
      heading: {
        en: 'What happens next',
        fr: 'Les prochaines étapes',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Please return this form by {{return_by}}. If that is not possible, tell {{contact_name}} — the date is for scheduling, and missing it does not affect your request.',
        fr: 'Veuillez remettre ce formulaire au plus tard le {{return_by}}. Si cela n’est pas possible, informez-en {{contact_name}} : cette date sert à la planification et son non-respect n’a aucune incidence sur votre demande.',
      },
      heading: {
        en: 'Return date',
        fr: 'Date de remise',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This workplace is unionized: you may involve your union representative at any point, and the union shares the duty to help find a workable arrangement.',
        fr: 'Ce milieu de travail est syndiqué : vous pouvez faire intervenir votre représentant syndical à tout moment, et le syndicat partage l’obligation de contribuer à trouver un arrangement viable.',
      },
      heading: {
        en: 'Union representation',
        fr: 'Représentation syndicale',
      },
      when: {
        union: true,
      },
    },
    {
      type: 'sig',
      roles: [
        {
          en: 'Employee',
          fr: 'Employé(e)',
        },
      ],
    },
    {
      type: 'note',
      text: {
        en: 'What you write here is kept confidential and stored separately from your general personnel file. It is shared only with those who need it to put an arrangement in place.',
        fr: 'Ce que vous inscrivez ici demeure confidentiel et est conservé séparément de votre dossier d’employé général. Ces renseignements ne sont communiqués qu’aux personnes qui en ont besoin pour mettre un arrangement en place.',
      },
      tone: 'info',
    },
    {
      type: 'note',
      tone: 'info',
      text: {
        en: 'Generated from your answers as a starting point.',
        fr: 'Généré à partir de vos réponses comme point de départ.',
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
