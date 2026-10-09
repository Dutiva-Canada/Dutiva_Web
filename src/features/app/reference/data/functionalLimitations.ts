import { bi } from '@/i18n/core'
import { contrast, li, p } from '../guideModel'
import type { ReferenceGuide } from '../guideModel'

/**
 * Ring 2, Pillar B — the functional limitations guide
 * (docs/FOUR_RING_FRAMEWORK.md). All FR is [FR self-authored].
 *
 * The framework's brief is "how to work with medical information without
 * violating employee privacy". The line it teaches is a single distinction —
 * what someone can and cannot do, versus what is wrong with them — and the
 * guide is organised around applying that line in the four places employers
 * actually cross it: the request, the note that comes back, the file, and the
 * conversation with the manager who has to operate the arrangement.
 */
export const functionalLimitationsGuide: ReferenceGuide = {
  slug: 'functional-limitations',
  ring: 2,
  jurisdictions: ['ON', 'QC', 'FED'],
  readingMinutes: 6,
  title: bi(
    'Functional limitations, not diagnosis',
    'Limitations fonctionnelles, et non diagnostic',
  ),
  summary: bi(
    'What you may ask a health professional, what you may keep, and what to tell a manager who has to make the arrangement work.',
    'Ce que vous pouvez demander à un professionnel de la santé, ce que vous pouvez conserver et ce qu’il faut dire au gestionnaire qui doit appliquer l’arrangement.',
  ),
  tag: bi('Accommodation · All jurisdictions', 'Accommodement · Toutes les juridictions'),
  relatedTemplates: ['T20', 'T21', 'T23'],
  relatedFlows: ['duty-to-accommodate'],
  sections: [
    {
      heading: bi('The distinction', 'La distinction'),
      blocks: [
        p(
          'An employer is entitled to know what an employee can and cannot do at work, what restrictions apply, and how long they are expected to last. An employer is not entitled to know the medical condition behind them. That single line governs everything below, and it holds across Ontario, Québec and federally regulated workplaces alike.',
          'L’employeur a le droit de savoir ce qu’un employé peut ou ne peut pas faire au travail, quelles restrictions s’appliquent et quelle en est la durée prévue. Il n’a pas le droit de connaître la condition médicale sous-jacente. Cette seule distinction régit tout ce qui suit, et elle vaut autant en Ontario qu’au Québec ou en milieu de travail de compétence fédérale.',
        ),
        p(
          'The reason is practical as much as legal. A limitation tells you what to change; a diagnosis does not. Two people with the same diagnosis may need entirely different arrangements, and two people with different diagnoses may need the same one.',
          'La raison est autant pratique que juridique. Une limitation vous indique quoi modifier; un diagnostic, non. Deux personnes ayant le même diagnostic peuvent nécessiter des arrangements complètement différents, et deux personnes ayant des diagnostics distincts peuvent nécessiter le même.',
        ),
        contrast(
          bi(
            'Cannot lift more than a set weight; cannot sit longer than about an hour without a break; expected to last three months.',
            'Ne peut soulever plus d’un certain poids ; ne peut demeurer assis plus d’une heure environ sans pause ; durée prévue de trois mois.',
          ),
          bi('Has a herniated disc.', 'Souffre d’une hernie discale.'),
        ),
        contrast(
          bi(
            'Cannot work rotating shifts at present; can work a fixed daytime schedule; to be reviewed in eight weeks.',
            'Ne peut travailler en rotation d’horaire pour l’instant ; peut travailler selon un horaire de jour fixe ; à réviser dans huit semaines.',
          ),
          bi(
            'Is being treated for a mental health condition.',
            'Est traité pour un trouble de santé mentale.',
          ),
        ),
      ],
    },
    {
      heading: bi('When you ask', 'Au moment de la demande'),
      blocks: [
        p(
          'Ask the health professional about capacity, not condition. A request that asks for a diagnosis usually gets one, and once it is in your hands you hold information you had no right to and cannot un-know.',
          'Interrogez le professionnel de la santé sur la capacité, non sur la condition. Une demande qui réclame un diagnostic en obtient généralement un, et dès qu’il est entre vos mains, vous détenez un renseignement auquel vous n’aviez pas droit et que vous ne pouvez plus ignorer.',
        ),
        li(
          'Describe the job — its actual physical, cognitive and scheduling demands. A professional cannot assess fitness for work they have not had described to them.',
          'Décrivez le poste — ses exigences réelles sur les plans physique, cognitif et d’horaire. Un professionnel ne peut évaluer l’aptitude à un travail qu’on ne lui a pas décrit.',
        ),
        li(
          'Ask which of those demands the employee can meet, which they cannot, and which they could meet with a change.',
          'Demandez lesquelles de ces exigences l’employé(e) peut satisfaire, lesquelles il ou elle ne peut satisfaire, et lesquelles seraient satisfaites moyennant un ajustement.',
        ),
        li(
          'Ask how long the restrictions are expected to last, and when they should be reassessed.',
          'Demandez la durée prévue des restrictions et le moment de leur réévaluation.',
        ),
        li(
          'Say explicitly that you are not asking for a diagnosis.',
          'Indiquez explicitement que vous ne demandez pas de diagnostic.',
        ),
        p(
          'The medical information request letter (T20) is written to this shape. Use it rather than composing a request in the moment, which is where the extra question tends to creep in.',
          'La lettre de demande de renseignements médicaux (T20) est rédigée selon cette structure. Utilisez-la plutôt que de composer une demande sur le moment : c’est là que la question de trop s’insinue.',
        ),
      ],
    },
    {
      heading: bi('When a diagnosis arrives anyway', 'Si un diagnostic vous parvient malgré tout'),
      blocks: [
        p(
          'It happens — a note volunteers it, or an employee tells you directly. You have not done anything wrong by receiving it, and you do not have to pretend you did not read it. What matters is what you do next.',
          'Cela arrive : une note le mentionne d’elle-même, ou l’employé(e) vous le dit directement. Vous n’avez commis aucune faute en le recevant et vous n’avez pas à faire comme si vous ne l’aviez pas lu. Ce qui compte, c’est la suite.',
        ),
        li(
          'Do not copy it forward into the accommodation plan, the case file, or any email.',
          'Ne le reportez ni dans le plan d’accommodement, ni au dossier, ni dans un courriel.',
        ),
        li(
          'Keep the document itself in the confidential medical file, separate from the personnel file.',
          'Conservez le document lui-même au dossier médical confidentiel, distinct du dossier d’employé.',
        ),
        li(
          'Work from the limitations it describes, and record only those.',
          'Travaillez à partir des limitations qui y sont décrites et ne consignez que celles-ci.',
        ),
        li(
          'Do not treat it as consent to discuss the condition with anyone else.',
          'N’y voyez pas un consentement à discuter de la condition avec qui que ce soit.',
        ),
      ],
    },
    {
      heading: bi('What the manager is told', 'Ce que le gestionnaire apprend'),
      blocks: [
        p(
          'A manager needs to know what changes about the work. They do not need to know why, and telling them is the most common way a confidential file leaks — not through the system, but through a well-meant explanation.',
          'Un gestionnaire doit savoir ce qui change dans le travail. Il n’a pas besoin d’en connaître la raison, et le lui dire est la façon la plus courante dont un dossier confidentiel fuit — non par le système, mais par une explication bien intentionnée.',
        ),
        contrast(
          bi(
            'Priya is on a fixed daytime schedule until the end of March and is not on the rotation. Route night coverage to the rest of the team.',
            'Priya est à un horaire de jour fixe jusqu’à la fin mars et ne fait pas partie de la rotation. Répartissez la couverture de nuit dans le reste de l’équipe.',
          ),
          bi(
            'Priya can’t do nights right now because of what she’s going through.',
            'Priya ne peut pas faire de nuits en ce moment à cause de ce qu’elle traverse.',
          ),
        ),
        p(
          'If a manager pushes for a reason, the answer is that the arrangement is confirmed and confidential — not evasive, just closed. A manager who is told to keep it confidential and told the reason anyway has been handed a burden, not a confidence.',
          'Si un gestionnaire insiste pour connaître la raison, la réponse est que l’arrangement est confirmé et confidentiel — sans détour, mais sans ouverture. Un gestionnaire à qui l’on demande la confidentialité tout en lui révélant le motif se voit confier un fardeau, non une confidence.',
        ),
      ],
    },
    {
      heading: bi('Where it is kept', 'Où le dossier est conservé'),
      blocks: [
        p(
          'Medical information lives in a confidential file separate from the general personnel file, reachable only by the people administering the accommodation. The accommodation plan itself circulates further, which is exactly why it carries limitations and never a condition.',
          'Les renseignements médicaux sont conservés dans un dossier confidentiel distinct du dossier d’employé général, accessible uniquement aux personnes qui administrent l’accommodement. Le plan d’accommodement, lui, circule plus largement — raison précise pour laquelle il ne comporte que des limitations et jamais une condition.',
        ),
        li(
          'Keep it only as long as it is needed, and reassess at the review date rather than holding it indefinitely.',
          'Conservez-le uniquement le temps nécessaire et réévaluez à la date de révision plutôt que de le garder indéfiniment.',
        ),
        li(
          'Do not attach medical documents to a case record other people can open.',
          'Ne joignez pas de documents médicaux à un dossier que d’autres personnes peuvent ouvrir.',
        ),
        li(
          'If someone leaves, the confidential file follows the retention rule for medical records, not the one for personnel files.',
          'En cas de départ, le dossier confidentiel suit la règle de conservation des dossiers médicaux, non celle des dossiers d’employés.',
        ),
      ],
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'The Human Rights Code sets the duty to accommodate, and the information you may require is what supports it — limitations and prognosis. Note what Ontario does not have: no general privacy statute covers private-sector employee records, so the constraint here comes from the Code itself, the common law, and the confidentiality you undertook when you asked. That makes practice the safeguard rather than a statute, and a manager is not entitled to the detail merely by being the employee’s manager.',
      fr: 'Le Code des droits de la personne établit l’obligation d’accommodement, et les renseignements exigibles sont ceux qui l’appuient : limitations et pronostic. Notez ce qui manque en Ontario : aucune loi générale sur la vie privée ne vise les dossiers d’employés du secteur privé, de sorte que l’encadrement découle du Code lui-même, de la common law et de l’engagement de confidentialité pris au moment de la demande. La protection tient donc à la pratique plutôt qu’à une loi, et un gestionnaire n’a pas droit au détail du seul fait qu’il est le supérieur de l’employé(e).',
    },
    QC: {
      en: 'The Charter of human rights and freedoms imposes the same duty, and Québec’s private-sector privacy regime is stricter than most on collecting only what is necessary — a diagnosis you did not need is not merely surplus, it is a collection you could not justify.',
      fr: 'La Charte des droits et libertés de la personne impose la même obligation, et le régime québécois de protection des renseignements personnels dans le secteur privé est plus strict que la plupart quant à la collecte du strict nécessaire : un diagnostic dont vous n’aviez pas besoin n’est pas un simple surplus, c’est une collecte injustifiable.',
    },
    FED: {
      en: 'The Canadian Human Rights Act sets the duty for federally regulated employers, and PIPEDA governs the handling of the information collected in the course of meeting it — including how long it is kept and who inside the organization can reach it.',
      fr: 'La Loi canadienne sur les droits de la personne établit l’obligation pour les employeurs de compétence fédérale, et la LPRPDE régit le traitement des renseignements recueillis dans ce cadre — y compris leur durée de conservation et les personnes qui, dans l’organisation, peuvent y accéder.',
    },
  },
}
