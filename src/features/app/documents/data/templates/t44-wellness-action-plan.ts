/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 2, Pillar C (docs/FOUR_RING_FRAMEWORK.md).

   **This one belongs to the employee, and that changes how it is built.**
   Every other template in the catalogue is the employer's document about a
   person. This is a person's document about themselves, handed to a manager
   so the manager knows what helps.

   **So it generates blank, and that is the design rather than an omission.**
   The first draft asked the wizard for the employee's answers, which review
   caught: `GenerateScreen` is employer-side — an owner, HR lead or manager
   picks an employee and types into it — so a template with fields for "what
   makes work harder" has the employer authoring someone else's health-adjacent
   data. The three questions here are the only ones an employer legitimately
   fills in: whose plan it is, when to look at it again, and who to give it
   back to. Everything else prints as a prompt with space under it.

   If an employee self-completion path is ever built, this is the template to
   revisit — but a blank form is the honest shape until then, not a stopgap.

   No diagnosis is requested anywhere, deliberately: a box marked "nature of
   condition" gets that box filled in. What the product cannot do is stop
   someone volunteering one in free text, so the copy says "no diagnosis is
   requested" rather than claiming the result is never a medical record, and
   the manager note says to treat whatever comes back as sensitive personal
   information either way.

   It is also not an accommodation, and the copy says so — but it does not say
   the accommodation process waits for a formal request, because it does not:
   the duty starts when the employer knows or ought reasonably to know. An
   earlier draft said "starts with an accommodation request", which
   contradicted this file's own jurisdiction notes. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT44: DocTemplate = {
  id: 'tpl_t44',
  tid: 'T44',
  key: 'wellness_action_plan',
  kind: 'plan',
  category: 'wellbeing',
  core: false,
  name: {
    en: 'Wellness action plan',
    fr: 'Plan d’action pour le bien-être',
  },
  desc: {
    en: 'An employee’s own plan for staying well at work — what helps, what the early signs are, and what they want their manager to do. Voluntary, issued blank for the employee to fill in, and no diagnosis is ever requested.',
    fr: 'Le plan personnel d’une personne salariée pour rester bien au travail : ce qui aide, les signes précurseurs et ce qu’elle attend de son gestionnaire. Volontaire, remis vierge pour que la personne le remplisse, et aucun diagnostic n’y est jamais demandé.',
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
      en: 'Voluntary — completing one cannot be required, and declining costs nothing',
      fr: 'Volontaire — nul ne peut être tenu d’en remplir un, et refuser n’entraîne aucune conséquence',
    },
    {
      en: 'Privacy — no diagnosis is requested, and a completed plan is sensitive personal information',
      fr: 'Vie privée — aucun diagnostic n’est demandé, et un plan rempli constitue un renseignement personnel sensible',
    },
    {
      en: 'Not an accommodation, and not a substitute for one',
      fr: 'Ni un accommodement, ni un substitut à celui-ci',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Nothing requires an employer to offer this, and nothing lets one require it. Two cautions. What the employee writes here can amount to notice that they may need an adjustment — once you know, or ought reasonably to know, the Human Rights Code duty to accommodate has started, whatever this document is called. And where the difficulty they describe is conduct at work, the Occupational Health and Safety Act harassment duties apply and a wellness plan is not a response to them.',
      fr: 'Rien n’oblige un employeur à offrir ce plan, et rien ne lui permet de l’imposer. Deux mises en garde. Ce que la personne y écrit peut valoir avis qu’elle pourrait avoir besoin d’un ajustement — dès que vous savez, ou devriez raisonnablement savoir, l’obligation d’accommodement du Code des droits de la personne est enclenchée, quel que soit le nom du document. Et lorsque la difficulté décrite relève de comportements au travail, les obligations de la Loi sur la santé et la sécurité au travail s’appliquent et un plan de bien-être n’y répond pas.',
    },
    QC: {
      en: 'The same two cautions apply, through the Charter of human rights and freedoms for accommodation and the Act respecting labour standards for psychological harassment — and note that the Act obliges an employer to act on harassment once aware, so a plan describing conduct by a colleague is information you must act on rather than file. Law 25 governs the personal information collected here: collect only what is necessary, say what it will be used for, and keep it apart. The form must be available in French.',
      fr: 'Les deux mêmes mises en garde s’appliquent, par la Charte des droits et libertés de la personne pour l’accommodement et par la Loi sur les normes du travail pour le harcèlement psychologique — et notez que la Loi oblige l’employeur à agir sur le harcèlement dès qu’il en est informé : un plan décrivant les comportements d’un collègue est donc une information sur laquelle agir plutôt qu’à classer. La Loi 25 régit les renseignements personnels recueillis ici : ne recueillez que le nécessaire, indiquez l’usage prévu et conservez-les séparément. Le formulaire doit être disponible en français.',
    },
    FED: {
      en: 'The Canadian Human Rights Act carries the accommodation duty on the same "knew or ought to have known" footing. Where what the employee describes is a harassment or violence occurrence, the Work Place Harassment and Violence Prevention Regulations set a prescribed process with its own timelines — a plan is not that process and does not start it. PIPEDA governs the personal information collected.',
      fr: 'La Loi canadienne sur les droits de la personne porte l’obligation d’accommodement sur le même fondement du « savait ou aurait dû savoir ». Lorsque ce que décrit la personne constitue un incident de harcèlement ou de violence, le Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail prévoit un processus assorti de ses propres délais — un plan n’est pas ce processus et ne le déclenche pas. La LPRPDE régit les renseignements personnels recueillis.',
    },
  },
  includes: [
    {
      en: 'What keeps you well at work',
      fr: 'Ce qui vous garde bien au travail',
    },
    {
      en: 'What makes work harder',
      fr: 'Ce qui rend le travail plus difficile',
    },
    {
      en: 'Early signs, and what you want done about them',
      fr: 'Signes précurseurs et ce que vous souhaitez qu’on fasse',
    },
    {
      en: 'Who else may see this',
      fr: 'Qui d’autre peut le consulter',
    },
    {
      en: 'When it is next looked at',
      fr: 'Quand il sera revu',
    },
  ],
  questions: [
    {
      id: 'employee_name',
      section: {
        en: 'Who it is for',
        fr: 'Pour qui',
      },
      label: {
        en: 'Employee name',
        fr: 'Nom de la personne salariée',
      },
      type: 'text',
      required: true,
      hint: {
        en: 'This section is the routing and identifying detail only — whose plan it is, when to revisit, who to return it to. Every answer in the plan itself is written by the person it belongs to.',
        fr: 'Cette section ne contient que les renseignements d’identification et d’acheminement — à qui appartient le plan, quand le revoir, à qui le remettre. Toutes les réponses du plan lui-même sont rédigées par la personne à qui il appartient.',
      },
    },
    {
      id: 'review_on',
      section: {
        en: 'Who it is for',
        fr: 'Pour qui',
      },
      label: {
        en: 'Suggested date to look at it again',
        fr: 'Date suggérée pour le revoir',
      },
      type: 'date',
      required: true,
      hint: {
        en: 'A suggestion, which the employee can change. A plan nobody revisits describes a job that has since changed.',
        fr: 'Une suggestion, que la personne peut modifier. Un plan que personne ne revoit décrit un poste qui a changé depuis.',
      },
    },
    {
      id: 'return_to',
      section: {
        en: 'Who it is for',
        fr: 'Pour qui',
      },
      label: {
        en: 'Who to give the completed plan to',
        fr: 'À qui remettre le plan rempli',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Usually their own manager — and say if there is an alternative.',
        fr: 'Habituellement leur gestionnaire — précisez s’il existe une autre option.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Wellness action plan',
        fr: 'Plan d’action pour le bien-être',
      },
    },
    {
      type: 'meta',
      text: {
        en: 'For {{employee_name}} to complete · {{org}} · Issued {{today}} · Suggested review {{review_on}}',
        fr: 'À remplir par {{employee_name}} · {{org}} · Émis le {{today}} · Révision suggérée le {{review_on}}',
      },
    },
    {
      type: 'para',
      text: {
        en: 'This plan belongs to you. It is issued blank because nobody else should be writing your answers — fill in as much or as little as you want, in your own words, and leave anything you would rather not say. Completing it is entirely voluntary and you will not be asked why if you do not. When you are ready, give it to {{return_to}}. You can change it or take it back at any time.',
        fr: 'Le présent plan vous appartient. Il est remis vierge parce que personne d’autre ne devrait rédiger vos réponses — remplissez-en autant ou aussi peu que vous le souhaitez, dans vos mots, et laissez de côté ce que vous préférez taire. Le remplir est entièrement volontaire et on ne vous demandera pas pourquoi si vous ne le faites pas. Lorsque vous serez prêt(e), remettez-le à {{return_to}}. Vous pouvez le modifier ou le reprendre en tout temps.',
      },
    },
    {
      type: 'fill',
      n: 1,
      lines: 4,
      heading: {
        en: 'What helps me work well',
        fr: 'Ce qui m’aide à bien travailler',
      },
      text: {
        en: 'Working patterns, notice before changes, a quiet space, regular one-to-ones — whatever actually helps. Most of a useful plan is a list of ordinary things that already work, and it is the part a manager can act on straight away.',
        fr: 'Rythme de travail, préavis avant les changements, un espace calme, des rencontres régulières — ce qui aide réellement. L’essentiel d’un plan utile est une liste de choses ordinaires qui fonctionnent déjà, et c’est la partie sur laquelle un gestionnaire peut agir tout de suite.',
      },
    },
    {
      type: 'fill',
      n: 2,
      lines: 4,
      heading: {
        en: 'What makes it harder',
        fr: 'Ce qui rend les choses plus difficiles',
      },
      text: {
        en: 'Situations or demands that make work harder, described by how they affect your work. You are not asked for a diagnosis anywhere on this form, you do not have to give one, and nobody may ask you for one because you completed it.',
        fr: 'Les situations ou exigences qui compliquent le travail, décrites par leur effet sur celui-ci. Aucun diagnostic ne vous est demandé nulle part sur ce formulaire, vous n’avez pas à en fournir, et personne ne peut vous en demander un parce que vous l’avez rempli.',
      },
    },
    {
      type: 'fill',
      n: 3,
      lines: 3,
      heading: {
        en: 'What you might notice first',
        fr: 'Ce que vous pourriez remarquer en premier',
      },
      text: {
        en: 'The changes you would want someone to spot — in your work, your hours, how much you say in a meeting.',
        fr: 'Les changements que vous voudriez qu’on remarque — dans votre travail, vos horaires, votre participation aux réunions.',
      },
    },
    {
      type: 'fill',
      n: 4,
      lines: 4,
      heading: {
        en: 'What I would like you to do then',
        fr: 'Ce que je souhaite que vous fassiez alors',
      },
      text: {
        en: 'Who should speak to you, how, and what you would rather they did not do. Written now, this is the instruction your future self would struggle to give — "ask me directly and privately" and "do not raise it in a team meeting" are both useful answers.',
        fr: 'Qui doit vous en parler, comment, et ce que vous préféreriez qu’on ne fasse pas. Rédigée maintenant, c’est la consigne que vous auriez du mal à donner le moment venu — « parlez-m’en directement et en privé » et « n’abordez pas le sujet en réunion d’équipe » sont deux réponses utiles.',
      },
    },
    {
      type: 'fill',
      n: 5,
      lines: 2,
      heading: {
        en: 'Who I agree may see this',
        fr: 'Qui j’accepte de laisser consulter ce plan',
      },
      text: {
        en: 'Name them — "my manager only" is a complete answer. Your choice is respected. If it later has to go further, to arrange cover or because someone else has to act, you are told before that happens.',
        fr: 'Nommez-les — « mon gestionnaire seulement » est une réponse complète. Votre choix est respecté. Si le plan doit ensuite circuler davantage, pour organiser un remplacement ou parce qu’une autre personne doit agir, vous en serez informé(e) au préalable.',
      },
    },
    {
      type: 'clause',
      n: 6,
      heading: {
        en: 'How this is handled',
        fr: 'Comment ce plan est traité',
      },
      text: {
        en: 'A completed plan is treated as sensitive personal information: kept separately from the personnel file, never part of a performance record, and seen only by the people named above. We will tell you before sharing it further, and we will return or destroy it if you ask. Two honest limits on that — where the law requires us to disclose or to keep a record, we will, and where something in it must be acted on we may have to involve someone you did not name. In either case we tell you.',
        fr: 'Un plan rempli est traité comme un renseignement personnel sensible : conservé séparément du dossier d’employé, jamais versé à un dossier de rendement, et consulté uniquement par les personnes nommées ci-dessus. Nous vous informerons avant de le diffuser plus largement et nous vous le remettrons ou le détruirons sur demande. Deux limites honnêtes à cela : lorsque la loi nous oblige à divulguer ou à conserver un dossier, nous le ferons, et lorsqu’un élément appelle une intervention, nous pourrions devoir impliquer une personne que vous n’avez pas nommée. Dans les deux cas, nous vous en informons.',
      },
    },
    {
      type: 'clause',
      n: 7,
      heading: {
        en: 'What this is not',
        fr: 'Ce que ce plan n’est pas',
      },
      text: {
        en: 'No diagnosis is requested anywhere in this form, and nothing here asks you for one. What you choose to write is yours — if you do mention something about your health, it is treated as sensitive personal information and handled as clause 6 sets out. This is not an accommodation, and completing it does not mean you have asked for one or have a disability. Most of what belongs on this form is ordinary preference, and an ordinary preference is not an accommodation. Where what you write points to a need connected to a disability or another protected ground, that is an accommodation matter — and it does not wait for you to make a formal request: once {{org}} knows, or ought reasonably to know of such a need, the duty has started. Nothing here replaces or delays that.',
        fr: 'Aucun diagnostic n’est demandé dans le présent formulaire et rien ici ne vous en réclame. Ce que vous choisissez d’écrire vous appartient — si vous mentionnez un élément touchant votre santé, il est traité comme un renseignement personnel sensible et selon la clause 6. Il ne s’agit pas d’un accommodement, et le remplir ne signifie pas que vous en avez demandé un ni que vous avez un handicap. L’essentiel de ce qui a sa place ici relève de la préférence ordinaire, et une préférence ordinaire n’est pas un accommodement. Lorsque ce que vous écrivez révèle un besoin lié à un handicap ou à un autre motif protégé, il s’agit d’une question d’accommodement — et elle n’attend pas une demande formelle de votre part : dès que {{org}} connaît un tel besoin, ou devrait raisonnablement le connaître, l’obligation est enclenchée. Rien ici ne la remplace ni ne la retarde.',
      },
    },
    {
      type: 'sig',
      roles: [
        {
          en: 'Employee',
          fr: 'Employé(e)',
        },
        {
          en: 'Manager (acknowledging receipt)',
          fr: 'Gestionnaire (accusant réception)',
        },
        {
          en: 'Date',
          fr: 'Date',
        },
      ],
    },
    {
      type: 'note',
      tone: 'risk',
      text: {
        en: 'For the manager issuing this. Hand it over blank — do not fill any of it in on someone’s behalf, and do not ask what condition sits behind any answer. You may not require anyone to complete one, and declining must carry no consequence. When you get it back, read what it says: most of it will be ordinary preference, which is not an accommodation — but where it points to a need connected to a disability or another protected ground, the duty to accommodate has started whatever the document is called; if it describes conduct by a colleague, that is a harassment matter with its own obligations and timelines, and filing this instead of acting is the error to avoid. Treat whatever the employee chose to write as sensitive personal information, including anything about their health they volunteered without being asked.',
        fr: 'À l’intention du gestionnaire qui le remet. Remettez-le vierge — n’en remplissez aucune partie au nom de quelqu’un et ne demandez pas quel trouble se cache derrière une réponse. Vous ne pouvez exiger de quiconque qu’il en remplisse un, et un refus ne doit entraîner aucune conséquence. À sa réception, lisez ce qui y est écrit : l’essentiel relèvera de la préférence ordinaire, ce qui n’est pas un accommodement — mais lorsqu’il révèle un besoin lié à un handicap ou à un autre motif protégé, l’obligation d’accommodement est enclenchée quel que soit le nom du document ; s’il décrit les comportements d’un collègue, il s’agit d’une question de harcèlement assortie de ses propres obligations et délais, et le classer au lieu d’agir est l’erreur à éviter. Traitez tout ce que la personne a choisi d’écrire comme un renseignement personnel sensible, y compris ce qu’elle aurait volontairement révélé sur sa santé sans qu’on le lui demande.',
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
