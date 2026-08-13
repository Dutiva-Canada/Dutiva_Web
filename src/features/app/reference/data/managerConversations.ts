import { bi } from '@/i18n/core'
import { contrast, li, p } from '../guideModel'
import type { ReferenceGuide } from '../guideModel'

/**
 * Ring 2, Pillar A — the manager conversation guide
 * (docs/FOUR_RING_FRAMEWORK.md). All FR is [FR self-authored].
 *
 * Written as wording rather than as principles, because principles are not
 * what fails. Managers already know they should be supportive and should not
 * pry; what they do not have is the sentence to say at the moment the room
 * goes quiet, so they improvise, and the improvisation is where the diagnosis
 * gets guessed at and the promise gets made that cannot be kept.
 *
 * Hence the density of `contrast` blocks: each pair is a real sentence to use
 * against the real sentence it replaces. The "not this" half is not a straw
 * man — every one of them is something a well-meaning manager says.
 *
 * Scope boundaries, all deliberate. The functional limitations guide covers
 * what you may ask a health professional; the EAP guide covers the programme
 * and the line around it; the accommodation process itself is Pillar B. This
 * guide stops at the edge of the conversation and points at those.
 */
export const managerConversationsGuide: ReferenceGuide = {
  slug: 'manager-conversations',
  ring: 2,
  jurisdictions: ['ON', 'QC', 'FED'],
  readingMinutes: 8,
  title: bi(
    'Talking to someone who is struggling',
    'Parler à une personne qui éprouve des difficultés',
  ),
  summary: bi(
    'The sentences that work and the ones that create liability — for the manager who has ten minutes before the meeting.',
    'Les formulations qui fonctionnent et celles qui créent un risque juridique — pour le gestionnaire qui a dix minutes avant la rencontre.',
  ),
  tag: bi('Wellness · All jurisdictions', 'Mieux-être · Toutes les juridictions'),
  relatedTemplates: ['T21', 'T22', 'T33'],
  relatedFlows: ['mental-health-response', 'duty-to-accommodate'],
  sections: [
    {
      heading: bi('One rule, and everything follows from it', 'Une seule règle, dont tout découle'),
      blocks: [
        p(
          'Talk about the work. Not about the person, not about their health, not about what you have concluded is going on.',
          'Parlez du travail. Pas de la personne, pas de sa santé, pas de ce que vous avez conclu sur sa situation.',
        ),
        p(
          'This is not a softening device. It is the line between a conversation you are entitled to have and one you are not, and it is what makes a note about the meeting defensible rather than evidence. An employer may observe and address work. An employer may not investigate an employee’s health, and a manager who tries has moved the organisation from "responded to a difficulty" to "made an employment decision informed by a perceived condition".',
          'Ce n’est pas un procédé d’atténuation. C’est la frontière entre une conversation à laquelle vous avez droit et une autre à laquelle vous n’avez pas droit, et c’est ce qui rend défendable une note sur la rencontre plutôt qu’incriminante. Un employeur peut observer le travail et l’aborder. Il ne peut enquêter sur la santé d’une personne, et le gestionnaire qui s’y essaie fait passer l’organisation de « a réagi à une difficulté » à « a pris une décision d’emploi éclairée par un état de santé perçu ».',
        ),
        contrast(
          bi(
            'I have noticed the last few weeks have been different — deadlines slipping, and you have been quieter in the planning meetings. How are things?',
            'J’ai remarqué que les dernières semaines étaient différentes — des échéances reportées, et vous êtes plus discret dans les réunions de planification. Comment ça va?',
          ),
          bi(
            'You have not seemed yourself. Is everything OK at home? Are you depressed?',
            'Vous ne semblez pas dans votre assiette. Est-ce que tout va bien à la maison? Faites-vous une dépression?',
          ),
        ),
        p(
          'The first names what you actually saw and hands the conversation over. The second names a conclusion you reached, a domain you have no business in, and a condition you are not qualified to raise — and it does all three before the employee has said a word.',
          'La première nomme ce que vous avez réellement observé et cède la parole. La seconde énonce une conclusion que vous avez tirée, empiète sur un domaine qui ne vous regarde pas et évoque un trouble que vous n’êtes pas qualifié pour nommer — et ce, avant que la personne n’ait dit un mot.',
        ),
      ],
    },
    {
      heading: bi('Opening it', 'Amorcer la conversation'),
      blocks: [
        li(
          'Pick a time and place that is not a performance review and not a corridor. A conversation held in passing tells the employee how seriously to take it.',
          'Choisissez un moment et un lieu qui ne soient ni une évaluation de rendement ni un couloir. Une conversation tenue au passage indique à la personne le sérieux à lui accorder.',
        ),
        li(
          'Say why you asked to speak, in one sentence, at the start. A manager who circles for five minutes has already told the employee that something bad is coming.',
          'Dites en une phrase, dès le début, pourquoi vous avez demandé à parler. Un gestionnaire qui tourne autour du pot pendant cinq minutes a déjà annoncé qu’une mauvaise nouvelle s’en vient.',
        ),
        li(
          'Ask one open question and then stop talking. The silence is doing the work; filling it is the most common mistake in this conversation.',
          'Posez une seule question ouverte, puis taisez-vous. Le silence fait le travail; le combler est l’erreur la plus fréquente dans ce type d’échange.',
        ),
        li(
          'Accept "I am fine" if you get it. You have made the offer, and it is now on the record that the door was open — which is what matters if the subject returns.',
          'Acceptez un « ça va » si c’est la réponse. Vous avez fait l’offre, et il est désormais établi que la porte était ouverte — ce qui compte si le sujet revient.',
        ),
      ],
    },
    {
      heading: bi('When they tell you something', 'Lorsque la personne vous confie quelque chose'),
      blocks: [
        p(
          'The duty to accommodate starts when the employer knows, or reasonably should know, that someone needs an adjustment. It does not wait for a diagnosis, a form, or the word "accommodation" — so from the moment they say something, your obligations have already changed, whatever you do next.',
          'L’obligation d’accommodement naît dès que l’employeur sait, ou devrait raisonnablement savoir, qu’une personne a besoin d’un ajustement. Elle n’attend ni diagnostic, ni formulaire, ni l’emploi du mot « accommodement » — dès que la personne parle, vos obligations ont donc déjà changé, quoi que vous fassiez ensuite.',
        ),
        contrast(
          bi(
            'Thank you for telling me. What would make the work manageable right now?',
            'Merci de m’en avoir parlé. Qu’est-ce qui rendrait le travail gérable en ce moment?',
          ),
          bi(
            'What exactly is the diagnosis? How long have you had it?',
            'Quel est exactement le diagnostic? Depuis combien de temps l’avez-vous?',
          ),
        ),
        contrast(
          bi(
            'I will keep this between us as far as I can. I may need to tell one person what has to change at work — never why.',
            'Je garderai cela entre nous autant que possible. Je devrai peut-être indiquer à une personne ce qui doit changer dans le travail — jamais pourquoi.',
          ),
          bi('This stays between us, I promise.', 'Cela reste entre nous, je vous le promets.'),
        ),
        p(
          'The second is a promise you will break. Arranging cover, adjusting a schedule or approving a leave all involve someone else, and an employee who was promised total secrecy and later finds a colleague knew has been given a reason never to raise anything again. Promise the thing you can deliver: the adjustment travels, the reason does not.',
          'La seconde est une promesse que vous romprez. Organiser un remplacement, modifier un horaire ou approuver un congé implique nécessairement une autre personne, et l’employé à qui l’on a promis le secret absolu et qui découvre ensuite qu’un collègue savait a toutes les raisons de ne plus jamais rien signaler. Promettez ce que vous pouvez livrer : l’ajustement circule, le motif reste.',
        ),
        li(
          'Do not offer a solution in the room. An adjustment agreed on the spot and withdrawn a week later reads as a broken commitment, and it may have created one.',
          'Ne proposez pas de solution sur-le-champ. Un ajustement convenu spontanément puis retiré une semaine plus tard passe pour un engagement rompu — et il en a peut-être créé un.',
        ),
        li(
          'Do not share your own experience as a shortcut to rapport. It relocates the conversation to you, and it invites a comparison — "I got through it" — that the employee will hear as a standard.',
          'Ne partagez pas votre propre expérience pour créer un lien. Cela déplace la conversation vers vous et invite une comparaison — « je m’en suis sorti » — que la personne entendra comme une norme.',
        ),
        li(
          'Write down, afterwards, what they said about their work and what you agreed to do. Do not write down what you think they have.',
          'Consignez ensuite ce que la personne a dit de son travail et ce que vous vous êtes engagé à faire. Ne consignez pas ce dont vous croyez qu’elle souffre.',
        ),
      ],
    },
    {
      heading: bi(
        'When performance is genuinely the subject',
        'Lorsque le rendement est véritablement le sujet',
      ),
      blocks: [
        p(
          'Health being involved does not suspend the conversation about work. It changes what the conversation has to account for, and it means the standard may need adjusting — not that the standard disappears or that nobody may mention it.',
          'La présence d’un enjeu de santé ne suspend pas la conversation sur le travail. Elle modifie ce dont cette conversation doit tenir compte et peut appeler un ajustement de la norme — elle ne fait pas disparaître la norme et n’interdit à personne d’en parler.',
        ),
        p(
          'Avoiding it altogether is not kindness. An employee whose work has been quietly carried for a year, and who is then managed out, was denied the one thing that might have changed the outcome: knowing.',
          'L’éviter entièrement n’est pas une marque de bienveillance. La personne dont on a discrètement porté le travail pendant un an, puis que l’on écarte, a été privée de la seule chose qui aurait pu changer l’issue : le savoir.',
        ),
        contrast(
          bi(
            'The last three deliverables were late, and I need us to look at that. If something is making it harder right now, tell me and we will factor it in.',
            'Les trois derniers livrables étaient en retard et je souhaite que nous en discutions. Si quelque chose rend cela plus difficile en ce moment, dites-le-moi et nous en tiendrons compte.',
          ),
          bi(
            'I did not want to bring it up given everything you are dealing with.',
            'Je ne voulais pas en parler, vu tout ce que vous traversez.',
          ),
        ),
        li(
          'Keep the two threads visible but separate: this is the standard, and this is what we are changing so it is reachable.',
          'Gardez les deux fils apparents mais distincts : voici la norme, et voici ce que nous modifions pour qu’elle soit atteignable.',
        ),
        li(
          'Never put support in a corrective document. A referral written into a warning converts an offer into a condition, and the record now shows an employment consequence attached to a health matter.',
          'N’inscrivez jamais le soutien dans un document disciplinaire. Une orientation consignée dans un avertissement transforme une offre en condition, et le dossier montre désormais une conséquence d’emploi rattachée à un enjeu de santé.',
        ),
      ],
    },
    {
      heading: bi('Sentences to have ready', 'Formulations à avoir sous la main'),
      blocks: [
        li(
          '"I do not need to know why. I need to know what would help."',
          '« Je n’ai pas besoin de savoir pourquoi. J’ai besoin de savoir ce qui aiderait. »',
        ),
        li(
          '"Take the time you need to think about it. Can we speak again on Thursday?"',
          '« Prenez le temps d’y réfléchir. Pouvons-nous en reparler jeudi? »',
        ),
        li(
          '"I do not have an answer today. I will find out and come back to you by Friday." — and then do.',
          '« Je n’ai pas de réponse aujourd’hui. Je vais me renseigner et je vous reviens d’ici vendredi. » — puis faites-le.',
        ),
        li(
          '"That is outside what I can decide on my own. I am going to involve HR, and I will tell you exactly what I share with them."',
          '« Cela dépasse ce que je peux décider seul. Je vais impliquer les RH, et je vous dirai exactement ce que je leur transmets. »',
        ),
        li(
          '"Nothing you have told me changes your standing here."  — only if it is true, and if you say it, make it true.',
          '« Rien de ce que vous m’avez dit ne change votre situation ici. » — seulement si c’est vrai, et si vous le dites, faites en sorte que ce le soit.',
        ),
      ],
    },
    {
      heading: bi('After the conversation', 'Après la conversation'),
      blocks: [
        li(
          'Do what you said you would do, on the day you said it. Follow-through is the entire content of the message; the conversation itself was the packaging.',
          'Faites ce que vous avez annoncé, le jour annoncé. Le suivi constitue tout le message; la conversation n’en était que l’emballage.',
        ),
        li(
          'Tell only the people who must act, and tell them only what they must act on. "Priya is working reduced hours until March" is what a colleague needs. Why she is is not theirs to know, and it is not a detail you have been asked to withhold — it is one you must.',
          'N’informez que les personnes qui doivent agir, et uniquement de ce sur quoi elles doivent agir. « Priya travaille selon un horaire réduit jusqu’en mars » est ce qu’un collègue a besoin de savoir. La raison ne le regarde pas — et ce n’est pas un détail qu’on vous demande de taire, c’en est un que vous devez taire.',
        ),
        li(
          'Keep any health information out of the personnel file and store it separately, with access limited to whoever administers it.',
          'Gardez toute information de santé hors du dossier d’employé et conservez-la séparément, l’accès étant réservé aux personnes qui l’administrent.',
        ),
        li(
          'If an adjustment is now in place, write it down as an accommodation rather than leaving it as an understanding. An arrangement nobody recorded is one both sides later remember differently, and it is the employer who must prove what it was.',
          'Si un ajustement est désormais en place, consignez-le comme un accommodement plutôt que de le laisser à l’état d’entente tacite. Un arrangement non consigné est un arrangement dont chacun se souviendra différemment, et c’est à l’employeur d’en prouver la teneur.',
        ),
      ],
    },
  ],
  jurisdictionNotes: {
    ON: bi(
      'The Human Rights Code duty is triggered by what the employer knows or ought reasonably to know — a manager who noticed a pattern and said nothing has still triggered it, because knowledge sits with the organisation rather than with whoever happened to hear it. Where the difficulty involves harassment or violence at work, the Occupational Health and Safety Act adds an investigation duty that a supportive conversation does not satisfy.',
      'L’obligation prévue au Code des droits de la personne est déclenchée par ce que l’employeur sait ou devrait raisonnablement savoir — le gestionnaire qui a remarqué une tendance sans rien dire l’a tout de même déclenchée, la connaissance appartenant à l’organisation et non à la personne qui en a été témoin. Lorsque la difficulté met en cause du harcèlement ou de la violence au travail, la Loi sur la santé et la sécurité au travail ajoute une obligation d’enquête à laquelle une conversation bienveillante ne satisfait pas.',
    ),
    QC: bi(
      'The Charter of human rights and freedoms carries the accommodation duty, and Québec weighs undue hardship more broadly than Ontario’s closed statutory list — so a conversation that gathers what would actually help is more useful here, not less. Separately, the Act respecting labour standards requires reasonable steps to prevent psychological harassment and to stop it: if what the employee describes is conduct at work, this stops being a wellness conversation and becomes a complaint you must act on.',
      'La Charte des droits et libertés de la personne porte l’obligation d’accommodement, et le Québec apprécie la contrainte excessive plus largement que la liste légale fermée de l’Ontario — une conversation qui recueille ce qui aiderait réellement y est donc plus utile, et non moins. Par ailleurs, la Loi sur les normes du travail exige des moyens raisonnables pour prévenir le harcèlement psychologique et le faire cesser : si ce que décrit la personne relève de comportements au travail, il ne s’agit plus d’une conversation de bien-être mais d’une plainte sur laquelle vous devez agir.',
    ),
    FED: bi(
      'The Canadian Human Rights Act carries the duty. The Work Place Harassment and Violence Prevention Regulations add a specific constraint on this conversation: where what is described is an occurrence, the response is the resolution process those regulations set out, on their timelines, and a manager must not conduct their own inquiry into it first.',
      'La Loi canadienne sur les droits de la personne porte l’obligation. Le Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail impose une contrainte particulière à cette conversation : lorsque ce qui est décrit constitue un incident, la réponse est le processus de règlement prévu par ce règlement, selon ses délais, et le gestionnaire ne doit pas mener sa propre enquête au préalable.',
    ),
  },
}
