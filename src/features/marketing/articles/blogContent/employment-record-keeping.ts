import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = [
    {
      blocks: [
        p(
          'Record-keeping pulls in two directions at once. Employment standards legislation requires employers to keep specified records for a set period. Privacy law requires that personal information not be retained beyond the purpose it was collected for. Employers who notice only the first obligation accumulate everything forever; employers who notice only the second delete material they were required to hold. Both are compliance failures.',
          'La tenue de dossiers tire dans deux directions à la fois. La législation sur les normes d’emploi oblige les employeurs à conserver des documents précis pendant une période déterminée. Les lois sur la protection de la vie privée exigent que les renseignements personnels ne soient pas conservés au-delà de la fin pour laquelle ils ont été recueillis. L’employeur qui ne voit que la première obligation accumule tout indéfiniment; celui qui ne voit que la seconde supprime des documents qu’il devait conserver. Les deux constituent des manquements.',
        ),
      ],
    },
    {
      heading: bi('What generally has to be kept', 'Ce qui doit généralement être conservé'),
      blocks: [
        li(
          'Identifying and start-date information for each employee.',
          'Les renseignements d’identification et la date d’entrée en fonction de chaque employé.',
        ),
        li(
          'Hours worked, wages paid, and the deductions applied.',
          'Les heures travaillées, les salaires versés et les retenues appliquées.',
        ),
        li(
          'Vacation and holiday entitlements taken and owing.',
          'Les droits aux vacances et aux jours fériés pris et à payer.',
        ),
        li(
          'Leaves taken, and any agreements about hours or overtime arrangements.',
          'Les congés pris, ainsi que toute entente sur les heures ou les modalités de temps supplémentaire.',
        ),
        li(
          'Records relating to the end of employment, including what was paid and when.',
          'Les documents relatifs à la fin d’emploi, y compris ce qui a été payé et à quel moment.',
        ),
        p(
          'Retention periods and the precise list vary by jurisdiction, and payroll and tax records carry their own separate requirements. Look up the periods that apply to you rather than adopting a single number for everything.',
          'Les périodes de conservation et la liste exacte varient selon la compétence, et les documents de paie et fiscaux comportent leurs propres exigences distinctes. Vérifiez les périodes qui vous sont applicables plutôt que d’adopter un chiffre unique pour tout.',
        ),
      ],
    },
    {
      heading: bi(
        'Keep the record findable, not just stored',
        'Rendez le dossier repérable, pas seulement stocké',
      ),
      blocks: [
        p(
          'A retained record you cannot locate provides no protection. Inspections and claims arrive with deadlines, and an employer who cannot produce the relevant file within them is in much the same position as one who never kept it. Structure matters more than volume: one place per employee, consistent naming, and a clear rule about what belongs in the personnel file versus a manager’s own notes.',
          'Un dossier conservé mais introuvable n’offre aucune protection. Les inspections et les réclamations arrivent avec des délais, et l’employeur incapable de produire le dossier pertinent dans ces délais se trouve à peu près dans la même position que celui qui ne l’a jamais conservé. La structure compte plus que le volume : un seul emplacement par employé, une nomenclature uniforme et une règle claire sur ce qui appartient au dossier du personnel par opposition aux notes personnelles d’un gestionnaire.',
        ),
      ],
    },
    {
      heading: bi(
        'Sensitive categories need tighter handling',
        'Les catégories sensibles exigent un traitement plus strict',
      ),
      blocks: [
        p(
          'Medical and accommodation information should be held separately from the general personnel file, with access limited to those who genuinely need it. The same applies to investigation material about harassment or misconduct. Over-broad internal access to these categories is a common finding against employers and is straightforward to avoid at the point where the file is set up.',
          'Les renseignements médicaux et d’accommodement devraient être conservés à part du dossier du personnel général, avec un accès limité aux personnes qui en ont véritablement besoin. Il en va de même du matériel d’enquête portant sur le harcèlement ou l’inconduite. Un accès interne trop large à ces catégories est un reproche fréquemment formulé aux employeurs et se prévient aisément au moment de la création du dossier.',
        ),
      ],
    },
    {
      heading: bi(
        'Building a retention schedule that resolves the conflict',
        'Bâtir un calendrier de conservation qui règle le conflit',
      ),
      blocks: [
        p(
          'The way to reconcile the two obligations is to stop treating "the employee file" as a single object with a single lifespan. Break it into categories, and give each one a retention period derived from the rule that governs it:',
          'Pour concilier les deux obligations, il faut cesser de traiter « le dossier de l’employé » comme un objet unique doté d’une seule durée de vie. Découpez-le en catégories et attribuez à chacune une période de conservation issue de la règle qui la régit :',
        ),
        li(
          'Payroll and hours records, governed by employment standards and tax requirements, which typically run from the end of the employment or the tax year rather than from the date each entry was made.',
          'Les registres de paie et d’heures, régis par les normes d’emploi et les exigences fiscales, dont le décompte part généralement de la fin de l’emploi ou de l’année d’imposition plutôt que de la date de chaque inscription.',
        ),
        li(
          'Contractual documents, kept while any claim arising from them remains possible.',
          'Les documents contractuels, conservés tant qu’une réclamation en découlant demeure possible.',
        ),
        li(
          'Medical and accommodation material, held only as long as the accommodation and any related obligation continues, then disposed of on schedule.',
          'Le matériel médical et d’accommodement, conservé seulement tant que l’accommodement et toute obligation connexe se poursuivent, puis éliminé selon le calendrier.',
        ),
        li(
          'Investigation records, retained on their own basis given the possibility of later proceedings.',
          'Les dossiers d’enquête, conservés selon leur propre logique compte tenu de la possibilité de procédures ultérieures.',
        ),
        li(
          'Recruitment material for candidates who were not hired, which usually has the shortest justified life of anything on this list.',
          'Le matériel de recrutement des personnes candidates non retenues, dont la durée de vie justifiée est habituellement la plus courte de cette liste.',
        ),
        p(
          'Write the schedule down, assign an owner by role, and make disposal something that happens on a cycle rather than when storage runs short. A schedule that is applied inconsistently is harder to defend than a generous one applied uniformly, because the exceptions are what get examined.',
          'Consignez le calendrier par écrit, désignez un responsable par fonction, et faites de l’élimination une opération cyclique plutôt qu’une réaction au manque d’espace. Un calendrier appliqué de façon inégale est plus difficile à défendre qu’un calendrier généreux appliqué uniformément, car ce sont les exceptions qui sont examinées.',
        ),
      ],
    },
    {
      heading: bi(
        'Two things that override the schedule',
        'Deux éléments qui priment le calendrier',
      ),
      blocks: [
        p(
          'The first is a legal hold. Once a dispute is live or reasonably anticipated, routine disposal of anything touching it has to stop, even where the retention period has expired. Destroying relevant material after a claim is foreseeable is a materially worse problem than having kept it, and the fact that a scheduled process did it automatically is not much of an answer. Make sure whoever runs the disposal cycle can suspend it, and that someone is responsible for telling them to.',
          'Le premier est la suspension pour litige. Dès qu’un différend est en cours ou raisonnablement prévisible, l’élimination courante de tout élément s’y rapportant doit cesser, même si la période de conservation est expirée. Détruire du matériel pertinent alors qu’une réclamation est prévisible constitue un problème nettement plus grave que de l’avoir conservé, et le fait qu’un processus planifié l’ait fait automatiquement n’est guère une réponse. Assurez-vous que la personne qui exécute le cycle d’élimination puisse le suspendre, et que quelqu’un ait la responsabilité de le lui demander.',
        ),
        p(
          "The second is an employee's right to access their own information, which exists in some form under the privacy regime that applies to you. Requests tend to arrive at the least convenient moment, often alongside a dispute, and the response is easier when records are organized by person and category than when they are scattered across mailboxes and shared drives. Structuring the file well is what makes both obligations manageable at once.",
          'Le second est le droit de l’employé d’accéder à ses propres renseignements, qui existe sous une forme ou une autre dans le régime de protection de la vie privée qui vous est applicable. Les demandes arrivent souvent au moment le moins commode, fréquemment en parallèle d’un litige, et la réponse est plus simple lorsque les dossiers sont organisés par personne et par catégorie que lorsqu’ils sont éparpillés dans des boîtes de courriel et des lecteurs partagés. C’est la bonne structuration du dossier qui rend les deux obligations gérables en même temps.',
        ),
      ],
    },
    {
      heading: bi(
        'Records held in systems you do not own',
        'Des dossiers hébergés dans des systèmes qui ne vous appartiennent pas',
      ),
      blocks: [
        p(
          'Most employment records now live in software — payroll platforms, applicant tracking systems, shared drives, messaging tools. That does not move the obligation anywhere. The employer remains accountable for information it collects about its employees regardless of which vendor stores it, and a retention schedule that only governs the filing cabinet governs almost nothing.',
          'La plupart des dossiers d’emploi résident aujourd’hui dans des logiciels — plateformes de paie, systèmes de suivi des candidatures, lecteurs partagés, outils de messagerie. Cela ne déplace l’obligation nulle part. L’employeur demeure responsable des renseignements qu’il recueille sur ses employés, quel que soit le fournisseur qui les stocke, et un calendrier de conservation qui ne régit que le classeur ne régit à peu près rien.',
        ),
        li(
          'Know where each category of record actually lives, including copies that accumulate in mailboxes and chat history.',
          'Sachez où réside réellement chaque catégorie de dossier, y compris les copies qui s’accumulent dans les boîtes de courriel et les historiques de clavardage.',
        ),
        li(
          'Check what your agreement with each vendor says about retention, deletion, and what happens to the data if the relationship ends.',
          'Vérifiez ce que votre entente avec chaque fournisseur prévoit quant à la conservation, à la suppression et au sort des données si la relation prend fin.',
        ),
        li(
          'Confirm whether the applicable privacy regime constrains where information may be stored or processed, and whether you have to disclose that to employees.',
          'Confirmez si le régime de protection de la vie privée applicable encadre l’endroit où les renseignements peuvent être conservés ou traités, et si vous devez en informer les employés.',
        ),
        li(
          'Review access permissions on the same cycle as the retention schedule — access granted for a project and never revoked is the most common quiet exposure.',
          'Révisez les autorisations d’accès selon le même cycle que le calendrier de conservation — un accès accordé pour un projet et jamais révoqué est l’exposition discrète la plus courante.',
        ),
        li(
          "Make sure departing managers' files and notes are captured, rather than leaving the only record of a performance history in an individual's personal storage.",
          'Assurez-vous que les fichiers et notes des gestionnaires qui partent sont récupérés, plutôt que de laisser l’unique trace d’un historique de rendement dans l’espace personnel d’une personne.',
        ),
      ],
    },
    {
      blocks: [
        p(
          'Write down a retention schedule that reflects both obligations, apply it consistently, and suspend deletion for anything touched by a live or reasonably anticipated dispute. Dutiva keeps generated documents and their history in one place; the retention decisions themselves stay yours.',
          'Établissez par écrit un calendrier de conservation qui reflète les deux obligations, appliquez-le de façon uniforme et suspendez toute suppression visant un élément touché par un litige en cours ou raisonnablement prévisible. Dutiva regroupe en un seul endroit les documents générés et leur historique; les décisions de conservation, elles, vous appartiennent.',
        ),
      ],
    },
  ]
