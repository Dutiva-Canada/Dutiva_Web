import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = [
    {
      blocks: [
        p(
          'Every Canadian jurisdiction provides a set of job-protected leaves — parental, medical, family caregiving, bereavement, domestic violence, and others. The names, durations, and eligibility rules differ between provinces and under the federal regime, and the list has grown in most jurisdictions over the past several years.',
          'Chaque compétence canadienne prévoit un ensemble de congés protégés — parentaux, médicaux, pour proche aidant, de deuil, en cas de violence conjugale, et autres. Les appellations, les durées et les critères d’admissibilité varient d’une province à l’autre et sous le régime fédéral, et la liste s’est allongée dans la plupart des compétences ces dernières années.',
        ),
      ],
    },
    {
      heading: bi('Three questions, not one', 'Trois questions, pas une'),
      blocks: [
        p(
          'Employers routinely collapse these into a single "is this leave paid?" conversation. Separate them:',
          'Les employeurs réduisent régulièrement ces enjeux à une seule question : « ce congé est-il payé? ». Distinguez-les :',
        ),
        li(
          'Job protection — the employee’s right to take the leave and return to their position. This comes from employment standards legislation.',
          'La protection de l’emploi — le droit de l’employé de prendre le congé et de revenir à son poste. Elle découle de la législation sur les normes d’emploi.',
        ),
        li(
          'Income replacement — usually a separate government program rather than an employer obligation, with its own eligibility rules.',
          'Le remplacement du revenu — habituellement un programme gouvernemental distinct plutôt qu’une obligation de l’employeur, avec ses propres critères d’admissibilité.',
        ),
        li(
          'Benefit continuation — whether coverage carries on during the leave, which is often required and is frequently overlooked.',
          'Le maintien des avantages sociaux — la poursuite ou non de la couverture pendant le congé, souvent obligatoire et fréquemment négligée.',
        ),
        p(
          'A leave being unpaid by the employer does not mean the employee is unprotected, and it does not suspend the employer’s other obligations.',
          'Le fait qu’un congé ne soit pas payé par l’employeur ne signifie pas que l’employé n’est pas protégé, ni que les autres obligations de l’employeur sont suspendues.',
        ),
      ],
    },
    {
      heading: bi(
        'Return to work is part of the leave',
        'Le retour au travail fait partie du congé',
      ),
      blocks: [
        p(
          'The right to reinstatement is the substance of job protection. An employee returning from a protected leave is generally entitled to their former position, or a comparable one, at no less than their former rate. Reorganizing around someone’s absence and presenting a diminished role on their return is a well-worn path to a constructive dismissal or reprisal claim, and the timing alone invites scrutiny.',
          'Le droit à la réintégration est le cœur de la protection de l’emploi. L’employé qui revient d’un congé protégé a généralement droit à son ancien poste, ou à un poste comparable, à un taux au moins équivalent. Réorganiser le travail autour de l’absence d’une personne et lui présenter un rôle diminué à son retour est un chemin bien connu vers une réclamation pour congédiement déguisé ou représailles, et le seul moment choisi appelle l’examen.',
        ),
      ],
    },
    {
      heading: bi(
        'Where leave meets the duty to accommodate',
        'Quand le congé rencontre l’obligation d’accommodement',
      ),
      blocks: [
        p(
          'Statutory leave and the duty to accommodate are separate obligations that frequently apply to the same absence, and exhausting one does not discharge the other. An employee who reaches the end of a medical leave entitlement may still be owed accommodation on human-rights grounds — a graduated return, modified duties, or further time — assessed on its own footing up to undue hardship.',
          'Le congé prévu par la loi et l’obligation d’accommodement sont des obligations distinctes qui s’appliquent souvent à la même absence, et épuiser l’une ne libère pas de l’autre. L’employé qui atteint la fin de son droit à un congé médical peut encore avoir droit à un accommodement fondé sur les droits de la personne — un retour progressif, des tâches modifiées ou du temps additionnel — évalué pour lui-même jusqu’au point de contrainte excessive.',
        ),
        p(
          'Treating the end of a statutory leave as an automatic decision point about continued employment is one of the more consequential mistakes in this area, because it converts a leave question into a termination question without the analysis the second one requires.',
          'Considérer la fin d’un congé légal comme un point de décision automatique sur le maintien de l’emploi est l’une des erreurs les plus lourdes de conséquences dans ce domaine, car elle transforme une question de congé en question de cessation d’emploi sans l’analyse qu’exige la seconde.',
        ),
      ],
    },
    {
      heading: bi('Practical handling', 'Gestion pratique'),
      blocks: [
        li(
          'Confirm which jurisdiction’s leave rules apply before quoting any entitlement to an employee.',
          'Confirmez quelles règles de congé s’appliquent avant d’annoncer un droit quelconque à un employé.',
        ),
        li(
          'Request only the documentation the statute permits — many leaves limit what you may ask for.',
          'N’exigez que les documents permis par la loi — de nombreux congés limitent ce que vous pouvez demander.',
        ),
        li(
          'Record the dates, the basis of the leave, and what was communicated about the return.',
          'Consignez les dates, le fondement du congé et ce qui a été communiqué au sujet du retour.',
        ),
        li(
          'Keep benefit administration aligned with the leave rather than defaulting to suspension.',
          'Alignez l’administration des avantages sociaux sur le congé plutôt que de les suspendre par défaut.',
        ),
      ],
    },
    {
      heading: bi(
        'Covering the work without eroding the job',
        'Assurer le travail sans éroder le poste',
      ),
      blocks: [
        p(
          "The operational problem is real: work has to continue while someone is away. The legal constraint is that the arrangements you make to cover it cannot quietly become permanent. Where a replacement is hired, engage them on terms that reflect the temporary nature of the assignment, and be explicit internally that the absent employee's position continues to exist.",
          'Le problème opérationnel est réel : le travail doit se poursuivre pendant l’absence d’une personne. La contrainte juridique est que les arrangements pris pour l’assurer ne peuvent devenir discrètement permanents. Lorsqu’un remplaçant est embauché, engagez-le à des conditions qui reflètent le caractère temporaire de l’affectation, et soyez explicite à l’interne sur le fait que le poste de l’employé absent continue d’exister.',
        ),
        p(
          'Where duties are redistributed to the existing team instead, keep a note of what moved and on what understanding. Responsibilities absorbed informally over a long absence have a way of never coming back, and the returning employee who finds their scope diminished has the makings of a claim that nobody intended to create.',
          'Lorsque les tâches sont plutôt redistribuées à l’équipe en place, notez ce qui a été déplacé et sur quelle base. Les responsabilités absorbées de façon informelle au cours d’une longue absence ont tendance à ne jamais revenir, et l’employé qui constate à son retour que son champ d’action est réduit détient les éléments d’une réclamation que personne n’a voulu créer.',
        ),
        p(
          'Restructuring during a leave is not prohibited, but it carries a heavy evidentiary burden. If a genuine business reorganization would have affected the position regardless of the absence, document that reasoning at the time the decision is made rather than assembling it afterwards.',
          'Une restructuration pendant un congé n’est pas interdite, mais elle comporte un lourd fardeau de preuve. Si une réorganisation d’affaires véritable aurait touché le poste indépendamment de l’absence, consignez ce raisonnement au moment de la décision plutôt que de le reconstituer par la suite.',
        ),
      ],
    },
    {
      heading: bi('Mistakes that recur', 'Des erreurs qui reviennent'),
      blocks: [
        li(
          'Requiring a diagnosis where the statute permits only confirmation of the need for leave.',
          'Exiger un diagnostic là où la loi ne permet que la confirmation du besoin de congé.',
        ),
        li(
          'Suspending benefit coverage automatically at the start of an unpaid leave without checking whether continuation is required.',
          'Suspendre automatiquement la couverture des avantages sociaux au début d’un congé non payé sans vérifier si le maintien est obligatoire.',
        ),
        li(
          'Counting a protected absence against an attendance-management program as though it were ordinary absenteeism.',
          'Comptabiliser une absence protégée dans un programme de gestion de l’assiduité comme s’il s’agissait d’absentéisme ordinaire.',
        ),
        li(
          "Applying one province's entitlement to an employee governed by another's, or by the federal regime.",
          'Appliquer le droit d’une province à un employé régi par celui d’une autre, ou par le régime fédéral.',
        ),
        li(
          'Treating a leave request as a performance signal, or letting it influence a review written during the absence.',
          'Traiter une demande de congé comme un signal de rendement, ou la laisser influencer une évaluation rédigée pendant l’absence.',
        ),
        li(
          'Losing track of the return date, so the employee comes back to no plan, no access, and no assigned work.',
          'Perdre de vue la date de retour, de sorte que l’employé revient sans plan, sans accès et sans travail assigné.',
        ),
      ],
    },
    {
      heading: bi(
        'Documenting a leave from request to return',
        'Documenter un congé, de la demande au retour',
      ),
      blocks: [
        p(
          'Leaves generate disputes long after they end, usually about what was agreed and when. The record that resolves them is built while the leave is running, and it is inexpensive to keep if someone owns it.',
          'Les congés engendrent des litiges bien après leur fin, généralement sur ce qui a été convenu et à quel moment. Le dossier qui les règle se constitue pendant le congé, et il coûte peu à tenir lorsque quelqu’un en est responsable.',
        ),
        p(
          'Record the request as it was made, including the date and the basis given, and confirm back in writing what leave is being taken, what documentation was requested, what happens to benefits and any top-up, and the expected return date. That single confirmation resolves most of what is later argued about, and it protects the employee as much as the employer.',
          'Consignez la demande telle qu’elle a été formulée, avec la date et le fondement invoqué, et confirmez par écrit quel congé est pris, quels documents ont été demandés, ce qu’il advient des avantages sociaux et de tout complément, ainsi que la date de retour prévue. Cette seule confirmation règle l’essentiel de ce qui sera plus tard contesté, et elle protège l’employé autant que l’employeur.',
        ),
        p(
          'Keep contact during the absence proportionate and purposeful. Operational updates and confirmation of return logistics are appropriate; pressure to return, requests for work, or repeated enquiries about progress are not, and they read badly afterwards. Diarize the return date, plan for it before it arrives, and confirm the arrangements in writing before the employee walks back in.',
          'Gardez un contact proportionné et utile pendant l’absence. Les mises à jour opérationnelles et la confirmation de la logistique du retour sont appropriées; les pressions pour revenir, les demandes de travail ou les questions répétées sur l’évolution de la situation ne le sont pas, et se lisent mal par la suite. Inscrivez la date de retour à l’agenda, préparez-la avant qu’elle n’arrive, et confirmez les modalités par écrit avant que l’employé ne revienne.',
        ),
      ],
    },
    {
      blocks: [
        p(
          'Because leave entitlements change often and vary by jurisdiction, verify the current rules for the specific leave and jurisdiction in front of you rather than relying on internal precedent. This article is orientation, not entitlement advice.',
          'Comme les droits aux congés évoluent souvent et varient selon la compétence, vérifiez les règles en vigueur pour le congé et la compétence en cause plutôt que de vous fier à un précédent interne. Ce texte sert de repère, non d’avis sur vos obligations.',
        ),
      ],
    },
  ]
