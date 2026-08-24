import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = [
    {
      blocks: [
        p(
          'Ending employment in Ontario engages at least two separate sources of obligation, and confusing them is the most common and most expensive mistake employers make. The Employment Standards Act, 2000 sets statutory minimums. The common law — judge-made contract law — may require considerably more unless the employment contract validly limits it.',
          'Mettre fin à un emploi en Ontario met en jeu au moins deux sources d’obligations distinctes, et les confondre est l’erreur la plus fréquente et la plus coûteuse des employeurs. La Loi de 2000 sur les normes d’emploi établit des minimums légaux. La common law — le droit des contrats élaboré par les tribunaux — peut exiger beaucoup plus, à moins que le contrat de travail ne limite validement cette obligation.',
        ),
        p(
          'This guide sets out how those sources interact, what each one actually governs, and the decision points worth settling before a termination meeting rather than after it. It deliberately quotes no notice periods or thresholds: those vary by jurisdiction and fact pattern, they change, and a figure repeated out of context becomes a representation the moment it is wrong. Name the statute, understand the shape of the rule, then confirm the specifics against the current official text.',
          'Ce guide expose comment ces sources interagissent, ce que chacune régit réellement, et les points de décision qu’il vaut mieux régler avant une rencontre de cessation d’emploi plutôt qu’après. Il ne cite délibérément aucune période de préavis ni aucun seuil : ceux-ci varient selon la compétence et les faits, ils changent, et un chiffre répété hors contexte devient une affirmation dès qu’il est erroné. Nommez la loi, comprenez la logique de la règle, puis validez les détails dans le texte officiel en vigueur.',
        ),
      ],
    },
    {
      heading: bi(
        'Two sources of obligation, not one',
        'Deux sources d’obligations, et non une seule',
      ),
      blocks: [
        p(
          'The ESA is public-order legislation: it sets minimum entitlements that an employment contract cannot reduce, and an agreement purporting to do so is void to that extent. It governs written notice of termination, and in defined circumstances a separate severance entitlement, along with continuation of certain benefits during the statutory notice period.',
          'La LNE est une loi d’ordre public : elle établit des droits minimaux qu’un contrat de travail ne peut réduire, et une entente qui prétendrait le faire est nulle dans cette mesure. Elle régit le préavis écrit de cessation d’emploi et, dans des circonstances définies, une indemnité de licenciement distincte, ainsi que le maintien de certains avantages sociaux pendant la période de préavis légal.',
        ),
        p(
          'The common law sits on top of it and asks a different question: absent an enforceable agreement to the contrary, what period of reasonable notice does this particular employee deserve? That assessment weighs the character of the role, length of service, age, and the availability of comparable work. It is holistic rather than formulaic, and it commonly produces an entitlement well beyond the statutory floor — which is precisely why the enforceability of the termination clause matters so much.',
          'La common law s’y superpose et pose une question différente : en l’absence d’une entente exécutoire contraire, quel préavis raisonnable cet employé précis mérite-t-il? Cette évaluation soupèse la nature du poste, la durée du service, l’âge et la disponibilité d’un emploi comparable. Elle est globale plutôt que formulaire, et produit couramment un droit largement supérieur au plancher légal — ce qui explique précisément pourquoi le caractère exécutoire de la clause de cessation d’emploi compte autant.',
        ),
      ],
    },
    {
      heading: bi(
        'Statutory notice is a floor, not a ceiling',
        'Le préavis légal est un plancher, pas un plafond',
      ),
      blocks: [
        p(
          'The ESA entitles most non-union employees to a minimum period of written notice of termination, scaling with length of service. That minimum is exactly that — a minimum. An employee whose contract does not clearly and enforceably limit them to the statutory floor is generally entitled to common-law reasonable notice instead, which is assessed case by case and is frequently far longer.',
          'La LNE donne à la plupart des employés non syndiqués droit à une période minimale de préavis écrit de cessation d’emploi, proportionnelle à la durée du service. Ce minimum n’est rien de plus qu’un minimum. L’employé dont le contrat ne le limite pas clairement et validement au plancher légal a généralement droit au préavis raisonnable de la common law, évalué au cas par cas et souvent bien plus long.',
        ),
        p(
          'Ontario courts have repeatedly struck down termination clauses that fall short of the ESA in any respect — including in parts of the clause the employer never sought to rely on. When a clause fails, it usually fails entirely, and the employee falls back to common-law notice. This is why the drafting of the contract, years before any termination, so often decides the cost of it.',
          'Les tribunaux ontariens ont invalidé à répétition des clauses de cessation d’emploi qui ne respectent pas la LNE sous quelque aspect que ce soit — y compris dans des parties de la clause que l’employeur n’invoquait même pas. Lorsqu’une clause échoue, elle échoue généralement en entier, et l’employé se rabat sur le préavis de common law. C’est pourquoi la rédaction du contrat, des années avant toute cessation d’emploi, en détermine si souvent le coût.',
        ),
      ],
    },
    {
      heading: bi(
        'Why termination clauses fail so often',
        'Pourquoi les clauses de cessation d’emploi échouent si souvent',
      ),
      blocks: [
        p(
          'The failure modes are well worn and largely avoidable. Reviewing your standard agreement against this list is the cheapest risk reduction available to most employers:',
          'Les causes d’échec sont bien connues et largement évitables. Comparer votre entente type à cette liste est la réduction de risque la moins coûteuse dont disposent la plupart des employeurs :',
        ),
        li(
          'Language that could produce less than the statutory minimum in some scenario — even a scenario that never occurred and that the employer never invoked.',
          'Un libellé qui pourrait produire moins que le minimum légal dans un scénario donné — même un scénario qui ne s’est jamais réalisé et que l’employeur n’a jamais invoqué.',
        ),
        li(
          'A "just cause" carve-out drafted more broadly than the narrow statutory standard for disentitlement, which can invalidate the clause even where the departure had nothing to do with cause.',
          'Une exception pour « motif valable » rédigée plus largement que la norme légale étroite de privation du droit, ce qui peut invalider la clause même lorsque le départ n’avait rien à voir avec un motif.',
        ),
        li(
          'Silence on benefit continuation during the statutory notice period, or wording that appears to end coverage on the last day worked.',
          'Le silence sur le maintien des avantages sociaux pendant la période de préavis légal, ou un libellé qui semble mettre fin à la couverture le dernier jour travaillé.',
        ),
        li(
          'A clause that was valid when signed but was overtaken by a later promotion or a materially changed role, without a refreshed agreement.',
          'Une clause valide à la signature, mais dépassée par une promotion ultérieure ou une modification importante du poste, sans entente renouvelée.',
        ),
        p(
          'Courts generally do not rewrite a defective clause to make it lawful, and generally do not sever the offending words to save the rest. The clause fails and reasonable notice applies. A sentence copied from a borrowed template becomes the most expensive line in the document.',
          'Les tribunaux ne réécrivent généralement pas une clause défectueuse pour la rendre licite, et n’en retranchent généralement pas les mots fautifs pour sauver le reste. La clause échoue et le préavis raisonnable s’applique. Une phrase copiée d’un modèle emprunté devient la ligne la plus coûteuse du document.',
        ),
      ],
    },
    {
      heading: bi(
        'Working notice, pay in lieu, or a combination',
        'Préavis travaillé, indemnité en tenant lieu, ou une combinaison',
      ),
      blocks: [
        p(
          'An employer can give notice and have the employee continue working through it, pay the equivalent amount instead, or combine the two. The choice is a practical one, and it has consequences beyond cash:',
          'Un employeur peut donner un préavis et laisser l’employé travailler pendant celui-ci, verser plutôt l’équivalent en argent, ou combiner les deux. Le choix est pratique, et ses conséquences dépassent la simple trésorerie :',
        ),
        li(
          'Benefit continuation through the statutory notice period is generally required, whichever route you choose.',
          'Le maintien des avantages sociaux pendant la période de préavis légal est généralement exigé, quelle que soit l’option retenue.',
        ),
        li(
          'Working notice depends on the role remaining workable — it rarely suits a departure that follows a conflict or a loss of trust.',
          'Le préavis travaillé suppose que le poste demeure viable — il convient rarement à un départ qui fait suite à un conflit ou à une perte de confiance.',
        ),
        li(
          'Working notice generally only counts once the employee has been told clearly and unambiguously when employment ends; a vague warning that change is coming does not start the clock.',
          'Le préavis travaillé ne compte généralement qu’à partir du moment où l’employé a été informé clairement et sans ambiguïté de la date de fin d’emploi; un avertissement vague annonçant des changements ne déclenche rien.',
        ),
        li(
          'A Record of Employment must still be issued on the applicable timeline regardless of the structure.',
          'Un relevé d’emploi doit tout de même être produit dans le délai applicable, peu importe la structure retenue.',
        ),
        p(
          'Where the parting is amicable and the role is genuinely still productive, working notice can reduce cost substantially. Where trust has broken down, attempting it tends to produce a worse outcome than paying — a disengaged employee in a sensitive role is a risk that rarely justifies the saving.',
          'Lorsque la séparation est à l’amiable et que le poste demeure réellement productif, le préavis travaillé peut réduire les coûts de façon appréciable. Lorsque la confiance est rompue, tenter cette avenue produit généralement un résultat pire que de payer — un employé désengagé dans un poste sensible représente un risque qui justifie rarement l’économie.',
        ),
      ],
    },
    {
      heading: bi(
        'Severance pay is a separate entitlement',
        'L’indemnité de licenciement est un droit distinct',
      ),
      blocks: [
        p(
          'In Ontario, statutory severance pay is not the same thing as termination notice, and it is not an alternative to it. It is a separate entitlement that arises only when specific conditions about the employee’s length of service and the employer’s payroll are met. Employers routinely treat the two as interchangeable and underpay as a result. Confirm whether severance is engaged before you calculate anything.',
          'En Ontario, l’indemnité de licenciement prévue par la loi n’est pas la même chose que le préavis de cessation d’emploi, et elle ne s’y substitue pas. Il s’agit d’un droit distinct qui ne prend naissance que lorsque des conditions précises relatives à la durée de service de l’employé et à la masse salariale de l’employeur sont réunies. Les employeurs traitent régulièrement les deux comme interchangeables et versent des montants insuffisants. Vérifiez si l’indemnité de licenciement s’applique avant de calculer quoi que ce soit.',
        ),
        p(
          'Two details catch employers repeatedly. The payroll condition is not necessarily limited to the Ontario operation, so a business with employees elsewhere may qualify when it assumed it would not. And severance is generally payable in addition to notice rather than instead of it — an employer that pays only the larger of the two has usually underpaid.',
          'Deux détails piègent les employeurs à répétition. Le critère de masse salariale ne se limite pas nécessairement aux activités ontariennes, de sorte qu’une entreprise ayant des employés ailleurs peut y être assujettie alors qu’elle présumait le contraire. Et l’indemnité de licenciement est généralement payable en sus du préavis plutôt qu’à sa place — l’employeur qui ne verse que le plus élevé des deux a habituellement payé en deçà de ses obligations.',
        ),
      ],
    },
    {
      heading: bi(
        'What continues after the last day worked',
        'Ce qui se poursuit après le dernier jour travaillé',
      ),
      blocks: [
        p(
          'Termination is not a clean stop, and treating it as one creates avoidable liability. Confirm the position on each of these before the meeting:',
          'Une cessation d’emploi n’est pas un arrêt net, et la traiter comme tel crée une responsabilité évitable. Confirmez la position sur chacun de ces points avant la rencontre :',
        ),
        li(
          'Benefit coverage through the statutory notice period, and whether your insurer will actually continue it — some policies will not cover a terminated employee, which leaves the employer exposed for what the coverage would have paid.',
          'La couverture des avantages sociaux pendant la période de préavis légal, et la question de savoir si votre assureur la maintiendra réellement — certaines polices ne couvrent pas un employé licencié, ce qui expose l’employeur à hauteur de ce que la couverture aurait versé.',
        ),
        li(
          'Vacation pay accrued but not taken, and vacation accruing during the notice period itself.',
          'L’indemnité de vacances accumulée mais non prise, et les vacances qui s’accumulent pendant la période de préavis elle-même.',
        ),
        li(
          'Bonus, commission, and equity treatment — governed by the plan document read together with the contract, not by custom.',
          'Le traitement des primes, des commissions et des actions — régi par le document du régime lu avec le contrat, et non par l’usage.',
        ),
        li(
          'Any obligation that survives the relationship, such as confidentiality or the return of property and records.',
          'Toute obligation qui survit à la relation, comme la confidentialité ou la restitution des biens et des dossiers.',
        ),
      ],
    },
    {
      heading: bi(
        'Just cause is narrower than most employers assume',
        'Le motif valable est plus étroit que ne le présument la plupart des employeurs',
      ),
      blocks: [
        p(
          'Just cause is often described as the capital punishment of employment law, and the description is apt. The conduct must be serious enough to repudiate the employment relationship, assessed proportionally against the employee’s record and the circumstances. Poor performance, without a documented history of clear expectations, warnings, and an opportunity to improve, rarely meets it.',
          'On décrit souvent le motif valable comme la peine capitale du droit du travail, et la formule est juste. La conduite doit être suffisamment grave pour répudier la relation d’emploi, appréciée de façon proportionnelle au dossier de l’employé et aux circonstances. Le rendement insuffisant, en l’absence d’un historique documenté d’attentes claires, d’avertissements et d’une occasion de s’améliorer, y satisfait rarement.',
        ),
        p(
          'Ontario adds a further trap: the statutory standard for disentitlement to ESA notice is narrower still than the common-law standard for just cause. An employer can therefore succeed in establishing common-law cause and yet still owe the statutory minimum. An allegation that fails altogether can worsen exposure rather than limit it, by supporting a claim that the employer acted in bad faith. Treat cause as a decision to make with counsel, never as a default posture.',
          'L’Ontario ajoute un piège supplémentaire : la norme légale de privation du préavis prévu par la LNE est encore plus étroite que la norme de common law relative au motif valable. Un employeur peut donc établir un motif au sens de la common law et devoir tout de même le minimum légal. Une allégation qui échoue complètement peut aggraver l’exposition plutôt que la limiter, en appuyant une prétention de mauvaise foi. Traitez le motif comme une décision à prendre avec un conseiller juridique, jamais comme une position par défaut.',
        ),
      ],
    },
    {
      heading: bi(
        'Constructive dismissal: the ending nobody announced',
        'Le congédiement déguisé : la fin que personne n’a annoncée',
      ),
      blocks: [
        p(
          'An employer can terminate employment without ever saying so. A unilateral change to a fundamental term — compensation, reporting line, location, scope of responsibility — can amount to constructive dismissal, entitling the employee to treat the relationship as ended and claim notice. Restructurings, demotions dressed as reorganizations, and pay changes imposed without agreement are the usual sources.',
          'Un employeur peut mettre fin à un emploi sans jamais le dire. Une modification unilatérale d’une condition essentielle — rémunération, lien hiérarchique, lieu de travail, étendue des responsabilités — peut constituer un congédiement déguisé, permettant à l’employé de considérer la relation comme terminée et de réclamer un préavis. Les restructurations, les rétrogradations présentées comme des réorganisations et les changements de rémunération imposés sans entente en sont les sources habituelles.',
        ),
        p(
          'The safer path is to treat a material change as what it is: either negotiate it with genuine consideration, or give proper notice of the change so that it takes effect only after a period matching what would have been owed on termination. Imposing it and hoping nobody objects is the approach that generates claims.',
          'La voie la plus sûre consiste à traiter un changement important pour ce qu’il est : soit le négocier avec une contrepartie véritable, soit donner un préavis en bonne et due forme du changement pour qu’il ne prenne effet qu’après une période correspondant à ce qui aurait été dû en cas de cessation d’emploi. L’imposer en espérant que personne ne s’y oppose est l’approche qui engendre des réclamations.',
        ),
      ],
    },
    {
      heading: bi(
        'Terminating several people at once changes the analysis',
        'Mettre fin à plusieurs emplois à la fois change l’analyse',
      ),
      blocks: [
        p(
          'When a number of employees are terminated at one establishment within a short window, Ontario’s mass-termination rules can apply. They can enlarge the notice owed and add a filing obligation with the province, and the notice period may not begin until that filing is made. If you are contemplating more than a couple of departures in the same period, treat this as a threshold question rather than a detail to resolve later.',
          'Lorsqu’un certain nombre d’employés sont licenciés dans un même établissement à l’intérieur d’une courte période, les règles ontariennes sur les licenciements collectifs peuvent s’appliquer. Elles peuvent allonger le préavis dû et ajouter une obligation de dépôt auprès de la province, et la période de préavis peut ne commencer qu’au moment de ce dépôt. Si vous envisagez plus de quelques départs dans la même période, traitez cette question comme préalable plutôt que comme un détail à régler plus tard.',
        ),
        p(
          'The definition of an establishment is not always intuitive, and remote workers attached to a location can complicate the count. Because the consequence of getting this wrong is that notice never validly started running, confirm the analysis before any communication goes out rather than after.',
          'La définition d’un établissement n’est pas toujours intuitive, et les travailleurs à distance rattachés à un lieu peuvent compliquer le décompte. Comme la conséquence d’une erreur est que le préavis n’a jamais valablement commencé à courir, validez l’analyse avant l’envoi de toute communication plutôt qu’après.',
        ),
      ],
    },
    {
      heading: bi('Before you act', 'Avant d’agir'),
      blocks: [
        li(
          'Read the actual employment contract, including any offer letter, and note whether a termination clause exists and what it says.',
          'Lisez le contrat de travail réel, y compris toute lettre d’offre, et notez si une clause de cessation d’emploi existe et ce qu’elle prévoit.',
        ),
        li(
          'Confirm the employee is covered by the ESA — some occupations and arrangements are treated differently, and federally regulated employers follow the Canada Labour Code instead.',
          'Confirmez que l’employé est visé par la LNE — certaines professions et situations sont traitées différemment, et les employeurs de compétence fédérale relèvent plutôt du Code canadien du travail.',
        ),
        li(
          'Check whether the reason for termination touches a protected ground or a protected activity, which raises human-rights and reprisal questions on top of notice.',
          'Vérifiez si le motif de cessation d’emploi touche un motif protégé ou une activité protégée, ce qui soulève des questions de droits de la personne et de représailles en plus du préavis.',
        ),
        li(
          'Confirm whether the employee is on a statutory leave, which can carry reinstatement protections independent of anything the contract says.',
          'Vérifiez si l’employé est en congé prévu par la loi, ce qui peut comporter des protections de réintégration indépendantes de ce que prévoit le contrat.',
        ),
        li(
          'Settle the reason you will give and make sure the letter, the meeting, and the Record of Employment all say the same thing.',
          'Arrêtez le motif que vous invoquerez et assurez-vous que la lettre, la rencontre et le relevé d’emploi disent tous la même chose.',
        ),
        li(
          'Get the numbers reviewed by an employment lawyer before the termination meeting, not after it.',
          'Faites réviser les montants par un avocat en droit du travail avant la rencontre de cessation d’emploi, et non après.',
        ),
      ],
    },
    {
      blocks: [
        p(
          'Dutiva helps you assemble and document the paperwork around a termination consistently — the letter, the record, the checklist of what was provided and when. It does not calculate your entitlements or tell you what is owed, and it is not a substitute for legal advice on a specific departure.',
          'Dutiva vous aide à réunir et à documenter les pièces entourant une cessation d’emploi de façon uniforme — la lettre, le dossier, la liste de ce qui a été remis et à quel moment. Il ne calcule pas vos obligations ni ne vous indique ce qui est dû, et il ne remplace pas un avis juridique sur un départ précis.',
        ),
      ],
    },
  ]
