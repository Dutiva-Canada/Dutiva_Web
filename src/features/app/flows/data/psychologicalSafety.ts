import { bi } from '@/i18n/core'
import type { Flow, FlowChoiceStep } from '../flowModel'

/**
 * Ring 2, Pillar C — the psychological safety self-check
 * (docs/FOUR_RING_FRAMEWORK.md). All FR is [FR self-authored].
 *
 * **What this is not.** CSA Z1003-13 is a copyrighted standard published by
 * the CSA Group, and its assessment instrument is not reproduced here — not
 * in whole, not in paraphrase. What is borrowed is the set of thirteen
 * psychosocial factors the Standard identifies, which are named and described
 * in freely published material about it. Every question below is written from
 * scratch, and the copy is careful never to describe a run as an audit
 * against the Standard, a measure of conformance, or any kind of
 * certification. An employer who wants to work to the Standard should buy it.
 *
 * The framework asks for "15 questions"; there are thirteen, one per factor.
 * A round number was the wrong thing to preserve — padding two factors into
 * four questions would weight them double for no reason.
 *
 * **Why it is not anonymous employee survey.** This asks an employer what
 * they have put in place, not how their staff feel. A survey of employees is
 * a different instrument with different ethics — consent, anonymity, a duty
 * to act on what it surfaces — and quietly shipping one as a self-check would
 * be the wrong tool wearing the right label.
 */

const SCALE = [
  { id: 'no', value: 0, label: bi('Not in place', 'Rien en place') },
  { id: 'started', value: 1, label: bi('Started, informal', 'Amorcé, informel') },
  {
    id: 'mostly',
    value: 2,
    label: bi('Mostly, not written down', 'En bonne partie, non consigné'),
  },
  { id: 'yes', value: 3, label: bi('In place and written down', 'En place et consigné') },
]

/** One rated question. Every option scores and leads to the same next step. */
const rate = (
  id: string,
  to: string,
  domain: ReturnType<typeof bi>,
  title: ReturnType<typeof bi>,
  body: ReturnType<typeof bi>,
  caution?: ReturnType<typeof bi>,
): FlowChoiceStep => ({
  id,
  kind: 'choice',
  domain,
  title,
  body,
  ...(caution !== undefined && { caution }),
  options: SCALE.map((option) => ({
    id: option.id,
    label: option.label,
    value: option.value,
    to,
  })),
})

export const psychologicalSafetyFlow: Flow = {
  slug: 'psychological-safety-check',
  ring: 2,
  jurisdictions: ['ON', 'QC', 'FED'],
  estMinutes: 10,
  title: bi('Psychological safety self-check', 'Autoévaluation de la santé psychologique'),
  summary: bi(
    'Thirteen questions on what you have actually put in place, scored by factor — so the gaps are specific enough to act on.',
    'Treize questions sur ce que vous avez réellement mis en place, avec un score par facteur — pour que les lacunes soient assez précises pour être corrigées.',
  ),
  start: 'intro',
  steps: [
    {
      id: 'intro',
      kind: 'task',
      title: bi('Before you start', 'Avant de commencer'),
      body: bi(
        'This walks through the thirteen psychosocial factors that shape psychological health at work — the set named by the national standard on the subject, CSA Z1003-13. It asks what your organization has in place, not how your people feel.',
        'Ce parcours passe en revue les treize facteurs psychosociaux qui influencent la santé psychologique au travail — l’ensemble nommé par la norme nationale en la matière, CSA Z1003-13. Il porte sur ce que votre organisation a mis en place, et non sur le ressenti de votre personnel.',
      ),
      points: [
        bi(
          'Answer for what is actually true today, not what is planned. A generous answer produces a score that tells you nothing.',
          'Répondez selon ce qui est vrai aujourd’hui, non selon ce qui est prévu. Une réponse complaisante produit un score qui ne vous apprend rien.',
        ),
        bi(
          '"Written down" means someone new could find it and follow it without asking you.',
          '« Consigné » signifie qu’une personne nouvellement arrivée pourrait le trouver et l’appliquer sans vous consulter.',
        ),
        bi(
          'Nothing is stored. The result is yours to read and act on, and re-running it later is how you see movement.',
          'Rien n’est conservé. Le résultat vous appartient : lisez-le, agissez, et refaites l’exercice plus tard pour mesurer l’évolution.',
        ),
      ],
      caution: bi(
        'This is a self-check, not an audit against CSA Z1003-13 and not a measure of conformance with it. The Standard is published by the CSA Group and is the authoritative source; working to it means obtaining it.',
        'Il s’agit d’une autoévaluation, et non d’un audit au regard de la norme CSA Z1003-13 ni d’une mesure de conformité à celle-ci. La norme est publiée par le Groupe CSA et constitue la source faisant autorité; s’y conformer suppose de se la procurer.',
      ),
      to: 'q_support',
    },

    rate(
      'q_support',
      'q_culture',
      bi('Psychological support', 'Soutien psychologique'),
      bi('Support when someone is struggling', 'Soutien en cas de difficulté'),
      bi(
        'People know where to turn when work is affecting their mental health, and the person they turn to knows what to do next.',
        'Les gens savent vers qui se tourner lorsque le travail affecte leur santé mentale, et cette personne sait quoi faire ensuite.',
      ),
    ),
    rate(
      'q_culture',
      'q_leadership',
      bi('Organizational culture', 'Culture organisationnelle'),
      bi('Trust and honesty day to day', 'Confiance et franchise au quotidien'),
      bi(
        'People can raise a problem without managing how it will be received, and what leadership says matches what it does.',
        'Les gens peuvent soulever un problème sans avoir à gérer la façon dont il sera reçu, et les paroles de la direction concordent avec ses gestes.',
      ),
    ),
    rate(
      'q_leadership',
      'q_civility',
      bi('Clear leadership and expectations', 'Leadership et attentes clairs'),
      bi('People know what is expected', 'Les attentes sont connues'),
      bi(
        'Everyone can say what their job is, what good looks like, and what is changing. Ambiguity is a workload of its own.',
        'Chacun peut dire en quoi consiste son poste, ce qui est attendu et ce qui change. L’ambiguïté constitue une charge en soi.',
      ),
    ),
    rate(
      'q_civility',
      'q_fit',
      bi('Civility and respect', 'Civilité et respect'),
      bi('How people treat each other', 'La façon dont les gens se traitent'),
      bi(
        'There is a standard for conduct, people know it, and it is applied to everyone — including whoever is hardest to apply it to.',
        'Une norme de conduite existe, elle est connue et elle s’applique à tous — y compris à la personne à qui il est le plus difficile de l’appliquer.',
      ),
      bi(
        'This is the factor that overlaps your legal obligations most directly: harassment and violence prevention is required by statute in every jurisdiction Dutiva covers, and a policy is the floor rather than the answer.',
        'C’est le facteur qui recoupe le plus directement vos obligations légales : la prévention du harcèlement et de la violence est exigée par la loi dans toutes les juridictions couvertes par Dutiva, et une politique en constitue le plancher, non la réponse.',
      ),
    ),
    rate(
      'q_fit',
      'q_growth',
      bi('Psychological job fit', 'Adéquation psychologique au poste'),
      bi('The job suits the person doing it', 'Le poste convient à la personne qui l’occupe'),
      bi(
        'Roles are matched to what people are actually good at and can sustain, and a mismatch gets addressed rather than endured.',
        'Les postes correspondent à ce que les gens font réellement bien et peuvent soutenir dans la durée, et une inadéquation est traitée plutôt que subie.',
      ),
    ),
    rate(
      'q_growth',
      'q_recognition',
      bi('Growth and development', 'Croissance et perfectionnement'),
      bi('Room to build skills', 'Possibilité de développer ses compétences'),
      bi(
        'People have a way to develop that does not depend on their manager remembering to offer it.',
        'Les gens disposent d’un moyen de se perfectionner qui ne dépend pas du fait que leur gestionnaire y pense.',
      ),
    ),
    rate(
      'q_recognition',
      'q_involvement',
      bi('Recognition and reward', 'Reconnaissance et récompense'),
      bi('Effort is acknowledged', 'Les efforts sont reconnus'),
      bi(
        'Good work is noticed in a way people can predict, rather than only when it is exceptional or only when it is missing.',
        'Le bon travail est remarqué de façon prévisible, plutôt qu’uniquement lorsqu’il est exceptionnel ou lorsqu’il fait défaut.',
      ),
    ),
    rate(
      'q_involvement',
      'q_workload',
      bi('Involvement and influence', 'Participation et influence'),
      bi('A say in the work', 'Une voix au chapitre'),
      bi(
        'People are consulted on decisions that change how they work, early enough for the answer to still be open.',
        'Les gens sont consultés sur les décisions qui modifient leur façon de travailler, assez tôt pour que la réponse soit encore ouverte.',
      ),
    ),
    rate(
      'q_workload',
      'q_engagement',
      bi('Workload management', 'Gestion de la charge de travail'),
      bi('The work fits the hours', 'Le travail entre dans les heures'),
      bi(
        'What is asked of people can be done in the time they have, and someone notices when it stops being true.',
        'Ce qui est demandé peut être accompli dans le temps disponible, et quelqu’un s’en aperçoit lorsque ce n’est plus le cas.',
      ),
    ),
    rate(
      'q_engagement',
      'q_balance',
      bi('Engagement', 'Engagement'),
      bi('People are connected to the work', 'Les gens sont liés à leur travail'),
      bi(
        'People understand how their work matters, and you would know before they left if that had stopped being true.',
        'Les gens comprennent en quoi leur travail compte, et vous le sauriez avant leur départ si ce n’était plus le cas.',
      ),
    ),
    rate(
      'q_balance',
      'q_protection',
      bi('Balance', 'Équilibre'),
      bi('Work stays inside its edges', 'Le travail reste dans ses limites'),
      bi(
        'There is an understood boundary around hours and availability, and the people most likely to breach it are managers rather than staff.',
        'Une limite comprise encadre les heures et la disponibilité, et ceux qui risquent le plus de l’outrepasser sont les gestionnaires, non le personnel.',
      ),
    ),
    rate(
      'q_protection',
      'q_physical',
      bi('Psychological protection', 'Protection psychologique'),
      bi('Speaking up is safe', 'Il est sans risque de s’exprimer'),
      bi(
        'Someone can raise a concern, decline unsafe work, or disagree with a decision without it costing them.',
        'Une personne peut soulever une préoccupation, refuser un travail dangereux ou contester une décision sans que cela lui coûte.',
      ),
      bi(
        'Protection from reprisal is a legal obligation, not only a cultural goal. If the honest answer here is low, treat it as a compliance finding as well as a wellbeing one.',
        'La protection contre les représailles est une obligation légale et pas seulement un objectif culturel. Si la réponse honnête est faible, traitez-la comme un constat de conformité autant que de bien-être.',
      ),
    ),
    rate(
      'q_physical',
      'result',
      bi('Protection of physical safety', 'Protection de la sécurité physique'),
      bi('Physical safety is handled', 'La sécurité physique est prise en charge'),
      bi(
        'Hazards are identified and acted on, and people believe that reporting one leads somewhere.',
        'Les dangers sont repérés et pris en charge, et les gens croient qu’un signalement mène à quelque chose.',
      ),
    ),

    {
      id: 'result',
      kind: 'result',
      title: bi('Where you stand', 'Où vous en êtes'),
      body: bi(
        'Your score is the share of what was available across the thirteen factors. Treat the factor breakdown as the useful part — a single number tells you how you are doing, and the breakdown tells you what to do.',
        'Votre score correspond à la part obtenue sur l’ensemble des treize facteurs. La ventilation par facteur en est la partie utile : un chiffre unique indique où vous en êtes, la ventilation indique quoi faire.',
      ),
      bands: [
        {
          id: 'established',
          minPercent: 70,
          tone: 'ok',
          title: bi('Largely established', 'Largement établi'),
          body: bi(
            'Most of what matters is in place and written down. The work from here is keeping it true as the organization changes, and looking hard at whichever factors scored lowest — a strong average hides a weak factor, and people experience the weak one.',
            'L’essentiel est en place et consigné. Le travail consiste désormais à le maintenir vrai à mesure que l’organisation évolue, et à examiner attentivement les facteurs les plus faibles — une bonne moyenne masque un facteur faible, et c’est celui-là que les gens vivent.',
          ),
          documents: ['T04', 'T13'],
        },
        {
          id: 'partial',
          minPercent: 40,
          tone: 'caution',
          title: bi('Real in places, informal in others', 'Réel par endroits, informel ailleurs'),
          body: bi(
            'A good deal of this exists in practice but not on paper, which means it depends on the people currently doing it and leaves with them. Start with the lowest-scoring factors, and start by writing down what already works.',
            'Une bonne part de cela existe en pratique sans être consignée : cela dépend donc des personnes en poste et disparaît avec elles. Commencez par les facteurs les plus faibles, et commencez par consigner ce qui fonctionne déjà.',
          ),
          documents: ['T13', 'T12', 'T04'],
        },
        {
          id: 'early',
          minPercent: 0,
          tone: 'risk',
          title: bi(
            'Early — start with the obligations',
            'Au début — commencez par les obligations',
          ),
          body: bi(
            'Little of this is in place yet, so sequence it rather than trying to build everything. Begin with the parts that are legally required — harassment and violence prevention, and protection from reprisal — because those carry consequences beyond morale, and a written standard of conduct is what most of the rest hangs off.',
            'Peu de choses sont en place : séquencez plutôt que de tout construire à la fois. Commencez par ce qui est exigé par la loi — la prévention du harcèlement et de la violence, et la protection contre les représailles — car ces éléments emportent des conséquences qui dépassent le moral, et une norme de conduite écrite constitue le socle du reste.',
          ),
          documents: ['T13', 'T12'],
        },
      ],
    },
  ],
}
