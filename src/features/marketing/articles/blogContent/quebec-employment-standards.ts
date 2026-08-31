import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = [
  {
    blocks: [
      p(
        'Employers expanding from Ontario into Quebec often assume the two provinces differ mainly in language of service. They differ in legal architecture. Quebec is a civil-law jurisdiction; its employment rules sit in the Act respecting labour standards alongside the Civil Code of Québec, and several of them have no Ontario equivalent at all. Treating a Quebec hire as an Ontario hire with translated paperwork is a reliable way to end up out of compliance.',
        'Les employeurs qui étendent leurs activités de l’Ontario au Québec présument souvent que les deux provinces diffèrent surtout par la langue de service. Elles diffèrent par l’architecture juridique. Le Québec est une compétence de droit civil; ses règles d’emploi se trouvent dans la Loi sur les normes du travail, en parallèle du Code civil du Québec, et plusieurs d’entre elles n’ont aucun équivalent ontarien. Traiter une embauche québécoise comme une embauche ontarienne avec des documents traduits est un moyen sûr de se retrouver en situation de non-conformité.',
      ),
    ],
  },
  {
    heading: bi(
      'Protection against dismissal without good and sufficient cause',
      'Protection contre le congédiement sans cause juste et suffisante',
    ),
    blocks: [
      p(
        'This is the largest structural difference. Once an employee has accumulated enough continuous service, Quebec provides a recourse against dismissal made without good and sufficient cause — a remedy that can include reinstatement. Ontario has no general equivalent for non-union employees, where the usual question is how much notice is owed rather than whether the dismissal may stand. An employer used to thinking in notice alone will misjudge Quebec risk substantially.',
        'C’est la plus grande différence structurelle. Une fois qu’un employé a accumulé suffisamment de service continu, le Québec offre un recours contre le congédiement fait sans cause juste et suffisante — un recours qui peut inclure la réintégration. L’Ontario n’a aucun équivalent général pour les employés non syndiqués, où la question habituelle est le montant du préavis dû plutôt que le maintien du congédiement. Un employeur habitué à raisonner uniquement en préavis évaluera très mal le risque québécois.',
      ),
    ],
  },
  {
    heading: bi('Language of work', 'Langue du travail'),
    blocks: [
      p(
        'Quebec regulates the language of the workplace itself, not just the language of consumer-facing material. Employment documents, internal communications, and the conditions under which another language may be required of a position are all governed. Requirements have been tightened in recent years and are tied to business size, so verify the current thresholds and obligations that apply to you rather than relying on what a colleague did some years ago.',
        'Le Québec encadre la langue du travail elle-même, et pas seulement celle des documents destinés aux consommateurs. Les documents d’emploi, les communications internes et les conditions permettant d’exiger une autre langue pour un poste sont tous visés. Les exigences ont été resserrées ces dernières années et varient selon la taille de l’entreprise; vérifiez donc les seuils et obligations en vigueur qui s’appliquent à vous plutôt que de vous fier à ce qu’un collègue a fait il y a quelques années.',
      ),
    ],
  },
  {
    heading: bi('Other differences worth checking', 'Autres différences à vérifier'),
    blocks: [
      li(
        'Statutory holidays are not the same list as Ontario’s, and the calculation of holiday pay differs.',
        'La liste des jours fériés n’est pas celle de l’Ontario, et le calcul de l’indemnité afférente diffère.',
      ),
      li(
        'Annual leave entitlements accrue on a different structure and reference period.',
        'Les droits au congé annuel s’accumulent selon une structure et une période de référence différentes.',
      ),
      li(
        'Psychological harassment obligations are expressly framed in the labour standards legislation, with a required policy.',
        'Les obligations en matière de harcèlement psychologique sont expressément prévues dans la législation sur les normes du travail, avec une politique obligatoire.',
      ),
      li(
        'Quebec has its own private-sector privacy regime, distinct from PIPEDA, with its own obligations for employee data.',
        'Le Québec a son propre régime de protection des renseignements personnels dans le secteur privé, distinct de la LPRPDE, avec ses propres obligations à l’égard des données des employés.',
      ),
      li(
        'Payroll deductions and provincial programs differ, including parental insurance.',
        'Les retenues à la source et les programmes provinciaux diffèrent, notamment l’assurance parentale.',
      ),
    ],
  },
  {
    heading: bi(
      'Psychological harassment carries a standing obligation',
      'Le harcèlement psychologique impose une obligation permanente',
    ),
    blocks: [
      p(
        'Quebec was early to legislate expressly on psychological harassment, and the obligation sits in the labour standards regime rather than only in occupational health and safety. Employers are required to take reasonable steps to prevent it and, when it is brought to their attention, to make it stop. A written prevention and complaint-handling policy is required, and the framework expressly reaches conduct of a sexual nature.',
        'Le Québec a légiféré tôt et expressément sur le harcèlement psychologique, et l’obligation se trouve dans le régime des normes du travail plutôt que seulement en santé et sécurité du travail. Les employeurs doivent prendre les moyens raisonnables pour le prévenir et, lorsqu’il est porté à leur connaissance, le faire cesser. Une politique écrite de prévention et de traitement des plaintes est obligatoire, et le cadre vise expressément les conduites à caractère sexuel.',
      ),
      p(
        'An Ontario employer extending its existing harassment policy into Quebec usually needs more than a translation. The definitions, the recourse available to the employee, and the body that hears a complaint all differ, and a policy that describes an Ontario process to a Quebec employee is describing the wrong one.',
        'L’employeur ontarien qui étend sa politique de harcèlement existante au Québec a généralement besoin de plus qu’une traduction. Les définitions, le recours offert à l’employé et l’instance qui entend une plainte diffèrent tous, et une politique décrivant un processus ontarien à un employé québécois décrit le mauvais processus.',
      ),
    ],
  },
  {
    heading: bi(
      'Employee privacy is governed provincially',
      'La vie privée des employés relève du provincial',
    ),
    blocks: [
      p(
        'Quebec has its own private-sector privacy statute governing personal information, and it applies to employee data held by Quebec employers rather than leaving that field to the federal regime. Recent reform has strengthened it considerably, adding obligations around governance, transparency about how information is used, incident reporting, and individual rights.',
        'Le Québec dispose de sa propre loi sur la protection des renseignements personnels dans le secteur privé, et elle s’applique aux données des employés détenues par les employeurs québécois plutôt que de laisser ce champ au régime fédéral. Une réforme récente l’a considérablement renforcée, ajoutant des obligations de gouvernance, de transparence sur l’utilisation des renseignements, de déclaration des incidents et de droits individuels.',
      ),
      p(
        'For an employer running HR processes across provinces, the practical consequence is that Quebec employee records may be subject to requirements the same records would not attract elsewhere — including around how information is collected, how long it is kept, and what has to happen when confidentiality is breached. Confirm your obligations against the current statute rather than assuming a national privacy policy covers it.',
        'Pour un employeur qui exploite des processus RH dans plusieurs provinces, la conséquence pratique est que les dossiers d’employés québécois peuvent être assujettis à des exigences que les mêmes dossiers n’attireraient pas ailleurs — notamment quant à la collecte des renseignements, à leur durée de conservation et à ce qui doit survenir en cas d’atteinte à la confidentialité. Validez vos obligations au regard de la loi en vigueur plutôt que de présumer qu’une politique nationale de confidentialité y répond.',
      ),
    ],
  },
  {
    heading: bi('Before your first Quebec hire', 'Avant votre première embauche au Québec'),
    blocks: [
      li(
        'Have the employment documents prepared for Quebec rather than adapted from an Ontario set, and confirm the language in which they must be provided.',
        'Faites préparer les documents d’emploi pour le Québec plutôt que de les adapter d’un ensemble ontarien, et confirmez la langue dans laquelle ils doivent être remis.',
      ),
      li(
        'Register with the applicable provincial payroll and workplace programs before the first pay run rather than after it.',
        'Inscrivez-vous aux programmes provinciaux de paie et de milieu de travail applicables avant la première paie plutôt qu’après.',
      ),
      li(
        'Put the required psychological harassment policy in place and distribute it, keeping proof of distribution.',
        'Mettez en place la politique obligatoire contre le harcèlement psychologique et diffusez-la, en conservant la preuve de la diffusion.',
      ),
      li(
        "Review how you handle employee personal information against Quebec's privacy requirements specifically.",
        'Révisez votre traitement des renseignements personnels des employés au regard des exigences québécoises en matière de vie privée en particulier.',
      ),
      li(
        'Budget for advice from counsel practising in Quebec before the relationship starts, not at the point it ends.',
        'Prévoyez un budget pour l’avis d’un conseiller qui pratique au Québec avant le début de la relation, et non au moment où elle se termine.',
      ),
    ],
  },
  {
    heading: bi(
      'Ending employment under a civil-law contract',
      'Mettre fin à un emploi sous un contrat de droit civil',
    ),
    blocks: [
      p(
        "Quebec's employment contract is governed by the Civil Code, and the vocabulary that Ontario employers rely on does not map cleanly onto it. The Code frames the obligation as reasonable notice of termination, alongside the labour standards minimums, and it recognizes a serious reason as the basis for ending a contract without notice. An employer thinking in terms of common-law reasonable notice and just cause is reasoning about adjacent but distinct concepts.",
        'Le contrat de travail québécois est régi par le Code civil, et le vocabulaire sur lequel s’appuient les employeurs ontariens ne s’y transpose pas proprement. Le Code formule l’obligation comme un délai de congé raisonnable, en parallèle des minimums prévus par les normes du travail, et il reconnaît le motif sérieux comme fondement d’une résiliation sans délai de congé. L’employeur qui raisonne en préavis raisonnable de common law et en motif valable réfléchit à des concepts voisins mais distincts.',
      ),
      p(
        'The recourse against dismissal without good and sufficient cause sits on top of that and changes what is actually at stake. In Ontario the practical question at the end of most non-union relationships is how much notice is owed; in Quebec, for an employee with enough continuous service, the question can be whether the dismissal stands at all. Reinstatement is a live remedy rather than a theoretical one, which means the analysis has to happen before the decision rather than during a negotiation about its cost.',
        'Le recours contre le congédiement sans cause juste et suffisante s’y superpose et modifie ce qui est réellement en jeu. En Ontario, la question pratique à la fin de la plupart des relations non syndiquées est le montant du préavis dû; au Québec, pour un employé comptant suffisamment de service continu, la question peut être le maintien même du congédiement. La réintégration est un remède bien réel plutôt que théorique, ce qui signifie que l’analyse doit précéder la décision plutôt que d’accompagner une négociation sur son coût.',
      ),
      p(
        'The practical consequence for a multi-province employer is that a single national termination playbook will misprice Quebec departures. Build the Quebec path separately, and involve counsel practising there before the conversation happens rather than after a contestation is filed.',
        'La conséquence pratique pour un employeur multiprovincial est qu’un guide national unique de cessation d’emploi évaluera mal les départs québécois. Construisez le parcours québécois séparément, et faites intervenir un conseiller qui y pratique avant la conversation plutôt qu’après le dépôt d’une contestation.',
      ),
    ],
  },
  {
    blocks: [
      p(
        'Dutiva treats Quebec as its own jurisdiction rather than an Ontario variant, alongside Ontario and the federal regime. Jurisdiction-specific guidance narrows the questions worth asking; it does not answer them for your particular situation, and Quebec questions in particular reward advice from counsel practising there.',
        'Dutiva traite le Québec comme une compétence à part entière plutôt que comme une variante de l’Ontario, aux côtés de l’Ontario et du régime fédéral. Un accompagnement propre à la compétence resserre les questions à se poser; il n’y répond pas pour votre situation particulière, et les questions québécoises en particulier gagnent à être soumises à un conseiller qui y pratique.',
      ),
    ],
  },
]
