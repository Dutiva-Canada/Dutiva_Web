import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = [
  {
    blocks: [
      p(
        'Most employment disputes are decided on documents that either existed at the right moment or did not. The practical problem is that nearly every document below is dramatically easier to put in place before someone starts than afterwards — because once employment has begun, asking an employee to sign new terms raises the question of what they are receiving in exchange for agreeing.',
        'La plupart des litiges en emploi se tranchent sur des documents qui existaient au bon moment ou qui n’existaient pas. Le problème pratique est que presque tous les documents ci-dessous sont nettement plus faciles à mettre en place avant l’entrée en fonction qu’après — car une fois l’emploi commencé, demander à un employé de signer de nouvelles conditions soulève la question de ce qu’il reçoit en échange de son accord.',
      ),
      p(
        'This checklist is organized by when each item has to exist, because sequencing is where employers lose ground. Nothing here is exotic; the failure is almost never that an employer could not produce a document, but that it was produced late, distributed informally, or revised without anyone recording that it had been.',
        'Cette liste est organisée selon le moment où chaque élément doit exister, car c’est dans la séquence que les employeurs perdent du terrain. Rien ici n’est exotique; l’échec tient presque jamais à l’incapacité de produire un document, mais au fait qu’il a été produit tard, diffusé de façon informelle ou révisé sans que personne ne consigne qu’il l’avait été.',
      ),
    ],
  },
  {
    heading: bi('Before the first day', 'Avant la première journée'),
    blocks: [
      li(
        'A written employment agreement, accepted before work begins, covering role, compensation, and how the relationship can end.',
        'Une entente d’emploi écrite, acceptée avant le début du travail, couvrant le poste, la rémunération et les modalités de fin de la relation.',
      ),
      li(
        'The offer letter and any pre-hire correspondence that describes terms — these are read alongside the agreement if the two ever conflict.',
        'La lettre d’offre et toute correspondance préalable à l’embauche décrivant des conditions — elles seront lues avec l’entente si les deux se contredisent un jour.',
      ),
      li(
        'Confidentiality and intellectual-property terms, where the role touches either.',
        'Des clauses de confidentialité et de propriété intellectuelle, lorsque le poste touche l’une ou l’autre.',
      ),
      li(
        'Written consent for any background or reference checking you intend to do.',
        'Un consentement écrit pour toute vérification d’antécédents ou de références que vous comptez effectuer.',
      ),
      li(
        'Payroll and tax onboarding forms, and banking details for direct deposit.',
        'Les formulaires d’intégration à la paie et aux impôts, ainsi que les coordonnées bancaires pour le dépôt direct.',
      ),
      li(
        'A job description that reflects the work actually expected — it becomes the reference point for performance management and for accommodation questions later.',
        'Une description de poste qui reflète le travail réellement attendu — elle devient le point de référence pour la gestion du rendement et, plus tard, pour les questions d’accommodement.',
      ),
      p(
        'Signature timing matters as much as content. Send the agreement far enough ahead that the candidate has a real opportunity to read it and take advice, and keep evidence of when it was sent and when it was accepted. An agreement produced on the first morning, signed in a rush, is the version most likely to be challenged.',
        'Le moment de la signature compte autant que le contenu. Transmettez l’entente suffisamment à l’avance pour que la personne candidate ait une véritable occasion de la lire et de consulter, et conservez la preuve du moment de l’envoi et de l’acceptation. Une entente produite le premier matin et signée à la hâte est la version la plus susceptible d’être contestée.',
      ),
    ],
  },
  {
    heading: bi('Policies to have ready', 'Politiques à avoir sous la main'),
    blocks: [
      p(
        'Several workplace policies are required outright in some jurisdictions and expected in practice in all of them. Have them written, current, and distributed in a way you can later prove:',
        'Plusieurs politiques en milieu de travail sont carrément obligatoires dans certaines compétences et attendues en pratique dans toutes. Ayez-les rédigées, à jour et diffusées d’une manière que vous pourrez démontrer plus tard :',
      ),
      li(
        'Workplace violence and harassment prevention, including how a complaint is made and investigated.',
        'Prévention de la violence et du harcèlement en milieu de travail, y compris la façon de formuler et d’enquêter sur une plainte.',
      ),
      li(
        'Health and safety, appropriate to the actual hazards of the work.',
        'Santé et sécurité, adaptée aux risques réels du travail.',
      ),
      li(
        'Accessibility and accommodation, including how an employee requests one.',
        'Accessibilité et accommodement, y compris la façon dont un employé en fait la demande.',
      ),
      li(
        'Privacy, covering what employee information you collect and why.',
        'Confidentialité, précisant les renseignements sur les employés que vous recueillez et pourquoi.',
      ),
      li(
        'Acceptable technology use, if employees will use your systems or their own devices for work.',
        'Utilisation acceptable des technologies, si les employés utilisent vos systèmes ou leurs propres appareils pour le travail.',
      ),
      li(
        'Remote and hybrid work arrangements, including which jurisdiction’s rules govern an employee who works from another province.',
        'Modalités de télétravail et de travail hybride, y compris la compétence dont les règles régissent un employé qui travaille depuis une autre province.',
      ),
      p(
        'Requirements differ by jurisdiction and often by headcount, and several of these obligations are triggered by thresholds rather than applying to everyone. Confirm which ones bind you rather than adopting a generic set, and revisit the question as the business grows past the point where new obligations attach.',
        'Les exigences varient selon la compétence et souvent selon l’effectif, et plusieurs de ces obligations sont déclenchées par des seuils plutôt que de s’appliquer à tous. Confirmez celles qui vous lient plutôt que d’adopter un ensemble générique, et réexaminez la question à mesure que l’entreprise franchit les seuils qui font naître de nouvelles obligations.',
      ),
    ],
  },
  {
    heading: bi('Distribution is part of the document', 'La diffusion fait partie du document'),
    blocks: [
      p(
        'A policy nobody received is close to worthless when it matters. Keep a record of what was distributed, to whom, and when — acknowledgement of receipt, dated. The same applies to updates: a policy revised without redistribution is often treated as the old policy.',
        'Une politique que personne n’a reçue ne vaut à peu près rien au moment critique. Conservez un registre de ce qui a été diffusé, à qui et quand — un accusé de réception, daté. Il en va de même pour les mises à jour : une politique révisée sans nouvelle diffusion est souvent traitée comme l’ancienne politique.',
      ),
      p(
        'Version control is the quiet half of this. When a policy is questioned, the useful record is not simply the current text but which text was in force at the relevant time and who had received it by then. Keep superseded versions with their dates rather than overwriting them, and note when training was delivered where training is part of the obligation.',
        'Le contrôle des versions en est la moitié discrète. Lorsqu’une politique est contestée, le registre utile n’est pas seulement le texte actuel, mais celui qui était en vigueur au moment pertinent et les personnes qui l’avaient alors reçu. Conservez les versions antérieures avec leurs dates plutôt que de les écraser, et notez le moment où la formation a été donnée lorsqu’elle fait partie de l’obligation.',
      ),
    ],
  },
  {
    heading: bi('What to keep during employment', 'Ce qu’il faut conserver pendant l’emploi'),
    blocks: [
      p(
        'The file continues after onboarding, and the entries added along the way are what a performance-based decision later rests on. Keep them contemporaneous and factual:',
        'Le dossier se poursuit après l’intégration, et les inscriptions ajoutées en cours de route sont ce sur quoi reposera plus tard une décision fondée sur le rendement. Tenez-les à jour et factuelles :',
      ),
      li(
        'Payroll and hours records for the retention period your jurisdiction sets, including overtime and any averaging or banked-time arrangements.',
        'Les registres de paie et d’heures pour la période de conservation fixée par votre compétence, y compris les heures supplémentaires et toute entente d’étalement ou de banque de temps.',
      ),
      li(
        'Performance reviews, and any written feedback given outside a formal review cycle.',
        'Les évaluations de rendement, et toute rétroaction écrite donnée en dehors d’un cycle formel d’évaluation.',
      ),
      li(
        'Records of leaves taken, accommodation requests, and what was agreed in response.',
        'Les registres des congés pris, des demandes d’accommodement et de ce qui a été convenu en réponse.',
      ),
      li(
        'Any change to terms — compensation, role, reporting, location — along with what the employee received in exchange for agreeing to it.',
        'Toute modification aux conditions — rémunération, poste, lien hiérarchique, lieu de travail — avec ce que l’employé a reçu en contrepartie de son accord.',
      ),
      li(
        'Incident, investigation, and disciplinary records, kept separately from the general personnel file where privacy obligations call for it.',
        'Les dossiers d’incidents, d’enquêtes et de mesures disciplinaires, conservés séparément du dossier du personnel lorsque les obligations de confidentialité l’exigent.',
      ),
    ],
  },
  {
    heading: bi('Closing gaps on an existing team', 'Combler les lacunes dans une équipe en place'),
    blocks: [
      p(
        'Most employers reading a checklist like this discover they are missing items for people who are already employed. That is a normal position to be in, and it is fixable — but not by circulating the missing documents and asking for signatures, because a term introduced mid-employment generally needs fresh consideration to bind. Something of value has to change hands.',
        'La plupart des employeurs qui lisent une liste comme celle-ci constatent qu’il leur manque des éléments pour des personnes déjà à l’emploi. C’est une situation normale, et elle se corrige — mais pas en faisant circuler les documents manquants pour signature, car une condition introduite en cours d’emploi exige généralement une contrepartie nouvelle pour lier. Quelque chose de valeur doit être échangé.',
      ),
      p(
        'A workable sequence is to separate the items by whether they impose obligations on the employee. Policies you are required to have, and records you are required to keep, can and should be put in place immediately — distributing a harassment-prevention policy to existing staff creates no consideration problem. Contractual terms that restrict the employee, such as a termination clause or a restrictive covenant, are the ones that need a genuine exchange, and are best attached to a moment where something is already changing: a promotion, a compensation adjustment, or a role change.',
        'Une séquence viable consiste à séparer les éléments selon qu’ils imposent ou non des obligations à l’employé. Les politiques que vous devez avoir et les registres que vous devez tenir peuvent et devraient être mis en place immédiatement — diffuser une politique de prévention du harcèlement au personnel en poste ne pose aucun problème de contrepartie. Les conditions contractuelles qui restreignent l’employé, comme une clause de cessation d’emploi ou une clause restrictive, sont celles qui exigent un échange véritable, et gagnent à être rattachées à un moment où quelque chose change déjà : une promotion, un ajustement salarial ou un changement de poste.',
      ),
      p(
        'Do not backdate anything. A document signed today and dated to the hiring date is worse than no document, because it converts a gap into a credibility problem that taints the rest of the file.',
        'N’antidatez rien. Un document signé aujourd’hui et daté du jour de l’embauche est pire que l’absence de document, car il transforme une lacune en problème de crédibilité qui contamine le reste du dossier.',
      ),
    ],
  },
  {
    heading: bi(
      'Employees in more than one jurisdiction',
      'Des employés dans plus d’une compétence',
    ),
    blocks: [
      p(
        'A single set of documents stops working the moment the team crosses a provincial line, and remote hiring means many employers cross one without deciding to. Employment standards, required policies, privacy obligations, and payroll all follow the applicable jurisdiction rather than the location of the head office.',
        'Un ensemble unique de documents cesse de fonctionner dès que l’équipe franchit une frontière provinciale, et l’embauche à distance fait que bien des employeurs en franchissent une sans l’avoir décidé. Les normes d’emploi, les politiques obligatoires, les obligations en matière de vie privée et la paie suivent la compétence applicable plutôt que l’emplacement du siège social.',
      ),
      li(
        'Record where each employee actually works, not simply which office they are attached to on the org chart.',
        'Consignez l’endroit où chaque employé travaille réellement, et non seulement le bureau auquel l’organigramme le rattache.',
      ),
      li(
        'Confirm whether the operation is provincially or federally regulated before selecting any template — the choice governs nearly everything downstream.',
        'Confirmez si l’exploitation relève du provincial ou du fédéral avant de choisir un modèle — ce choix régit presque tout le reste.',
      ),
      li(
        'Check language-of-work obligations where they apply, which can govern the language the employment documents themselves are provided in.',
        'Vérifiez les obligations relatives à la langue du travail lorsqu’elles s’appliquent, car elles peuvent régir la langue dans laquelle les documents d’emploi eux-mêmes sont remis.',
      ),
      li(
        'Revisit the set when someone relocates — a move can change which rules apply without any change to the job.',
        'Réexaminez l’ensemble lorsqu’une personne déménage — un déplacement peut changer les règles applicables sans aucun changement à l’emploi.',
      ),
    ],
  },
  {
    blocks: [
      p(
        'Dutiva ships templates covering the common Canadian HR documents across Ontario, Quebec, and the federal regime, and keeps a record of what was generated and when. Templates are a starting point for your situation, not a legal opinion about it — have anything consequential reviewed.',
        'Dutiva propose des modèles couvrant les documents RH canadiens courants pour l’Ontario, le Québec et le régime fédéral, et conserve un registre de ce qui a été généré et à quel moment. Les modèles sont un point de départ adapté à votre situation, non un avis juridique à son sujet — faites réviser tout ce qui a des conséquences importantes.',
      ),
    ],
  },
]
