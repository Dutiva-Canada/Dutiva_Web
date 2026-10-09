import { bi } from '@/i18n/core'
import { contrast, li, p } from '../guideModel'
import type { ReferenceGuide } from '../guideModel'

/**
 * Ring 2, Pillar A — the EAP referral guide
 * (docs/FOUR_RING_FRAMEWORK.md). All FR is [FR self-authored].
 *
 * Scoped to the benefit and the boundary around it. How to hold the
 * conversation is the manager conversation guide's subject, and the two are
 * deliberately not merged: this one is read once, when an employer is working
 * out what their programme is and what they are allowed to do with it, and
 * that one is read the morning of a difficult meeting.
 *
 * The through-line is that an EAP is a benefit the employer buys and does not
 * operate. Nearly every way this goes wrong — requiring attendance, asking
 * whether someone went, treating a referral as a performance step, promising
 * more than the plan covers — comes from an employer acting as though the
 * programme were theirs to direct.
 *
 * No figures: session counts, coverage limits and eligibility are set by the
 * plan an employer bought, not by anything this product can know.
 */
export const eapReferralGuide: ReferenceGuide = {
  slug: 'eap-referral',
  ring: 2,
  jurisdictions: ['ON', 'QC', 'FED'],
  readingMinutes: 6,
  title: bi(
    'Referring someone to your employee assistance programme',
    'Orienter une personne vers votre programme d’aide aux employés',
  ),
  summary: bi(
    'What an EAP is, what it is not, and the line between offering it and requiring it — which is the line most employers cross without noticing.',
    'Ce qu’est un PAE, ce qu’il n’est pas, et la frontière entre le proposer et l’imposer — celle que la plupart des employeurs franchissent sans s’en apercevoir.',
  ),
  tag: bi('Wellness · All jurisdictions', 'Mieux-être · Toutes les juridictions'),
  relatedTemplates: ['T21', 'T33', 'T34'],
  relatedFlows: ['mental-health-response'],
  sections: [
    {
      heading: bi('What you have actually bought', 'Ce que vous avez réellement acheté'),
      blocks: [
        p(
          'An employee assistance programme is a third-party service the employer pays for and the employee uses privately. That sentence contains the whole of the employer’s position: you fund it, you tell people it exists, and past that point it is not yours.',
          'Un programme d’aide aux employés est un service tiers que l’employeur finance et que la personne salariée utilise en privé. Cette phrase résume toute la position de l’employeur : vous le financez, vous en annoncez l’existence, et au-delà, il ne vous appartient pas.',
        ),
        p(
          'Most programmes offer short-term counselling and referral, and many extend to legal, financial and family services that have nothing to do with mental health. That breadth is worth naming when you tell people about it — a programme people believe is only for a crisis is a programme most of them will never use.',
          'La plupart des programmes offrent du counseling à court terme et de l’orientation, et beaucoup couvrent aussi des services juridiques, financiers et familiaux sans lien avec la santé mentale. Cette étendue mérite d’être mentionnée — un programme perçu comme réservé aux crises est un programme que la plupart n’utiliseront jamais.',
        ),
        p(
          'What it is not is treatment, and it is not a substitute for the health system or for accommodation. A programme with a handful of sessions cannot carry a serious or lasting condition, and an employer who treats a referral as the response to one has done less than they think.',
          'Ce n’est ni un traitement, ni un substitut au réseau de la santé ou à l’accommodement. Un programme comptant quelques séances ne peut prendre en charge un trouble grave ou durable, et l’employeur qui y voit la réponse à un tel trouble en a fait moins qu’il ne le croit.',
        ),
      ],
    },
    {
      heading: bi(
        'You will not be told, and that is the point',
        'Vous ne serez pas informé, et c’est là tout l’intérêt',
      ),
      blocks: [
        p(
          'Whether someone contacted the programme, what they discussed, and what came of it are between them and the provider. You may receive aggregate usage statistics; you will not receive names, and you should not ask for them.',
          'Le fait qu’une personne ait communiqué avec le programme, ce dont elle a discuté et ce qui en est ressorti relèvent d’elle et du fournisseur. Vous pouvez recevoir des statistiques d’utilisation globales; vous n’obtiendrez pas de noms, et vous ne devez pas en demander.',
        ),
        p(
          'This is not a courtesy — it is the condition that makes the programme work at all. An employee who suspects their manager will hear about the call does not make the call, and an employer who has quietly established that suspicion has bought a benefit nobody uses.',
          'Ce n’est pas une politesse : c’est la condition même de l’efficacité du programme. Une personne qui soupçonne que son gestionnaire sera informé de l’appel ne le fera pas, et l’employeur qui a discrètement installé ce soupçon a payé un avantage que personne n’utilise.',
        ),
        contrast(
          bi(
            'I will not know whether you contact them, and I am not going to ask. They will tell you what they keep private and where the limits are — that part is between you and them.',
            'Je ne saurai pas si vous les contactez, et je ne le demanderai pas. Ils vous expliqueront ce qui demeure confidentiel et où se situent les limites — cela relève de vous et d’eux.',
          ),
          bi('Let me know how it goes.', 'Tenez-moi au courant de la suite.'),
        ),
        p(
          'Note what the first one does not say. "It is completely confidential" is not yours to promise: the provider sets its own terms, and most carry exceptions — an imminent risk of harm, a mandatory reporting obligation, a court order. Promise the part you control, which is that the employer does not ask and is not told, and let the provider state its own limits. The alternative is the failure this pillar warns about everywhere else: a promise made in good faith by someone with no power to keep it.',
          'Remarquez ce que la première formule ne dit pas. « C’est entièrement confidentiel » ne vous appartient pas : le fournisseur fixe ses propres conditions et la plupart comportent des exceptions — un risque imminent de préjudice, une obligation de signalement, une ordonnance judiciaire. Promettez ce que vous maîtrisez — que l’employeur ne demande rien et n’est pas informé — et laissez le fournisseur énoncer ses propres limites. À défaut, c’est l’échec contre lequel ce pilier met en garde partout ailleurs : une promesse faite de bonne foi par une personne qui n’a pas le pouvoir de la tenir.',
        ),
        p(
          'The second one sounds like warmth and lands as surveillance. It also creates an expectation you are not entitled to hold, and the employee now has to decide whether declining to report back will be held against them.',
          'La seconde formule se veut bienveillante et est reçue comme une surveillance. Elle crée en outre une attente à laquelle vous n’avez pas droit, et la personne doit désormais évaluer si refuser d’en rendre compte lui sera reproché.',
        ),
      ],
    },
    {
      heading: bi(
        'Offering, requiring, and the line between',
        'Proposer, imposer, et la frontière entre les deux',
      ),
      blocks: [
        p(
          'A referral is an offer. The moment it becomes a condition — of keeping a role, of avoiding discipline, of an adjustment being granted — it stops being support and becomes an employment decision made on the basis of a perceived health condition, which is the thing human rights legislation in every jurisdiction Dutiva covers exists to prohibit.',
          'Une orientation est une offre. Dès qu’elle devient une condition — pour conserver un poste, éviter une sanction ou obtenir un ajustement —, elle cesse d’être un soutien et devient une décision d’emploi fondée sur un état de santé perçu, soit précisément ce que la législation en matière de droits de la personne interdit dans chacune des juridictions couvertes par Dutiva.',
        ),
        li(
          'Say it exists, say how to reach it, say it is voluntary, and say you are not told who uses it. That is a referral.',
          'Dites qu’il existe, comment y accéder, qu’il est volontaire et que vous n’êtes pas informé de qui y a recours. Voilà une orientation.',
        ),
        li(
          'Put it in a performance document, make it a step in a corrective process, or ask for confirmation of attendance. That is a requirement wearing a referral’s clothes.',
          'L’inscrire dans un document de rendement, en faire une étape d’un processus disciplinaire ou exiger une confirmation de participation : voilà une exigence déguisée en orientation.',
        ),
        li(
          'Offer it to everyone in the same circumstance, not only to the person you have a theory about. Selective offers are how an employer’s assumption about someone’s health ends up on the record.',
          'Offrez-le à toute personne se trouvant dans la même situation, et non uniquement à celle sur laquelle vous avez une intuition. Les offres sélectives sont la façon dont la présomption d’un employeur sur la santé de quelqu’un finit consignée au dossier.',
        ),
        p(
          'There is a narrow exception in some workplaces — a formal, negotiated return-to-work or last-chance arrangement, usually unionised, usually built with medical and legal input. That is a different instrument with its own consent, and nothing in this guide authorises improvising one.',
          'Il existe une exception étroite dans certains milieux : une entente formelle et négociée de retour au travail ou de dernière chance, généralement en contexte syndiqué et élaborée avec un apport médical et juridique. Il s’agit d’un instrument distinct, assorti de son propre consentement, et rien dans le présent guide n’autorise à en improviser un.',
        ),
      ],
    },
    {
      heading: bi('Saying it so it is heard', 'Le dire de façon à être entendu'),
      blocks: [
        p(
          'The most common failure is not refusal. It is that the offer was made once, in a tone that suggested it was a formality, and never landed.',
          'L’échec le plus courant n’est pas le refus. C’est que l’offre a été faite une fois, sur un ton laissant croire à une formalité, et n’a jamais porté.',
        ),
        contrast(
          bi(
            'We have a programme — counselling, and also legal and financial help. You call them directly, it is free, and nobody here is told anything about it. I can send you the number now if that is useful.',
            'Nous avons un programme — du counseling, mais aussi de l’aide juridique et financière. Vous les appelez directement, c’est gratuit, et personne ici n’en est informé. Je peux vous envoyer le numéro tout de suite si cela vous est utile.',
          ),
          bi(
            'You know we have an EAP, right? It is in the handbook.',
            'Vous savez que nous avons un PAE, n’est-ce pas ? C’est dans le manuel de l’employé.',
          ),
        ),
        li(
          'Give the contact details in the conversation rather than pointing at a document. The step between "it exists" and "here is the number" is where most offers die.',
          'Donnez les coordonnées pendant la conversation plutôt que de renvoyer à un document. C’est entre « cela existe » et « voici le numéro » que la plupart des offres se perdent.',
        ),
        li(
          'Say what it covers beyond counselling. People who would never call about their mental health will call about a debt or a custody question, and arrive at the same support.',
          'Précisez ce qui est couvert au-delà du counseling. Des personnes qui n’appelleraient jamais au sujet de leur santé mentale le feront pour une dette ou une question de garde, et accéderont au même soutien.',
        ),
        li(
          'Repeat it when nothing is wrong. A programme mentioned only in difficult meetings becomes a signal that the manager has concluded something.',
          'Répétez-le quand tout va bien. Un programme évoqué uniquement lors de rencontres difficiles devient le signal que le gestionnaire a tiré une conclusion.',
        ),
        p(
          'And check the offer is true before you make it. Whether the programme covers contractors, part-time staff, people on leave and family members varies by plan, and an offer withdrawn on eligibility grounds after someone has reached for it does more damage than never having made it.',
          'Et vérifiez que l’offre est exacte avant de la formuler. La couverture des personnes en sous-traitance, à temps partiel, en congé ou des membres de la famille varie selon le contrat, et une offre retirée pour cause d’inadmissibilité après que la personne y a eu recours fait plus de tort que si elle n’avait jamais été faite.',
        ),
      ],
    },
    {
      heading: bi('Where it stops', 'Là où cela s’arrête'),
      blocks: [
        p(
          'A referral does not discharge the duty to accommodate, does not answer a request for an adjustment, and does not replace a leave. If someone needs the work to change, the accommodation process starts and the programme carries on beside it.',
          'Une orientation ne libère pas de l’obligation d’accommodement, ne répond pas à une demande d’ajustement et ne remplace pas un congé. Si une personne a besoin que le travail change, le processus d’accommodement s’enclenche et le programme se poursuit en parallèle.',
        ),
        p(
          'Nor does it give you information you are otherwise not entitled to. Where a limitation has to be established, it is established the way any other is — through what the employee provides about their functional limitations, never through the programme, which will not tell you and should not be asked.',
          'Elle ne vous donne pas non plus accès à une information à laquelle vous n’auriez autrement pas droit. Lorsqu’une limitation doit être établie, elle l’est comme toute autre : par ce que la personne fournit sur ses limitations fonctionnelles, jamais par le programme, qui ne vous dira rien et à qui il ne faut rien demander.',
        ),
      ],
    },
  ],
  jurisdictionNotes: {
    ON: bi(
      'Ontario has no statute requiring an employee assistance programme; offering one is voluntary. What is not voluntary is what follows from what you learn — the Human Rights Code duty to accommodate a disability, and the Occupational Health and Safety Act duties that apply where the difficulty involves harassment or violence at work.',
      'Aucune loi ontarienne n’exige la mise en place d’un programme d’aide aux employés ; en offrir un est volontaire. Ce qui ne l’est pas, ce sont les suites de ce que vous apprenez — l’obligation d’accommoder un handicap prévue au Code des droits de la personne, et les obligations de la Loi sur la santé et la sécurité au travail lorsque la difficulté met en cause du harcèlement ou de la violence au travail.',
    ),
    QC: bi(
      'Québec likewise requires no programme, but the Act respecting labour standards obliges an employer to take reasonable steps to prevent psychological harassment and to stop it when it occurs — so where a difficulty is traced to conduct at work, a referral is not a response to it. The Charter of human rights and freedoms carries the accommodation duty.',
      'Le Québec n’exige pas davantage de programme, mais la Loi sur les normes du travail oblige l’employeur à prendre les moyens raisonnables pour prévenir le harcèlement psychologique et le faire cesser lorsqu’il survient — de sorte que si une difficulté remonte à des comportements au travail, une orientation n’y répond pas. La Charte des droits et libertés de la personne porte l’obligation d’accommodement.',
    ),
    FED: bi(
      'Federally regulated employers have no obligation to provide a programme either, but the Work Place Harassment and Violence Prevention Regulations do require that employees be made aware of the support services available to them — so if you have a programme, telling people it exists is not optional. The Canadian Human Rights Act carries the accommodation duty.',
      'Les employeurs de compétence fédérale ne sont pas non plus tenus d’offrir un programme, mais le Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail exige que les employés soient informés des services de soutien à leur disposition — si vous avez un programme, en annoncer l’existence n’est donc pas facultatif. La Loi canadienne sur les droits de la personne porte l’obligation d’accommodement.',
    ),
  },
}
