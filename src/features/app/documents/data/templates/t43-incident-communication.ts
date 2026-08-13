/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 3, Crisis communications (docs/FOUR_RING_FRAMEWORK.md).

   For the message that goes out after something has happened — an injury, a
   violent incident, a fire, a data breach, a death. Written on the worst day
   an employer has, usually by someone who has not slept, which is why it is
   a template at all: the failures here are predictable and they are all
   failures of restraint.

   **The clause that matters most is the one saying this is not a report.**
   Telling staff is not telling the regulator. A serious workplace injury has
   its own notification duty with its own deadline, a privacy breach has its
   own, and an employer who has sent a careful all-staff message and nothing
   else has met neither. That confusion is easy to fall into precisely
   because the internal message feels like the responsible thing to have
   done.

   The rest is restraint: what is known, what is not yet known, what people
   should do. No cause, no names, no reassurance that cannot be stood behind
   tomorrow. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT43: DocTemplate = {
  id: 'tpl_t43',
  tid: 'T43',
  key: 'incident_communication',
  kind: 'notice',
  category: 'communications',
  core: false,
  name: {
    en: 'Incident communication',
    fr: 'Communication à la suite d’un incident',
  },
  desc: {
    en: 'What to tell staff after a serious incident — what is known, what is being done, what to do now, and nothing that has to be retracted tomorrow.',
    fr: 'Ce qu’il faut dire au personnel après un incident grave : ce qui est connu, ce qui est fait, ce qu’il faut faire maintenant, et rien qui devra être rétracté demain.',
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
      en: 'Telling staff does not discharge any duty to notify a regulator',
      fr: 'Informer le personnel ne libère d’aucune obligation d’aviser un organisme de réglementation',
    },
    {
      en: 'A scene may have to be preserved before anything is cleared or restarted',
      fr: 'Les lieux peuvent devoir être préservés avant tout nettoyage ou reprise',
    },
    {
      en: 'Privacy — no one involved is identified, and no cause is stated before it is known',
      fr: 'Vie privée — aucune personne visée n’est identifiée et aucune cause n’est énoncée avant d’être établie',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'The Occupational Health and Safety Act sets notice and reporting obligations that run to the Ministry of Labour, the joint health and safety committee and, where applicable, the union — with the most serious categories carrying immediate notice and a written report within a prescribed period. Where a critical injury or fatality has occurred, the scene must not be disturbed until released, except for the narrow reasons the Act allows: to save life or relieve human suffering, to maintain an essential public utility or public transportation system, or to prevent unnecessary damage to equipment or other property. That is narrower than "protecting property" — read it as written before moving anything. On the privacy side, do not reach for PHIPA by default: its breach duties bind health information custodians and their agents, and holding employee medical records does not make an ordinary employer one. Where you are a custodian they apply. Where you are not, Ontario has no general private-sector breach-notification statute covering employee personal information — check whether PIPEDA catches the information at all before assuming a duty exists, and take advice rather than reporting to the wrong regulator.',
      fr: 'La Loi sur la santé et la sécurité au travail impose des obligations d’avis et de rapport envers le ministère du Travail, le comité mixte de santé et sécurité et, le cas échéant, le syndicat — les catégories les plus graves exigeant un avis immédiat et un rapport écrit dans un délai prescrit. En cas de blessure critique ou de décès, les lieux ne doivent pas être modifiés jusqu’à leur libération, sauf pour les motifs restreints que prévoit la Loi : sauver une vie ou soulager des souffrances humaines, maintenir un service public essentiel ou un réseau de transport public, ou prévenir des dommages inutiles à de l’équipement ou à d’autres biens. C’est plus étroit que « protéger des biens » — lisez le texte tel quel avant de déplacer quoi que ce soit. Sur le plan de la vie privée, ne présumez pas l’application de la LPRPS : ses obligations en cas d’atteinte visent les dépositaires de renseignements sur la santé et leurs mandataires, et détenir des dossiers médicaux d’employés ne fait pas d’un employeur ordinaire un dépositaire. Si vous en êtes un, elles s’appliquent. Sinon, l’Ontario ne dispose d’aucune loi générale du secteur privé imposant un avis d’atteinte visant les renseignements personnels des employés — vérifiez d’abord si la LPRPDE vise ces renseignements et prenez conseil plutôt que de signaler au mauvais organisme.',
    },
    QC: {
      en: 'An employer must notify the CNESST without delay of an event causing death, serious injury or the other prescribed consequences, and must not modify the scene except to prevent further harm or to help the injured until authorised. Where personal information is involved, Law 25 obliges an assessment of the risk of serious injury and, where that risk exists, notification of the Commission d’accès à l’information and the individuals concerned. Communicate in French where French is the language of work.',
      fr: 'L’employeur doit aviser sans délai la CNESST d’un événement causant un décès, une blessure grave ou les autres conséquences prescrites, et ne doit pas modifier les lieux, sauf pour empêcher une aggravation ou secourir la personne blessée, jusqu’à autorisation. Lorsque des renseignements personnels sont en cause, la Loi 25 impose d’évaluer le risque de préjudice sérieux et, le cas échéant, d’aviser la Commission d’accès à l’information et les personnes concernées. Communiquez en français lorsque le français est la langue du travail.',
    },
    FED: {
      en: 'The Canada Labour Code, Part II and the Canada Occupational Health and Safety Regulations set the reporting duties, including immediate notification for the most serious categories and prescribed written reports, with the workplace committee or health and safety representative involved in the investigation. Where the incident is a harassment or violence occurrence, the Work Place Harassment and Violence Prevention Regulations require the parties’ identities to be protected — so an all-staff message must not let colleagues work out who was involved. PIPEDA governs a privacy breach where personal information is at real risk of significant harm.',
      fr: 'Le Code canadien du travail, Partie II et le Règlement canadien sur la santé et la sécurité au travail fixent les obligations de déclaration, dont l’avis immédiat pour les catégories les plus graves et des rapports écrits prescrits, le comité du lieu de travail ou le représentant en santé et sécurité étant associé à l’enquête. Lorsque l’incident constitue un cas de harcèlement ou de violence, le Règlement afférent exige la protection de l’identité des parties — un message à tout le personnel ne doit donc pas permettre aux collègues de déduire qui est en cause. La LPRPDE régit les atteintes à la vie privée présentant un risque réel de préjudice grave.',
    },
  },
  includes: [
    {
      en: 'What happened, in the terms that are actually known',
      fr: 'Ce qui s’est produit, dans les termes réellement connus',
    },
    {
      en: 'What is being done now',
      fr: 'Ce qui est fait maintenant',
    },
    {
      en: 'What people should do, and what has changed today',
      fr: 'Ce que chacun doit faire, et ce qui change aujourd’hui',
    },
    {
      en: 'Where support is available',
      fr: 'Où trouver du soutien',
    },
    {
      en: 'Who handles enquiries from outside',
      fr: 'Qui traite les demandes de l’extérieur',
    },
    {
      en: 'When the next update comes',
      fr: 'Quand aura lieu la prochaine mise à jour',
    },
  ],
  questions: [
    {
      id: 'what_happened',
      section: {
        en: 'The incident',
        fr: 'L’incident',
      },
      label: {
        en: 'What happened',
        fr: 'Ce qui s’est produit',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Only what is established. Where, roughly when, and what kind of event.',
        fr: 'Uniquement ce qui est établi. Où, approximativement quand, et de quel type d’événement il s’agit.',
      },
      hint: {
        en: 'Facts you would still stand behind in a week. No cause, no names, no condition of anyone involved — all three are usually wrong on day one and all three are the parts people quote back.',
        fr: 'Des faits que vous maintiendriez encore dans une semaine. Aucune cause, aucun nom, aucun état de santé — ces trois éléments sont généralement inexacts le premier jour et ce sont ceux que l’on vous citera.',
      },
    },
    {
      id: 'response',
      section: {
        en: 'The response',
        fr: 'La réponse',
      },
      label: {
        en: 'What is being done',
        fr: 'Ce qui est fait',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Who has been notified, what has been secured or suspended, who is looking into it.',
        fr: 'Qui a été avisé, ce qui a été sécurisé ou suspendu, qui procède à l’examen.',
      },
    },
    {
      id: 'what_to_do',
      section: {
        en: 'The response',
        fr: 'La réponse',
      },
      label: {
        en: 'What people should do today',
        fr: 'Ce que chacun doit faire aujourd’hui',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Areas to avoid, systems not to use, whether to come in, who to report something to.',
        fr: 'Zones à éviter, systèmes à ne pas utiliser, présence sur les lieux, à qui signaler quelque chose.',
      },
      hint: {
        en: 'The reason most people open the message. Put it high and make it specific — "please be careful" tells nobody anything.',
        fr: 'La raison pour laquelle la plupart ouvriront le message. Placez-la en évidence et soyez précis — « soyez prudents » n’informe personne.',
      },
    },
    {
      id: 'support',
      section: {
        en: 'Support',
        fr: 'Soutien',
      },
      label: {
        en: 'Support available, and who to contact',
        fr: 'Soutien offert et personne-ressource',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The assistance programme if there is one, a named person, and how to reach both.',
        fr: 'Le programme d’aide s’il en existe un, une personne nommée, et comment joindre les deux.',
      },
    },
    {
      id: 'external_contact',
      section: {
        en: 'Support',
        fr: 'Soutien',
      },
      label: {
        en: 'Who handles enquiries from outside',
        fr: 'Qui traite les demandes de l’extérieur',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'A named person authorised to speak for the organisation, and how to reach them.',
        fr: 'Une personne nommée, autorisée à parler au nom de l’organisation, et ses coordonnées.',
      },
      hint: {
        en: 'Not the support contact. Someone authorised to speak for the organisation — sending a journalist to a counsellor or an assistance provider discloses the incident to the wrong party and puts them in an impossible position.',
        fr: 'Pas la ressource de soutien. Une personne autorisée à parler au nom de l’organisation — diriger un journaliste vers un intervenant ou un fournisseur d’aide divulgue l’incident à la mauvaise partie et place cette personne dans une position intenable.',
      },
    },
    {
      id: 'next_update',
      section: {
        en: 'Support',
        fr: 'Soutien',
      },
      label: {
        en: 'When the next update will come',
        fr: 'Quand aura lieu la prochaine mise à jour',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'A time, even if the update will be "nothing further yet".',
        fr: 'Un moment précis, même si la mise à jour se résumera à « rien de nouveau ».',
      },
      hint: {
        en: 'Commit to a time and keep it. A promised update that arrives saying nothing has changed holds an organisation together; one that never arrives is where the rumours start.',
        fr: 'Engagez-vous sur un moment et respectez-le. Une mise à jour promise qui arrive en disant que rien n’a changé maintient la cohésion ; celle qui n’arrive jamais est le point de départ des rumeurs.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'An incident at {{org}}',
        fr: 'Un incident chez {{org}}',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}} · To all staff',
        fr: '{{org}} · {{today}} · À tout le personnel',
      },
    },
    {
      type: 'clause',
      n: 1,
      heading: {
        en: 'What we know',
        fr: 'Ce que nous savons',
      },
      text: {
        en: '{{what_happened}} That is what has been established so far. We are not going to speculate about the cause, and we are not naming anyone involved.',
        fr: '{{what_happened}} Voilà ce qui a été établi jusqu’à présent. Nous ne spéculerons pas sur la cause et ne nommerons aucune personne en cause.',
      },
    },
    {
      type: 'clause',
      n: 2,
      heading: {
        en: 'What you should do',
        fr: 'Ce que vous devez faire',
      },
      text: {
        en: '{{what_to_do}} If you are unsure whether something applies to you, ask before acting rather than after.',
        fr: '{{what_to_do}} Si vous ne savez pas si une consigne vous vise, demandez avant d’agir plutôt qu’après.',
      },
    },
    {
      type: 'clause',
      n: 3,
      heading: {
        en: 'What is being done',
        fr: 'Ce qui est fait',
      },
      text: {
        en: '{{response}}',
        fr: '{{response}}',
      },
    },
    {
      type: 'clause',
      n: 4,
      heading: {
        en: 'Support',
        fr: 'Soutien',
      },
      text: {
        en: '{{support}} People are affected by this differently and there is no correct amount to be affected. If you need to step away, say so to your manager — you will not be asked to explain.',
        fr: '{{support}} Chacun réagit différemment et il n’existe pas de bonne mesure d’être affecté. Si vous avez besoin de vous retirer, dites-le à votre gestionnaire — on ne vous demandera pas de vous justifier.',
      },
    },
    {
      type: 'clause',
      n: 5,
      heading: {
        en: 'If you are asked about this from outside',
        fr: 'Si l’on vous interroge de l’extérieur',
      },
      text: {
        en: 'If a journalist, a customer or anyone outside asks you about this, you do not have to answer and should not. Send them to {{external_contact}} — not to the support contact above, which is there for you rather than for enquiries. This is not about secrecy: a partial account from any of us becomes the account, and none of us has the full picture yet.',
        fr: 'Si un journaliste, un client ou toute personne de l’extérieur vous interroge à ce sujet, vous n’avez pas à répondre et ne devez pas le faire. Dirigez-la vers {{external_contact}} — et non vers la ressource de soutien ci-dessus, qui est là pour vous et non pour les demandes de renseignements. Il ne s’agit pas de secret : un récit partiel provenant de l’un d’entre nous devient le récit, et aucun de nous n’a encore le portrait complet.',
      },
    },
    {
      type: 'clause',
      n: 6,
      heading: {
        en: 'What happens next',
        fr: 'La suite',
      },
      text: {
        en: 'The next update will come {{next_update}}, and it will come even if there is nothing new to report. If you saw something, or know something that would help, tell {{org}} rather than assuming someone else has.',
        fr: 'La prochaine mise à jour aura lieu {{next_update}}, et elle sera transmise même en l’absence de nouveauté. Si vous avez vu ou savez quelque chose d’utile, signalez-le à {{org}} plutôt que de présumer que quelqu’un d’autre l’a fait.',
      },
    },
    {
      type: 'note',
      tone: 'risk',
      text: {
        en: 'Sending this is not reporting. Serious injuries, fatalities, violent incidents and privacy breaches carry notification duties to a regulator — and in some cases to a committee, a union, or the individuals affected — each with its own deadline and its own prescribed form, and none of them is satisfied by an internal message however carefully written. Where a serious injury or death has occurred, the scene may have to be left undisturbed until it is released. Check the jurisdiction notes and act on those obligations first.',
        fr: 'Envoyer ce message ne constitue pas une déclaration. Les blessures graves, les décès, les incidents violents et les atteintes à la vie privée entraînent des obligations d’avis envers un organisme de réglementation — et, dans certains cas, envers un comité, un syndicat ou les personnes touchées — chacune assortie de son délai et de sa forme prescrite, et aucune n’est satisfaite par un message interne, si soigné soit-il. En cas de blessure grave ou de décès, les lieux peuvent devoir demeurer intacts jusqu’à leur libération. Consultez les notes par juridiction et donnez suite à ces obligations en premier.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: {
        en: 'This message states what is known at the time of writing and nothing beyond it. It makes no finding about cause or responsibility, identifies no one, and is not a report to any authority.',
        fr: 'Le présent message énonce ce qui est connu au moment de sa rédaction, et rien de plus. Il ne conclut rien quant à la cause ou à la responsabilité, n’identifie personne et ne constitue pas une déclaration à une autorité.',
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
