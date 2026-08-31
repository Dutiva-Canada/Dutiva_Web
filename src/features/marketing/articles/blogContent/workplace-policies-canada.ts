import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = [
  {
    blocks: [
      p(
        'Employers tend to treat policies as a compliance chore — write them once, file them, move on. Regulators and adjudicators treat them as evidence of how a workplace actually operates. That gap is where the risk lives, because a policy you have not followed can be used to establish the standard you set for yourself and then failed to meet.',
        'Les employeurs tendent à considérer les politiques comme une corvée de conformité : les rédiger une fois, les classer, passer à autre chose. Les organismes de réglementation et les décideurs y voient une preuve du fonctionnement réel du milieu de travail. C’est dans cet écart que réside le risque, car une politique que vous n’avez pas suivie peut servir à établir la norme que vous vous êtes vous-même fixée sans la respecter.',
      ),
    ],
  },
  {
    heading: bi('Commonly required in writing', 'Fréquemment obligatoires par écrit'),
    blocks: [
      p(
        'The exact list depends on your jurisdiction, your sector, and often your headcount, but these recur across Canadian regimes:',
        'La liste exacte dépend de votre compétence, de votre secteur et souvent de votre effectif, mais celles-ci reviennent d’un régime canadien à l’autre :',
      ),
      li(
        'Workplace harassment and violence prevention, including a stated complaint and investigation procedure.',
        'Prévention du harcèlement et de la violence en milieu de travail, incluant une procédure énoncée de plainte et d’enquête.',
      ),
      li(
        'Occupational health and safety, matched to the real hazards of the work performed.',
        'Santé et sécurité au travail, adaptée aux risques réels du travail effectué.',
      ),
      li(
        'Accessibility and accommodation, including how an employee asks for one.',
        'Accessibilité et accommodement, y compris la façon dont un employé en fait la demande.',
      ),
      li(
        'Privacy governing employee personal information, under the regime that applies to you.',
        'Protection des renseignements personnels des employés, selon le régime qui vous est applicable.',
      ),
      li(
        'Disconnecting from work and electronic monitoring, where your jurisdiction requires them at your size.',
        'Déconnexion du travail et surveillance électronique, lorsque votre compétence les exige pour votre taille d’entreprise.',
      ),
    ],
  },
  {
    heading: bi(
      'A stale policy is a liability, not a formality',
      'Une politique périmée est un risque, non une formalité',
    ),
    blocks: [
      p(
        'Three failure modes account for most of the trouble. The policy names a role or a person who no longer exists, so a complaint has nowhere to go. The policy describes a process the organization has quietly stopped following, so every departure from it looks deliberate. Or the policy was updated but never redistributed, so the version employees hold is the old one — and that is generally the version that governs their expectations.',
        'Trois modes de défaillance expliquent l’essentiel des problèmes. La politique nomme un rôle ou une personne qui n’existe plus, de sorte qu’une plainte n’a nulle part où aller. La politique décrit un processus que l’organisation a discrètement cessé de suivre, de sorte que chaque écart paraît délibéré. Ou encore la politique a été mise à jour sans être rediffusée, de sorte que la version détenue par les employés est l’ancienne — et c’est généralement celle qui régit leurs attentes.',
      ),
    ],
  },
  {
    heading: bi('Make the maintenance routine', 'Faites de l’entretien une routine'),
    blocks: [
      li(
        'Review policies on a set schedule and record the date of each review, even when nothing changes.',
        'Révisez les politiques selon un calendrier établi et consignez la date de chaque révision, même sans modification.',
      ),
      li(
        'Redistribute after any substantive change and keep dated acknowledgements.',
        'Rediffusez après toute modification de fond et conservez des accusés de réception datés.',
      ),
      li(
        'Name roles rather than individuals, so ordinary turnover does not invalidate the document.',
        'Nommez des rôles plutôt que des personnes, afin qu’un roulement normal n’invalide pas le document.',
      ),
      li(
        'Keep superseded versions — you may need to show what applied at a particular time.',
        'Conservez les versions antérieures — vous pourriez devoir démontrer ce qui s’appliquait à un moment donné.',
      ),
    ],
  },
  {
    heading: bi(
      'Write it so it can actually be followed',
      'Rédigez-la pour qu’elle puisse réellement être suivie',
    ),
    blocks: [
      p(
        'The most common drafting error is promising more process than the organization will deliver. A policy that commits to an investigation completed on a fixed timetable, an appeal to a committee that has never met, or a review cycle nobody owns creates a standard the employer will be measured against and will miss. Write what you will do, then do it.',
        'L’erreur de rédaction la plus courante consiste à promettre plus de processus que l’organisation n’en livrera. Une politique qui s’engage à une enquête terminée selon un échéancier fixe, à un appel devant un comité qui ne s’est jamais réuni ou à un cycle de révision dont personne n’est responsable crée une norme à l’aune de laquelle l’employeur sera évalué et à laquelle il faillira. Écrivez ce que vous ferez, puis faites-le.',
      ),
      p(
        'A workable policy states who it applies to, what conduct or situation it governs, what the employee is expected to do, what the employer will do in response, and who owns it by role. Anything beyond that tends to be either aspiration or legal text copied from a source that did not have your workplace in mind — and both dilute the parts that matter.',
        'Une politique viable indique à qui elle s’applique, quels comportements ou situations elle régit, ce qu’on attend de l’employé, ce que l’employeur fera en réponse, et qui en est responsable par fonction. Ce qui dépasse cela relève généralement soit de l’aspiration, soit d’un texte juridique copié d’une source qui n’avait pas votre milieu de travail en tête — et les deux diluent l’essentiel.',
      ),
    ],
  },
  {
    heading: bi(
      'Training and acknowledgement are part of the obligation',
      'La formation et l’accusé de réception font partie de l’obligation',
    ),
    blocks: [
      p(
        'For several of these policies the legislation requires not just a document but that workers be informed and, in some cases, trained. Distribution alone may not discharge that. Keep a record of who was trained, on what version, and when — and repeat it for new hires and after substantive revisions rather than treating it as a one-time exercise at launch.',
        'Pour plusieurs de ces politiques, la loi exige non seulement un document, mais aussi que les travailleurs soient informés et, dans certains cas, formés. La seule diffusion peut ne pas y satisfaire. Conservez un registre des personnes formées, sur quelle version et à quel moment — et répétez l’exercice pour les nouvelles embauches et après toute révision de fond plutôt que de le traiter comme une opération unique au lancement.',
      ),
      p(
        'Acknowledgements are worth collecting even where they are not strictly required, because they answer the question that comes up first in any dispute: did this person know? An unsigned acknowledgement is not fatal, but a documented distribution list with dates is considerably better than a recollection that the policy was on the intranet.',
        'Les accusés de réception valent la peine d’être recueillis même lorsqu’ils ne sont pas strictement exigés, car ils répondent à la question qui surgit en premier dans tout litige : cette personne le savait-elle? Un accusé non signé n’est pas fatal, mais une liste de diffusion documentée et datée vaut considérablement mieux que le souvenir que la politique se trouvait sur l’intranet.',
      ),
    ],
  },
  {
    heading: bi('Where policy meets discipline', 'Quand la politique rencontre la discipline'),
    blocks: [
      p(
        'Policies become consequential at the moment an employer relies on one to justify a decision. Two things determine whether that reliance holds: whether the employee knew the rule, and whether the employer has applied it consistently to others. Selective enforcement is one of the most reliable ways to convert a defensible decision into an indefensible one, because it supports the argument that the policy was a pretext rather than the reason.',
        'Les politiques deviennent déterminantes au moment où un employeur en invoque une pour justifier une décision. Deux éléments déterminent la solidité de cet appui : l’employé connaissait-il la règle, et l’employeur l’a-t-il appliquée de façon uniforme aux autres. L’application sélective est l’un des moyens les plus sûrs de transformer une décision défendable en décision indéfendable, car elle appuie l’argument que la politique servait de prétexte plutôt que de motif.',
      ),
      p(
        'Before relying on a policy breach, check that the version in force at the time said what you think it said, that the employee received it, and that comparable conduct by others was handled the same way. Where it was not, that is worth knowing before the decision rather than during a hearing about it.',
        'Avant d’invoquer un manquement à une politique, vérifiez que la version en vigueur à l’époque disait bien ce que vous croyez, que l’employé l’a reçue, et qu’une conduite comparable d’autres personnes a été traitée de la même manière. Si ce n’est pas le cas, mieux vaut le savoir avant la décision que pendant une audience à son sujet.',
      ),
    ],
  },
  {
    heading: bi(
      'A starting set for a growing employer',
      'Un ensemble de départ pour un employeur en croissance',
    ),
    blocks: [
      p(
        'Employers who are behind on this rarely benefit from trying to adopt everything at once. A more reliable approach is to put the required items in place first, in the order that exposure actually accrues, and to add the discretionary ones as the organization grows into them.',
        'Les employeurs en retard sur ce plan gagnent rarement à vouloir tout adopter d’un coup. Une approche plus fiable consiste à mettre d’abord en place les éléments obligatoires, dans l’ordre où l’exposition s’accumule réellement, puis à ajouter les éléments facultatifs à mesure que l’organisation y arrive.',
      ),
      li(
        'Start with harassment and violence prevention and with health and safety, because these are the most widely mandated and the most likely to be examined after an incident.',
        'Commencez par la prévention du harcèlement et de la violence et par la santé et sécurité, car ce sont les plus largement obligatoires et les plus susceptibles d’être examinées après un incident.',
      ),
      li(
        'Add accommodation and privacy next, since both govern processes you are already running whether or not they are written down.',
        'Ajoutez ensuite l’accommodement et la protection de la vie privée, puisque les deux régissent des processus que vous appliquez déjà, qu’ils soient consignés ou non.',
      ),
      li(
        'Then technology use and remote work, which mostly prevent disputes rather than satisfying a requirement — though some jurisdictions now mandate elements of both above a headcount threshold.',
        'Puis l’utilisation des technologies et le télétravail, qui préviennent surtout des différends plutôt que de satisfaire une exigence — bien que certaines compétences en imposent maintenant des éléments au-delà d’un seuil d’effectif.',
      ),
      li(
        'Re-run the exercise whenever headcount crosses a threshold that attaches new obligations, and whenever you begin employing someone in a new jurisdiction.',
        'Refaites l’exercice chaque fois que l’effectif franchit un seuil qui fait naître de nouvelles obligations, et chaque fois que vous commencez à employer quelqu’un dans une nouvelle compétence.',
      ),
      p(
        'Resist adopting a large borrowed handbook to close the gap quickly. It will describe processes you do not run, name roles you do not have, and reference legislation that may not govern you — and every one of those becomes a standard you have set for yourself in writing.',
        'Évitez d’adopter un vaste manuel emprunté pour combler rapidement l’écart. Il décrira des processus que vous n’appliquez pas, nommera des fonctions que vous n’avez pas et renverra à des lois qui ne vous régissent peut-être pas — et chacun de ces éléments devient une norme que vous vous êtes fixée par écrit.',
      ),
    ],
  },
  {
    blocks: [
      p(
        'Confirm which policies are mandatory for your jurisdiction, sector, and size — the thresholds change and several were added in recent years. Dutiva can hold your policy set and track when each was last reviewed; deciding which ones the law requires of you remains a question for counsel.',
        'Confirmez quelles politiques sont obligatoires selon votre compétence, votre secteur et votre taille — les seuils évoluent et plusieurs ont été ajoutés ces dernières années. Dutiva peut héberger votre corpus de politiques et suivre la date de la dernière révision de chacune; déterminer lesquelles la loi vous impose demeure une question pour un conseiller juridique.',
      ),
    ],
  },
]
