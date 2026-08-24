import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = [
    {
      blocks: [
        p(
          'Canadian courts approach employment contracts differently from commercial ones. The starting assumption is that the employer drafted the document, understood it, and held the stronger bargaining position — so ambiguity tends to be resolved against the employer, and a clause that reduces a statutory entitlement is read strictly.',
          'Les tribunaux canadiens abordent les contrats de travail différemment des contrats commerciaux. On présume au départ que l’employeur a rédigé le document, qu’il le comprenait et qu’il était en position de négociation plus forte — l’ambiguïté tend donc à être tranchée contre l’employeur, et une clause qui réduit un droit prévu par la loi est interprétée strictement.',
        ),
        p(
          'That interpretive posture has a practical consequence worth internalizing before reading any further: a clause does not have to be unfair to fail. It only has to be capable of operating unfairly in some scenario the drafter did not consider. Most struck-down clauses were written by someone competent who simply did not imagine the fact pattern a court later applied them to.',
          'Cette approche interprétative a une conséquence pratique qu’il vaut la peine d’intégrer avant d’aller plus loin : une clause n’a pas besoin d’être inéquitable pour échouer. Il suffit qu’elle puisse produire un résultat inéquitable dans un scénario que le rédacteur n’a pas envisagé. La plupart des clauses invalidées ont été rédigées par une personne compétente qui n’avait simplement pas imaginé la situation à laquelle un tribunal les a ensuite appliquées.',
        ),
      ],
    },
    {
      heading: bi('The termination clause', 'La clause de cessation d’emploi'),
      blocks: [
        p(
          'This is the clause that matters most, because it decides whether an ending costs the statutory minimum or common-law reasonable notice. Two habits get these clauses struck down repeatedly:',
          'C’est la clause qui compte le plus, car elle détermine si une fin d’emploi coûte le minimum légal ou le préavis raisonnable de la common law. Deux habitudes font invalider ces clauses à répétition :',
        ),
        li(
          'Language that could produce less than the statutory minimum in some scenario — even a scenario that never happened.',
          'Un libellé qui pourrait produire moins que le minimum légal dans un scénario donné — même un scénario qui ne s’est jamais réalisé.',
        ),
        li(
          'A "just cause" carve-out written more broadly than the narrow statutory standard for disentitlement.',
          'Une exception pour « motif valable » rédigée plus largement que la norme légale étroite de privation du droit.',
        ),
        p(
          'When a court finds either problem, it generally does not rewrite the clause to make it lawful or sever the offending words. The clause fails and reasonable notice applies. A clause that was cheap to copy from a template becomes the most expensive sentence in the document.',
          'Lorsqu’un tribunal constate l’un ou l’autre de ces problèmes, il ne réécrit généralement pas la clause pour la rendre licite et n’en retranche pas les mots fautifs. La clause échoue et le préavis raisonnable s’applique. Une clause bon marché à copier d’un modèle devient la phrase la plus coûteuse du document.',
        ),
        p(
          'A saving provision — wording that promises the employee will always receive at least the statutory minimum — is sometimes offered as insurance. It is not reliable insurance. Where the operative language is itself defective, a general promise to comply has often been treated as insufficient to cure it, on the reasoning that an employee reading the contract would be guided by the specific term rather than the disclaimer.',
          'Une clause de sauvegarde — un libellé promettant que l’employé recevra toujours au moins le minimum légal — est parfois présentée comme une assurance. Ce n’en est pas une fiable. Lorsque le libellé opérant est lui-même défectueux, une promesse générale de conformité a souvent été jugée insuffisante pour le corriger, au motif que l’employé qui lit le contrat se fierait à la clause précise plutôt qu’à l’avertissement.',
        ),
      ],
    },
    {
      heading: bi('Restrictive covenants', 'Clauses restrictives'),
      blocks: [
        p(
          'Non-competition and non-solicitation clauses are treated as restraints of trade and are presumptively unenforceable unless narrowly justified. Non-solicitation clauses generally fare better than non-competition ones, because they restrain less. Some jurisdictions have gone further and restricted non-competes for most employees outright, so whether you may use one at all is a jurisdiction-specific question before it is a drafting question.',
          'Les clauses de non-concurrence et de non-sollicitation sont considérées comme des restrictions au commerce et sont présumées inapplicables à moins d’être justifiées de façon étroite. Les clauses de non-sollicitation s’en tirent généralement mieux que celles de non-concurrence, parce qu’elles restreignent moins. Certaines compétences sont allées plus loin et ont carrément restreint les non-concurrences pour la plupart des employés; savoir si vous pouvez même en utiliser une est donc une question propre à la compétence avant d’être une question de rédaction.',
        ),
        p(
          'Where a restrictive covenant is available to you, scope is what decides enforceability: the activity restrained, the geography, and the duration all have to be no wider than the legitimate interest being protected. Courts generally will not read down an overbroad covenant to a reasonable one — the usual outcome is that it fails entirely, leaving the employer with nothing where a narrower clause would have held.',
          'Lorsqu’une clause restrictive vous est ouverte, c’est la portée qui détermine son caractère exécutoire : l’activité visée, le territoire et la durée ne doivent pas dépasser l’intérêt légitime protégé. Les tribunaux ne réduisent généralement pas une clause trop large à une clause raisonnable — le résultat habituel est qu’elle échoue en entier, ne laissant rien à l’employeur là où une clause plus étroite aurait tenu.',
        ),
        p(
          'Confidentiality obligations are a different matter and are generally enforceable on their own terms, because they protect information rather than restrain employment. For many roles, a well-drafted confidentiality and non-solicitation pairing protects the real interest without the enforceability risk a non-compete carries.',
          'Les obligations de confidentialité relèvent d’une autre logique et sont généralement exécutoires selon leurs propres termes, parce qu’elles protègent de l’information plutôt que de restreindre l’emploi. Pour bien des postes, un jumelage bien rédigé de confidentialité et de non-sollicitation protège l’intérêt réel sans le risque d’inapplicabilité que comporte une non-concurrence.',
        ),
      ],
    },
    {
      heading: bi(
        'Compensation, bonuses, and what survives a departure',
        'Rémunération, primes et ce qui survit à un départ',
      ),
      blocks: [
        p(
          'If a bonus or equity plan is meant to stop accruing when employment ends, the contract and the plan document have to say so clearly and consistently with each other. Where they conflict, or where the language is merely implied, employees have succeeded in claiming amounts through the notice period. Read the plan and the contract together before you rely on either.',
          'Si une prime ou un régime d’actions doit cesser de s’accumuler à la fin de l’emploi, le contrat et le document du régime doivent l’énoncer clairement et de façon cohérente entre eux. Lorsqu’ils se contredisent, ou que le libellé n’est qu’implicite, des employés ont obtenu gain de cause en réclamant des sommes pour la période de préavis. Lisez le régime et le contrat ensemble avant de vous fier à l’un ou à l’autre.',
        ),
        p(
          'A requirement to be "actively employed" on a payment date is the wording most often litigated, and it frequently fails. The reasoning is that an employee dismissed without proper notice would have been actively employed had the notice been given, so the condition cannot defeat what the notice period would have produced. Language that clearly and unambiguously removes the entitlement during the notice period is a drafting exercise worth doing carefully rather than by habit.',
          'L’exigence d’être « activement à l’emploi » à une date de versement est le libellé le plus souvent contesté, et il échoue fréquemment. Le raisonnement est que l’employé congédié sans préavis suffisant aurait été activement à l’emploi si le préavis avait été donné; la condition ne peut donc faire échec à ce que la période de préavis aurait produit. Un libellé qui écarte clairement et sans ambiguïté le droit pendant la période de préavis est un exercice de rédaction à faire soigneusement plutôt que par habitude.',
        ),
      ],
    },
    {
      heading: bi('Changing terms later', 'Modifier les conditions plus tard'),
      blocks: [
        p(
          'A contract signed after employment has already begun generally needs fresh consideration — something of value the employee receives in exchange for accepting the new terms. Continued employment, on its own, is usually not enough. A significant unilateral change to a fundamental term can also amount to constructive dismissal, which puts the employer in the position of having ended the relationship without saying so.',
          'Un contrat signé après le début de l’emploi exige généralement une contrepartie nouvelle — quelque chose de valeur que l’employé reçoit en échange de son acceptation des nouvelles conditions. Le maintien de l’emploi, à lui seul, ne suffit habituellement pas. Une modification unilatérale importante à une condition essentielle peut aussi constituer un congédiement déguisé, ce qui place l’employeur dans la position d’avoir mis fin à la relation sans le dire.',
        ),
        p(
          'Promotions are the moment this is most often missed. A contract signed at hiring for a junior role may not sensibly govern the same person after several advancements, and an old termination clause can be argued to have been displaced by a substantially new bargain. Refresh the agreement at each material change, with consideration attached, rather than discovering the gap at the end.',
          'Les promotions sont le moment où l’on manque le plus souvent ce point. Un contrat signé à l’embauche pour un poste subalterne peut ne plus régir sensément la même personne après plusieurs avancements, et on peut plaider qu’une ancienne clause de cessation d’emploi a été écartée par une entente substantiellement nouvelle. Renouvelez l’entente à chaque changement important, avec une contrepartie, plutôt que de découvrir la faille à la fin.',
        ),
      ],
    },
    {
      heading: bi(
        'Which law governs, and who is even an employee',
        'Quel droit s’applique, et qui est même un employé',
      ),
      blocks: [
        p(
          'Two threshold questions sit underneath every clause above. First, whether the worker is an employee at all: misclassifying an employee as an independent contractor does not remove statutory entitlements, and the label the parties used carries little weight against how the relationship actually operated. Dependent contractors — genuinely independent but economically reliant on one client — occupy a middle category that also attracts reasonable notice.',
          'Deux questions préalables sous-tendent chacune des clauses ci-dessus. D’abord, celle de savoir si le travailleur est bel et bien un employé : classer à tort un employé comme entrepreneur indépendant ne supprime pas les droits légaux, et l’étiquette utilisée par les parties pèse peu face au fonctionnement réel de la relation. Les entrepreneurs dépendants — véritablement indépendants mais économiquement tributaires d’un seul client — forment une catégorie intermédiaire qui donne aussi droit à un préavis raisonnable.',
        ),
        p(
          'Second, which jurisdiction’s standards apply. Most employers are provincially regulated, but a defined set of industries falls under the Canada Labour Code, and an employee working remotely from another province may be governed by that province’s rules rather than the one your office sits in. A governing-law clause does not settle the question, because employment standards legislation applies as public order regardless of what the contract chose.',
          'Ensuite, quelles normes s’appliquent. La plupart des employeurs relèvent du provincial, mais un ensemble défini de secteurs relève du Code canadien du travail, et un employé en télétravail depuis une autre province peut être régi par les règles de cette province plutôt que par celles où se trouve votre bureau. Une clause de droit applicable ne règle pas la question, car la législation sur les normes d’emploi s’applique d’ordre public, quel que soit le choix du contrat.',
        ),
      ],
    },
    {
      heading: bi(
        'Clauses employers most often leave out',
        'Les clauses que les employeurs omettent le plus souvent',
      ),
      blocks: [
        p(
          'Borrowed agreements tend to carry the same familiar terms and omit the same useful ones. These are worth considering deliberately rather than by default:',
          'Les ententes empruntées reprennent souvent les mêmes clauses familières et omettent les mêmes clauses utiles. Celles-ci méritent d’être envisagées délibérément plutôt que par défaut :',
        ),
        li(
          'A temporary-layoff provision. Absent an agreed right to lay off, imposing one can itself be treated as a termination — a lesson many employers learned the expensive way during business interruptions.',
          'Une clause de mise à pied temporaire. En l’absence d’un droit convenu de mise à pied, en imposer une peut être assimilé à une cessation d’emploi — une leçon que bien des employeurs ont apprise à leurs dépens lors d’interruptions d’activité.',
        ),
        li(
          'Written authorization for any permissible payroll deduction, which is generally required before an amount may be withheld.',
          'Une autorisation écrite pour toute retenue salariale permise, généralement exigée avant qu’un montant puisse être retenu.',
        ),
        li(
          'Clear intellectual-property assignment, including work created outside core hours where the role makes that foreseeable.',
          'Une cession claire de propriété intellectuelle, y compris pour les créations réalisées en dehors des heures habituelles lorsque le poste le rend prévisible.',
        ),
        li(
          'A term addressing changes to duties, location, or reporting, so ordinary evolution of the role does not become an argument about constructive dismissal.',
          'Une clause traitant des changements de tâches, de lieu de travail ou de lien hiérarchique, afin que l’évolution normale du poste ne devienne pas un argument de congédiement déguisé.',
        ),
        li(
          'Return of property and records on departure, including material held on personal devices.',
          'La restitution des biens et des dossiers au départ, y compris le matériel conservé sur des appareils personnels.',
        ),
        p(
          "Two cautions on drafting them. Anything that touches an employee's statutory entitlement has to be checked against the applicable legislation rather than assumed portable from another jurisdiction, and a clause borrowed from a United States agreement is more likely to be unenforceable here than merely unusual — at-will employment has no Canadian equivalent, and terms built on that assumption tend to fail.",
          'Deux mises en garde sur leur rédaction. Tout ce qui touche un droit légal de l’employé doit être vérifié au regard de la législation applicable plutôt que présumé transposable d’une autre compétence, et une clause tirée d’une entente américaine risque davantage d’être inapplicable ici que simplement inhabituelle — l’emploi « à volonté » n’a aucun équivalent canadien, et les clauses fondées sur cette prémisse échouent généralement.',
        ),
      ],
    },
    {
      blocks: [
        p(
          'Employment contracts are the single highest-leverage document in the relationship and the one most often assembled from borrowed text. Have your standard agreement reviewed by an employment lawyer in the jurisdiction that governs it, and re-reviewed when the law moves.',
          'Le contrat de travail est le document le plus déterminant de la relation et celui le plus souvent assemblé à partir de textes empruntés. Faites réviser votre entente type par un avocat en droit du travail de la compétence applicable, et faites-la réviser de nouveau lorsque le droit évolue.',
        ),
      ],
    },
  ]
