import { bi } from '@/i18n/core'
import { contrast, li, p } from '../guideModel'
import type { ReferenceGuide } from '../guideModel'

/**
 * Ring 2, Pillar C — the bystander intervention guide
 * (docs/FOUR_RING_FRAMEWORK.md). All FR is [FR self-authored].
 *
 * The only tool in the product written for the colleague rather than the
 * employer, and that is the point of it. Every other thing here tells an
 * organisation what to do once something has been reported. Most of what
 * happens in a workplace is never reported, and the person best placed to
 * change what happens next is whoever was standing there.
 *
 * Written as options rather than as a duty, deliberately. A guide that tells
 * people they must confront the behaviour in the room produces one of two
 * outcomes: nothing, because most people will not, or an escalation someone
 * is not equipped for. Four options, any of which counts, is what makes the
 * quiet ones usable — and checking in with the person afterwards is both the
 * easiest and, by most accounts, the one they remember.
 *
 * It does not create an obligation to intervene, and it must not be written
 * as though it does. An employer whose policy says a bystander who stayed
 * silent has breached it has invented a disciplinary offence out of someone
 * else's misconduct, and has shifted its own duty onto the witness.
 */
export const bystanderInterventionGuide: ReferenceGuide = {
  slug: 'bystander-intervention',
  ring: 2,
  jurisdictions: ['ON', 'QC', 'FED'],
  readingMinutes: 6,
  title: bi('When you see it happen to someone else', 'Quand cela arrive à quelqu’un d’autre'),
  summary: bi(
    'Four things a colleague can do in the moment, none of which requires confronting anyone — and what to do afterwards, which matters more.',
    'Quatre gestes possibles sur le moment, dont aucun n’exige d’affronter qui que ce soit — et ce qu’il faut faire après, ce qui compte davantage.',
  ),
  tag: bi('Wellness · All jurisdictions', 'Mieux-être · Toutes les juridictions'),
  relatedTemplates: ['T13', 'T31'],
  relatedFlows: ['psychological-safety-check'],
  sections: [
    {
      heading: bi('Why this is for you', 'Pourquoi ceci s’adresse à vous'),
      blocks: [
        p(
          'Almost everything an employer publishes about harassment is addressed to the person it happened to, and asks them to report it. Most of the time nobody does — and the reasons are ordinary: they are not sure it counts, they do not want to be the person who made a thing of it, they have to keep working with everyone in the room.',
          'La quasi-totalité de ce qu’un employeur publie sur le harcèlement s’adresse à la personne visée et lui demande de signaler. La plupart du temps, personne ne le fait — et les raisons sont ordinaires : on doute que cela compte, on ne veut pas être celui ou celle qui en a fait une affaire, il faudra continuer de travailler avec tout le monde.',
        ),
        p(
          'Which leaves whoever else was there. A colleague who does something — anything — changes two things at once: it interrupts what is happening, and it tells the person on the receiving end that they did not imagine it. That second one is what people describe years later, and it does not require you to have handled it well.',
          'Reste donc quiconque était présent. Un collègue qui fait quelque chose — n’importe quoi — change deux choses à la fois : il interrompt ce qui se produit, et il signifie à la personne visée qu’elle n’a rien imaginé. C’est ce second effet dont les gens parlent des années plus tard, et il n’exige pas que vous vous en soyez bien tiré.',
        ),
        p(
          'Nothing in this guide is a duty. It creates no obligation to intervene, and an employer that treats a bystander’s silence as a disciplinary matter has turned its own obligation into that person’s. What it cannot do is override obligations you already have: a workplace violence or safety reporting policy, a collective agreement, a professional obligation, or a supervisory role can each require you to report something regardless of what this says. Check what applies to you — and if you are a supervisor, see the last section, because your position is different.',
          'Rien dans le présent guide n’est une obligation. Il ne crée aucun devoir d’intervenir, et un employeur qui traite le silence d’un témoin comme une faute disciplinaire a transformé sa propre obligation en celle de cette personne. Ce qu’il ne peut faire, c’est écarter des obligations que vous avez déjà : une politique de signalement en matière de violence ou de sécurité, une convention collective, une obligation professionnelle ou une fonction de supervision peuvent chacune vous imposer de signaler, quoi qu’en dise le présent texte. Vérifiez ce qui s’applique à vous — et si vous êtes superviseur, voyez la dernière section, car votre position diffère.',
        ),
      ],
    },
    {
      heading: bi('Four things you can do', 'Quatre gestes possibles'),
      blocks: [
        p(
          'Only one of these involves addressing the behaviour directly, and it is the one to reach for least. The others work, and they are the ones people actually use.',
          'Un seul de ces gestes consiste à aborder le comportement de front, et c’est celui auquel il faut recourir le moins. Les autres fonctionnent, et ce sont ceux que l’on emploie réellement.',
        ),
        li(
          'Interrupt. Change the subject, ask an unrelated question, spill something. You do not have to name what is happening — the interruption is the intervention, and the person doing it usually stops.',
          'Interrompre. Changez de sujet, posez une question sans rapport, renversez quelque chose. Vous n’avez pas à nommer ce qui se passe — l’interruption est l’intervention, et la personne en cause s’arrête généralement.',
        ),
        li(
          'Move the room. Sit down beside the person, ask them to help you with something, invite them into another conversation. Removing the audience removes most of the point.',
          'Déplacer la situation. Asseyez-vous à côté de la personne, demandez-lui un coup de main, entraînez-la dans une autre conversation. Retirer le public retire l’essentiel de l’intérêt.',
        ),
        li(
          'Say something, plainly and briefly. "That is not okay." "Let’s not." Short works better than a speech, and it does not require you to win an argument — you are marking the line, not litigating it.',
          'Dire quelque chose, simplement et brièvement. « Ce n’est pas correct. » « On va s’arrêter là. » La brièveté vaut mieux qu’un discours, et cela n’exige pas de gagner un débat — vous marquez la limite, vous ne la plaidez pas.',
        ),
        li(
          'Tell someone who can act. If none of the above is possible, or it keeps happening, take it to whoever your policy names. You can do that without the affected person asking you to, and without naming them if they would rather you did not.',
          'Le dire à une personne qui peut agir. Si rien de ce qui précède n’est possible, ou si cela se répète, adressez-vous à la personne désignée par votre politique. Vous pouvez le faire sans que la personne visée vous l’ait demandé, et sans la nommer si elle préfère.',
        ),
        p(
          'Weigh your own safety first, every time. If the situation could turn on you — physically, or because of who holds power over your job — the fourth option is the right one and there is nothing to apologise for in choosing it.',
          'Évaluez d’abord votre propre sécurité, chaque fois. Si la situation risque de se retourner contre vous — physiquement, ou en raison du pouvoir que quelqu’un exerce sur votre emploi — la quatrième option est la bonne et son choix n’appelle aucune excuse.',
        ),
      ],
    },
    {
      heading: bi('Afterwards, which matters more', 'Après, ce qui compte davantage'),
      blocks: [
        p(
          'If you do one thing from this guide, do this one: find the person afterwards and say you saw it. It costs a sentence, it requires no courage in the moment, and it is the single most reported thing that helped.',
          'Si vous ne retenez qu’un geste de ce guide, retenez celui-ci : allez voir la personne ensuite et dites-lui que vous avez vu. Cela tient en une phrase, n’exige aucun courage sur le moment, et c’est ce que l’on cite le plus souvent comme ayant aidé.',
        ),
        contrast(
          bi(
            'I saw what happened in that meeting and it was not okay. Are you all right? Tell me if there is something you want me to do — including nothing.',
            'J’ai vu ce qui s’est passé pendant la réunion et ce n’était pas correct. Est-ce que ça va ? Dis-moi s’il y a quelque chose que tu veux que je fasse — y compris rien.',
          ),
          bi(
            'You should report that. I would report that.',
            'Tu devrais signaler ça. Moi, je le signalerais.',
          ),
        ),
        p(
          'The second one hands them a decision and a judgement in the same breath, and if they choose not to report it they now have your disappointment to carry as well. Offer, then take the answer.',
          'La seconde formule leur impose une décision et un jugement d’un même souffle, et si la personne choisit de ne pas signaler, elle porte en plus votre déception. Proposez, puis acceptez la réponse.',
        ),
        li(
          'Write down what you saw, in your own words, the same day — what was said, who was there, when. Memory of a specific exchange degrades fast, and a contemporaneous note is worth more than a confident recollection six months later.',
          'Notez ce que vous avez vu, dans vos mots, le jour même — ce qui a été dit, qui était présent, quand. Le souvenir d’un échange précis se dégrade vite, et une note prise sur le moment vaut mieux qu’un souvenir assuré six mois plus tard.',
        ),
        li(
          'Do not tell the story to other colleagues. It stops being support and becomes the thing the person has to manage next, and it is how a private difficulty turns into workplace information.',
          'Ne racontez pas l’épisode à d’autres collègues. Cela cesse d’être un soutien et devient ce que la personne devra gérer ensuite, et c’est ainsi qu’une difficulté privée devient une information de bureau.',
        ),
        li(
          'If you are asked to give an account later, give an honest one, including the parts that do not help the outcome you would prefer. An investigation that turns on a shaded account helps nobody, least of all the person you were trying to support.',
          'Si l’on vous demande plus tard un témoignage, donnez-en un honnête, y compris les éléments qui ne servent pas l’issue que vous souhaiteriez. Une enquête qui repose sur un récit arrangé n’aide personne, et surtout pas la personne que vous vouliez soutenir.',
        ),
      ],
    },
    {
      heading: bi('If you are the manager', 'Si vous êtes le ou la gestionnaire'),
      blocks: [
        p(
          'Being present changes your position. An employee who witnesses something may choose what to do with it; a manager who witnesses it has put the organisation on notice, because what a manager knows the employer knows. Doing nothing is not an option available to you in the way it is to a colleague.',
          'Votre présence change votre position. Une personne salariée témoin d’un incident peut choisir la suite; un gestionnaire témoin place l’organisation en situation de connaissance, car ce que sait un gestionnaire, l’employeur le sait. Ne rien faire n’est pas une option qui vous est ouverte comme elle l’est à un collègue.',
        ),
        li(
          'Act on what you saw whether or not anyone complains. Waiting for a complaint that never comes is the most common way an employer’s knowledge sits unaddressed for a year and then surfaces in a claim.',
          'Agissez sur ce que vous avez vu, qu’il y ait plainte ou non. Attendre une plainte qui ne vient jamais est la façon la plus courante dont la connaissance d’un employeur reste sans suite un an durant, puis refait surface dans un recours.',
        ),
        li(
          'Tell the affected person what you are going to do before you do it, and do not promise them control you do not have. You may have to act even if they ask you not to; say so honestly rather than agreeing and then acting anyway.',
          'Dites à la personne visée ce que vous ferez avant de le faire, et ne lui promettez pas une maîtrise que vous n’avez pas. Vous pourriez devoir agir même si elle vous demande de ne pas le faire; dites-le honnêtement plutôt que d’acquiescer puis d’agir malgré tout.',
        ),
        li(
          'Do not investigate it yourself in the moment. Gathering accounts from the room before anyone has decided what process applies is how evidence gets shaped, and in a federally regulated workplace it can cut across a process that has its own prescribed steps.',
          'N’enquêtez pas vous-même sur le champ. Recueillir des versions auprès des personnes présentes avant qu’on ait déterminé le processus applicable est une façon d’influencer les témoignages et, en milieu de compétence fédérale, cela peut court-circuiter un processus assorti d’étapes prescrites.',
        ),
      ],
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'The Occupational Health and Safety Act obliges the employer to investigate incidents of workplace harassment that come to its attention — which includes what a supervisor witnessed, whether or not anyone filed a complaint. The Human Rights Code protects a witness from reprisal for taking part in a proceeding, so a colleague who gives an account is protected on the same footing as the person who complained.',
      fr: 'La Loi sur la santé et la sécurité au travail oblige l’employeur à enquêter sur les incidents de harcèlement portés à sa connaissance — ce qui comprend ce qu’un superviseur a constaté, qu’une plainte ait été déposée ou non. Le Code des droits de la personne protège le témoin contre les représailles liées à sa participation à une instance, de sorte qu’un collègue qui témoigne est protégé au même titre que la personne plaignante.',
    },
    QC: {
      en: 'The Act respecting labour standards requires an employer to take reasonable steps to prevent psychological harassment and to stop it once made aware — and a manager who was in the room has made the employer aware. Note that a single serious incident can amount to harassment there where it produces a lasting harmful effect — so “it only happened once” is not on its own a reason to leave it, though seriousness alone is not the test either.',
      fr: 'La Loi sur les normes du travail oblige l’employeur à prendre les moyens raisonnables pour prévenir le harcèlement psychologique et à le faire cesser dès qu’il en est informé — et un gestionnaire présent sur les lieux en a informé l’employeur. Notez qu’une seule conduite grave peut y constituer du harcèlement lorsqu’elle produit un effet nocif continu : « ce n’est arrivé qu’une fois » n’est donc pas en soi un motif pour laisser passer, sans que la gravité suffise à elle seule.',
    },
    FED: {
      en: 'Under the Work Place Harassment and Violence Prevention Regulations a witness may themselves give notice of an occurrence, and the process that follows is prescribed rather than discretionary. The Regulations protect the identity of the parties throughout — which is a reason not to discuss what you saw with colleagues, beyond the ordinary one.',
      fr: 'Sous le régime du Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail, un témoin peut lui-même signaler un incident, et le processus qui suit est prescrit et non discrétionnaire. Le règlement protège l’identité des parties tout au long — une raison de plus, au-delà de la raison ordinaire, de ne pas discuter avec des collègues de ce que vous avez vu.',
    },
  },
}
