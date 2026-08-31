import { bi } from '@/i18n/core'
import type { DocMeta, DocumentTemplate } from './types'

/**
 * Document templates (bodies + Document Studio metadata), transcribed from
 * the prototype's `buildDocBodies()` and `docMetaFor()`. Template keys are
 * the prototype's EN titles and are referenced by chats, employee files and
 * followup replies.
 */

const catOffboarding = bi('Offboarding', 'Départ')
const catHiring = bi('Hiring', 'Embauche')
const catPolicy = bi('Policy', 'Politique')
const catPerformance = bi('Performance', 'Rendement')
const catAccommodation = bi('Accommodation', 'Accommodement')

/** Base Document Studio metadata (prototype `docMetaFor()` defaults). */
export const docMetaDefaults: DocMeta = {
  link: bi('Not linked to a case', 'Non lié à un dossier'),
  jur: bi('Confirm jurisdiction before use', 'Confirmer la compétence avant utilisation'),
  governing: bi('—', '—'),
  template: 'v2.3 · 2026-05',
  created: bi('Jul 8, 2026', '8 juill. 2026'),
  createdBy: bi('Advisor draft for Riley Summers', 'Ébauche du Conseiller pour Riley Summers'),
  reviewedBy: bi('Not yet reviewed', 'Pas encore révisé'),
  legalReview: bi('Optional', 'Facultative'),
  retention: bi(
    'Follow the document retention schedule',
    'Suivre le calendrier de conservation des documents',
  ),
  assumptions: bi(
    'Assumes standard full-time employment in the selected jurisdiction.',
    'Suppose un emploi standard à temps plein dans la compétence sélectionnée.',
  ),
  missing: bi(
    'Confirm names, dates, and jurisdiction-specific details before use.',
    'Confirmez les noms, les dates et les détails propres à la compétence avant utilisation.',
  ),
}

export const documentTemplates: DocumentTemplate[] = [
  {
    key: 'Termination Letter',
    title: bi('Termination Letter', 'Lettre de licenciement'),
    category: catOffboarding,
    highRisk: true,
    sections: [
      bi('Private & Confidential\n\nDate: July 5, 2026', 'Confidentiel\n\nDate : 5 juillet 2026'),
      bi(
        'Dear Jordan,\n\nThis letter confirms that your employment with Northgate Logistics Inc. will end effective July 19, 2026, as a result of a restructuring of the Operations team. This decision is not a reflection of your performance or conduct.',
        "Cher Jordan,\n\nLa présente confirme que votre emploi chez Northgate Logistics Inc. prendra fin le 19 juillet 2026, à la suite d'une restructuration de l'équipe des opérations. Cette décision ne reflète en rien votre rendement ni votre conduite.",
      ),
      bi(
        "In recognition of your service, you will receive the following in lieu of working notice: 9 months' base salary, continuation of benefits through the notice period, and a pro-rated payment of any earned incentive. A full calculation is attached separately.",
        'En reconnaissance de vos services, vous recevrez ce qui suit en tenant lieu de préavis travaillé : 9 mois de salaire de base, le maintien des avantages sociaux pendant la période de préavis et le paiement au prorata de toute prime acquise. Un calcul complet est joint séparément.',
      ),
      bi(
        'Please note: because your employment agreement contains no termination clause, this estimate is based on common law reasonable notice rather than ESA minimums alone. Advisor has flagged this case for legal review — treat the amount above as a starting point, not a final offer.',
        'Veuillez noter : comme votre contrat de travail ne comporte aucune clause de licenciement, cette estimation repose sur le préavis raisonnable de common law plutôt que sur les seuls minimums de la LNE. Le Conseiller a signalé ce dossier pour examen juridique — considérez le montant ci-dessus comme un point de départ, non une offre finale.',
      ),
      bi(
        'We are prepared to discuss these terms with you or a representative of your choosing. Northgate is grateful for your eight years of contribution and will provide a reference upon request.\n\nSincerely,\nRiley Summers\nHR Lead',
        'Nous sommes disposés à discuter de ces modalités avec vous ou un représentant de votre choix. Northgate vous est reconnaissante de vos huit années de contribution et fournira une référence sur demande.\n\nCordialement,\nRiley Summers\nResponsable RH',
      ),
    ],
    meta: {
      link: bi('Jordan Mensah · Termination case', 'Jordan Mensah · Dossier de licenciement'),
      jur: bi('Ontario · ESA, 2000', 'Ontario · LNE, 2000'),
      governing: bi(
        '2019 employment agreement — no termination clause',
        'Contrat d’emploi de 2019 — aucune clause de licenciement',
      ),
      legalReview: bi('Required before sending', 'Requise avant l’envoi'),
      retention: bi(
        '7 years after employment ends (ESA/CRA records)',
        '7 ans après la fin de l’emploi (registres LNE/ARC)',
      ),
      assumptions: bi(
        'Assumes provincially regulated Ontario employment; the enhanced package is contingent on a signed release.',
        'Suppose un emploi réglementé par l’Ontario; l’indemnité bonifiée est conditionnelle à une quittance signée.',
      ),
      missing: bi(
        'Signed agreement version; ESA severance payroll calculation; final vacation balance.',
        'Version signée du contrat; calcul de la masse salariale (LNE); solde de vacances final.',
      ),
    },
  },
  {
    key: 'Full & Final Release',
    title: bi('Full & Final Release', 'Quittance complète et finale'),
    category: catOffboarding,
    highRisk: true,
    sections: [
      bi(
        'Release of Claims — prepared for Jordan Mensah',
        'Quittance de réclamations — préparée pour Jordan Mensah',
      ),
      bi(
        'In exchange for the enhanced payment described in the accompanying termination letter, the employee agrees to release the employer from all claims arising from their employment or its end, to the extent permitted by law.',
        "En échange du paiement bonifié décrit dans la lettre de cessation d'emploi ci-jointe, l'employé accepte de libérer l'employeur de toute réclamation découlant de son emploi ou de sa fin, dans la mesure permise par la loi.",
      ),
      bi(
        'This release does not affect any claim that cannot be waived by law, including certain human rights or workers’ compensation claims.',
        "Cette quittance n'affecte aucune réclamation qui ne peut être levée par la loi, y compris certaines réclamations relatives aux droits de la personne ou à l'indemnisation des accidents du travail.",
      ),
      bi(
        'Recommended: the employee should obtain independent legal advice before signing. A standard acknowledgement clause confirming this has been included.',
        "Recommandé : l'employé devrait obtenir un avis juridique indépendant avant de signer. Une clause de reconnaissance standard confirmant cela a été incluse.",
      ),
    ],
    meta: {
      link: bi('Jordan Mensah · Termination case', 'Jordan Mensah · Dossier de licenciement'),
      jur: bi('Ontario · ESA, 2000', 'Ontario · LNE, 2000'),
      governing: bi(
        'Termination letter — enhanced payment as consideration',
        'Lettre de cessation — indemnité bonifiée en contrepartie',
      ),
      legalReview: bi('Required before sending', 'Requise avant l’envoi'),
      retention: bi(
        '7 years after employment ends (ESA/CRA records)',
        '7 ans après la fin de l’emploi (registres LNE/ARC)',
      ),
      assumptions: bi(
        'Assumes consideration above statutory minimums supports the release.',
        'Suppose une contrepartie supérieure aux minimums légaux à l’appui de la quittance.',
      ),
      missing: bi(
        'Final amounts; date of the independent-legal-advice acknowledgment.',
        'Montants finaux; date de l’attestation de conseil juridique indépendant.',
      ),
    },
  },
  {
    key: 'Offboarding Checklist',
    title: bi('Offboarding Checklist', 'Liste de vérification de départ'),
    category: catOffboarding,
    highRisk: false,
    sections: [
      bi(
        'Offboarding Checklist — Jordan Mensah, last day July 19, 2026',
        'Liste de vérification de départ — Jordan Mensah, dernier jour le 19 juillet 2026',
      ),
      bi(
        '• Final pay + accrued vacation calculated and scheduled\n• Benefits end-date confirmed with provider\n• Company equipment & access revoked on last day\n• Record of Employment (ROE) issued within 5 calendar days\n• Exit interview scheduled\n• Reference contact designated',
        "• Paie finale + vacances accumulées calculées et planifiées\n• Date de fin des avantages confirmée avec le fournisseur\n• Équipement et accès de l'entreprise révoqués le dernier jour\n• Relevé d'emploi (RE) émis dans les 5 jours civils\n• Entrevue de départ planifiée\n• Personne-ressource de référence désignée",
      ),
    ],
    meta: {
      link: bi('Jordan Mensah · Termination case', 'Jordan Mensah · Dossier de licenciement'),
      jur: bi('Ontario · ESA, 2000', 'Ontario · LNE, 2000'),
      missing: bi(
        'ROE issue date; benefits end date confirmation.',
        'Date d’émission du RE; confirmation de la date de fin des avantages.',
      ),
    },
  },
  {
    key: 'Offer Letter',
    title: bi('Offer Letter', 'Lettre d’offre'),
    category: catHiring,
    highRisk: false,
    sections: [
      bi('Offer of Employment — Senior Analyst', "Offre d'emploi — Analyste principal"),
      bi(
        'Northgate Logistics Inc. is pleased to offer you the position of Senior Analyst, reporting to the Director of Operations, based in British Columbia. This offer is contingent on standard background checks.',
        "Northgate Logistics Inc. a le plaisir de vous offrir le poste d'analyste principal, relevant du directeur des opérations, basé en Colombie-Britannique. Cette offre est conditionnelle à des vérifications d'antécédents standards.",
      ),
      bi(
        'Compensation: [base salary] annually, paid biweekly, plus eligibility for the company benefits plan after 3 months.',
        "Rémunération : [salaire de base] par année, versé aux deux semaines, plus l'admissibilité au régime d'avantages sociaux de l'entreprise après 3 mois.",
      ),
      bi(
        'This role includes a 3-month probationary period consistent with BC employment standards. Either party may end the employment relationship during this period with the statutory minimum notice.',
        "Ce poste comprend une période de probation de 3 mois conforme aux normes d'emploi de la C.-B. L'une ou l'autre partie peut mettre fin à la relation d'emploi durant cette période avec le préavis minimal prévu par la loi.",
      ),
      bi(
        'Please confirm your acceptance by [date]. We’re looking forward to having you on the team.',
        "Veuillez confirmer votre acceptation d'ici [date]. Nous avons hâte de vous compter dans l'équipe.",
      ),
    ],
    meta: {
      jur: bi(
        'British Columbia · Employment Standards Act (BC)',
        'Colombie-Britannique · Employment Standards Act (C.-B.)',
      ),
      missing: bi(
        'Non-solicitation or non-competition clauses need BC-specific review.',
        'Les clauses de non-sollicitation ou de non-concurrence exigent une révision propre à la C.-B.',
      ),
    },
  },
  {
    key: 'Employment Agreement',
    title: bi('Employment Agreement', 'Contrat de travail'),
    category: catHiring,
    highRisk: false,
    sections: [
      bi('Employment Agreement — key terms', 'Contrat de travail — modalités clés'),
      bi(
        'This agreement sets out compensation, benefits, confidentiality obligations, and termination provisions.',
        "Ce contrat établit la rémunération, les avantages sociaux, les obligations de confidentialité et les dispositions de cessation d'emploi.",
      ),
      bi(
        'Termination clause: drafted to limit entitlements to ESA minimums where enforceable in the employee’s province. Advisor recommends a provincial-specific review before signing — enforceability standards differ by jurisdiction and are frequently challenged in court.',
        "Clause de cessation : rédigée pour limiter les droits aux minimums de la LNE là où elle est exécutoire dans la province de l'employé. Le Conseiller recommande un examen propre à la province avant la signature — les normes d'applicabilité varient selon la compétence et sont fréquemment contestées devant les tribunaux.",
      ),
    ],
    meta: {
      jur: bi('Multi-province', 'Multiprovincial'),
      legalReview: bi(
        'Recommended before signing — termination clause enforceability varies by province',
        'Recommandée avant signature — la force exécutoire de la clause de cessation varie selon la province',
      ),
    },
  },
  {
    key: 'Remote Work Policy',
    title: bi('Remote Work Policy', 'Politique de télétravail'),
    category: catPolicy,
    highRisk: false,
    sections: [
      bi('Remote Work Policy', 'Politique de télétravail'),
      bi(
        'Eligibility: roles approved for remote work by department leads. Employees must maintain a safe, ergonomic workspace.',
        'Admissibilité : postes approuvés pour le télétravail par les chefs de service. Les employés doivent maintenir un espace de travail sûr et ergonomique.',
      ),
      bi(
        'Health & safety: occupational health and safety obligations extend to home offices. Employees must complete the home office safety checklist before starting remote work.',
        "Santé et sécurité : les obligations en matière de santé et sécurité au travail s'étendent aux bureaux à domicile. Les employés doivent remplir la liste de vérification de sécurité du bureau à domicile avant de commencer le télétravail.",
      ),
      bi(
        'Equipment & expenses: the company provides a laptop and a one-time home office allowance; ongoing internet costs are the employee’s responsibility unless otherwise required by provincial law.',
        "Équipement et dépenses : l'entreprise fournit un ordinateur portable et une allocation unique pour le bureau à domicile; les frais Internet récurrents sont à la charge de l'employé sauf disposition contraire de la loi provinciale.",
      ),
      bi(
        'Data security: company data must stay within approved, encrypted devices and storage.',
        "Sécurité des données : les données de l'entreprise doivent demeurer sur des appareils et supports de stockage approuvés et chiffrés.",
      ),
    ],
  },
  {
    key: 'Performance Improvement Plan',
    title: bi('Performance Improvement Plan', 'Plan d’amélioration du rendement'),
    category: catPerformance,
    highRisk: false,
    sections: [
      bi(
        'Performance Improvement Plan — Devon Clarke',
        "Plan d'amélioration du rendement — Devon Clarke",
      ),
      bi(
        'Area for improvement: attendance reliability. Expectation: adherence to scheduled shifts, with advance notice for exceptions, consistent with the attendance policy.',
        "Point à améliorer : fiabilité de l'assiduité. Attente : respect des quarts planifiés, avec préavis pour les exceptions, conformément à la politique d'assiduité.",
      ),
      bi(
        '30-day check-in: July 22, 2026. Progress will be reviewed against the expectations above.',
        'Suivi à 30 jours : 22 juillet 2026. Les progrès seront évalués par rapport aux attentes ci-dessus.',
      ),
      bi(
        'Note: before finalizing, confirm the absences are not linked to a medical condition requiring accommodation — see the linked risk flag.',
        'Note : avant de finaliser, confirmez que les absences ne sont pas liées à une condition médicale nécessitant un accommodement — voir le signalement de risque associé.',
      ),
    ],
    meta: {
      link: bi('Devon Clarke · Performance case', 'Devon Clarke · Dossier de rendement'),
      jur: bi(
        'Ontario · ESA, 2000 + Human Rights Code',
        'Ontario · LNE, 2000 + Code des droits de la personne',
      ),
      legalReview: bi(
        'Optional — recommended if accommodation may apply',
        'Facultative — recommandée si un accommodement peut s’appliquer',
      ),
      assumptions: bi(
        'Assumes absences are not linked to a condition requiring accommodation — confirm before finalizing.',
        'Suppose que les absences ne sont pas liées à une condition nécessitant un accommodement — à confirmer avant de finaliser.',
      ),
      missing: bi(
        'Measurable targets and check-in dates confirmed with the manager.',
        'Cibles mesurables et dates de suivi confirmées avec le gestionnaire.',
      ),
    },
  },
  {
    key: 'Accommodation Documentation',
    title: bi('Accommodation Documentation', 'Documentation d’accommodement'),
    category: catAccommodation,
    highRisk: true,
    sections: [
      bi('Accommodation Record — Confidential', "Dossier d'accommodement — Confidentiel"),
      bi(
        'Employee has disclosed a medical condition requiring modified duties. Documentation on file is limited to functional limitations, not diagnosis, consistent with human rights obligations.',
        "L'employé a divulgué une condition médicale nécessitant des tâches modifiées. La documentation au dossier se limite aux limitations fonctionnelles, sans diagnostic, conformément aux obligations en matière de droits de la personne.",
      ),
      bi(
        'Accommodation plan: modified duties reviewed every 90 days or as functional limitations change. Next review: July 14, 2026.',
        "Plan d'accommodement : tâches modifiées révisées tous les 90 jours ou lorsque les limitations fonctionnelles changent. Prochain examen : 14 juillet 2026.",
      ),
    ],
    meta: {
      link: bi('Accommodation case', 'Dossier d’accommodement'),
      jur: bi('British Columbia · Human Rights Code', 'Colombie-Britannique · Human Rights Code'),
      legalReview: bi('Recommended — privacy-sensitive', 'Recommandée — caractère confidentiel'),
      retention: bi(
        'Duration of employment + 3 years (accommodation records)',
        'Durée de l’emploi + 3 ans (dossiers d’accommodement)',
      ),
      assumptions: bi(
        'Holds functional limitations only — diagnosis stays off file.',
        'Contient les limitations fonctionnelles seulement — aucun diagnostic au dossier.',
      ),
      missing: bi(
        'Next review date confirmation (Jul 14, 2026).',
        'Confirmation de la prochaine date d’examen (14 juillet 2026).',
      ),
    },
  },
  {
    key: 'Medical Information Request Letter',
    title: bi('Medical Information Request Letter', 'Lettre de demande de renseignements médicaux'),
    category: catAccommodation,
    highRisk: true,
    sections: [
      bi(
        'Request for Functional Abilities Information',
        'Demande de renseignements sur les capacités fonctionnelles',
      ),
      bi(
        'To support an appropriate accommodation, we are requesting information from your treating provider limited to functional limitations and restrictions — not diagnosis.',
        'Pour soutenir un accommodement approprié, nous demandons à votre professionnel traitant des renseignements limités aux limitations et restrictions fonctionnelles — sans diagnostic.',
      ),
      bi(
        'This information will be kept confidential and used only to determine appropriate workplace accommodation.',
        "Ces renseignements demeureront confidentiels et ne serviront qu'à déterminer l'accommodement approprié en milieu de travail.",
      ),
    ],
    meta: {
      link: bi('Accommodation case', 'Dossier d’accommodement'),
      jur: bi('British Columbia · Human Rights Code', 'Colombie-Britannique · Human Rights Code'),
      legalReview: bi('Recommended — privacy-sensitive', 'Recommandée — caractère confidentiel'),
      retention: bi(
        'Duration of employment + 3 years (accommodation records)',
        'Durée de l’emploi + 3 ans (dossiers d’accommodement)',
      ),
      assumptions: bi(
        'Requests functional limitations only — never a diagnosis.',
        'Demande les limitations fonctionnelles seulement — jamais de diagnostic.',
      ),
      missing: bi(
        'Treating provider details; reply-by date.',
        'Coordonnées du professionnel traitant; date limite de réponse.',
      ),
    },
  },
  {
    key: 'Written Warning',
    title: bi('Written Warning', 'Avertissement écrit'),
    category: catPerformance,
    highRisk: true,
    sections: [
      bi('Written Warning', 'Avertissement écrit'),
      bi(
        'This letter confirms our conversation regarding [issue]. This is a formal warning: continued issues of this nature may lead to further discipline, up to and including termination.',
        "La présente confirme notre conversation concernant [problème]. Il s'agit d'un avertissement formel : la persistance de problèmes de cette nature pourrait entraîner d'autres mesures disciplinaires, pouvant aller jusqu'au congédiement.",
      ),
      bi(
        'We’re committed to supporting your improvement — please speak with your manager if there are barriers we should know about.',
        "Nous nous engageons à soutenir votre amélioration — veuillez parler à votre gestionnaire s'il existe des obstacles dont nous devrions être informés.",
      ),
    ],
    meta: {
      legalReview: bi(
        'Recommended for repeated or escalating discipline',
        'Recommandée en cas de discipline répétée ou croissante',
      ),
      assumptions: bi(
        'Assumes earlier coaching conversations are documented.',
        'Suppose que les conversations d’accompagnement antérieures sont documentées.',
      ),
      missing: bi(
        'Incident dates; the policy provision engaged; prior warnings on file.',
        'Dates des incidents; disposition de la politique en cause; avertissements antérieurs au dossier.',
      ),
    },
  },
]

/** Lookup by template key (the prototype's `docBodies[title]` access pattern). */
export const documentTemplatesByKey: Record<string, DocumentTemplate> = Object.fromEntries(
  documentTemplates.map((t) => [t.key, t]),
)
