import { bi } from '@/i18n/core'
import type { Flow } from '../flowModel'

/**
 * Ring 2, Pillar A — the mental health support checklist
 * (docs/FOUR_RING_FRAMEWORK.md). All FR is [FR self-authored].
 *
 * **Read this before widening it.** The duty to accommodate flow already
 * starts at "someone tells you they are struggling" and already branches on
 * a manager who noticed rather than was told. Building a second flow that
 * assesses, canvasses options and lands on an arrangement would have been
 * that flow again under a wellness heading — the near-duplicate mistake the
 * framework doc has now recorded twice.
 *
 * So this one stops where that one starts. Its subject is the ten minutes
 * before any process begins, and the only question it answers is which door
 * this goes through: an emergency, a health need, or a work conversation
 * that was always just a work conversation.
 *
 * That triage is the distinct content, because getting it wrong is the harm.
 * A health need managed as underperformance is how an employer ends up
 * disciplining a disability. A performance problem re-labelled as a health
 * matter is how an employee never gets told the truth about their work, and
 * finds out at the termination meeting. Both mistakes are made by managers
 * acting in good faith, which is why the flow asks rather than assumes.
 *
 * Nothing here diagnoses, and nothing here asks the user to. A manager does
 * not need to know what is wrong to respond correctly to it.
 */
export const mentalHealthResponseFlow: Flow = {
  slug: 'mental-health-response',
  ring: 2,
  jurisdictions: ['ON', 'QC', 'FED'],
  estMinutes: 6,
  title: bi('Responding to a mental health concern', 'Réagir à une préoccupation de santé mentale'),
  summary: bi(
    'Someone is struggling, or you think they might be. What to do in the next ten minutes, and which process this actually belongs to.',
    'Une personne éprouve des difficultés, ou vous le soupçonnez. Que faire dans les dix prochaines minutes, et de quel processus cela relève réellement.',
  ),
  start: 'situation',
  steps: [
    {
      id: 'situation',
      kind: 'choice',
      title: bi('What has brought you here?', 'Qu’est-ce qui vous amène ici ?'),
      body: bi(
        'Answer for what you actually know, not for what you suspect. The four routes below go to genuinely different places, and the one that fits is decided by how this reached you rather than by how serious you think it is.',
        'Répondez en fonction de ce que vous savez réellement, et non de ce que vous soupçonnez. Les quatre parcours ci-dessous mènent à des endroits véritablement différents, et celui qui convient dépend de la façon dont la situation vous est parvenue, non de la gravité que vous lui prêtez.',
      ),
      caution: bi(
        'You are not being asked to work out what is wrong with anyone. You do not need a diagnosis to respond correctly, you are not qualified to reach one, and reaching for one is itself one of the ways this goes wrong.',
        'On ne vous demande pas de déterminer ce dont souffre qui que ce soit. Vous n’avez pas besoin d’un diagnostic pour réagir correctement, vous n’êtes pas qualifié pour en poser un, et chercher à le faire constitue en soi l’une des façons dont la situation dérape.',
      ),
      options: [
        {
          id: 'crisis',
          label: bi('Someone’s safety is at risk', 'La sécurité d’une personne est en jeu'),
          detail: bi(
            'Their own or someone else’s — whether that is happening right now or you have been told about it. The next step sorts which.',
            'La leur ou celle d’autrui — que ce soit en train de se produire ou que vous en ayez été informé. L’étape suivante fait la distinction.',
          ),
          to: 'emergency',
        },
        {
          id: 'told',
          label: bi(
            'They have told me they are struggling',
            'La personne m’a dit qu’elle éprouve des difficultés',
          ),
          detail: bi(
            'In any words. They do not have to have named a condition or used the word “accommodation”.',
            'Quels que soient les mots employés. Elle n’a pas à avoir nommé un trouble ni prononcé le mot « accommodement ».',
          ),
          to: 'listen',
        },
        {
          id: 'noticed',
          label: bi(
            'I have noticed a change and they have said nothing',
            'J’ai remarqué un changement et la personne n’a rien dit',
          ),
          to: 'observe',
        },
        {
          id: 'performance',
          label: bi(
            'Their work has slipped and I was about to address it',
            'Leur rendement a fléchi et j’allais aborder la question',
          ),
          to: 'separate',
        },
      ],
    },
    {
      id: 'emergency',
      kind: 'outcome',
      tone: 'caution',
      title: bi('This is not an HR process yet', 'Il ne s’agit pas encore d’un processus RH'),
      body: bi(
        'Two numbers, and which one depends on immediacy. If someone is in danger now, or needs urgent medical help, call 9-1-1. If this is suicidal thoughts or serious distress without immediate danger, 9-8-8 — the Suicide Crisis Helpline — is the better call: it is staffed for exactly this, it is there for you as the person who is worried and not only for the person in distress, and if emergency services turn out to be needed it will tell you so. If you cannot tell which of the two this is, call 9-8-8 and let them help you work it out. What you should not do is route it to the employee assistance programme or to HR and wait.',
        'Deux numéros, et le choix dépend de l’immédiateté. Si une personne est en danger maintenant, ou a besoin de soins médicaux urgents, composez le 9-1-1. S’il s’agit d’idées suicidaires ou d’une grande détresse sans danger immédiat, le 9-8-8 — la Ligne d’aide en cas de crise de suicide — est le meilleur appel : on y répond précisément à cela, la ligne s’adresse aussi à vous en tant que personne inquiète et non seulement à la personne en détresse, et si les services d’urgence s’avèrent nécessaires, on vous le dira. Si vous n’arrivez pas à déterminer de quel cas il s’agit, composez le 9-8-8 et laissez-les vous aider à y voir clair. Ce qu’il ne faut pas faire, c’est acheminer la situation vers le programme d’aide aux employés ou les RH et attendre.',
      ),
      caution: bi(
        'Afterwards, the employment side resumes and it is ordinary: most often a leave, and a return that is planned rather than assumed. What must not happen is the incident becoming a performance record, or a story anyone else in the workplace is told.',
        'Par la suite, le volet emploi reprend son cours ordinaire : le plus souvent un congé, puis un retour planifié plutôt que présumé. Ce qui ne doit pas se produire, c’est que l’incident devienne un élément du dossier de rendement, ou un récit raconté à quiconque dans le milieu de travail.',
      ),
      documents: ['T33', 'T27'],
    },
    {
      id: 'separate',
      kind: 'choice',
      title: bi(
        'Performance, or something underneath it?',
        'Rendement, ou autre chose en dessous ?',
      ),
      body: bi(
        'This is the question the whole flow exists for, and both wrong answers are expensive. Treat a health need as underperformance and you are disciplining a disability. Treat ordinary underperformance as a health matter and the employee is never told the truth about their work, which is its own unfairness and surfaces at the worst possible moment.',
        'C’est la question qui justifie l’existence de ce parcours, et les deux mauvaises réponses coûtent cher. Traiter un besoin de santé comme un rendement insuffisant, c’est sanctionner un handicap. Traiter un rendement insuffisant ordinaire comme une question de santé, c’est priver la personne de la vérité sur son travail — une injustice en soi, qui refait surface au pire moment.',
      ),
      caution: bi(
        'You do not need to be right to have a duty. If there is a reasonable signal that health is involved, the duty to accommodate has already started, whether or not anyone has asked for anything and whether or not your read turns out to be correct.',
        'Vous n’avez pas à voir juste pour être tenu à une obligation. S’il existe un signal raisonnable que la santé est en cause, l’obligation d’accommodement a déjà pris naissance, que quelqu’un ait demandé quelque chose ou non, et que votre lecture s’avère exacte ou non.',
      ),
      options: [
        {
          id: 'health_signal',
          label: bi(
            'There is a signal — a change that tracks with something, or they have hinted at it',
            'Il y a un signal — un changement qui coïncide avec quelque chose, ou une allusion de leur part',
          ),
          to: 'listen',
        },
        {
          id: 'no_signal',
          label: bi(
            'Nothing points that way — this is about the work',
            'Rien ne va dans ce sens — il s’agit du travail',
          ),
          detail: bi(
            'The work has not met a standard that was set and understood.',
            'Le travail n’a pas satisfait à une norme fixée et comprise.',
          ),
          to: 'perf_only',
        },
      ],
    },
    {
      id: 'perf_only',
      kind: 'outcome',
      tone: 'ok',
      title: bi('Have the performance conversation', 'Tenez la conversation sur le rendement'),
      body: bi(
        'Address it as performance, plainly and on the record, because that is what it is and the employee is entitled to know. Two things keep this safe: describe the work rather than the person, and leave the door open — say what support exists and that it is available without a reason being given. If health surfaces during that conversation, the duty starts then, and you come back to this flow.',
        'Abordez la question comme un enjeu de rendement, clairement et par écrit, parce que c’est de cela qu’il s’agit et que la personne a le droit de le savoir. Deux choses rendent cette démarche sûre : décrire le travail plutôt que la personne, et laisser la porte ouverte — indiquer quel soutien existe et qu’il est accessible sans avoir à se justifier. Si la santé émerge pendant cette conversation, l’obligation naît à ce moment et vous revenez à ce parcours.',
      ),
      documents: ['T16'],
    },
    {
      id: 'listen',
      kind: 'task',
      title: bi('Listen, and do not fill the silence', 'Écoutez, sans combler le silence'),
      body: bi(
        'What you do in this conversation decides whether you hear anything else for the next year. The goal is not to establish what is wrong — it is to make the next sentence possible.',
        'Ce que vous faites dans cette conversation détermine si vous entendrez quoi que ce soit d’autre au cours de la prochaine année. Le but n’est pas d’établir ce qui ne va pas, mais de rendre la phrase suivante possible.',
      ),
      points: [
        bi(
          'Let them describe it in their own words, and do not translate it into a condition. What you write down later is what they told you about their work, not what you concluded about their health.',
          'Laissez la personne décrire la situation dans ses propres mots, sans traduire cela en un trouble. Ce que vous consignerez plus tard, c’est ce qu’elle vous a dit de son travail, non ce que vous avez conclu sur sa santé.',
        ),
        bi(
          'Do not promise confidentiality you cannot keep. You can promise that no one learns anything they do not need to act on, and that no diagnosis goes anywhere at all — that promise you can keep.',
          'Ne promettez pas une confidentialité que vous ne pouvez garantir. Vous pouvez promettre que personne n’apprendra ce dont il n’a pas besoin pour agir, et qu’aucun diagnostic ne circulera nulle part — cette promesse-là, vous pouvez la tenir.',
        ),
        bi(
          'Ask one question: what would help at work. Not what happened, not why, not for how long.',
          'Posez une seule question : qu’est-ce qui aiderait au travail. Ni ce qui s’est passé, ni pourquoi, ni pour combien de temps.',
        ),
        bi(
          'Do not solve it in the room. An adjustment offered on the spot and withdrawn a week later is worse than one that took a week to agree.',
          'Ne réglez pas tout sur-le-champ. Un ajustement offert spontanément puis retiré une semaine plus tard vaut moins qu’un ajustement convenu en une semaine.',
        ),
      ],
      to: 'offer',
    },
    {
      id: 'observe',
      kind: 'task',
      title: bi('Open the door without pushing through it', 'Ouvrez la porte sans la forcer'),
      body: bi(
        'You have noticed something and they have not raised it. You are allowed to ask — you are not allowed to ask what is wrong with them. The difference is whether the subject is the work or the person.',
        'Vous avez remarqué quelque chose et la personne n’en a pas parlé. Vous avez le droit de poser une question — vous n’avez pas le droit de demander ce qui ne va pas chez elle. La différence tient à ce qui fait l’objet de la question : le travail ou la personne.',
      ),
      points: [
        bi(
          'Write down what you observed about the work — deadlines, hours, errors, meetings missed — and nothing you inferred from it. That note is defensible; a note recording your theory about someone’s mental health is not, and you should not be holding one.',
          'Notez ce que vous avez observé du travail — échéances, horaires, erreurs, réunions manquées — et rien de ce que vous en avez déduit. Une telle note est défendable ; une note consignant votre théorie sur la santé mentale d’une personne ne l’est pas, et vous ne devriez pas en détenir.',
        ),
        bi(
          'Open with the observation and stop. “I have noticed the last few weeks have looked different — is everything all right?” leaves them free to say nothing, which they are entitled to do.',
          'Commencez par l’observation, puis arrêtez-vous. « J’ai remarqué que les dernières semaines semblaient différentes — est-ce que tout va bien ? » laisse la personne libre de ne rien dire, ce qu’elle a le droit de faire.',
        ),
        bi(
          'If they say nothing is wrong, accept it and say what is available anyway. Silence now is not the end of the conversation; a manager who pushed is.',
          'Si la personne répond que tout va bien, acceptez-le et mentionnez tout de même ce qui est offert. Un silence aujourd’hui ne met pas fin à la conversation ; un gestionnaire qui a insisté, oui.',
        ),
        bi(
          'Do not go to anyone else first. Asking a colleague whether they have noticed anything turns a private difficulty into workplace information, and it is the step people most often regret.',
          'Ne vous adressez pas d’abord à quelqu’un d’autre. Demander à un collègue s’il a remarqué quelque chose transforme une difficulté privée en information de travail, et c’est l’étape que l’on regrette le plus souvent.',
        ),
      ],
      to: 'opened',
    },
    {
      id: 'opened',
      kind: 'choice',
      title: bi('What came back?', 'Qu’est-ce qui est ressorti ?'),
      body: bi(
        'The last step said to accept “everything is fine” if that is the answer, so this is where accepting it actually happens. There is nothing further to ask on that route.',
        'L’étape précédente indiquait d’accepter un « tout va bien » si telle est la réponse ; c’est donc ici que cette acceptation prend effet. Il n’y a rien de plus à demander sur ce parcours.',
      ),
      options: [
        {
          id: 'spoke',
          label: bi('They told me something', 'La personne m’a dit quelque chose'),
          detail: bi(
            'Anything at all about what is going on, however partial.',
            'Quoi que ce soit sur ce qui se passe, même partiellement.',
          ),
          to: 'listen',
        },
        {
          id: 'declined',
          label: bi('They said everything is fine', 'La personne a répondu que tout allait bien'),
          to: 'declined',
        },
      ],
    },
    {
      id: 'declined',
      kind: 'outcome',
      tone: 'ok',
      title: bi('Take the answer', 'Prenez la réponse pour ce qu’elle est'),
      body: bi(
        'You asked, you said what support exists, and they said no. That is a complete and correct ending, and pressing further from here is the thing that guarantees you are not told next time either. Carry on managing the work as you would for anyone, and if the pattern you noticed continues, address it as work — which is a conversation you are entitled to have and one this flow can be run again from.',
        'Vous avez demandé, vous avez indiqué le soutien offert, et la personne a dit non. Il s’agit d’une conclusion complète et correcte, et insister davantage est précisément ce qui garantit qu’on ne vous dira rien la prochaine fois non plus. Continuez de gérer le travail comme pour quiconque et, si la tendance observée persiste, abordez-la comme un enjeu de travail — une conversation à laquelle vous avez droit et à partir de laquelle ce parcours peut être repris.',
      ),
      noDocument: bi(
        'Nothing goes on file. You have no health information, you were not given any, and a note recording that you suspected something is the one artifact this conversation must not produce. Keep your own note of what you observed about the work, where you already keep those.',
        'Rien n’est versé au dossier. Vous ne détenez aucune information de santé, on ne vous en a confié aucune, et une note consignant vos soupçons est le seul document que cette conversation ne doit pas produire. Conservez votre propre note de ce que vous avez observé du travail, là où vous consignez déjà ce type d’observation.',
      ),
    },
    {
      id: 'offer',
      kind: 'task',
      title: bi(
        'Say what exists, then agree a next point',
        'Nommez ce qui existe, puis fixez un point de suivi',
      ),
      body: bi(
        'Support an employee does not know about is support the employer is paying for and not delivering. This step is where most of the value of an EAP is actually created or lost.',
        'Un soutien que la personne ignore est un soutien que l’employeur paie sans le livrer. C’est à cette étape que la valeur d’un programme d’aide se crée ou se perd.',
      ),
      points: [
        bi(
          'Name the programme, say how it is reached, and say plainly that it is voluntary and that you are not told whether it was used. If you do not have one, say what you do have.',
          'Nommez le programme, indiquez comment y accéder et dites clairement qu’il est volontaire et que vous n’êtes pas informé de son utilisation. Si vous n’en avez pas, dites ce dont vous disposez.',
        ),
        bi(
          'Offer, never require. A referral an employee is directed to make is not a referral, and conditioning anything at work on taking it up is where a support programme becomes a liability.',
          'Proposez, n’imposez jamais. Une orientation qu’on ordonne n’en est pas une, et subordonner quoi que ce soit au travail au fait d’y recourir transforme un programme de soutien en responsabilité juridique.',
        ),
        bi(
          'Ask what would make the next two weeks manageable, and be ready for the answer to be small. Most of what helps is a deadline moved or a meeting dropped, not a formal arrangement.',
          'Demandez ce qui rendrait les deux prochaines semaines gérables, et attendez-vous à une réponse modeste. Ce qui aide relève le plus souvent d’une échéance reportée ou d’une réunion annulée, non d’un arrangement formel.',
        ),
        bi(
          'Fix a date to speak again before you leave the conversation. “Come and find me any time” puts the work of returning on the person least able to do it.',
          'Fixez une date pour vous reparler avant de clore la conversation. « Viens me voir quand tu veux » fait porter l’effort du retour à la personne la moins en mesure de le fournir.',
        ),
      ],
      to: 'next',
    },
    {
      id: 'next',
      kind: 'choice',
      title: bi('What did they say they need?', 'Qu’a dit la personne avoir besoin ?'),
      body: bi(
        'Their answer decides the process, not your assessment of how serious it is. All three routes below are legitimate endings, including the one where nothing changes.',
        'Leur réponse détermine le processus, et non votre appréciation de la gravité. Les trois parcours ci-dessous constituent tous des fins légitimes, y compris celui où rien ne change.',
      ),
      options: [
        {
          id: 'adjust',
          label: bi(
            'Something about the work needs to change',
            'Quelque chose doit changer dans le travail',
          ),
          detail: bi(
            'Hours, duties, workload, environment, or how they are managed.',
            'Horaire, tâches, charge de travail, environnement ou encadrement.',
          ),
          to: 'to_accommodation',
        },
        {
          id: 'time',
          label: bi('They need time away', 'La personne a besoin de s’absenter'),
          to: 'to_leave',
        },
        {
          id: 'nothing',
          label: bi(
            'Nothing, for now — they wanted it known',
            'Rien, pour l’instant — elle voulait que ce soit su',
          ),
          to: 'door_open',
        },
      ],
    },
    {
      id: 'to_accommodation',
      kind: 'outcome',
      tone: 'ok',
      title: bi('This is now an accommodation', 'Il s’agit désormais d’un accommodement'),
      body: bi(
        'From here it is a legal process with a shape, and this flow has done its job by getting you to it. Run the duty to accommodate workflow rather than agreeing something informally: an arrangement that was never written down is one both sides remember differently, and the employer is the one who has to prove what it was.',
        'À partir d’ici, il s’agit d’un processus juridique structuré, et ce parcours a rempli son rôle en vous y amenant. Suivez le processus d’obligation d’accommodement plutôt que de convenir de quelque chose de manière informelle : un arrangement jamais consigné est un arrangement dont les deux parties se souviennent différemment, et c’est à l’employeur qu’il revient d’en prouver la teneur.',
      ),
      caution: bi(
        'What you may ask for is the limitation, not the diagnosis — see the functional limitations guide before you request anything from a health professional.',
        'Ce que vous pouvez demander, c’est la limitation, non le diagnostic — consultez le guide sur les limitations fonctionnelles avant de solliciter quoi que ce soit d’un professionnel de la santé.',
      ),
      documents: ['T21', 'T22', 'T23'],
    },
    {
      id: 'to_leave',
      kind: 'outcome',
      tone: 'ok',
      title: bi('This is a leave', 'Il s’agit d’un congé'),
      body: bi(
        'Treat it as the leave it is — statutory sick or medical leave in the first instance — and do not require a diagnosis to start it. Apply your sick leave policy as written rather than deciding terms case by case here, and plan the return at the same time as the departure, because a return nobody planned is the part of a mental health absence that most often fails.',
        'Traitez la situation comme le congé qu’elle est — en premier lieu un congé de maladie prévu par la loi — et n’exigez pas de diagnostic pour l’amorcer. Appliquez votre politique de congé de maladie telle qu’elle est rédigée plutôt que d’en fixer les modalités au cas par cas, et planifiez le retour en même temps que le départ, car un retour que personne n’a planifié est l’aspect d’une absence pour santé mentale qui échoue le plus souvent.',
      ),
      documents: ['T33', 'T27'],
    },
    {
      id: 'door_open',
      kind: 'outcome',
      tone: 'ok',
      title: bi('Nothing changes today', 'Rien ne change aujourd’hui'),
      body: bi(
        'This is a real ending and not a failed one. File nothing about their health, keep the check-back date you agreed, and make sure the offer you made stays true — an employee who is told support exists and finds it withdrawn when they ask has learned something about the employer that no policy undoes.',
        'Il s’agit d’une véritable conclusion, non d’un échec. Ne versez rien au dossier concernant leur santé, respectez la date de suivi convenue et veillez à ce que l’offre faite demeure valable — une personne à qui l’on annonce l’existence d’un soutien et qui le voit retiré au moment de le demander a appris sur son employeur quelque chose qu’aucune politique ne corrige.',
      ),
      caution: bi(
        'If they come back later and ask for a change, that is where the accommodation process starts — and the fact that you offered first is what makes asking possible.',
        'Si la personne revient plus tard demander un changement, c’est là que débute le processus d’accommodement — et c’est le fait d’avoir offert en premier qui rend la demande possible.',
      ),
      noDocument: bi(
        'Nothing to open, and that is the instruction rather than an omission. An accommodation record started for someone who asked for no accommodation is a health record you created without cause and now have to justify holding. If they come back and ask for something, the accommodation request form is where that begins — on that day, not this one.',
        'Rien à ouvrir, et il s’agit d’une consigne et non d’un oubli. Un dossier d’accommodement ouvert pour une personne qui n’a rien demandé est un dossier de santé que vous avez créé sans motif et dont vous devrez justifier la conservation. Si la personne revient demander quelque chose, le formulaire de demande d’accommodement est le point de départ — ce jour-là, pas aujourd’hui.',
      ),
    },
  ],
}
