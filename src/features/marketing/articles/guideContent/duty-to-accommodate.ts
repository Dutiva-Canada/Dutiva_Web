import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = [
  {
    blocks: [
      p(
        'Human-rights legislation across Canada requires employers to accommodate employees in relation to protected grounds — disability most often, but also family status, religion, pregnancy, and others — up to the point of undue hardship. The obligation is not discretionary, and it is triggered by the employer becoming aware of a need, not by a formally worded request.',
        'Les lois sur les droits de la personne partout au Canada exigent des employeurs qu’ils accommodent les employés en lien avec des motifs protégés — le handicap le plus souvent, mais aussi la situation de famille, la religion, la grossesse et d’autres — jusqu’au point de contrainte excessive. L’obligation n’est pas discrétionnaire, et elle est déclenchée par la connaissance qu’a l’employeur d’un besoin, et non par une demande formulée en bonne et due forme.',
      ),
      p(
        'That trigger is worth dwelling on, because it is where employers most often start from the wrong place. There is no magic word. An employee who says they are struggling since a diagnosis, or that a shift pattern conflicts with a caregiving obligation, has raised the duty just as effectively as one who files a written request. Where the need is obvious from circumstances, the obligation can arise even without the employee raising it at all.',
        'Ce déclencheur mérite qu’on s’y arrête, car c’est là que les employeurs partent le plus souvent du mauvais pied. Il n’existe aucune formule consacrée. L’employé qui dit éprouver des difficultés depuis un diagnostic, ou qu’un horaire entre en conflit avec une obligation de proche aidant, a fait naître l’obligation aussi efficacement que celui qui dépose une demande écrite. Lorsque le besoin est évident au vu des circonstances, l’obligation peut naître même sans que l’employé l’ait soulevé.',
      ),
    ],
  },
  {
    heading: bi(
      'Undue hardship is a high bar, and it must be proven',
      'La contrainte excessive est un seuil élevé, et elle doit être prouvée',
    ),
    blocks: [
      p(
        'Undue hardship is a real limit, but it is a demanding one. It is assessed on evidence about cost, health, and safety in the context of the particular employer — not on inconvenience, not on how other employees might feel about it, and not on an assumption that accommodation will be disruptive. An employer asserting undue hardship carries the burden of demonstrating it with something more than an estimate made in the moment.',
        'La contrainte excessive est une limite réelle, mais exigeante. Elle s’évalue sur la base d’une preuve portant sur les coûts, la santé et la sécurité dans le contexte de l’employeur en cause — non sur l’inconvénient, non sur la réaction possible des autres employés, et non sur la présomption que l’accommodement sera perturbateur. L’employeur qui invoque la contrainte excessive a le fardeau de la démontrer par autre chose qu’une estimation improvisée.',
      ),
      p(
        'Scale matters to the analysis: what is genuinely unaffordable for a small employer may be routine for a large one, and the same accommodation can therefore cross the line in one workplace and not another. Business inconvenience, customer preference, and morale complaints from colleagues are generally not accepted as hardship at all. If you intend to rely on cost, be prepared to show the calculation and what alternatives were priced alongside it.',
        'L’échelle compte dans l’analyse : ce qui est véritablement inabordable pour un petit employeur peut être courant pour un grand, et le même accommodement peut donc franchir le seuil dans un milieu et non dans un autre. L’inconvénient commercial, la préférence de la clientèle et les récriminations de collègues ne sont généralement pas admis comme contrainte. Si vous comptez invoquer le coût, soyez prêt à montrer le calcul et les solutions de rechange évaluées en parallèle.',
      ),
    ],
  },
  {
    heading: bi(
      'The process matters as much as the outcome',
      'Le processus compte autant que le résultat',
    ),
    blocks: [
      p(
        'A large share of adverse findings against employers turn on procedural failure rather than the substance of the accommodation. The employer never asked what was needed, never explored options, or decided unilaterally that nothing could be done. An employer who engages seriously, explores alternatives, and documents that effort is in a substantially stronger position even where the accommodation ultimately fails.',
        'Une large part des décisions défavorables aux employeurs repose sur un manquement de procédure plutôt que sur le fond de l’accommodement. L’employeur n’a jamais demandé ce dont la personne avait besoin, n’a jamais exploré d’options, ou a décidé unilatéralement que rien ne pouvait être fait. L’employeur qui s’engage sérieusement, explore des solutions de rechange et documente cet effort se trouve dans une position nettement plus solide, même lorsque l’accommodement échoue en fin de compte.',
      ),
      li(
        'Respond to the need when you learn of it, in whatever form it reaches you.',
        'Réagissez au besoin dès que vous en prenez connaissance, quelle qu’en soit la forme.',
      ),
      li(
        'Ask what functional limitations exist and what would help — not for a diagnosis.',
        'Demandez quelles sont les limitations fonctionnelles et ce qui aiderait — et non un diagnostic.',
      ),
      li(
        'Consider more than one option, including ones that are imperfect but workable.',
        'Envisagez plus d’une option, y compris des solutions imparfaites mais viables.',
      ),
      li(
        'Write down what was considered, what was chosen, and why the rest was not.',
        'Consignez ce qui a été envisagé, ce qui a été retenu, et pourquoi le reste ne l’a pas été.',
      ),
      li(
        'Revisit the arrangement as circumstances change — accommodation is rarely a one-time decision.',
        'Réexaminez l’arrangement à mesure que les circonstances évoluent — l’accommodement est rarement une décision ponctuelle.',
      ),
      p(
        'Delay is itself a form of failure. An accommodation eventually granted after months of unanswered follow-ups has often been treated as a breach regardless of the outcome, because the employee bore the consequences throughout. Acknowledge promptly, set an interim arrangement where the final answer will take time, and keep the employee informed while you work it out.',
        'Le retard constitue en soi un manquement. Un accommodement finalement accordé après des mois de relances sans réponse a souvent été considéré comme une violation quel qu’en soit le résultat, parce que l’employé en a subi les conséquences tout du long. Accusez réception rapidement, prévoyez une mesure provisoire lorsque la réponse définitive prendra du temps, et tenez l’employé informé pendant que vous cherchez la solution.',
      ),
    ],
  },
  {
    heading: bi(
      'Medical information: enough, and no more',
      'Renseignements médicaux : le nécessaire, rien de plus',
    ),
    blocks: [
      p(
        'Employers are generally entitled to the information needed to understand functional limitations and craft an accommodation. They are generally not entitled to the underlying diagnosis or an employee’s broader medical history. Collecting more than you need creates a privacy problem alongside the human-rights one, and both provincial privacy law and, for federally regulated employers, PIPEDA constrain what you may hold and how long you may hold it.',
        'Les employeurs ont généralement droit aux renseignements nécessaires pour comprendre les limitations fonctionnelles et concevoir un accommodement. Ils n’ont généralement pas droit au diagnostic sous-jacent ni à l’historique médical élargi de l’employé. Recueillir plus que nécessaire crée un problème de confidentialité en plus du problème de droits de la personne, et tant les lois provinciales sur la vie privée que, pour les employeurs de compétence fédérale, la LPRPDE encadrent ce que vous pouvez conserver et pour combien de temps.',
      ),
      p(
        'Handle what you do collect accordingly: restrict it to those who need it to implement the accommodation, keep it apart from the general personnel file, and tell the employee’s manager what the restrictions are rather than why they exist. A manager can schedule around a lifting limit without knowing the condition behind it.',
        'Traitez en conséquence ce que vous recueillez : limitez-en l’accès aux personnes qui en ont besoin pour mettre en œuvre l’accommodement, conservez-le à l’écart du dossier général du personnel, et indiquez au gestionnaire de l’employé quelles sont les restrictions plutôt que leur cause. Un gestionnaire peut organiser l’horaire en fonction d’une limite de charge sans connaître la condition qui la motive.',
      ),
    ],
  },
  {
    heading: bi('Accommodation is a shared process', 'L’accommodement est un processus partagé'),
    blocks: [
      p(
        'The employee participates too: providing the information reasonably requested, engaging with proposals, and accepting a reasonable accommodation even when it is not the one they preferred. That shared obligation does not reduce the employer’s duty to lead the process in good faith, and an employer should not treat an employee’s frustration as a refusal to participate.',
        'L’employé participe aussi : il fournit les renseignements raisonnablement demandés, s’engage à l’égard des propositions et accepte un accommodement raisonnable même s’il ne s’agit pas de celui qu’il privilégiait. Cette obligation partagée ne diminue en rien le devoir de l’employeur de mener le processus de bonne foi, et l’employeur ne devrait pas assimiler la frustration d’un employé à un refus de participer.',
      ),
      p(
        'Unions carry a role as well in organized workplaces, and an accommodation that touches the collective agreement usually needs their participation rather than a private arrangement between employer and employee. A collective agreement does not override human-rights obligations, but the parties are generally expected to work the accommodation through together.',
        'Le syndicat joue également un rôle dans les milieux syndiqués, et un accommodement qui touche la convention collective exige habituellement sa participation plutôt qu’une entente privée entre l’employeur et l’employé. Une convention collective ne prime pas les obligations en matière de droits de la personne, mais on s’attend généralement à ce que les parties élaborent l’accommodement ensemble.',
      ),
    ],
  },
  {
    heading: bi('Where accommodation runs out', 'Lorsque l’accommodement atteint sa limite'),
    blocks: [
      p(
        'The duty does not require an employer to create a job that does not exist, to keep a position open indefinitely with no prospect of return, or to retain an employee who cannot perform the essential duties of any available role even with accommodation. Where an employment relationship genuinely cannot continue, ending it may be lawful — but the analysis is evidence-heavy and the record you built along the way is what carries it.',
        'L’obligation n’exige pas de l’employeur qu’il crée un poste qui n’existe pas, qu’il maintienne indéfiniment un poste vacant sans perspective de retour, ni qu’il conserve un employé incapable d’accomplir les tâches essentielles d’un poste disponible même avec accommodement. Lorsqu’une relation d’emploi ne peut véritablement pas se poursuivre, y mettre fin peut être licite — mais l’analyse repose lourdement sur la preuve, et c’est le dossier constitué en cours de route qui la soutient.',
      ),
      p(
        'Distinguish essential duties from tasks that have simply always been bundled into the role. Employers frequently assert that a function is essential when it is incidental, or that no alternative position exists without having actually canvassed the organization. Both assertions are tested on evidence, and both are commonly where the employer’s case gives way.',
        'Distinguez les tâches essentielles de celles qui ont simplement toujours été rattachées au poste. Les employeurs affirment fréquemment qu’une fonction est essentielle alors qu’elle est accessoire, ou qu’aucun autre poste n’existe sans avoir réellement sondé l’organisation. Ces deux affirmations sont éprouvées par la preuve, et c’est couramment là que la position de l’employeur cède.',
      ),
    ],
  },
  {
    heading: bi('Grounds beyond disability', 'Des motifs au-delà du handicap'),
    blocks: [
      p(
        'Disability accommodation is the most familiar, but it is not the whole obligation, and the less familiar grounds are where employers are most likely to respond badly without meaning to.',
        'L’accommodement du handicap est le plus connu, mais il ne constitue pas toute l’obligation, et c’est à l’égard des motifs moins familiers que les employeurs risquent le plus de mal réagir sans le vouloir.',
      ),
      li(
        'Family status, typically engaging childcare or eldercare obligations. The tests applied have differed across Canadian jurisdictions, so the threshold question of what an employee must show is itself jurisdiction-specific.',
        'La situation de famille, qui met généralement en jeu des obligations de garde d’enfants ou de proches aînés. Les critères appliqués ont varié d’une compétence canadienne à l’autre; la question préalable de ce que l’employé doit démontrer est donc elle-même propre à la compétence.',
      ),
      li(
        'Religion and creed, which can engage scheduling, dress and grooming standards, and time for observance.',
        'La religion et les croyances, qui peuvent toucher les horaires, les normes vestimentaires et de présentation, ainsi que le temps consacré à la pratique.',
      ),
      li(
        'Pregnancy and breastfeeding, including modified duties and facilities, and protection on return from leave.',
        'La grossesse et l’allaitement, y compris les tâches modifiées et les installations, ainsi que la protection au retour de congé.',
      ),
      li(
        'Gender identity and gender expression, including records, names, and facilities.',
        'L’identité et l’expression de genre, y compris les dossiers, les noms et les installations.',
      ),
      li(
        'Addiction, which is generally treated as a disability rather than as misconduct — a distinction that reshapes how a workplace policy breach is handled.',
        'La dépendance, généralement traitée comme un handicap plutôt que comme une inconduite — une distinction qui transforme la façon de traiter un manquement à une politique.',
      ),
      p(
        'Two grounds can also intersect in one situation, and an employee is not required to pick the most convenient label for the employer. Respond to the need described rather than to the category it seems to fall into.',
        'Deux motifs peuvent aussi se croiser dans une même situation, et l’employé n’est pas tenu de choisir l’étiquette la plus commode pour l’employeur. Répondez au besoin décrit plutôt qu’à la catégorie dans laquelle il semble entrer.',
      ),
    ],
  },
  {
    blocks: [
      p(
        'Accommodation questions are fact-specific and the consequences of getting them wrong are significant. Use this as orientation, keep a written record of your process, and involve counsel on anything contested or complex.',
        'Les questions d’accommodement dépendent des faits et les conséquences d’une erreur sont importantes. Utilisez ce texte comme repère, conservez une trace écrite de votre processus et faites intervenir un conseiller juridique dans tout dossier contesté ou complexe.',
      ),
    ],
  },
]
