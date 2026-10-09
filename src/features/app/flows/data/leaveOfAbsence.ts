import { bi } from '@/i18n/core'
import type { Flow } from '../flowModel'

/**
 * Ring 2, Pillar D — the leave of absence checklist
 * (docs/FOUR_RING_FRAMEWORK.md). All FR is [FR self-authored].
 *
 * The framework describes it as "type-specific checklists branching by leave
 * type", which is the right shape for a reason worth stating: the steps that
 * differ between leaves are not the administration — that is nearly identical
 * — but what you may ask for and what the return obligation looks like. A
 * single generic checklist collapses exactly the part that matters.
 *
 * Every branch converges on the same closing steps, because the way employers
 * get this wrong is rarely at the start. It is the return: the position that
 * quietly changed, the contact that never stopped, the benefit that lapsed
 * without anyone deciding it should.
 *
 * No figures anywhere. Leave durations, notice periods and paid-day counts
 * differ by jurisdiction and by leave, and several moved recently — this
 * names the statute and sends the reader to it.
 */
export const leaveOfAbsenceFlow: Flow = {
  slug: 'leave-of-absence',
  ring: 2,
  jurisdictions: ['ON', 'QC', 'FED'],
  estMinutes: 8,
  title: bi('Leave of absence', 'Congé d’absence'),
  summary: bi(
    'What to do when someone needs time away — by leave type, because what you may ask for is what differs.',
    'Que faire lorsqu’une personne a besoin de s’absenter — par type de congé, car c’est ce que vous pouvez demander qui varie.',
  ),
  start: 'which',
  steps: [
    {
      id: 'which',
      kind: 'choice',
      title: bi('What kind of leave is this?', 'De quel type de congé s’agit-il ?'),
      body: bi(
        'Name the leave as your employment standards act names it. That name decides the protections, the evidence you may ask for, whether any of it is paid, and what you owe on the return.',
        'Nommez le congé comme le fait votre loi sur les normes du travail. Cette appellation détermine les protections, la preuve exigible, le caractère rémunéré ou non et vos obligations au retour.',
      ),
      caution: bi(
        'If you are unsure which leave applies, do not guess and do not ask the employee to choose for you. Getting the name wrong changes what you are allowed to ask them.',
        'En cas de doute sur le congé applicable, ne devinez pas et ne demandez pas à l’employé(e) de trancher à votre place. Une erreur d’appellation modifie ce que vous êtes autorisé à demander.',
      ),
      options: [
        {
          id: 'medical',
          label: bi('Illness or injury', 'Maladie ou blessure'),
          detail: bi(
            'Their own health, short or long.',
            'Leur propre santé, à court ou à long terme.',
          ),
          to: 'medical',
        },
        {
          id: 'parental',
          label: bi('Pregnancy, birth or adoption', 'Grossesse, naissance ou adoption'),
          to: 'parental',
        },
        {
          id: 'bereavement',
          label: bi('A death, or caring for someone', 'Un décès, ou des soins à un proche'),
          detail: bi(
            'Bereavement, family responsibility, or care for a seriously ill relative.',
            'Deuil, obligations familiales ou soins à un proche gravement malade.',
          ),
          to: 'family',
        },
        {
          id: 'other',
          label: bi('Something else', 'Autre chose'),
          detail: bi(
            'Domestic or sexual violence, jury duty, reservist service, organ donation, or a leave your policy grants beyond the statute.',
            'Violence conjugale ou à caractère sexuel, fonction de juré, service de réserviste, don d’organes, ou un congé accordé par votre politique au-delà de la loi.',
          ),
          to: 'other',
        },
      ],
    },

    {
      id: 'medical',
      kind: 'task',
      title: bi('Illness or injury', 'Maladie ou blessure'),
      body: bi(
        'Start from what you are allowed to ask, which is less than most employers assume, and treat the length as unknown until it is known.',
        'Partez de ce que vous pouvez demander — moins que ne le supposent la plupart des employeurs — et considérez la durée comme inconnue jusqu’à ce qu’elle soit connue.',
      ),
      points: [
        bi(
          'Check what evidence your jurisdiction permits you to require for this leave before asking for any. The limits are real and several changed recently.',
          'Vérifiez la preuve que votre juridiction vous permet d’exiger pour ce congé avant d’en demander une. Les limites sont réelles et plusieurs ont changé récemment.',
        ),
        bi(
          'Ask about capacity and duration, never diagnosis. The functional limitations guide sets out the line.',
          'Interrogez sur la capacité et la durée, jamais sur le diagnostic. Le guide sur les limitations fonctionnelles trace la ligne.',
        ),
        bi(
          'Confirm whether it is paid — under the statute, your policy, or a disability plan — and tell them which.',
          'Confirmez s’il est rémunéré — par la loi, votre politique ou un régime d’invalidité — et dites-leur lequel.',
        ),
        bi(
          'If it looks like it will be long, treat the return as an accommodation question from the start rather than at the end.',
          'Si le congé s’annonce long, abordez le retour comme une question d’accommodement dès le départ plutôt qu’à la fin.',
        ),
      ],
      to: 'admin',
    },
    {
      id: 'parental',
      kind: 'task',
      title: bi('Pregnancy, birth or adoption', 'Grossesse, naissance ou adoption'),
      body: bi(
        'These are usually the longest leaves you will administer, and the ones where the return goes wrong most often because a lot changes while someone is away.',
        'Ce sont généralement les congés les plus longs que vous administrerez, et ceux où le retour tourne le plus souvent mal, parce que beaucoup de choses changent pendant l’absence.',
      ),
      points: [
        bi(
          'Confirm which leaves apply and in what order — pregnancy and parental leave are separate entitlements with separate rules.',
          'Confirmez les congés applicables et leur ordre — le congé de maternité et le congé parental constituent des droits distincts, régis par des règles distinctes.',
        ),
        bi(
          'Check the notice the employee owes and the notice you owe back, then diarise both.',
          'Vérifiez le préavis dû par l’employé(e) et celui que vous devez en retour, puis inscrivez-les à l’agenda.',
        ),
        bi(
          'Explain what happens to benefits and pension contributions, and whether you offer any top-up.',
          'Expliquez le sort des avantages et des cotisations de retraite, et indiquez si vous offrez un complément salarial.',
        ),
        bi(
          'Point them at the parental leave guide for how the pieces fit together.',
          'Orientez-les vers le guide sur le congé parental pour comprendre l’articulation des éléments.',
        ),
        bi(
          'Plan the coverage now, and plan it as temporary. A backfill that becomes permanent is how a reinstatement obligation gets breached.',
          'Planifiez le remplacement dès maintenant, et planifiez-le comme temporaire. Un remplacement devenu permanent est la façon dont une obligation de réintégration est violée.',
        ),
      ],
      to: 'admin',
    },
    {
      id: 'family',
      kind: 'task',
      title: bi('A death, or caring for someone', 'Un décès, ou des soins à un proche'),
      body: bi(
        'Short, urgent, and the category where asking for paperwork does the most damage for the least benefit.',
        'Courts, urgents, et c’est la catégorie où exiger des documents cause le plus de tort pour le moins de bénéfice.',
      ),
      points: [
        bi(
          'Let them go first and sort the administration afterwards. Nothing here is improved by a form completed on the day.',
          'Laissez-les partir d’abord et réglez l’administratif ensuite. Rien ici ne s’améliore par un formulaire rempli le jour même.',
        ),
        bi(
          'Check which relationships the leave covers in your jurisdiction — the definitions are broader than most people assume, and narrower than some families are.',
          'Vérifiez les liens visés par le congé dans votre juridiction — les définitions sont plus larges qu’on ne le croit, et plus étroites que certaines familles.',
        ),
        bi(
          'Do not ask for proof of a death or of a relationship unless you have a real reason and the law allows it.',
          'N’exigez pas de preuve d’un décès ou d’un lien de parenté sans motif réel et sans que la loi le permette.',
        ),
        bi(
          'For a longer caregiving leave, check whether a medical certificate about the person being cared for is required and who is entitled to it.',
          'Pour un congé de proche aidant prolongé, vérifiez si un certificat médical concernant la personne aidée est requis et qui y a droit.',
        ),
      ],
      to: 'admin',
    },
    {
      id: 'other',
      kind: 'task',
      title: bi('Everything else', 'Tous les autres cas'),
      body: bi(
        'Statutory leaves you meet less often, and leaves your own policy grants. The distinction matters: one you cannot refuse, the other you wrote.',
        'Des congés légaux que vous rencontrez moins souvent, et des congés accordés par votre propre politique. La distinction compte : les uns ne peuvent être refusés, les autres, vous les avez rédigés.',
      ),
      points: [
        bi(
          'Find the leave in your employment standards act before deciding anything. If it is there, it is a right and not a request.',
          'Repérez le congé dans votre loi sur les normes du travail avant toute décision. S’il y figure, c’est un droit et non une demande.',
        ),
        bi(
          'Leave for domestic or sexual violence carries confidentiality obligations beyond the ordinary — check them specifically.',
          'Le congé pour violence conjugale ou à caractère sexuel comporte des obligations de confidentialité qui excèdent l’ordinaire — vérifiez-les précisément.',
        ),
        bi(
          'If the leave is one your policy grants rather than the statute, apply the policy consistently — an exception made once becomes the standard you are measured against.',
          'Si le congé découle de votre politique plutôt que de la loi, appliquez-la de façon constante — une exception consentie une fois devient la norme à laquelle on vous mesurera.',
        ),
      ],
      to: 'admin',
    },

    {
      id: 'admin',
      kind: 'task',
      title: bi('Set it up', 'Mettre le congé en place'),
      body: bi(
        'The same for every leave. Doing it in writing is what makes the return straightforward months later, when nobody remembers what was agreed.',
        'Identique pour tous les congés. Le faire par écrit est ce qui rend le retour simple des mois plus tard, quand personne ne se rappelle ce qui avait été convenu.',
      ),
      points: [
        bi(
          'Record the request on the leave request form (T33) — dates, type, and how they want to be contacted.',
          'Consignez la demande sur le formulaire de demande de congé (T33) : dates, type et modalités de contact souhaitées.',
        ),
        bi(
          'Confirm in writing what continues: benefits, pension contributions, service accrual, any top-up.',
          'Confirmez par écrit ce qui se poursuit : avantages, cotisations de retraite, accumulation du service, complément salarial le cas échéant.',
        ),
        bi(
          'File a Record of Employment where earnings are interrupted (T29).',
          'Produisez un relevé d’emploi en cas d’arrêt de la rémunération (T29).',
        ),
        bi(
          'Tell the team what they need to know to cover the work — the dates, not the reason.',
          'Communiquez à l’équipe ce qu’elle doit savoir pour assurer le travail — les dates, non le motif.',
        ),
        bi(
          'Diarise the expected return, and diarise a check-in before it.',
          'Inscrivez à l’agenda le retour prévu, ainsi qu’un point de contact avant celui-ci.',
        ),
      ],
      caution: bi(
        'Keep whatever medical or personal information you receive separate from the general personnel file, and share only the dates with anyone who does not need more.',
        'Conservez tout renseignement médical ou personnel reçu séparément du dossier d’employé général, et ne communiquez que les dates aux personnes qui n’ont pas besoin d’en savoir plus.',
      ),
      to: 'during',
    },
    {
      id: 'during',
      kind: 'task',
      title: bi('While they are away', 'Pendant l’absence'),
      body: bi(
        'Mostly this means leaving them alone, which is harder than it sounds when the work is short-handed.',
        'Cela consiste surtout à les laisser tranquilles, ce qui est plus difficile qu’il n’y paraît lorsque l’équipe manque de bras.',
      ),
      points: [
        bi(
          'Contact them only as agreed, and only about what was agreed.',
          'Ne les contactez que selon ce qui a été convenu, et uniquement sur les sujets convenus.',
        ),
        bi(
          'Keep paying whatever continues, and check it actually went out rather than assuming.',
          'Maintenez les versements qui se poursuivent, et vérifiez qu’ils ont réellement été effectués plutôt que de le présumer.',
        ),
        bi(
          'Include them in anything that affects their job — a restructuring decided while someone is on leave is still a decision they were excluded from.',
          'Associez-les à tout ce qui touche leur poste — une réorganisation décidée pendant un congé demeure une décision dont ils ont été exclus.',
        ),
        bi(
          'If the leave extends, record the new date and move the diarised return with it.',
          'Si le congé se prolonge, consignez la nouvelle date et reportez le rappel du retour en conséquence.',
        ),
      ],
      to: 'back',
    },
    {
      id: 'back',
      kind: 'task',
      title: bi('Bring them back properly', 'Organiser un retour en règle'),
      body: bi(
        'The return is where the obligation actually bites, and where a leave that was handled well can still end badly.',
        'C’est au retour que l’obligation se concrétise, et c’est là qu’un congé bien géré peut malgré tout mal se terminer.',
      ),
      points: [
        bi(
          'Return them to the position they left, or a comparable one if it genuinely no longer exists — and write down why if it does not.',
          'Réintégrez-les dans le poste quitté ou, s’il n’existe véritablement plus, dans un poste comparable — et consignez-en la raison le cas échéant.',
        ),
        bi(
          'Apply any pay increase the role received while they were away.',
          'Appliquez toute augmentation dont le poste a bénéficié pendant leur absence.',
        ),
        bi(
          'Confirm the return in writing with the return from leave confirmation (T27).',
          'Confirmez le retour par écrit au moyen de la confirmation de retour de congé (T27).',
        ),
        bi(
          'Bring them up to date on what changed, and give someone the job of doing it.',
          'Mettez-les au fait des changements, et confiez cette tâche à une personne précise.',
        ),
        bi(
          'If they need adjustments to come back, that is an accommodation — run the duty to accommodate process rather than improvising.',
          'S’ils ont besoin d’ajustements pour revenir, il s’agit d’un accommodement — suivez le processus d’obligation d’accommodement plutôt que d’improviser.',
        ),
      ],
      to: 'done',
    },

    {
      id: 'done',
      kind: 'outcome',
      tone: 'ok',
      title: bi('Leave handled', 'Congé pris en charge'),
      body: bi(
        'What makes this defensible is the paper: the request recorded, the terms confirmed, the return put in writing. Nothing about a leave is remembered accurately a year later, and a year later is when it tends to be asked about.',
        'Ce qui rend la démarche défendable, c’est le dossier : la demande consignée, les conditions confirmées, le retour mis par écrit. Rien d’un congé ne se rappelle fidèlement un an plus tard — et c’est un an plus tard qu’on pose généralement la question.',
      ),
      documents: ['T33', 'T27'],
    },
  ],
}
