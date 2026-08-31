import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = [
  {
    blocks: [
      p(
        'Most Canadian employers are provincially regulated. A minority are federally regulated, and for them the Canada Labour Code — not the provincial employment standards statute — governs hours, leaves, termination, and much else. Because the two regimes differ meaningfully, an employer applying the wrong one is not slightly off; it is applying an entire body of rules that does not govern it.',
        'La plupart des employeurs canadiens relèvent de la compétence provinciale. Une minorité relèvent de la compétence fédérale, et pour eux, c’est le Code canadien du travail — et non la loi provinciale sur les normes d’emploi — qui régit les heures, les congés, la cessation d’emploi et bien d’autres aspects. Comme les deux régimes diffèrent sensiblement, l’employeur qui applique le mauvais n’est pas légèrement à côté : il applique tout un corpus de règles qui ne le régit pas.',
      ),
    ],
  },
  {
    heading: bi('It turns on the nature of the work', 'Tout dépend de la nature de l’activité'),
    blocks: [
      p(
        'Federal jurisdiction follows the type of undertaking, not the size of the company or where it is incorporated. It generally covers work that is interprovincial or international in nature, or that falls within specific federal heads of power. Sectors commonly captured include:',
        'La compétence fédérale suit le type d’entreprise, et non la taille de la société ni son lieu de constitution. Elle vise généralement les activités de nature interprovinciale ou internationale, ou qui relèvent de chefs de compétence fédéraux précis. Parmi les secteurs habituellement visés :',
      ),
      li(
        'Banking; interprovincial and international transportation; telecommunications and broadcasting.',
        'Les banques; le transport interprovincial et international; les télécommunications et la radiodiffusion.',
      ),
      li(
        'Air transport, shipping and navigation, and interprovincial pipelines.',
        'Le transport aérien, la navigation maritime et les pipelines interprovinciaux.',
      ),
      li(
        'Certain Crown corporations and undertakings declared to be for the general advantage of Canada.',
        'Certaines sociétés d’État et entreprises déclarées à l’avantage général du Canada.',
      ),
      p(
        'The hard cases are businesses that serve a federally regulated undertaking without obviously being one — a contractor whose work is essential and integral to a federal operation may be pulled into federal jurisdiction on that basis. This is a legal determination, and where it is genuinely unclear it is worth getting an opinion rather than choosing the answer that is administratively easier.',
        'Les cas difficiles sont les entreprises qui desservent une entreprise fédérale sans en être une de façon évidente — un sous-traitant dont le travail est essentiel et fait partie intégrante d’une exploitation fédérale peut, à ce titre, être assujetti à la compétence fédérale. Il s’agit d’une qualification juridique et, lorsqu’elle est réellement incertaine, mieux vaut obtenir un avis que de retenir la réponse administrativement plus commode.',
      ),
    ],
  },
  {
    heading: bi('Why the answer matters so much', 'Pourquoi la réponse compte autant'),
    blocks: [
      p(
        'The Canada Labour Code contains an unjust-dismissal recourse for eligible non-managerial employees that has no counterpart in most provincial standards legislation, and it can lead to reinstatement. Leave entitlements, hours-of-work rules, and the harassment and violence prevention framework are federal as well, and privacy for federally regulated employers falls under PIPEDA with respect to employee personal information. Getting the jurisdiction wrong therefore misroutes not one obligation but nearly all of them.',
        'Le Code canadien du travail prévoit pour les employés non cadres admissibles un recours en cas de congédiement injuste qui n’a pas d’équivalent dans la plupart des lois provinciales sur les normes, et qui peut mener à la réintégration. Les droits aux congés, les règles sur la durée du travail et le cadre de prévention du harcèlement et de la violence sont eux aussi fédéraux, et la protection de la vie privée pour les employeurs de compétence fédérale relève de la LPRPDE en ce qui concerne les renseignements personnels des employés. Se tromper de compétence achemine donc mal non pas une obligation, mais presque toutes.',
      ),
    ],
  },
  {
    heading: bi('Remote workers do not change it', 'Le télétravail n’y change rien'),
    blocks: [
      p(
        'An employee working from home in another province does not convert a federally regulated employer into a provincially regulated one, or the reverse. Jurisdiction follows the undertaking. Remote arrangements can still raise practical questions about which provincial rules touch the employee in other respects, so treat the jurisdictional question and the location question as separate.',
        'Un employé qui travaille depuis son domicile dans une autre province ne transforme pas un employeur de compétence fédérale en employeur de compétence provinciale, ni l’inverse. La compétence suit l’entreprise. Le télétravail peut tout de même soulever des questions pratiques sur les règles provinciales qui touchent l’employé à d’autres égards; traitez donc la question de la compétence et celle du lieu comme distinctes.',
      ),
    ],
  },
  {
    heading: bi(
      'What changes in practice if you are federal',
      'Ce qui change en pratique si vous êtes de compétence fédérale',
    ),
    blocks: [
      p(
        'The differences are not confined to termination. Nearly every recurring HR process has a federal counterpart that differs from the provincial one you may have built around:',
        'Les différences ne se limitent pas à la cessation d’emploi. Presque tous les processus RH récurrents ont un pendant fédéral qui diffère de celui, provincial, autour duquel vous avez peut-être bâti vos façons de faire :',
      ),
      li(
        'Hours of work, scheduling, breaks, and overtime follow federal rules, including notice requirements around schedule changes that have no provincial equivalent.',
        'La durée du travail, les horaires, les pauses et le temps supplémentaire suivent les règles fédérales, y compris des exigences d’avis en cas de modification d’horaire qui n’ont pas d’équivalent provincial.',
      ),
      li(
        'The leave catalogue is federal, with its own eligibility conditions and documentation limits.',
        'Le catalogue des congés est fédéral, avec ses propres conditions d’admissibilité et limites documentaires.',
      ),
      li(
        'Harassment and violence prevention runs under dedicated federal regulations, with prescribed steps for assessment, training, and resolution.',
        'La prévention du harcèlement et de la violence relève de règlements fédéraux dédiés, avec des étapes prescrites d’évaluation, de formation et de résolution.',
      ),
      li(
        'Employee personal information falls under PIPEDA, rather than under a provincial private-sector privacy statute.',
        'Les renseignements personnels des employés relèvent de la LPRPDE plutôt que d’une loi provinciale sur la protection des renseignements personnels dans le secteur privé.',
      ),
      li(
        'Pay-equity and employment-equity style obligations apply to federally regulated employers on their own terms and thresholds.',
        'Les obligations de type équité salariale et équité en matière d’emploi s’appliquent aux employeurs de compétence fédérale selon leurs propres modalités et seuils.',
      ),
    ],
  },
  {
    heading: bi(
      'Confirming your status, and mixed operations',
      'Confirmer votre statut, et les exploitations mixtes',
    ),
    blocks: [
      p(
        'Most employers can settle the question by describing what the business actually does and comparing it against the federal heads of power — but a surprising number sit near a line. A business can also have federally regulated and provincially regulated parts, where a distinct division carries on an activity that is federal in nature while the rest is not. Where that is the case, the two parts follow different rules, and treating the whole organization as one regime will be wrong for part of it.',
        'La plupart des employeurs peuvent trancher la question en décrivant ce que fait réellement l’entreprise et en la comparant aux chefs de compétence fédéraux — mais un nombre étonnant se trouvent près d’une frontière. Une entreprise peut aussi comporter des parties de compétence fédérale et d’autres de compétence provinciale, lorsqu’une division distincte exerce une activité de nature fédérale alors que le reste ne l’est pas. Dans ce cas, les deux parties suivent des règles différentes, et traiter toute l’organisation comme un seul régime sera erroné pour une partie d’entre elles.',
      ),
      p(
        'Corporate structure is not the answer either. Being federally incorporated does not make an employer federally regulated, and a great many federally incorporated businesses are provincially regulated for employment purposes. The determination follows the nature of the undertaking, and it is worth recording the reasoning in writing once it is made so it does not get relitigated informally each time a question arises.',
        'La structure corporative n’est pas non plus la réponse. Être constituée en société fédérale ne rend pas un employeur de compétence fédérale, et un très grand nombre d’entreprises à charte fédérale relèvent du provincial en matière d’emploi. La qualification suit la nature de l’entreprise, et il vaut la peine de consigner le raisonnement par écrit une fois la question tranchée, afin qu’elle ne soit pas réexaminée de façon informelle chaque fois qu’elle refait surface.',
      ),
    ],
  },
  {
    heading: bi(
      'The unjust-dismissal recourse in practice',
      'Le recours pour congédiement injuste en pratique',
    ),
    blocks: [
      p(
        'This is the difference that most changes how a federally regulated employer should think about ending employment. Eligible non-managerial employees with sufficient continuous service can bring a complaint that the dismissal was unjust, and the available remedies include reinstatement with compensation — an outcome most provincially regulated employers never have to contemplate for non-union staff.',
        'C’est la différence qui modifie le plus la façon dont un employeur de compétence fédérale devrait envisager la fin d’un emploi. Les employés non cadres admissibles comptant suffisamment de service continu peuvent déposer une plainte alléguant que le congédiement était injuste, et les remèdes offerts incluent la réintégration avec indemnisation — une issue que la plupart des employeurs de compétence provinciale n’ont jamais à envisager pour du personnel non syndiqué.',
      ),
      p(
        'Two consequences follow. First, paying notice does not necessarily resolve the exposure the way it typically would provincially: an employer that offers a generous package may still face a complaint seeking the job back. Second, the quality of the underlying record matters more, because the question being asked is whether the dismissal was justified rather than what it should cost. Performance documentation, progressive discipline, and a consistent stated reason carry more weight here than in a jurisdiction where the argument is about quantum.',
        'Deux conséquences en découlent. D’abord, verser un préavis ne règle pas nécessairement l’exposition comme ce serait généralement le cas au provincial : l’employeur qui offre une indemnité généreuse peut tout de même faire face à une plainte visant la reprise de l’emploi. Ensuite, la qualité du dossier sous-jacent compte davantage, car la question posée est de savoir si le congédiement était justifié plutôt que ce qu’il devrait coûter. La documentation du rendement, la discipline progressive et un motif invoqué constant y pèsent plus lourd que dans une compétence où le débat porte sur le montant.',
      ),
      p(
        'Genuine discontinuance of a function is treated differently from dismissal for cause or performance, which is why an accurate characterization of the reason — settled before the meeting and reflected consistently in the letter and the Record of Employment — matters as much here as anywhere.',
        'La suppression véritable d’une fonction est traitée différemment d’un congédiement pour motif ou pour rendement, d’où l’importance d’une qualification exacte du motif — arrêtée avant la rencontre et reflétée de façon cohérente dans la lettre et le relevé d’emploi — tout autant ici qu’ailleurs.',
      ),
    ],
  },
  {
    blocks: [
      p(
        'If you have never confirmed which regime governs you, confirm it now rather than at the point of a dispute. Dutiva supports Ontario, Quebec, and the federal regime, and asks you to set the jurisdiction explicitly for exactly this reason — but the determination itself is a legal question about your business.',
        'Si vous n’avez jamais confirmé quel régime vous régit, faites-le maintenant plutôt qu’au moment d’un litige. Dutiva prend en charge l’Ontario, le Québec et le régime fédéral, et vous demande de préciser explicitement la compétence pour cette raison même — mais la qualification elle-même est une question juridique portant sur votre entreprise.',
      ),
    ],
  },
]
