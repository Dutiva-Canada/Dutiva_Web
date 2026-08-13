/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 3, Crisis communications (docs/FOUR_RING_FRAMEWORK.md).

   The notice a participant receives before an interview. T31 is the report
   at the end; this is the letter at the start, and they are different
   documents with different audiences — the report is written for the
   employer's file, this is written for someone who is worried and has to
   decide whether to bring a representative.

   Two things are load-bearing.

   **The respondent has to be told enough to answer.** A notice that says
   "concerns have been raised about your conduct" and nothing more is the
   most common defect in workplace investigations, and it is the one that
   costs an employer the finding: a person who was never told the allegation
   in enough detail to respond to it did not get a fair process, and the
   investigation that follows is worth less than the time it took.

   **The confidentiality request has limits, and they are stated.** An
   employer may ask participants not to discuss an active investigation. It
   may not, and this document does not, prevent anyone from getting legal
   advice, speaking to a union representative, contacting the ministry or
   regulator, or filing a complaint elsewhere. A confidentiality clause that
   reads as barring those is both unenforceable and evidence of an employer
   trying to contain something. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT41: DocTemplate = {
  id: 'tpl_t41',
  tid: 'T41',
  key: 'investigation_notice',
  kind: 'notice',
  category: 'communications',
  core: false,
  name: {
    en: 'Investigation notice to a participant',
    fr: 'Avis d’enquête à une personne participante',
  },
  desc: {
    en: 'Tells a respondent or a witness what is happening, what is being asked of them, and what protections apply — before the interview, not after.',
    fr: 'Informe la personne mise en cause ou le témoin de ce qui se passe, de ce qu’on attend d’elle et des protections applicables — avant l’entretien, non après.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'high',
  review: 'lawyer_review_recommended',
  requiresLawyerReview: true,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 6,
  usageCount: 0,
  statutory: [
    {
      en: 'Procedural fairness — a respondent must know the allegation well enough to answer it',
      fr: 'Équité procédurale — la personne mise en cause doit connaître l’allégation suffisamment pour y répondre',
    },
    {
      en: 'Reprisal prohibition — raising a protected complaint, and taking part, is protected',
      fr: 'Interdiction de représailles — porter une plainte protégée et y participer est protégé',
    },
    {
      en: 'Confidentiality cannot bar advice, a union representative, or a regulator',
      fr: 'La confidentialité ne peut faire obstacle à un avis, à un représentant syndical ou à un organisme de réglementation',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'The Occupational Health and Safety Act requires an investigation appropriate in the circumstances where workplace harassment is alleged, and requires that the complainant and, where they are a worker, the respondent be informed in writing of the results and of any corrective action. The Human Rights Code carries its own reprisal protection. Note that the results obligation runs to those parties and not to the workplace at large.',
      fr: 'La Loi sur la santé et la sécurité au travail exige une enquête appropriée aux circonstances lorsque du harcèlement au travail est allégué, et exige que la personne plaignante et, si elle est un travailleur, la personne mise en cause soient informées par écrit des résultats et de toute mesure corrective. Le Code des droits de la personne comporte sa propre protection contre les représailles. Notez que l’obligation d’informer vise ces parties et non l’ensemble du milieu de travail.',
    },
    QC: {
      en: 'The Act respecting labour standards obliges an employer to take reasonable steps to prevent psychological harassment — which includes sexual harassment — and to stop it when it is brought to their attention, and it protects an employee from dismissal or sanction for having made a complaint. The Charter of human rights and freedoms applies where a prohibited ground is engaged. Conduct the process in French where French is the language of work, including this notice.',
      fr: 'La Loi sur les normes du travail oblige l’employeur à prendre les moyens raisonnables pour prévenir le harcèlement psychologique — lequel comprend le harcèlement sexuel — et à le faire cesser lorsqu’il en est informé, et elle protège la personne salariée contre le congédiement ou toute sanction consécutifs à une plainte. La Charte des droits et libertés de la personne s’applique lorsqu’un motif interdit est en cause. Menez le processus en français lorsque le français est la langue du travail, y compris le présent avis.',
    },
    FED: {
      en: 'These Regulations apply only where the matter is a harassment or violence occurrence. An ordinary misconduct investigation at a federally regulated employer is not governed by them, and importing their language into one is a mistake. Where they do apply the resolution process is prescribed: notice of an occurrence, then negotiated resolution, with conciliation available only if both parties agree to it, and an investigation the principal party can require — it does not wait for the other routes to fail and can run while negotiated resolution continues. Two consequences for this notice: the person alleged to have committed the occurrence is the "responding party" in that scheme, and the investigator’s report must not reveal the identity of the parties or of witnesses.',
      fr: 'Ce règlement ne s’applique que lorsque l’affaire constitue un incident de harcèlement ou de violence. Une enquête ordinaire pour inconduite chez un employeur de compétence fédérale n’en relève pas, et y transposer son vocabulaire est une erreur. Lorsqu’il s’applique, le processus de règlement est prescrit : avis d’un incident, puis résolution négociée, la conciliation n’étant possible que si les deux parties y consentent, et une enquête que la partie principale peut exiger — elle n’attend pas l’échec des autres voies et peut se dérouler pendant que la résolution négociée se poursuit. Deux conséquences pour le présent avis : la personne à qui l’on impute l’incident est la « partie intimée » au sens de ce régime, et le rapport de l’enquêteur ne doit pas révéler l’identité des parties ni des témoins.',
    },
  },
  includes: [
    {
      en: 'What is being looked into, in enough detail to respond',
      fr: 'Ce qui fait l’objet de l’examen, avec assez de détails pour y répondre',
    },
    {
      en: 'The role this person has in it',
      fr: 'Le rôle de la personne dans le processus',
    },
    {
      en: 'Who is conducting it and when the interview is',
      fr: 'Qui la mène et quand a lieu l’entretien',
    },
    {
      en: 'Who you may bring with you',
      fr: 'Qui vous pouvez amener avec vous',
    },
    {
      en: 'Reprisal protection, and the limits of confidentiality',
      fr: 'La protection contre les représailles et les limites de la confidentialité',
    },
  ],
  questions: [
    {
      id: 'participant_name',
      section: {
        en: 'The participant',
        fr: 'La personne participante',
      },
      label: {
        en: 'Full name',
        fr: 'Nom complet',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'role',
      section: {
        en: 'The participant',
        fr: 'La personne participante',
      },
      label: {
        en: 'Their role in this process',
        fr: 'Son rôle dans le processus',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: 'respondent',
          label: {
            en: 'The person the allegations are about',
            fr: 'La personne visée par les allégations',
          },
        },
        {
          value: 'witness',
          label: {
            en: 'A witness',
            fr: 'Un témoin',
          },
        },
        {
          value: 'complainant',
          label: {
            en: 'The person who raised the concern',
            fr: 'La personne qui a soulevé la préoccupation',
          },
        },
      ],
      hint: {
        en: 'This changes how much detail belongs in the notice. A respondent needs the allegations; a witness needs the subject matter and nothing more about anyone else.',
        fr: 'Cela détermine le niveau de détail à inclure. La personne mise en cause a besoin des allégations ; un témoin a besoin de l’objet et de rien de plus sur autrui.',
      },
    },
    {
      id: 'subject_matter',
      section: {
        en: 'The matter',
        fr: 'L’objet',
      },
      label: {
        en: 'What is being looked into',
        fr: 'Ce qui fait l’objet de l’examen',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'For a respondent: the conduct alleged, when, and where. For a witness: the subject and the period.',
        fr: 'Pour la personne mise en cause : la conduite alléguée, quand et où. Pour un témoin : l’objet et la période.',
      },
      hint: {
        en: 'For a respondent this must be specific enough to answer. "Concerns about your conduct" is the defect that most often costs an employer the finding — if the person cannot tell what they are being asked to respond to, they were not given a chance to respond.',
        fr: 'Pour la personne mise en cause, la description doit être assez précise pour permettre une réponse. « Des préoccupations concernant votre comportement » est le vice qui coûte le plus souvent sa conclusion à l’employeur — si la personne ne peut savoir à quoi on lui demande de répondre, elle n’a pas eu l’occasion de le faire.',
      },
    },
    {
      id: 'investigator',
      section: {
        en: 'The process',
        fr: 'Le processus',
      },
      label: {
        en: 'Who is conducting it',
        fr: 'Qui la mène',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Name and role, internal or external.',
        fr: 'Nom et fonction, à l’interne ou à l’externe.',
      },
    },
    {
      id: 'meeting_when',
      section: {
        en: 'The process',
        fr: 'Le processus',
      },
      label: {
        en: 'Interview date and time',
        fr: 'Date et heure de l’entretien',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Date, time and location or link.',
        fr: 'Date, heure et lieu ou lien.',
      },
      hint: {
        en: 'Leave enough time between this notice and the interview for the person to read it, take advice, and arrange to be accompanied. An interview scheduled for the same afternoon is not a process anyone will call fair.',
        fr: 'Prévoyez entre le présent avis et l’entretien un délai suffisant pour lire, prendre conseil et organiser un accompagnement. Un entretien fixé le même après-midi ne sera jugé équitable par personne.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Notice of a workplace investigation',
        fr: 'Avis d’enquête en milieu de travail',
      },
    },
    {
      type: 'meta',
      text: {
        en: 'Private and confidential · {{participant_name}} · {{org}} · {{today}}',
        fr: 'Confidentiel · {{participant_name}} · {{org}} · {{today}}',
      },
    },
    {
      type: 'clause',
      n: 1,
      heading: {
        en: 'Why you are receiving this',
        fr: 'Pourquoi vous recevez cet avis',
      },
      text: {
        en: 'A concern has been raised that we are required to look into. Your role in it is this: {{role}}. We are writing before speaking to you so that you know what this is about in advance rather than being asked about it without warning.',
        fr: 'Une préoccupation a été soulevée sur laquelle nous devons faire enquête. Votre rôle est le suivant : {{role}}. Nous vous écrivons avant de vous rencontrer afin que vous sachiez à l’avance de quoi il s’agit plutôt que d’être interrogé(e) sans préavis.',
      },
    },
    {
      type: 'clause',
      n: 2,
      heading: {
        en: 'What is being looked into',
        fr: 'Ce qui fait l’objet de l’examen',
      },
      text: {
        en: '{{subject_matter}}',
        fr: '{{subject_matter}}',
      },
    },
    {
      type: 'clause',
      n: 3,
      heading: {
        en: 'Nothing has been decided',
        fr: 'Rien n’est décidé',
      },
      text: {
        en: 'This is an investigation and not a conclusion. No finding has been made, no decision about anyone has been taken, and the purpose of speaking to you is to understand what happened. If you are the person the allegations concern, you will have the chance to respond to them fully before any finding is made.',
        fr: 'Il s’agit d’une enquête et non d’une conclusion. Aucune constatation n’a été faite, aucune décision n’a été prise à l’égard de quiconque, et l’entretien vise à comprendre ce qui s’est passé. Si vous êtes la personne visée par les allégations, vous aurez l’occasion d’y répondre pleinement avant toute constatation.',
      },
    },
    {
      type: 'clause',
      n: 4,
      heading: {
        en: 'Who is conducting it, and when',
        fr: 'Qui la mène, et quand',
      },
      text: {
        en: 'The investigation is being conducted by {{investigator}}. Your interview is scheduled for {{meeting_when}}. If that time does not work, or you need more time to prepare, tell us and we will move it.',
        fr: 'L’enquête est menée par {{investigator}}. Votre entretien est prévu le {{meeting_when}}. Si ce moment ne convient pas ou s’il vous faut plus de temps pour vous préparer, dites-le-nous et nous le déplacerons.',
      },
    },
    {
      type: 'clause',
      n: 5,
      heading: {
        en: 'You may bring someone with you',
        fr: 'Vous pouvez être accompagné(e)',
      },
      text: {
        en: 'You may bring someone with you to the interview — that is how we run this process, whatever your jurisdiction does or does not require. If you are represented by a union you may bring your representative, and where your collective agreement gives you a right to representation, that right applies here. You are free to take independent legal advice at any point, at your own expense, and nothing in this notice prevents that or requires you to tell us that you have.',
        fr: 'Vous pouvez être accompagné(e) à l’entretien — c’est ainsi que nous menons ce processus, indépendamment de ce que votre juridiction exige ou non. Si vous êtes représenté(e) par un syndicat, vous pouvez venir avec votre représentant(e), et lorsque votre convention collective vous confère un droit à la représentation, ce droit s’applique ici. Vous êtes libre de consulter un conseiller juridique indépendant à tout moment, à vos frais, et rien dans le présent avis ne l’empêche ni ne vous oblige à nous en informer.',
      },
    },
    {
      type: 'clause',
      n: 6,
      heading: {
        en: 'You will not be penalised',
        fr: 'Vous ne subirez aucune sanction',
      },
      text: {
        en: 'Nobody is penalised for raising a concern in good faith, for taking part in this investigation, or for answering honestly in it. That protection is {{org}}’s commitment, and it applies here whatever the law adds. Statutory reprisal protection exists too, but it is activity-specific rather than general: which statute protects you depends on what is being looked into — human rights, health and safety, or employment standards each protect their own complaints and participation, and some internal matters attract none of them. {{investigator}} can tell you which applies here. Any reprisal will be treated as a matter in its own right. If you experience something you think is reprisal, report it, including where it comes from someone senior to you. What this does not do is put anyone beyond the reach of the process itself: it is not immunity for the conduct under investigation, and it does not cover knowingly false statements.',
        fr: 'Nul ne subit de sanction pour avoir soulevé de bonne foi une préoccupation, participé à la présente enquête ou répondu honnêtement dans ce cadre. Cette protection est un engagement de {{org}} et elle s’applique ici, quoi qu’ajoute la loi. Une protection légale contre les représailles existe aussi, mais elle est propre à l’activité en cause plutôt que générale : la loi qui vous protège dépend de l’objet de l’examen — droits de la personne, santé et sécurité ou normes du travail protègent chacune leurs propres plaintes et participations, et certaines affaires internes n’en relèvent d’aucune. {{investigator}} peut vous indiquer laquelle s’applique ici. Toute représaille sera traitée comme une affaire distincte. Si vous estimez subir des représailles, signalez-le, y compris si elles proviennent d’une personne ayant autorité sur vous. En revanche, cela ne met personne à l’abri du processus lui-même : il ne s’agit pas d’une immunité pour la conduite faisant l’objet de l’enquête, et cela ne couvre pas les déclarations sciemment fausses.',
      },
    },
    {
      type: 'clause',
      n: 7,
      heading: {
        en: 'Confidentiality, and what it does not cover',
        fr: 'La confidentialité, et ce qu’elle ne couvre pas',
      },
      text: {
        en: 'We ask you not to discuss this investigation with colleagues while it is running, because that is how evidence gets shaped and how people get identified who should not be. That request has limits, and they matter: nothing here prevents you from seeking legal advice, speaking to your union representative, contacting the ministry or regulator with jurisdiction, filing a complaint with a human rights body or a court, or speaking to a doctor, a counsellor or your family. We are asking for discretion among colleagues, not silence.',
        fr: 'Nous vous demandons de ne pas discuter de la présente enquête avec vos collègues pendant son déroulement, car c’est ainsi que les témoignages s’influencent et que des personnes sont identifiées alors qu’elles ne devraient pas l’être. Cette demande a des limites, et elles comptent : rien ici ne vous empêche de consulter un conseiller juridique, de parler à votre représentant(e) syndical(e), de communiquer avec le ministère ou l’organisme compétent, de déposer une plainte auprès d’un organisme des droits de la personne ou d’un tribunal, ni de parler à un médecin, à un intervenant ou à vos proches. Nous demandons de la discrétion entre collègues, non le silence.',
      },
    },
    {
      type: 'clause',
      n: 8,
      when: {
        juris: 'FED',
      },
      heading: {
        en: 'If this is a harassment or violence matter',
        fr: 'S’il s’agit de harcèlement ou de violence',
      },
      text: {
        en: 'This workplace is federally regulated. If what is being looked into is harassment or violence, the Work Place Harassment and Violence Prevention Regulations govern how it is resolved and set the timelines: a negotiated resolution is attempted, conciliation is available if both parties agree to it, and an investigation may be required by the principal party rather than waiting for those routes to fail. Under those Regulations the investigator’s report does not identify the parties or the witnesses. If this is a different kind of matter those Regulations do not apply to it, and {{investigator}} will tell you which process does.',
        fr: 'Le présent milieu de travail est de compétence fédérale. S’il s’agit de harcèlement ou de violence, le Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail régit le règlement du dossier et en fixe les délais : une résolution négociée est tentée, la conciliation est possible si les deux parties y consentent, et une enquête peut être exigée par la partie principale plutôt que d’attendre l’échec de ces voies. En vertu de ce règlement, le rapport de l’enquêteur n’identifie ni les parties ni les témoins. S’il s’agit d’une autre question, ce règlement ne s’y applique pas et {{investigator}} vous indiquera le processus applicable.',
      },
    },
    {
      type: 'clause',
      n: 9,
      heading: {
        en: 'What happens after',
        fr: 'Ce qui suit',
      },
      text: {
        en: 'Once the investigation is finished, the people entitled to be told the outcome will be told it. That is not everyone who took part: a witness is generally told the process has concluded and no more, because the details are not theirs. If you want to know what will be shared with you specifically, ask {{investigator}} and you will get a straight answer.',
        fr: 'Une fois l’enquête terminée, les personnes qui ont droit d’en connaître l’issue en seront informées. Cela ne vise pas tous les participants : un témoin est généralement informé que le processus est clos, sans plus, les détails ne le concernant pas. Si vous souhaitez savoir ce qui vous sera communiqué précisément, demandez-le à {{investigator}} et vous obtiendrez une réponse claire.',
      },
    },
    {
      type: 'note',
      tone: 'risk',
      text: {
        en: 'This notice is procedural. It makes no finding, states no conclusion, and is not a disciplinary step — it must not be placed on anyone’s file as one. Workplace investigations carry real legal exposure and the process differs by jurisdiction and by what is alleged; take advice on the process before starting, not after.',
        fr: 'Le présent avis est de nature procédurale. Il ne comporte aucune constatation ni conclusion et ne constitue pas une mesure disciplinaire — il ne doit être versé au dossier de personne à ce titre. Les enquêtes en milieu de travail comportent un risque juridique réel et le processus varie selon la juridiction et la nature des allégations ; prenez conseil sur le processus avant de l’amorcer, et non après.',
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
