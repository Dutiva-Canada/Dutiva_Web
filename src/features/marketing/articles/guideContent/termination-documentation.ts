import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = [
  {
    blocks: [
      p(
        'By the time a termination is disputed, the employer’s position is largely fixed by documents created before anyone thought there would be a dispute. Terminations are also the point at which employers are most tempted to improvise — and improvised paperwork is what gets read back to them later.',
        'Au moment où une cessation d’emploi est contestée, la position de l’employeur est en grande partie déterminée par des documents créés avant que quiconque n’envisage un litige. La cessation d’emploi est aussi le moment où les employeurs sont le plus tentés d’improviser — et c’est la paperasse improvisée qu’on leur relit plus tard.',
      ),
      p(
        'The habit worth building is separating three questions that tend to collapse into one under pressure: what happened, what you are entitled to do about it, and how you will describe it. The first is a record-keeping exercise that should already be done. The second is a legal question. The third is a communication decision that has to be consistent everywhere it appears.',
        'L’habitude à développer consiste à séparer trois questions qui tendent à se confondre sous pression : ce qui s’est passé, ce que vous avez le droit de faire, et la façon dont vous le décrirez. La première est un exercice de tenue de dossiers qui devrait déjà être fait. La deuxième est une question juridique. La troisième est une décision de communication qui doit être cohérente partout où elle apparaît.',
      ),
    ],
  },
  {
    heading: bi('Before the meeting', 'Avant la rencontre'),
    blocks: [
      li(
        'Pull the employment contract and confirm what it actually says about ending the relationship.',
        'Sortez le contrat de travail et confirmez ce qu’il prévoit réellement quant à la fin de la relation.',
      ),
      li(
        'Assemble the performance or conduct record you are relying on, and note the gaps in it honestly.',
        'Réunissez le dossier de rendement ou de conduite sur lequel vous vous appuyez, et notez-en honnêtement les lacunes.',
      ),
      li(
        'Have the termination letter, the final pay calculation, and the benefits position settled in advance.',
        'Ayez la lettre de cessation d’emploi, le calcul de la paie finale et la position sur les avantages sociaux réglés à l’avance.',
      ),
      li(
        'Decide who attends, and have a second person present to witness what is said.',
        'Décidez qui assiste à la rencontre, et prévoyez une deuxième personne pour témoigner de ce qui est dit.',
      ),
      li(
        'Check whether the employee is on or has recently requested a leave, raised a safety concern, or sought an accommodation — any of which changes the analysis before anything else does.',
        'Vérifiez si l’employé est en congé ou en a récemment demandé un, a soulevé une préoccupation de sécurité ou demandé un accommodement — chacun de ces éléments modifie l’analyse avant tout le reste.',
      ),
      li(
        'Prepare the logistics: system access, property return, and how the departure will be communicated internally.',
        'Préparez la logistique : accès aux systèmes, restitution des biens et façon dont le départ sera communiqué à l’interne.',
      ),
    ],
  },
  {
    heading: bi(
      'What the letter should and should not do',
      'Ce que la lettre doit faire et ne pas faire',
    ),
    blocks: [
      p(
        'A termination letter is a record that will be read by people who were not present. It should state the effective date, what is being provided and on what basis, the position on benefits, and what the employee needs to do next. It should be legible to someone reading it cold.',
        'Une lettre de cessation d’emploi est un document que liront des personnes qui n’étaient pas présentes. Elle doit indiquer la date d’effet, ce qui est offert et à quel titre, la position sur les avantages sociaux, et ce que l’employé doit faire ensuite. Elle doit être compréhensible pour quelqu’un qui la découvre sans contexte.',
      ),
      p(
        'What it should not do is argue. A letter that catalogues grievances, characterizes the employee’s personality, or justifies the decision at length creates material that will be examined line by line, and it rarely improves the employer’s position. Where a release is being sought in exchange for an enhanced package, keep the offer distinct from the statement of entitlements so it is clear what is owed regardless and what is conditional.',
        'Ce qu’elle ne doit pas faire, c’est plaider. Une lettre qui recense les griefs, qualifie la personnalité de l’employé ou justifie longuement la décision crée une matière qui sera examinée ligne par ligne, et elle améliore rarement la position de l’employeur. Lorsqu’une quittance est recherchée en échange d’une offre bonifiée, gardez l’offre distincte de l’énoncé des droits, afin qu’il soit clair ce qui est dû de toute façon et ce qui est conditionnel.',
      ),
    ],
  },
  {
    heading: bi('Say less, and say it consistently', 'Dites moins, et dites-le de façon constante'),
    blocks: [
      p(
        'The reason given at the meeting, the reason in the letter, and the reason in the Record of Employment should be consistent with one another. Inconsistency between them is one of the most damaging patterns in an employer’s file, because it invites the inference that the stated reason is not the real one. If you have not settled on how to characterize the ending, settle it before the meeting rather than during it.',
        'Le motif donné en rencontre, celui de la lettre et celui du relevé d’emploi doivent concorder. Une incohérence entre eux constitue l’un des schémas les plus dommageables dans un dossier d’employeur, car elle invite à conclure que le motif invoqué n’est pas le véritable. Si vous n’avez pas arrêté la façon de qualifier la fin d’emploi, faites-le avant la rencontre plutôt que pendant.',
      ),
      p(
        'Alleging just cause deserves particular caution. The standard is narrow, the burden sits with the employer, and an allegation that fails can worsen the employer’s exposure rather than limit it. It is a decision to make with legal advice, not a default posture.',
        'Alléguer un motif valable mérite une prudence particulière. La norme est étroite, le fardeau incombe à l’employeur, et une allégation qui échoue peut aggraver son exposition plutôt que la limiter. C’est une décision à prendre avec un avis juridique, non une position par défaut.',
      ),
      p(
        'The same discipline applies to what is said internally and to references given afterwards. Colleagues asking what happened, a manager explaining the change to a team, and a reference request answered later all generate statements that can be produced. Agree the internal wording at the same time as the letter, keep it brief and factual, and make sure whoever handles references knows what it is.',
        'La même discipline vaut pour ce qui est dit à l’interne et pour les références données par la suite. Les collègues qui demandent ce qui s’est passé, le gestionnaire qui explique le changement à une équipe et une demande de références traitée plus tard produisent tous des déclarations qui peuvent être mises en preuve. Convenez du libellé interne en même temps que de la lettre, gardez-le bref et factuel, et assurez-vous que la personne qui traite les références sait ce qu’il est.',
      ),
    ],
  },
  {
    heading: bi('After the meeting', 'Après la rencontre'),
    blocks: [
      li(
        'Write a dated note of what was said and by whom, while it is fresh.',
        'Rédigez une note datée de ce qui a été dit et par qui, pendant que c’est frais.',
      ),
      li(
        'Issue the Record of Employment within the applicable timeline.',
        'Produisez le relevé d’emploi dans le délai applicable.',
      ),
      li(
        'Recover property and revoke system access, and record when each occurred.',
        'Récupérez les biens et révoquez les accès aux systèmes, en notant le moment de chaque opération.',
      ),
      li(
        'Retain the file for the full period your jurisdiction requires — do not purge it because the person has left.',
        'Conservez le dossier pendant toute la période exigée par votre compétence — ne le supprimez pas parce que la personne est partie.',
      ),
      li(
        'If a release was signed, keep it with the file along with evidence of what was provided in exchange.',
        'Si une quittance a été signée, conservez-la au dossier avec la preuve de ce qui a été fourni en contrepartie.',
      ),
      li(
        'Confirm the final payment actually went out as described, and keep proof — a letter promising something the payroll run did not deliver is a familiar and avoidable problem.',
        'Confirmez que le paiement final a réellement été versé comme annoncé, et conservez-en la preuve — une lettre promettant ce que la paie n’a pas livré est un problème courant et évitable.',
      ),
    ],
  },
  {
    heading: bi(
      'Releases are not automatically binding',
      'Les quittances ne sont pas automatiquement exécutoires',
    ),
    blocks: [
      p(
        'A signed release is valuable but not invulnerable. It generally needs to be supported by consideration beyond what the employee was already owed, and it is more likely to hold where the employee had a genuine opportunity to consider it and to take independent legal advice. A release presented in the termination meeting with an expectation of immediate signature is the version most often challenged.',
        'Une quittance signée est utile, mais pas invulnérable. Elle doit généralement être appuyée par une contrepartie qui dépasse ce qui était déjà dû à l’employé, et elle tient plus solidement lorsque l’employé a eu une véritable occasion de l’examiner et d’obtenir un avis juridique indépendant. Une quittance présentée en pleine rencontre de cessation d’emploi avec une attente de signature immédiate est la version la plus souvent contestée.',
      ),
      p(
        'Note as well that a release cannot waive certain statutory entitlements, and that human-rights claims may require specific language to be covered at all. Draft it for the situation rather than reusing a general form, and keep the evidence of what the employee received in exchange filed alongside it.',
        'Notez également qu’une quittance ne peut renoncer à certains droits prévus par la loi, et que les réclamations en matière de droits de la personne peuvent exiger un libellé précis pour être visées. Rédigez-la pour la situation plutôt que de réutiliser un formulaire général, et conservez au dossier la preuve de ce que l’employé a reçu en contrepartie.',
      ),
    ],
  },
  {
    heading: bi(
      'The Record of Employment deserves its own attention',
      'Le relevé d’emploi mérite une attention distincte',
    ),
    blocks: [
      p(
        'The Record of Employment is a federal filing that follows every interruption of earnings, whatever the reason and whichever jurisdiction governs the employment. It is easy to treat as an administrative afterthought, and it is the document most likely to contradict the rest of the file — because it is often completed by payroll, days later, without sight of the termination letter.',
        'Le relevé d’emploi est une déclaration fédérale qui suit toute interruption de la rémunération, quel qu’en soit le motif et quelle que soit la compétence qui régit l’emploi. Il est facile de le traiter comme une formalité administrative, et c’est le document le plus susceptible de contredire le reste du dossier — parce qu’il est souvent rempli par la paie, quelques jours plus tard, sans avoir vu la lettre de cessation d’emploi.',
      ),
      p(
        'The reason code selected is a statement about why the employment ended, and it will be read alongside everything else you said. A code indicating dismissal where the letter described a restructuring, or the reverse, is the kind of inconsistency that is difficult to explain later. Decide the characterization once, and make sure the person completing the filing is told what it is.',
        'Le code de motif retenu constitue une déclaration sur la raison de la fin d’emploi, et il sera lu avec tout le reste de ce que vous avez dit. Un code indiquant un congédiement alors que la lettre décrivait une restructuration, ou l’inverse, est le genre d’incohérence difficile à expliquer par la suite. Arrêtez la qualification une fois, et assurez-vous que la personne qui remplit la déclaration en soit informée.',
      ),
      p(
        'Delays carry their own consequence: the filing is what a former employee needs to access benefits, and a late or incorrect one produces an avoidable grievance at exactly the moment goodwill matters most. Treat issuing it accurately and on time as part of the termination, not as cleanup afterwards.',
        'Les retards ont leur propre conséquence : cette déclaration est ce dont un ancien employé a besoin pour accéder aux prestations, et un relevé tardif ou erroné crée un grief évitable précisément au moment où la bonne volonté compte le plus. Considérez sa production exacte et dans les délais comme faisant partie de la cessation d’emploi, et non comme un nettoyage ultérieur.',
      ),
    ],
  },
  {
    blocks: [
      p(
        'Dutiva generates termination-related documents from Canadian templates and keeps a consistent record of what was produced and when, so the file tells one coherent story. It does not decide whether a termination is lawful or what it should cost — those are questions for an employment lawyer, ideally before the meeting happens.',
        'Dutiva génère les documents liés à la cessation d’emploi à partir de modèles canadiens et conserve un registre uniforme de ce qui a été produit et à quel moment, afin que le dossier raconte une seule histoire cohérente. Il ne détermine pas si une cessation d’emploi est licite ni ce qu’elle devrait coûter — ces questions relèvent d’un avocat en droit du travail, idéalement avant la tenue de la rencontre.',
      ),
    ],
  },
]
