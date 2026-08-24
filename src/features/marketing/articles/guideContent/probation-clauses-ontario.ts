import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = [
    {
      blocks: [
        p(
          'Probation is one of the most widely misunderstood terms in Canadian employment. Many employers believe a probationary period means an employee can be dismissed freely, with no notice and no exposure, for some fixed opening stretch of the relationship. That belief is wrong in several directions at once, and acting on it is how straightforward hires turn into claims.',
          'La probation est l’une des notions les plus mal comprises en emploi au Canada. Beaucoup d’employeurs croient qu’une période de probation permet de congédier librement, sans préavis ni risque, pendant une portion initiale fixe de la relation. Cette croyance est erronée sur plusieurs plans à la fois, et agir en conséquence transforme des embauches simples en réclamations.',
        ),
        p(
          'The reality is narrower and more procedural. A probationary period is a contractual arrangement that, when properly created and properly run, gives an employer a defined window to assess suitability against a standard that is more forgiving than just cause. It does not suspend employment standards legislation, it does not suspend human-rights protections, and it does not survive being run carelessly.',
          'La réalité est plus étroite et plus procédurale. Une période de probation est un arrangement contractuel qui, lorsqu’il est créé et mené correctement, donne à l’employeur une fenêtre définie pour évaluer l’aptitude selon une norme plus souple que le motif valable. Elle ne suspend pas la législation sur les normes d’emploi, ne suspend pas les protections en matière de droits de la personne et ne survit pas à une gestion négligente.',
        ),
      ],
    },
    {
      heading: bi(
        'Probation is a contractual term, not an automatic right',
        'La probation est une clause contractuelle, non un droit automatique',
      ),
      blocks: [
        p(
          'There is no default probationary period in Ontario employment law. If your contract does not create one in writing, you do not have one. A probationary period exists only because the parties agreed to it before employment began — which means it must appear in a document the employee actually accepted before starting work, not in a handbook handed over on day one.',
          'Il n’existe aucune période de probation par défaut en droit du travail ontarien. Si votre contrat n’en crée pas une par écrit, vous n’en avez pas. Une période de probation n’existe que parce que les parties y ont consenti avant le début de l’emploi — ce qui suppose qu’elle figure dans un document que l’employé a réellement accepté avant de commencer à travailler, et non dans un manuel remis le premier jour.',
        ),
        p(
          'Timing is the detail that most often destroys the clause. An offer accepted verbally, followed by a written agreement signed after the employee has already started, raises the question of what the employee received in exchange for accepting terms they were not bound by. Get acceptance in writing before the first shift, and keep the record of when it happened.',
          'Le moment de la signature est le détail qui détruit le plus souvent la clause. Une offre acceptée verbalement, suivie d’une entente écrite signée après l’entrée en fonction, soulève la question de ce que l’employé a reçu en échange de son acceptation de conditions qui ne le liaient pas. Obtenez l’acceptation par écrit avant le premier quart de travail, et conservez la trace du moment où elle a eu lieu.',
        ),
      ],
    },
    {
      heading: bi('The statutory floor still applies', 'Le plancher légal continue de s’appliquer'),
      blocks: [
        p(
          'Ontario’s Employment Standards Act sets a service threshold below which statutory notice is not owed. Employers often assume their probationary period and that threshold are the same length. There is no rule that makes them the same, and a probationary period drafted to run past the statutory threshold does not suspend the entitlement that has by then accrued. A clause purporting to do so risks being unenforceable in its entirety.',
          'La Loi sur les normes d’emploi de l’Ontario prévoit un seuil de service en deçà duquel aucun préavis légal n’est dû. Les employeurs présument souvent que leur période de probation et ce seuil ont la même durée. Aucune règle ne les rend identiques, et une période de probation rédigée pour se prolonger au-delà du seuil légal ne suspend pas le droit déjà acquis à ce moment. Une clause qui prétendrait le faire risque d’être inapplicable en entier.',
        ),
        p(
          'Human-rights protections apply from the first day regardless. A probationary dismissal that is connected to a disability, a pregnancy, a request for accommodation, or any other protected ground is exposed no matter how the clause is written.',
          'Les protections en matière de droits de la personne s’appliquent dès le premier jour, peu importe. Un congédiement en probation lié à un handicap, à une grossesse, à une demande d’accommodement ou à tout autre motif protégé demeure exposé, quelle que soit la rédaction de la clause.',
        ),
        p(
          'The same is true of reprisal. An employee who raised a health-and-safety concern, asked about unpaid wages, or refused unsafe work is protected from retaliation during probation exactly as afterwards. Where a probationary dismissal follows closely on a protected activity, the timing itself invites scrutiny, and a thin assessment record will not withstand it.',
          'Il en va de même des représailles. L’employé qui a soulevé une préoccupation de santé et sécurité, posé une question sur un salaire impayé ou refusé un travail dangereux est protégé contre les représailles pendant la probation exactement comme après. Lorsqu’un congédiement en probation suit de près une activité protégée, le moment lui-même appelle un examen attentif, et un dossier d’évaluation mince n’y résistera pas.',
        ),
      ],
    },
    {
      heading: bi('What "suitability" actually means', 'Ce que signifie réellement l’« aptitude »'),
      blocks: [
        p(
          'Where a probationary clause is valid, the employer is generally expected to have assessed the employee’s suitability in good faith: to have given them a fair opportunity to demonstrate they could do the job, measured against expectations they were actually told about. Suitability is broader than competence — it can take in reliability, judgement, and fit with the way the team works — but it is not a licence to dismiss for any reason or none.',
          'Lorsqu’une clause de probation est valide, on s’attend généralement à ce que l’employeur ait évalué l’aptitude de l’employé de bonne foi : qu’il lui ait donné une occasion équitable de démontrer sa capacité à faire le travail, en fonction d’attentes qui lui ont réellement été communiquées. L’aptitude est plus large que la compétence — elle peut englober la fiabilité, le jugement et l’intégration à la façon de travailler de l’équipe — mais elle n’autorise pas un congédiement pour n’importe quel motif ou sans motif.',
        ),
        p(
          'A dismissal with no evidence that any assessment occurred is a weak position even inside a well-drafted probationary period. The question a decision-maker asks is not whether the employer was entitled to be dissatisfied, but whether the employer actually turned its mind to suitability and gave the employee a genuine chance to meet a known standard.',
          'Un congédiement sans preuve qu’une évaluation a eu lieu constitue une position fragile, même à l’intérieur d’une période de probation bien rédigée. La question que se pose le décideur n’est pas de savoir si l’employeur avait le droit d’être insatisfait, mais s’il s’est réellement penché sur l’aptitude et a donné à l’employé une véritable chance de satisfaire à une norme connue.',
        ),
      ],
    },
    {
      heading: bi(
        'Running a probationary period that holds up',
        'Mener une période de probation qui tient la route',
      ),
      blocks: [
        li(
          'Write down the expectations for the role and share them at the start, not at the end.',
          'Consignez les attentes liées au poste et communiquez-les dès le départ, et non à la fin.',
        ),
        li(
          'Hold at least one documented check-in before the period closes, while there is still time to correct course.',
          'Tenez au moins une rencontre de suivi documentée avant la fin de la période, pendant qu’il est encore temps de corriger le tir.',
        ),
        li(
          'Say plainly when performance is falling short, and record that you said it — a reassuring conversation followed by a dismissal is difficult to defend.',
          'Dites clairement lorsque le rendement est insuffisant, et consignez que vous l’avez dit — une conversation rassurante suivie d’un congédiement est difficile à défendre.',
        ),
        li(
          'Record the specific, job-related reasons if you decide not to continue the relationship.',
          'Consignez les motifs précis et liés à l’emploi si vous décidez de ne pas poursuivre la relation.',
        ),
        li(
          'Diarize the end of the period — letting it lapse unnoticed removes whatever benefit the clause offered.',
          'Inscrivez la fin de la période à l’agenda — la laisser s’écouler sans s’en apercevoir supprime tout avantage qu’offrait la clause.',
        ),
        li(
          'Pay whatever statutory entitlement has accrued even where you are satisfied the probationary standard was met; the clause governs the assessment, not the statutory floor.',
          'Versez tout droit légal accumulé même si vous êtes convaincu que la norme de probation a été respectée; la clause régit l’évaluation, non le plancher légal.',
        ),
      ],
    },
    {
      heading: bi(
        'Extending, and other things that quietly go wrong',
        'La prolongation, et ce qui déraille discrètement',
      ),
      blocks: [
        p(
          'Extending a probationary period is not automatic. Unless the contract expressly permits an extension, doing so is a change to an agreed term and raises the same consideration problem as any mid-employment amendment. An extension imposed unilaterally may simply be ineffective, leaving the employer past the original end of the period with none of its benefit.',
          'La prolongation d’une période de probation n’est pas automatique. À moins que le contrat ne la permette expressément, la prolongation modifie une condition convenue et soulève le même problème de contrepartie que toute modification en cours d’emploi. Une prolongation imposée unilatéralement peut être tout simplement inopérante, laissant l’employeur au-delà de la fin initiale de la période sans aucun de ses avantages.',
        ),
        p(
          'Two more patterns cause avoidable trouble. Rehiring a former employee into a fresh probationary period ignores that prior service may count toward statutory entitlements. And applying a probationary clause to an internal promotion is usually ineffective, because the employee is already employed and the new terms need their own consideration.',
          'Deux autres pratiques causent des ennuis évitables. Réembaucher un ancien employé avec une nouvelle période de probation fait abstraction du fait que le service antérieur peut compter dans les droits légaux. Et appliquer une clause de probation à une promotion interne est généralement inopérant, puisque l’employé est déjà en poste et que les nouvelles conditions exigent leur propre contrepartie.',
        ),
      ],
    },
    {
      heading: bi('Four assumptions worth discarding', 'Quatre présomptions à écarter'),
      blocks: [
        p(
          'Most probation disputes trace back to a small set of beliefs that sound reasonable and are not correct:',
          'La plupart des litiges liés à la probation remontent à un petit nombre de croyances qui semblent raisonnables et ne le sont pas :',
        ),
        li(
          '"Probationary employees can be let go without notice." Statutory notice depends on length of service, not on what the contract calls the period. Once the service threshold is passed, notice is owed whatever the clause says.',
          '« On peut congédier un employé en probation sans préavis. » Le préavis légal dépend de la durée du service, non de l’appellation que le contrat donne à la période. Une fois le seuil de service franchi, le préavis est dû quoi qu’en dise la clause.',
        ),
        li(
          '"We don\'t need a reason during probation." You need a reason connected to suitability, assessed in good faith, and you need to be able to show you formed it. Not needing just cause is not the same as not needing anything.',
          '« Nous n’avons pas besoin de motif pendant la probation. » Il faut un motif lié à l’aptitude, apprécié de bonne foi, et il faut pouvoir démontrer que vous l’avez formé. Ne pas exiger de motif valable n’équivaut pas à n’exiger rien.',
        ),
        li(
          '"The handbook says employees are probationary, so they are." A policy document circulated after hiring generally does not create a contractual term the employee agreed to before starting.',
          '« Le manuel dit que les employés sont en probation, donc ils le sont. » Un document de politique diffusé après l’embauche ne crée généralement pas une condition contractuelle acceptée par l’employé avant son entrée en fonction.',
        ),
        li(
          '"Probation protects us from a human-rights complaint." It does not, at any point. Protected grounds and reprisal protections operate from the first day of employment onward.',
          '« La probation nous protège d’une plainte en droits de la personne. » Elle ne le fait à aucun moment. Les motifs protégés et les protections contre les représailles s’appliquent dès la première journée d’emploi.',
        ),
      ],
    },
    {
      heading: bi('If it is not working out', 'Si cela ne fonctionne pas'),
      blocks: [
        p(
          'Deciding not to continue is a legitimate outcome of a probationary period, and handling it well costs very little. Confirm the period has not already lapsed, confirm what statutory entitlement has accrued and pay it without argument, and write the reason down in job-related terms before the meeting rather than reconstructing it afterwards.',
          'Décider de ne pas poursuivre est une issue légitime d’une période de probation, et bien la gérer coûte très peu. Confirmez que la période n’est pas déjà écoulée, confirmez le droit légal accumulé et versez-le sans discuter, et consignez le motif en termes liés à l’emploi avant la rencontre plutôt que de le reconstituer après coup.',
        ),
        p(
          'Resist the temptation to soften the message into something that does not match the file. Telling a departing employee the role was eliminated, when the reason was suitability, creates an inconsistency that surfaces the moment the position is reposted. Brief, accurate, and consistent survives scrutiny; kind-but-inaccurate does not.',
          'Résistez à la tentation d’adoucir le message jusqu’à ce qu’il ne corresponde plus au dossier. Dire à un employé qui part que le poste a été aboli, alors que le motif était l’aptitude, crée une incohérence qui refait surface dès que le poste est réaffiché. Bref, exact et cohérent résiste à l’examen; bienveillant mais inexact, non.',
        ),
      ],
    },
    {
      blocks: [
        p(
          'Have an employment lawyer review your standard offer and probationary language once, properly. It is the cheapest point in the entire employment relationship at which to fix this, and the clause you use is likely to be reused across every hire you make.',
          'Faites réviser une fois, sérieusement, votre offre type et votre libellé de probation par un avocat en droit du travail. C’est le moment le moins coûteux de toute la relation d’emploi pour corriger la situation, et la clause utilisée sera vraisemblablement reprise pour chaque embauche.',
        ),
      ],
    },
  ]
