/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 1, Legal (docs/FOUR_RING_FRAMEWORK.md). One of the eight Ring 1 tools
   the framework lists that had no template.

   Structured so findings of fact come before conclusions, and so the
   procedural record — what each party was told, and when they got to respond
   — is captured rather than assumed. Both are what a report is tested on
   when the investigation is later challenged, and both are what a report
   written as a narrative leaves out. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT31: DocTemplate = {
  id: 'tpl_t31',
  tid: 'T31',
  key: 'investigation_report',
  kind: 'report',
  category: 'discipline',
  core: true,
  name: {
    en: 'Workplace investigation report',
    fr: 'Rapport d’enquête en milieu de travail',
  },
  desc: {
    en: 'The findings of a workplace investigation — allegations, evidence, what was found on a balance of probabilities, and the process that got there.',
    fr: 'Les conclusions d’une enquête en milieu de travail : allégations, preuve, constats selon la prépondérance des probabilités et processus suivi.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'high',
  review: 'lawyer_review_recommended',
  requiresLawyerReview: true,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 20,
  usageCount: 0,
  statutory: [
    {
      en: 'Occupational health and safety — an investigation appropriate in the circumstances is required',
      fr: 'Santé et sécurité du travail — une enquête appropriée aux circonstances est exigée',
    },
    {
      en: 'Procedural fairness — the respondent knows the allegations and answers them',
      fr: 'Équité procédurale — la personne mise en cause connaît les allégations et y répond',
    },
    {
      en: 'Balance of probabilities — the standard of proof, applied to each allegation',
      fr: 'Prépondérance des probabilités — la norme de preuve, appliquée à chaque allégation',
    },
    {
      en: 'Reprisal prohibition — protects the complainant and the participants',
      fr: 'Interdiction de représailles — protège la personne plaignante et les participants',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'The Occupational Health and Safety Act requires an investigation appropriate in the circumstances into an incident or complaint of workplace harassment, and that the complainant and the respondent be informed in writing of the results and of any corrective action taken. That written outcome is a separate communication from this report.',
      fr: 'La Loi sur la santé et la sécurité au travail exige une enquête appropriée aux circonstances sur tout incident ou plainte de harcèlement au travail, et que la personne plaignante et la personne mise en cause soient informées par écrit des résultats et des mesures correctives prises. Cette communication écrite est distincte du présent rapport.',
    },
    QC: {
      en: 'The Act respecting labour standards requires an employer to have a psychological harassment prevention and complaint-handling policy and to take reasonable steps to stop harassment once known. The Charter of human rights and freedoms applies where the conduct engages a protected ground.',
      fr: 'La Loi sur les normes du travail oblige l’employeur à se doter d’une politique de prévention du harcèlement psychologique et de traitement des plaintes, et à prendre les moyens raisonnables pour faire cesser le harcèlement dès qu’il en est informé. La Charte des droits et libertés de la personne s’applique lorsque la conduite met en cause un motif protégé.',
    },
    FED: {
      en: 'The Work Place Harassment and Violence Prevention Regulations under the Canada Labour Code set the resolution process, the qualifications an investigator must meet, and the timelines. They also require the investigator’s report not to reveal, directly or indirectly, the identity of anyone involved in the occurrence or the resolution process — so the federal version of this report is written de-identified throughout, and the identifying material stays in the employer’s separate investigation file.',
      fr: 'Le Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail, pris sous le Code canadien du travail, établit le processus de règlement, les qualifications exigées de l’enquêteur et les délais. Il exige aussi que le rapport de l’enquêteur ne révèle, directement ou indirectement, l’identité d’aucune personne en cause dans l’incident ou dans le processus de règlement — la version fédérale du présent rapport est donc rédigée sans élément identificatoire, et les renseignements identificatoires demeurent au dossier d’enquête distinct de l’employeur.',
    },
  },
  includes: [
    {
      en: 'Allegations, stated separately',
      fr: 'Allégations, énoncées séparément',
    },
    {
      en: 'Process followed and who was interviewed',
      fr: 'Processus suivi et personnes rencontrées',
    },
    {
      en: 'Evidence considered',
      fr: 'Preuve examinée',
    },
    {
      en: 'Findings of fact',
      fr: 'Constats de fait',
    },
    {
      en: 'Conclusion on each allegation',
      fr: 'Conclusion sur chaque allégation',
    },
    {
      en: 'Recommendations',
      fr: 'Recommandations',
    },
  ],
  questions: [
    {
      id: 'investigator',
      section: {
        en: 'Investigation',
        fr: 'Enquête',
      },
      label: {
        en: 'Investigator',
        fr: 'Enquêteur',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Name, role, and whether internal or external.',
        fr: 'Nom, fonction, et à l’interne ou à l’externe.',
      },
      hint: {
        en: 'An investigator who reports to a party, or who was involved in the events, is the finding most easily overturned.',
        fr: 'Un enquêteur qui relève d’une partie, ou qui a participé aux événements, produit le constat le plus facilement écarté.',
      },
    },
    {
      id: 'parties',
      section: {
        en: 'Investigation',
        fr: 'Enquête',
      },
      label: {
        en: 'Parties',
        fr: 'Parties',
      },
      type: 'textarea',
      required: true,
      hint: {
        en: 'Federally regulated: use role descriptors only — “principal party”, “responding party” — and no names, here or in any later field. The Work Place Harassment and Violence Prevention Regulations require the investigator’s report not to reveal, directly or indirectly, who was involved.',
        fr: 'Compétence fédérale : n’employez que des désignations fonctionnelles — « partie principale », « partie intimée » — sans aucun nom, ici comme dans les champs suivants. Le Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail exige que le rapport de l’enquêteur ne révèle, directement ou indirectement, l’identité d’aucune personne en cause.',
      },
      placeholder: {
        en: 'Complainant and respondent, and their roles.',
        fr: 'Personne plaignante et personne mise en cause, et leurs fonctions.',
      },
    },
    {
      id: 'allegations',
      section: {
        en: 'Allegations',
        fr: 'Allégations',
      },
      label: {
        en: 'Allegations, numbered',
        fr: 'Allégations, numérotées',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'One allegation per line, each specific enough to be answered.',
        fr: 'Une allégation par ligne, chacune assez précise pour qu’on puisse y répondre.',
      },
      hint: {
        en: 'Each is decided on its own. A single bundled allegation cannot be answered or found on.',
        fr: 'Chacune est tranchée séparément. Une allégation groupée ne peut être ni réfutée ni tranchée.',
      },
    },
    {
      id: 'process',
      section: {
        en: 'Process',
        fr: 'Processus',
      },
      label: {
        en: 'Process followed',
        fr: 'Processus suivi',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Who was interviewed and when, what each party was told of the allegations, and the opportunity each had to respond.',
        fr: 'Qui a été rencontré et quand, ce qui a été communiqué à chaque partie quant aux allégations, et l’occasion donnée à chacune d’y répondre.',
      },
      hint: {
        en: 'A finding against someone who was never told what they were accused of does not survive review, however sound the reasoning.',
        fr: 'Un constat défavorable à une personne qui n’a jamais su ce qu’on lui reprochait ne résiste pas à un examen, si solide que soit le raisonnement.',
      },
    },
    {
      id: 'evidence',
      section: {
        en: 'Process',
        fr: 'Processus',
      },
      label: {
        en: 'Evidence considered',
        fr: 'Preuve examinée',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Documents, messages, records — and anything sought but not obtained.',
        fr: 'Documents, messages, registres — et tout élément recherché mais non obtenu.',
      },
    },
    {
      id: 'findings',
      section: {
        en: 'Findings',
        fr: 'Constats',
      },
      label: {
        en: 'Findings of fact',
        fr: 'Constats de fait',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'What happened. Where accounts conflict, which was preferred and why.',
        fr: 'Ce qui s’est passé. Lorsque les versions divergent, laquelle a été retenue et pourquoi.',
      },
      hint: {
        en: 'Facts here, conclusions in the next field. Merging them is what makes a report hard to defend.',
        fr: 'Les faits ici, les conclusions au champ suivant. Les confondre rend un rapport difficile à défendre.',
      },
    },
    {
      id: 'conclusions',
      section: {
        en: 'Findings',
        fr: 'Constats',
      },
      label: {
        en: 'Conclusion on each allegation',
        fr: 'Conclusion sur chaque allégation',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'For each numbered allegation: substantiated, not substantiated, or inconclusive — and on what basis.',
        fr: 'Pour chaque allégation numérotée : fondée, non fondée ou non concluante — et sur quel fondement.',
      },
    },
    {
      id: 'recommendations',
      section: {
        en: 'Findings',
        fr: 'Constats',
      },
      label: {
        en: 'Recommendations',
        fr: 'Recommandations',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'What the employer should consider. Deciding the discipline is the employer’s call, not the investigator’s.',
        fr: 'Ce que l’employeur devrait envisager. La décision disciplinaire appartient à l’employeur, non à l’enquêteur.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Workplace Investigation Report',
        fr: 'Rapport d’enquête en milieu de travail',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}} · {{jurisdiction}} · Confidential',
        fr: '{{org}} · {{today}} · {{jurisdiction}} · Confidentiel',
      },
    },
    {
      type: 'para',
      text: {
        en: 'This report sets out the findings of an investigation conducted for {{org}} by {{investigator}}. Each allegation was assessed on its own, on a balance of probabilities — whether it is more likely than not that it happened.',
        fr: 'Le présent rapport expose les conclusions d’une enquête menée pour {{org}} par {{investigator}}. Chaque allégation a été appréciée séparément, selon la prépondérance des probabilités — soit s’il est plus probable qu’improbable qu’elle se soit produite.',
      },
    },
    /* Two variants, because ClauseGate matches a jurisdiction positively and
       cannot express "not FED". ON and QC name the parties, which is normal
       and useful there; the federal variant carries the de-identification
       requirement on the face of the report instead. */
    {
      type: 'clause',
      text: {
        en: '{{parties}}',
        fr: '{{parties}}',
      },
      n: 1,
      heading: {
        en: 'Parties',
        fr: 'Parties',
      },
      when: {
        juris: 'ON',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{parties}}',
        fr: '{{parties}}',
      },
      n: 1,
      heading: {
        en: 'Parties',
        fr: 'Parties',
      },
      when: {
        juris: 'QC',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{parties}} This report is written de-identified: the parties and every other person involved are described by role, never by name, as the Work Place Harassment and Violence Prevention Regulations require of an investigator’s report. Anything that would identify someone — names, and details specific enough to point to a person — stays in {{org}}’s separate investigation file and does not appear below.',
        fr: '{{parties}} Le présent rapport est rédigé sans élément identificatoire : les parties et toute autre personne en cause sont désignées par leur rôle, jamais par leur nom, comme l’exige du rapport de l’enquêteur le Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail. Tout élément permettant d’identifier une personne — noms et détails assez précis pour la désigner — demeure au dossier d’enquête distinct de {{org}} et ne figure pas ci-dessous.',
      },
      n: 1,
      heading: {
        en: 'Parties',
        fr: 'Parties',
      },
      when: {
        juris: 'FED',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{allegations}}',
        fr: '{{allegations}}',
      },
      n: 2,
      heading: {
        en: 'Allegations',
        fr: 'Allégations',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{process}}',
        fr: '{{process}}',
      },
      n: 3,
      heading: {
        en: 'Process followed',
        fr: 'Processus suivi',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{evidence}}',
        fr: '{{evidence}}',
      },
      n: 4,
      heading: {
        en: 'Evidence considered',
        fr: 'Preuve examinée',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{findings}}',
        fr: '{{findings}}',
      },
      n: 5,
      heading: {
        en: 'Findings of fact',
        fr: 'Constats de fait',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{conclusions}}',
        fr: '{{conclusions}}',
      },
      n: 6,
      heading: {
        en: 'Conclusion on each allegation',
        fr: 'Conclusion sur chaque allégation',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{recommendations}}',
        fr: '{{recommendations}}',
      },
      n: 7,
      heading: {
        en: 'Recommendations',
        fr: 'Recommandations',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'No participant may be penalised for raising a concern, taking part in this investigation, or giving evidence in it. Reprisal is prohibited under {{statute}} and the health and safety legislation applying to this workplace, and any reprisal will be treated as a separate matter in its own right.',
        fr: 'Aucun participant ne peut être pénalisé pour avoir soulevé une préoccupation, pris part à la présente enquête ou y avoir témoigné. Les représailles sont interdites par {{statute}} et par la législation en santé et sécurité applicable à ce milieu de travail, et toute représaille sera traitée comme une affaire distincte à part entière.',
      },
      n: 8,
      heading: {
        en: 'Protection from reprisal',
        fr: 'Protection contre les représailles',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This workplace is unionized: the collective agreement governs representation during interviews and the grievance route open to either party once an outcome is communicated.',
        fr: 'Ce milieu de travail est syndiqué : la convention collective régit la représentation lors des rencontres ainsi que la voie de grief ouverte à chaque partie une fois le résultat communiqué.',
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
          en: 'Investigator',
          fr: 'Enquêteur',
        },
      ],
    },
    {
      type: 'note',
      text: {
        en: 'This report is not the communication to the parties. Both the complainant and the respondent are entitled to be told the outcome and any corrective action in writing, and that letter carries only what they are entitled to know — not this document, which contains third-party evidence and credibility assessments.',
        fr: 'Le présent rapport n’est pas la communication aux parties. La personne plaignante et la personne mise en cause ont droit d’être informées par écrit du résultat et des mesures correctives, et cette lettre ne transmet que ce qu’elles ont le droit de savoir — non le présent document, qui contient de la preuve de tiers et des appréciations de crédibilité.',
      },
      tone: 'risk',
    },
    {
      type: 'note',
      tone: 'risk',
      text: {
        en: 'Higher-risk document. Written in contemplation of a complaint, it may be producible in a proceeding — and where legal privilege is intended over an investigation, that has to be structured before the investigation starts, not claimed afterwards. Lawyer review is recommended.',
        fr: 'Document à risque élevé. Rédigé en prévision d’une plainte, il peut être communicable dans une instance — et lorsqu’un privilège juridique est recherché sur une enquête, cela doit être structuré avant son début et non invoqué après coup. Une révision juridique est recommandée.',
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
