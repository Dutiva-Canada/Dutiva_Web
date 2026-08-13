import { bi } from '@/i18n/core'
import { contrast, li, p } from '../guideModel'
import type { ReferenceGuide } from '../guideModel'

/**
 * Ring 4, Compensation & Financial Literacy — the RRSP & TFSA guide
 * (docs/FOUR_RING_FRAMEWORK.md). All FR is [FR self-authored].
 *
 * **Two rules govern this one, and they pull in the same direction.**
 *
 * The first is the figure rule the parental leave guide set: contribution
 * limits, the deduction limit carry-forward, the age an RRSP must convert, the
 * withholding rates on a withdrawal — every one of those is set annually or
 * amended by budget, and a guide carrying them is a guide someone re-audits
 * each January until the year nobody does.
 *
 * The second is narrower and only applies here: **an employer is not a
 * financial adviser, and this guide must not turn one into one.** Explaining
 * how an account is taxed is education. Telling an employee which account to
 * use, how much to put in it, or what to hold inside it is advice — advice
 * they did not seek from a regulated source, given by the party that signs
 * their pay cheque. So this guide describes mechanics and stops, and its
 * longest section is about where the employer's answer ends.
 *
 * Employer-side, like the rest of the reference set: the reader is deciding
 * whether to offer a plan and how to talk about it, not choosing their own.
 */
export const retirementSavingsGuide: ReferenceGuide = {
  slug: 'retirement-savings',
  ring: 4,
  jurisdictions: ['ON', 'QC', 'FED'],
  readingMinutes: 8,
  title: bi(
    'RRSPs and TFSAs, without giving financial advice',
    'REER et CELI, sans donner de conseils financiers',
  ),
  summary: bi(
    'How the two accounts differ, what a group plan commits you to, and the line between explaining a benefit and advising on it.',
    'En quoi les deux régimes diffèrent, à quoi vous engage un régime collectif, et la frontière entre expliquer un avantage et conseiller à son sujet.',
  ),
  tag: bi('Compensation · All jurisdictions', 'Rémunération · Toutes les juridictions'),
  relatedTemplates: ['T45', 'T26'],
  sections: [
    {
      heading: bi('Start with the line', 'Commencez par la frontière'),
      blocks: [
        p(
          'You can explain how these accounts work. You cannot tell an employee which one to use, how much to contribute, or what to hold inside it. That is advice, it is a regulated activity, and the person receiving it from you is not in a position to weigh it neutrally — you sign their pay cheque.',
          'Vous pouvez expliquer le fonctionnement de ces régimes. Vous ne pouvez pas dire à un employé lequel choisir, combien y verser ni quels placements y détenir. Il s’agit de conseils, une activité réglementée, et la personne qui les reçoit de vous n’est pas en mesure de les soupeser avec neutralité — c’est vous qui signez sa paie.',
        ),
        p(
          'The distinction is not academic. An employee who reduces a contribution on your say-so and is short at retirement, or who withdraws on your reassurance and is taxed on it, has a grievance with a specific author. Nothing in this guide is worth crossing that line for.',
          'La distinction n’est pas théorique. L’employé qui réduit une cotisation sur votre recommandation et se retrouve à court à la retraite, ou qui effectue un retrait sur la foi de vos assurances et se le voit imposer, aura un grief visant une personne précise. Rien dans ce guide ne justifie de franchir cette frontière.',
        ),
        contrast(
          bi(
            'Here is how the plan works, here is what the employer contributes, and here is the plan administrator — they can walk you through what makes sense for you.',
            'Voici comment fonctionne le régime, voici ce que verse l’employeur, et voici l’administrateur du régime — il pourra vous expliquer ce qui vous convient.',
          ),
          bi(
            'At your age I’d max the RRSP first — the refund is worth more than the TFSA.',
            'À votre âge, je remplirais d’abord le REER — le remboursement vaut plus que le CELI.',
          ),
        ),
        li(
          'Name a destination every time you decline. "I can’t advise on that" lands badly on its own and well when it ends with who can.',
          'Nommez une ressource chaque fois que vous refusez. « Je ne peux pas vous conseiller là-dessus » passe mal seul, et bien lorsque cela se termine par le nom de la personne qui le peut.',
        ),
        li(
          'Hold the same line for yourself. A manager’s aside about what they do with their own is still received as guidance from the employer.',
          'Tenez la même ligne pour vous-même. La remarque d’un gestionnaire sur ce qu’il fait de son propre régime est tout de même reçue comme une orientation de l’employeur.',
        ),
        li(
          'If you bring in the plan provider to present, say plainly whether they are being paid and by whom. Employees assume neutrality that may not be there.',
          'Si vous invitez le fournisseur du régime à faire une présentation, dites clairement s’il est rémunéré et par qui. Les employés présument une neutralité qui n’existe pas forcément.',
        ),
      ],
    },
    {
      heading: bi('Two accounts, two tax treatments', 'Deux régimes, deux traitements fiscaux'),
      blocks: [
        p(
          'Both shelter investment growth from tax. They differ in when the tax is paid, and almost everything else follows from that one difference.',
          'Les deux mettent la croissance des placements à l’abri de l’impôt. Ils diffèrent quant au moment où l’impôt est payé, et presque tout le reste découle de cette seule différence.',
        ),
        li(
          'A registered retirement savings plan is taxed on the way out. The contribution is deductible, so it reduces taxable income in the year it is made; the growth is untaxed while it stays inside; the withdrawal is income in the year it is taken.',
          'Un régime enregistré d’épargne-retraite est imposé à la sortie. La cotisation est déductible et réduit donc le revenu imposable de l’année où elle est versée; la croissance n’est pas imposée tant qu’elle demeure dans le régime; le retrait constitue un revenu dans l’année où il est effectué.',
        ),
        li(
          'A tax-free savings account is taxed on the way in. The contribution comes from money already taxed and is not deductible; the growth is untaxed; the withdrawal is not income and does not appear on a return.',
          'Un compte d’épargne libre d’impôt est imposé à l’entrée. La cotisation provient d’un revenu déjà imposé et n’est pas déductible; la croissance n’est pas imposée; le retrait ne constitue pas un revenu et ne figure sur aucune déclaration.',
        ),
        li(
          'Room is not the same thing in the two. Retirement plan room is earned — it accrues from employment and other qualifying income and is reported to the taxpayer by the tax authority each year. Savings account room accrues by calendar year from the year the holder becomes eligible, whether or not they worked.',
          'Le droit de cotisation n’a pas le même sens dans les deux cas. Celui du régime de retraite se gagne : il s’accumule à partir du revenu d’emploi et d’autres revenus admissibles, et l’autorité fiscale le communique au contribuable chaque année. Celui du compte d’épargne s’accumule par année civile depuis l’année où le titulaire devient admissible, qu’il ait travaillé ou non.',
        ),
        li(
          'Withdrawals behave differently afterwards. Taking money out of the savings account restores that room in a later year; taking it out of the retirement plan generally does not, and tax is withheld at the time.',
          'Les retraits ne se comportent pas de la même façon par la suite. Retirer du compte d’épargne rétablit ce droit lors d’une année ultérieure; le retirer du régime de retraite ne le rétablit généralement pas, et un impôt est retenu au moment du retrait.',
        ),
        li(
          'The retirement plan has an end date. It must be converted or collapsed in the year the holder reaches an age set by the tax legislation, which is the kind of thing to check rather than remember.',
          'Le régime de retraite comporte une échéance. Il doit être converti ou liquidé dans l’année où le titulaire atteint un âge fixé par la loi fiscale — le genre d’élément à vérifier plutôt qu’à mémoriser.',
        ),
        p(
          'Over-contributing to either has a penalty, and it is the employee’s to manage, not yours. An employee joining a group plan mid-year with contributions already made elsewhere is the usual way it happens — worth flagging as a thing to check, without checking it for them.',
          'Le versement excédentaire dans l’un ou l’autre entraîne une pénalité, dont la gestion revient à l’employé et non à vous. Le cas courant est celui de l’employé qui adhère à un régime collectif en cours d’année alors qu’il a déjà cotisé ailleurs — un point à signaler comme élément à vérifier, sans le vérifier à sa place.',
        ),
      ],
    },
    {
      heading: bi('What a group plan actually is', 'Ce qu’est réellement un régime collectif'),
      blocks: [
        p(
          'A group retirement savings plan is a collection of individual accounts that payroll happens to feed. Each account belongs to the employee, not to the plan and not to you, and it leaves with them.',
          'Un régime collectif d’épargne-retraite est un ensemble de comptes individuels alimentés par la paie. Chaque compte appartient à l’employé — non au régime ni à vous — et il le suit lorsqu’il quitte.',
        ),
        p(
          'It is not a pension plan. A registered pension plan is a different vehicle under different legislation with locking-in rules, funding obligations and a regulator; a group savings plan has none of those. Calling it "our pension" in a recruiting conversation sets an expectation the plan does not meet.',
          'Ce n’est pas un régime de retraite. Un régime de retraite agréé constitue un véhicule distinct, régi par une autre législation, assorti de règles d’immobilisation, d’obligations de capitalisation et d’un organisme de surveillance; le régime collectif d’épargne n’a rien de tout cela. Parler de « notre régime de retraite » en entrevue crée une attente à laquelle le régime ne répond pas.',
        ),
        li(
          'Deducting a contribution from pay needs the employee’s written authorization, like any deduction that is not required by law. Enrolment is that authorization; keep it.',
          'La retenue d’une cotisation sur la paie exige l’autorisation écrite de l’employé, comme toute retenue non exigée par la loi. L’adhésion constitue cette autorisation; conservez-la.',
        ),
        li(
          'Payroll deduction is the genuine advantage worth explaining: the contribution reduces the income the deduction is calculated on immediately, rather than coming back as a refund a year later. That is mechanics, not advice.',
          'La retenue sur la paie constitue l’avantage réel qu’il vaut la peine d’expliquer : la cotisation réduit immédiatement le revenu sur lequel la retenue est calculée, au lieu de revenir sous forme de remboursement un an plus tard. C’est de la mécanique, non du conseil.',
        ),
        li(
          'Decide what happens on departure before someone departs. Accounts typically move to an individual plan with the same provider, and the employee should hear that from you rather than from a letter.',
          'Décidez de ce qui arrive au départ avant qu’un départ ne survienne. Les comptes sont généralement transférés vers un régime individuel chez le même fournisseur, et l’employé devrait l’apprendre de vous plutôt que par lettre.',
        ),
        li(
          'A group tax-free account alongside the retirement plan is common and is a payroll decision as much as a benefits one. Confirm your provider and your payroll system both handle it before you announce it.',
          'Un compte d’épargne libre d’impôt collectif offert parallèlement au régime de retraite est courant et relève autant de la paie que des avantages sociaux. Confirmez que votre fournisseur et votre système de paie le prennent en charge avant de l’annoncer.',
        ),
      ],
    },
    {
      heading: bi(
        'Employer contributions are pay',
        'Les cotisations de l’employeur sont un salaire',
      ),
      blocks: [
        p(
          'If you match or contribute to a group savings plan, that contribution is a taxable benefit to the employee. It runs through payroll, it is reported, and it raises the income their source deductions are calculated on — so an employee who gains an employer contribution can see net pay fall in the same period.',
          'Si vous égalez ou versez des cotisations à un régime collectif d’épargne, cette cotisation constitue un avantage imposable pour l’employé. Elle transite par la paie, elle est déclarée, et elle augmente le revenu servant au calcul des retenues à la source — de sorte qu’un employé qui obtient une cotisation patronale peut voir sa paie nette diminuer pendant la même période.',
        ),
        li(
          'Say so when you announce the benefit, not when the first person calls. This is the most predictable surprise in the whole of compensation.',
          'Dites-le au moment d’annoncer l’avantage, et non lorsque la première personne appelle. C’est la surprise la plus prévisible de toute la rémunération.',
        ),
        li(
          'Confirm the payroll treatment with your provider before the first contribution, not after. A benefit set up wrong is corrected across every affected period, and the correction lands on the employee’s statement.',
          'Confirmez le traitement en paie auprès de votre fournisseur avant la première cotisation, et non après. Un avantage mal configuré se corrige sur toutes les périodes visées, et la correction apparaît sur le bulletin de l’employé.',
        ),
        li(
          'Other vehicles are treated differently — a deferred profit sharing plan and a registered pension plan do not carry the same payroll consequence. If the treatment is driving your choice, that is a conversation with your payroll provider and an adviser, not one to settle from a guide.',
          'D’autres véhicules sont traités différemment — un régime de participation différée aux bénéfices et un régime de retraite agréé n’entraînent pas les mêmes conséquences en paie. Si le traitement fiscal oriente votre choix, cette discussion revient à votre fournisseur de paie et à un conseiller, et non à un guide.',
        ),
        contrast(
          bi(
            'The employer contribution is a taxable benefit, so you will see it in your earnings and your deductions will be calculated on the higher amount.',
            'La cotisation de l’employeur est un avantage imposable : elle figurera dans votre rémunération et vos retenues seront calculées sur le montant majoré.',
          ),
          bi(
            'It is free money — nothing changes on your pay.',
            'C’est de l’argent gratuit — rien ne change sur votre paie.',
          ),
        ),
      ],
    },
    {
      heading: bi('Talking about it at all', 'En parler, tout simplement'),
      blocks: [
        p(
          'None of the above means saying nothing. An unexplained benefit is a benefit nobody values, and it shows up in a total compensation summary as a number the employee does not recognise. Explain the plan, not the employee’s finances.',
          'Rien de ce qui précède ne signifie qu’il faut se taire. Un avantage non expliqué est un avantage que personne ne valorise, et il se retrouve dans le sommaire de rémunération globale sous la forme d’un montant que l’employé ne reconnaît pas. Expliquez le régime, non les finances de l’employé.',
        ),
        li(
          'Safe ground: how enrolment works, what the employer contributes and on what condition, when deductions start, who the provider is, and how to reach them.',
          'Terrain sûr : le fonctionnement de l’adhésion, ce que verse l’employeur et à quelle condition, le moment où les retenues commencent, l’identité du fournisseur et la façon de le joindre.',
        ),
        li(
          'Off it: which account suits someone, how much they should contribute, what they should invest in, whether to withdraw, and anything that begins "if I were you".',
          'Hors de ce terrain : le régime qui convient à telle personne, le montant à verser, les placements à choisir, l’opportunité d’un retrait, et tout ce qui commence par « à votre place ».',
        ),
        li(
          'Put the same words in writing for everyone. A benefit explained differently to two people is a fairness problem before it is a financial one.',
          'Mettez les mêmes mots par écrit pour tout le monde. Un avantage expliqué différemment à deux personnes pose un problème d’équité avant d’en poser un de finances.',
        ),
        li(
          'Never require participation as a condition of anything, and never treat a decision not to join as a performance signal.',
          'N’exigez jamais la participation comme condition de quoi que ce soit, et ne traitez jamais le refus d’adhérer comme un indicateur de rendement.',
        ),
      ],
    },
    {
      heading: bi('Where the numbers are', 'Où trouver les chiffres'),
      blocks: [
        p(
          'This guide states no contribution limits, penalty rates, withholding rates or ages. They are set annually or amended by budget, and a figure repeated here would be one nobody re-audits.',
          'Le présent guide n’énonce aucun plafond de cotisation, taux de pénalité, taux de retenue ni âge limite. Ces éléments sont fixés annuellement ou modifiés par budget, et un chiffre repris ici serait un chiffre que personne ne réviserait.',
        ),
        li(
          'For limits, room and withdrawal treatment: the Canada Revenue Agency, and the individual’s own notice of assessment, which states their room and is the only reliable source for it.',
          'Pour les plafonds, les droits de cotisation et le traitement des retraits : l’Agence du revenu du Canada, ainsi que l’avis de cotisation de la personne, qui indique ses droits et en constitue la seule source fiable.',
        ),
        li(
          'For payroll treatment of an employer contribution: the tax authority’s employers’ guide to taxable benefits, and your payroll provider.',
          'Pour le traitement en paie d’une cotisation patronale : le guide de l’employeur sur les avantages imposables publié par l’autorité fiscale, et votre fournisseur de paie.',
        ),
        li(
          'For anything about an individual’s own position: a licensed adviser they choose. Not you, and not this guide.',
          'Pour toute question portant sur la situation personnelle d’un individu : un conseiller autorisé qu’il choisit lui-même. Pas vous, et pas ce guide.',
        ),
      ],
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'A group retirement savings plan in Ontario is not covered by the Pension Benefits Act — that statute and its regulator apply to registered pension plans, so the funding, locking-in and wind-up protections employees may assume are absent here. The obligation that does apply is the ordinary one: a contribution deducted from pay needs the employee’s written authorization under the Employment Standards Act, 2000, and enrolment paperwork is what supplies it. Ontario does not require an employer to offer a retirement savings arrangement at all.',
      fr: 'En Ontario, un régime collectif d’épargne-retraite n’est pas visé par la Loi sur les régimes de retraite — cette loi et son organisme de surveillance s’appliquent aux régimes de retraite agréés, de sorte que les protections de capitalisation, d’immobilisation et de liquidation que les employés pourraient présumer sont absentes ici. L’obligation qui s’applique est l’obligation ordinaire : une cotisation retenue sur la paie exige l’autorisation écrite de l’employé sous la Loi de 2000 sur les normes d’emploi, et les documents d’adhésion en tiennent lieu. L’Ontario n’oblige aucunement un employeur à offrir un régime d’épargne-retraite.',
    },
    QC: {
      en: 'Québec is the one jurisdiction here where offering something can be mandatory: the Voluntary Retirement Savings Plans Act requires an employer above a headcount set by that Act, and without an existing qualifying plan, to make a voluntary retirement savings plan available and to enrol eligible employees, who may then opt out. Check Retraite Québec for the current threshold and duties rather than assuming you are below it. Two further Québec differences: the contribution deduction is claimed on both the federal and the Québec return, since Québec administers its own income tax; and a written payroll authorization under the Act respecting labour standards is generally revocable, though not where it relates to a pension plan or insurance.',
      fr: 'Le Québec est la seule juridiction ici où offrir un régime peut être obligatoire : la Loi sur les régimes volontaires d’épargne-retraite oblige l’employeur qui dépasse un seuil d’effectif fixé par cette loi, et qui n’offre pas déjà un régime admissible, à rendre disponible un régime volontaire d’épargne-retraite et à y inscrire les employés admissibles, lesquels peuvent ensuite s’en retirer. Consultez Retraite Québec pour le seuil et les obligations en vigueur plutôt que de présumer y échapper. Deux autres particularités québécoises : la déduction de la cotisation se réclame à la fois dans la déclaration fédérale et dans la déclaration québécoise, le Québec administrant son propre impôt sur le revenu ; et l’autorisation écrite de retenue sur la paie prévue par la Loi sur les normes du travail est généralement révocable, sauf lorsqu’elle porte sur un régime de retraite ou d’assurance.',
    },
    FED: {
      en: 'The accounts themselves are federal tax vehicles and do not change for a federally regulated employer — but the pension side does. A registered pension plan offered by a federally regulated employer falls under the Pension Benefits Standards Act, 1985 and its federal regulator rather than provincial pension legislation, and the federal pooled registered pension plan framework is available as a middle option. A group savings plan is none of those, and describing it as a pension is the same error here as anywhere. Payroll deductions for it are governed by the Canada Labour Code, Part III, which requires the employee’s written authorization.',
      fr: 'Les régimes eux-mêmes sont des véhicules fiscaux fédéraux et ne changent pas pour un employeur de compétence fédérale — mais le volet retraite, lui, change. Un régime de retraite agréé offert par un employeur de compétence fédérale relève de la Loi de 1985 sur les normes de prestation de pension et de son organisme fédéral de surveillance plutôt que de la législation provinciale sur les régimes de retraite, et le cadre fédéral des régimes de pension agréés collectifs constitue une option intermédiaire. Un régime collectif d’épargne n’est aucun de ces véhicules, et le qualifier de régime de retraite constitue ici la même erreur qu’ailleurs. Les retenues sur la paie à ce titre sont régies par le Code canadien du travail, Partie III, qui exige l’autorisation écrite de l’employé.',
    },
  },
}
