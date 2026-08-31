import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = [
  {
    blocks: [
      p(
        'Every Canadian jurisdiction imposes harassment and violence prevention obligations on employers, though they are framed differently — in occupational health and safety legislation in some places, in labour standards in Quebec, and in dedicated regulations for federally regulated workplaces. What they share is that the obligations are largely procedural. You are required to have a process and to follow it.',
        'Chaque compétence canadienne impose aux employeurs des obligations de prévention du harcèlement et de la violence, bien qu’elles soient formulées différemment — dans la législation sur la santé et la sécurité au travail à certains endroits, dans les normes du travail au Québec, et dans des règlements dédiés pour les milieux de travail de compétence fédérale. Leur point commun est que ces obligations sont largement procédurales. Vous devez avoir un processus et le suivre.',
      ),
    ],
  },
  {
    heading: bi('The common building blocks', 'Les composantes communes'),
    blocks: [
      li(
        'A written policy that defines the conduct covered and is communicated to workers.',
        'Une politique écrite qui définit les comportements visés et qui est communiquée aux travailleurs.',
      ),
      li(
        'An assessment of the risks specific to your workplace, revisited as conditions change.',
        'Une évaluation des risques propres à votre milieu de travail, revue lorsque les conditions changent.',
      ),
      li(
        'Training so that workers and managers know what the policy requires of them.',
        'De la formation pour que les travailleurs et les gestionnaires sachent ce que la politique exige d’eux.',
      ),
      li(
        'A reporting route that does not require going through the person complained about.',
        'Une voie de signalement qui n’oblige pas à passer par la personne visée par la plainte.',
      ),
      li(
        'An investigation process, and a way to communicate outcomes to those involved.',
        'Un processus d’enquête, et un moyen de communiquer les résultats aux personnes concernées.',
      ),
    ],
  },
  {
    heading: bi(
      'Investigation is where employers most often fall short',
      'C’est à l’étape de l’enquête que les employeurs faillissent le plus souvent',
    ),
    blocks: [
      p(
        'The duty to investigate is generally triggered by awareness of a possible incident, not by a formal written complaint. An employer who hears about conduct informally and waits for paperwork has often already failed the obligation. Investigations must also be conducted by someone without a stake in the outcome — which frequently means someone outside the reporting line of the person complained about, and sometimes someone outside the organization.',
        'L’obligation d’enquêter naît généralement de la connaissance d’un incident possible, et non d’une plainte écrite formelle. L’employeur qui entend parler d’un comportement de manière informelle et attend un document a souvent déjà manqué à son obligation. Les enquêtes doivent aussi être menées par une personne sans intérêt dans l’issue — ce qui signifie fréquemment une personne hors de la ligne hiérarchique du mis en cause, et parfois une personne de l’extérieur de l’organisation.',
      ),
      p(
        'Findings can be adverse to an employer even where the underlying conduct is never substantiated, purely because the response was inadequate. The process is assessed on its own terms.',
        'Des conclusions peuvent être défavorables à l’employeur même si le comportement allégué n’est jamais établi, uniquement parce que la réponse a été inadéquate. Le processus est évalué pour lui-même.',
      ),
    ],
  },
  {
    heading: bi('Confidentiality and reprisal', 'Confidentialité et représailles'),
    blocks: [
      p(
        'Keep investigation material confidential and limited to those who need it, while recognizing that participants are generally entitled to know enough about the outcome as it affects them. Reprisal against someone who reports or participates is separately prohibited, and post-complaint changes to schedules, duties, or reporting lines will be read in that light — so document the independent business reason before making one, or wait.',
        'Gardez le matériel d’enquête confidentiel et limité aux personnes qui en ont besoin, tout en reconnaissant que les participants ont généralement le droit d’en savoir assez sur l’issue dans la mesure où elle les touche. Les représailles contre une personne qui signale ou participe sont interdites séparément, et les changements d’horaire, de tâches ou de lien hiérarchique survenant après une plainte seront interprétés sous cet angle — documentez donc le motif d’affaires indépendant avant d’en faire un, ou attendez.',
      ),
    ],
  },
  {
    heading: bi('Running an investigation that stands up', 'Mener une enquête qui tient la route'),
    blocks: [
      p(
        'Most of what makes an investigation defensible is decided in its first stage, before any evidence is weighed. Settle the scope — what specific allegations are being examined — and put it in writing, because an investigation that drifts into unrelated territory becomes difficult to defend for everyone involved.',
        'L’essentiel de ce qui rend une enquête défendable se décide à sa première étape, avant toute appréciation de la preuve. Arrêtez la portée — quelles allégations précises sont examinées — et consignez-la, car une enquête qui dérive vers des sujets sans lien devient difficile à défendre pour toutes les personnes concernées.',
      ),
      li(
        'Choose an investigator with no stake in the outcome and no reporting relationship to either party, and consider an external investigator where seniority or complexity makes internal neutrality doubtful.',
        'Choisissez un enquêteur sans intérêt dans l’issue et sans lien hiérarchique avec l’une ou l’autre partie, et envisagez un enquêteur externe lorsque l’ancienneté ou la complexité rend la neutralité interne douteuse.',
      ),
      li(
        'Tell the respondent what is alleged in enough detail to answer it, and give them a genuine opportunity to respond.',
        'Informez la personne mise en cause de ce qui est allégué avec assez de détails pour y répondre, et donnez-lui une véritable occasion de le faire.',
      ),
      li(
        'Interview the people identified by both parties, not only those the complainant named.',
        'Interrogez les personnes désignées par les deux parties, et non seulement celles nommées par la personne plaignante.',
      ),
      li(
        'Take contemporaneous notes and keep the evidence you relied on, rather than only the conclusion you reached.',
        'Prenez des notes au fur et à mesure et conservez la preuve sur laquelle vous vous êtes appuyé, et non seulement la conclusion retenue.',
      ),
      li(
        'Apply a balance-of-probabilities standard and state findings as findings, without editorializing about either party.',
        'Appliquez la norme de la prépondérance des probabilités et énoncez les conclusions comme telles, sans commentaire éditorial sur l’une ou l’autre partie.',
      ),
      li(
        'Consider interim measures while the process runs — separation of duties or schedules — chosen so they do not penalize the complainant.',
        'Envisagez des mesures provisoires pendant le processus — séparation des tâches ou des horaires — choisies de manière à ne pas pénaliser la personne plaignante.',
      ),
    ],
  },
  {
    heading: bi('After the findings', 'Après les conclusions'),
    blocks: [
      p(
        'An investigation that concludes and then produces nothing is a familiar failure. Where conduct is substantiated, the response has to be proportionate and actually implemented, and where it is not substantiated, that outcome still needs to be communicated and the working relationship still needs attention. Both parties are generally entitled to know the outcome as it affects them, even where the full report is not shared.',
        'Une enquête qui se conclut sans rien produire est un échec bien connu. Lorsque la conduite est établie, la réponse doit être proportionnée et réellement mise en œuvre; lorsqu’elle ne l’est pas, cette issue doit tout de même être communiquée et la relation de travail requiert quand même de l’attention. Les deux parties ont généralement le droit de connaître l’issue dans la mesure où elle les touche, même si le rapport complet n’est pas communiqué.',
      ),
      p(
        'Close the loop on the systemic side as well. If the process surfaced a gap — a reporting route nobody knew about, a manager who did not escalate, a risk the assessment missed — record it and fix it. Prevention obligations are continuing rather than one-time, and a pattern of complaints handled individually without any change to the conditions that produced them is itself a finding waiting to be made.',
        'Bouclez également la boucle sur le plan systémique. Si le processus a révélé une lacune — une voie de signalement que personne ne connaissait, un gestionnaire qui n’a pas fait remonter l’information, un risque que l’évaluation a manqué — consignez-la et corrigez-la. Les obligations de prévention sont continues plutôt que ponctuelles, et une succession de plaintes traitées individuellement sans aucun changement aux conditions qui les ont engendrées constitue en soi une conclusion en attente d’être tirée.',
      ),
    ],
  },
  {
    heading: bi('Who and what the obligations reach', 'Qui et quoi les obligations visent'),
    blocks: [
      p(
        'Employers frequently scope these obligations too narrowly, applying them to direct employees during working hours at a company site. The frameworks generally reach further than that, and the gap is where incidents fall through.',
        'Les employeurs délimitent fréquemment ces obligations de façon trop étroite, en les appliquant aux employés directs, pendant les heures de travail, sur un site de l’entreprise. Les cadres vont généralement plus loin, et c’est dans cet écart que les incidents passent entre les mailles.',
      ),
      li(
        "Conduct by clients, customers, patients, contractors, and members of the public can engage the employer's prevention obligations toward its own workers.",
        'La conduite de clients, de patients, de sous-traitants et de membres du public peut engager les obligations de prévention de l’employeur envers ses propres travailleurs.',
      ),
      li(
        'Work-related conduct away from the workplace — travel, conferences, work social events — is commonly captured where there is a sufficient connection to the employment.',
        'La conduite liée au travail à l’extérieur du lieu de travail — déplacements, congrès, activités sociales professionnelles — est couramment visée lorsqu’il existe un lien suffisant avec l’emploi.',
      ),
      li(
        'Online conduct counts. Messaging platforms, email, and video calls are workplaces for this purpose, and remote arrangements do not narrow the obligation.',
        'La conduite en ligne compte. Les plateformes de messagerie, le courriel et les appels vidéo sont des milieux de travail à cette fin, et le télétravail ne restreint pas l’obligation.',
      ),
      li(
        'Domestic violence that follows an employee into the workplace triggers duties in several jurisdictions once the employer is aware of a risk.',
        'La violence conjugale qui suit un employé jusqu’au travail déclenche des obligations dans plusieurs compétences dès que l’employeur a connaissance d’un risque.',
      ),
      p(
        'Scope your risk assessment against how your people actually work rather than against an office floorplan, and make sure the reporting route is available to someone who is remote, on a client site, or working outside ordinary hours.',
        'Délimitez votre évaluation des risques en fonction de la façon dont vos gens travaillent réellement plutôt qu’en fonction d’un plan de bureau, et assurez-vous que la voie de signalement est accessible à une personne en télétravail, chez un client ou en dehors des heures habituelles.',
      ),
    ],
  },
  {
    blocks: [
      p(
        'Confirm the specific requirements for your jurisdiction and sector, and review your policy against them rather than against a generic template. Serious complaints warrant advice early — the decisions made in the first days of an investigation are the ones most often scrutinized later.',
        'Confirmez les exigences précises applicables à votre compétence et à votre secteur, et révisez votre politique en fonction de celles-ci plutôt que d’un modèle générique. Les plaintes graves justifient un avis dès le départ — les décisions prises dans les premiers jours d’une enquête sont celles qui font le plus souvent l’objet d’un examen ultérieur.',
      ),
    ],
  },
]
