/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 2, Pillar B (docs/FOUR_RING_FRAMEWORK.md). This is the internal
   worksheet behind a refusal, and it is deliberately hard to complete: the
   options canvassed come before the conclusion, because a conclusion with no
   record of the options is the failure this document exists to prevent. It
   is not sent to the employee — T22 is. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT24: DocTemplate = {
  id: 'tpl_t24',
  tid: 'T24',
  key: 'undue_hardship_assessment',
  kind: 'assessment',
  category: 'accommodation',
  core: false,
  name: {
    en: 'Undue hardship assessment',
    fr: 'Évaluation de la contrainte excessive',
  },
  desc: {
    en: 'The internal worksheet behind a refusal — every option canvassed, the evidence for each factor, and the conclusion that follows from them.',
    fr: 'La feuille de travail interne qui fonde un refus : chaque option envisagée, la preuve relative à chaque facteur et la conclusion qui en découle.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'high',
  review: 'lawyer_review_recommended',
  requiresLawyerReview: true,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 15,
  usageCount: 0,
  statutory: [
    {
      en: 'Human rights legislation — undue hardship is the limit of the duty, and a high one',
      fr: 'Législation sur les droits de la personne — la contrainte excessive est la limite de l’obligation, et elle est élevée',
    },
    {
      en: 'Burden of proof — the employer must prove undue hardship with evidence, not assert it',
      fr: 'Fardeau de la preuve — l’employeur doit prouver la contrainte excessive par une preuve, et non l’affirmer',
    },
    {
      en: 'Procedural duty — failing to canvass the options is itself a breach',
      fr: 'Obligation procédurale — l’omission d’envisager les options constitue en soi un manquement',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Section 11(2) of the Human Rights Code confines the analysis to cost, outside sources of funding, and health and safety requirements. Business inconvenience, employee morale, and customer or co-worker preference are not undue hardship.',
      fr: 'Le paragraphe 11(2) du Code des droits de la personne limite l’analyse au coût, aux sources externes de financement et aux exigences de santé et de sécurité. Les inconvénients d’affaires, le moral du personnel et les préférences de la clientèle ou des collègues ne constituent pas une contrainte excessive.',
    },
    QC: {
      en: 'The Charter of human rights and freedoms names no list of factors, so the assessment is global and contextual — the whole of the circumstances, cumulatively, rather than any single factor read alone. That set is wider than Ontario’s: disruption to operations or to other employees can be weighed here where the Ontario Code excludes it. Wider does not mean easier — each factor still has to be evidenced, not asserted.',
      fr: 'La Charte des droits et libertés de la personne n’énumère aucun facteur : l’évaluation est donc globale et contextuelle — l’ensemble des circonstances, de façon cumulative, plutôt qu’un facteur pris isolément. Cet ensemble est plus large qu’en Ontario : la perturbation des activités ou de l’équipe peut y être prise en compte, là où le Code ontarien l’exclut. Plus large ne veut pas dire plus permissif — chaque facteur doit toujours être prouvé, et non affirmé.',
    },
    FED: {
      en: 'The Canadian Human Rights Act names health, safety and cost as the factors — a named list, like Ontario’s and unlike Québec’s. Document the evidence supporting each one that you rely on; an unquantified cost figure carries little weight.',
      fr: 'La Loi canadienne sur les droits de la personne nomme la santé, la sécurité et le coût comme facteurs — une liste énumérée, comme en Ontario et contrairement au Québec. Documentez la preuve appuyant chacun des facteurs invoqués ; un montant non chiffré a peu de poids.',
    },
  },
  includes: [
    {
      en: 'The limitation and what was requested',
      fr: 'La limitation et la demande présentée',
    },
    {
      en: 'Every option canvassed',
      fr: 'Chaque option envisagée',
    },
    {
      en: 'The test that applies in your jurisdiction',
      fr: 'Le test applicable dans votre juridiction',
    },
    {
      en: 'Cost, with the evidence behind it',
      fr: 'Coût, avec la preuve à l’appui',
    },
    {
      en: 'Outside sources of funding checked',
      fr: 'Sources externes de financement vérifiées',
    },
    {
      en: 'Health and safety analysis',
      fr: 'Analyse de santé et sécurité',
    },
    {
      en: 'Any other circumstances relied on',
      fr: 'Toute autre circonstance invoquée',
    },
    {
      en: 'Conclusion and who approved it',
      fr: 'Conclusion et personne l’ayant approuvée',
    },
  ],
  questions: [
    {
      id: 'employee_name',
      section: {
        en: 'File',
        fr: 'Dossier',
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
      id: 'request_summary',
      section: {
        en: 'File',
        fr: 'Dossier',
      },
      label: {
        en: 'Limitation and what was requested',
        fr: 'Limitation et demande présentée',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The functional limitations, and the adjustment sought.',
        fr: 'Les limitations fonctionnelles et l’ajustement demandé.',
      },
    },
    {
      id: 'options_considered',
      section: {
        en: 'Options',
        fr: 'Options',
      },
      label: {
        en: 'Every option canvassed, and why each was set aside',
        fr: 'Chaque option envisagée et le motif de son rejet',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Modified duties, schedule, equipment, location, redeployment, leave — each with the reason it does not work.',
        fr: 'Tâches modifiées, horaire, équipement, lieu, réaffectation, congé — chacune avec le motif pour lequel elle ne convient pas.',
      },
      hint: {
        en: 'Fill this in before the conclusion. A refusal with no record of the options canvassed fails on the process alone, whatever the answer would have been.',
        fr: 'Remplissez cette section avant la conclusion. Un refus sans trace des options envisagées échoue sur le seul plan du processus, quelle qu’eût été la réponse.',
      },
    },
    {
      id: 'cost_evidence',
      section: {
        en: 'Factors',
        fr: 'Facteurs',
      },
      label: {
        en: 'Cost — and the evidence for it',
        fr: 'Coût — et la preuve à l’appui',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Quantified cost, how it was calculated, and its size against the whole operation.',
        fr: 'Coût chiffré, méthode de calcul et importance par rapport à l’ensemble des activités.',
      },
      hint: {
        en: 'Cost is measured against the organization as a whole, not the department’s budget line.',
        fr: 'Le coût s’apprécie par rapport à l’organisation dans son ensemble, et non au poste budgétaire du service.',
      },
    },
    {
      id: 'funding_checked',
      section: {
        en: 'Factors',
        fr: 'Facteurs',
      },
      label: {
        en: 'Outside sources of funding checked',
        fr: 'Sources externes de financement vérifiées',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Programs, grants, insurers or tax measures checked, and the result of each.',
        fr: 'Programmes, subventions, assureurs ou mesures fiscales vérifiés, et le résultat de chacun.',
      },
      hint: {
        en: 'Not having looked is not the same as there being nothing available, and only one of those helps you.',
        fr: 'Ne pas avoir cherché n’équivaut pas à l’absence de ressources disponibles, et une seule de ces deux situations vous est utile.',
      },
    },
    {
      id: 'health_safety',
      section: {
        en: 'Factors',
        fr: 'Facteurs',
      },
      label: {
        en: 'Health and safety analysis',
        fr: 'Analyse de santé et sécurité',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The risk, who bears it, its seriousness and likelihood, and whether it can be reduced.',
        fr: 'Le risque, qui l’assume, sa gravité et sa probabilité, et la possibilité de le réduire.',
      },
      hint: {
        en: 'A risk the employee alone chooses to take carries different weight than one falling on others.',
        fr: 'Un risque que l’employé(e) choisit d’assumer seul(e) n’a pas le même poids qu’un risque qui retombe sur autrui.',
      },
    },
    {
      id: 'other_factors',
      section: {
        en: 'Factors',
        fr: 'Facteurs',
      },
      label: {
        en: 'Anything else you are relying on',
        fr: 'Tout autre élément invoqué',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Other circumstances you say make this unworkable — and the evidence for each.',
        fr: 'Autres circonstances qui rendraient la situation irréalisable — et la preuve de chacune.',
      },
      hint: {
        en: 'In Ontario and federally the analysis is confined to the factors above, so "nothing further" is usually the right answer — and recording that you had nothing further is itself worth having. In Québec the assessment is global, and operational disruption or the effect on the team belongs here, evidenced like everything else.',
        fr: 'En Ontario et au fédéral, l’analyse se limite aux facteurs ci-dessus : « rien de plus » est donc habituellement la bonne réponse — et consigner que vous n’aviez rien d’autre a sa valeur. Au Québec, l’évaluation est globale, et la perturbation des activités ou l’effet sur l’équipe trouvent leur place ici, avec preuve à l’appui comme le reste.',
      },
    },
    {
      id: 'conclusion',
      section: {
        en: 'Conclusion',
        fr: 'Conclusion',
      },
      label: {
        en: 'Conclusion',
        fr: 'Conclusion',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'What follows from the factors above — and what is being offered instead, if anything.',
        fr: 'Ce qui découle des facteurs ci-dessus — et ce qui est offert à la place, le cas échéant.',
      },
    },
    {
      id: 'approved_by',
      section: {
        en: 'Conclusion',
        fr: 'Conclusion',
      },
      label: {
        en: 'Approved by',
        fr: 'Approuvé par',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Name and role',
        fr: 'Nom et fonction',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Undue Hardship Assessment',
        fr: 'Évaluation de la contrainte excessive',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{employee_name}} · {{today}} · Internal — not for release to the employee',
        fr: '{{org}} · {{employee_name}} · {{today}} · Interne — non destiné à être remis à l’employé(e)',
      },
    },
    {
      type: 'para',
      text: {
        en: 'This worksheet records how {{org}} assessed whether accommodating {{employee_name}} reaches undue hardship under {{jurisdiction}} law. Undue hardship is the outer limit of the duty to accommodate and the threshold is high: the employer must prove it on evidence. The written answer to the employee is a separate document.',
        fr: 'La présente feuille de travail consigne la manière dont {{org}} a évalué si l’accommodement de {{employee_name}} atteint la contrainte excessive en droit applicable en {{jurisdiction}}. La contrainte excessive constitue la limite ultime de l’obligation d’accommodement et le seuil en est élevé : il revient à l’employeur de la prouver par une preuve. La réponse écrite à l’employé(e) fait l’objet d’un document distinct.',
      },
    },
    /* The applicable test, carried in the rendered blocks rather than left to
       `jurisdictionNotes` — those show on the template detail screen only, so a
       generated or exported worksheet would not contain the standard it is
       measured against. One gated variant per jurisdiction; unnumbered, like
       the collective-agreement clause, so the numbering below is stable
       whichever one resolves. */
    {
      type: 'clause',
      text: {
        en: 'In Ontario the Human Rights Code confines this analysis to three things: cost, outside sources of funding, and health and safety requirements. Nothing else counts — not business inconvenience, not employee morale, not customer or co-worker preference.',
        fr: 'En Ontario, le Code des droits de la personne limite l’analyse à trois éléments : le coût, les sources externes de financement et les exigences de santé et de sécurité. Rien d’autre ne compte — ni les inconvénients d’affaires, ni le moral du personnel, ni les préférences de la clientèle ou des collègues.',
      },
      heading: {
        en: 'The test that applies here',
        fr: 'Le test applicable',
      },
      when: {
        juris: 'ON',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'In Québec the Charter of human rights and freedoms names no list, so the assessment is global: the whole of the circumstances, weighed cumulatively. That set is wider than Ontario’s — operational disruption and the effect on other employees can count here — but wider is not easier. Every factor still has to be evidenced, and customer or co-worker preference is the discrimination rather than a defence to it.',
        fr: 'Au Québec, la Charte des droits et libertés de la personne n’énumère aucun facteur : l’évaluation est donc globale, soit l’ensemble des circonstances appréciées cumulativement. Cet ensemble est plus large qu’en Ontario — la perturbation des activités et l’effet sur les autres employés peuvent y compter — mais plus large ne veut pas dire plus permissif. Chaque facteur doit être prouvé, et la préférence de la clientèle ou des collègues constitue la discrimination elle-même, non un moyen de défense.',
      },
      heading: {
        en: 'The test that applies here',
        fr: 'Le test applicable',
      },
      when: {
        juris: 'QC',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Federally the Canadian Human Rights Act names health, safety and cost — a listed set, like Ontario’s and unlike Québec’s. Business inconvenience and customer or co-worker preference are not among them.',
        fr: 'Au fédéral, la Loi canadienne sur les droits de la personne nomme la santé, la sécurité et le coût — une liste énumérée, comme en Ontario et contrairement au Québec. Les inconvénients d’affaires et les préférences de la clientèle ou des collègues n’en font pas partie.',
      },
      heading: {
        en: 'The test that applies here',
        fr: 'Le test applicable',
      },
      when: {
        juris: 'FED',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{request_summary}}',
        fr: '{{request_summary}}',
      },
      n: 1,
      heading: {
        en: 'The limitation and the request',
        fr: 'La limitation et la demande',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{options_considered}}',
        fr: '{{options_considered}}',
      },
      n: 2,
      heading: {
        en: 'Options canvassed',
        fr: 'Options envisagées',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{cost_evidence}}',
        fr: '{{cost_evidence}}',
      },
      n: 3,
      heading: {
        en: 'Cost',
        fr: 'Coût',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{funding_checked}}',
        fr: '{{funding_checked}}',
      },
      n: 4,
      heading: {
        en: 'Outside sources of funding',
        fr: 'Sources externes de financement',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{health_safety}}',
        fr: '{{health_safety}}',
      },
      n: 5,
      heading: {
        en: 'Health and safety',
        fr: 'Santé et sécurité',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{other_factors}}',
        fr: '{{other_factors}}',
      },
      n: 6,
      heading: {
        en: 'Other circumstances relied on',
        fr: 'Autres circonstances invoquées',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{conclusion}} Approved by {{approved_by}} on {{today}}.',
        fr: '{{conclusion}} Approuvé par {{approved_by}} le {{today}}.',
      },
      n: 7,
      heading: {
        en: 'Conclusion',
        fr: 'Conclusion',
      },
    },
    {
      type: 'note',
      text: {
        en: 'Measure the conclusion against the test set out at the top of this worksheet, not against a general sense of how difficult this would be. Business inconvenience carries a refusal nowhere, and neither does customer or co-worker preference — a preference rooted in a protected ground is the discrimination, not a defence to it.',
        fr: 'Confrontez la conclusion au test énoncé en tête de la présente feuille de travail, et non à une impression générale de difficulté. Les inconvénients d’affaires ne soutiennent un refus dans aucune juridiction, pas plus que les préférences de la clientèle ou des collègues — une préférence fondée sur un motif protégé constitue la discrimination elle-même, et non un moyen de défense.',
      },
      tone: 'risk',
    },
    {
      type: 'clause',
      text: {
        en: 'The union shares the duty to accommodate and was involved as the collective agreement requires. A term of the agreement does not by itself establish undue hardship.',
        fr: 'Le syndicat partage l’obligation d’accommodement et a été impliqué conformément à la convention collective. Une clause de la convention n’établit pas à elle seule la contrainte excessive.',
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
          en: 'Prepared by',
          fr: 'Préparé par',
        },
        {
          en: 'Approved by',
          fr: 'Approuvé par',
        },
      ],
    },
    {
      type: 'note',
      tone: 'risk',
      text: {
        en: 'Higher-risk document. This is the record an employer is asked to produce when a refusal is challenged — lawyer review is recommended before relying on it.',
        fr: 'Document à risque élevé. Il s’agit du dossier qu’un employeur doit produire lorsqu’un refus est contesté — une révision juridique est recommandée avant de s’y fier.',
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
