import { bi } from '@/i18n/core'
import { contrast, li, p } from '../guideModel'
import type { ReferenceGuide } from '../guideModel'

/**
 * Ring 4, Compensation & Financial Literacy — the pay stub guide
 * (docs/FOUR_RING_FRAMEWORK.md). All FR is [FR self-authored].
 *
 * **Figure-free, under the rule the parental leave guide set.** Nearly
 * everything a reader might want a number for here — contribution rates,
 * maximums, exemptions, tax brackets — is set annually and changes every
 * January. A guide carrying them is a guide someone has to re-audit each year,
 * and the year nobody does is the year an employer explains a deduction using
 * last year's rate.
 *
 * What does not go stale is the structure: which deductions are required and
 * which need permission, what the statement has to show, and which of the two
 * mistakes below an employer is about to make.
 *
 * **Employer-side, like the rest of the reference set.** The reader is the HR
 * operator who has to answer "why is my net pay lower this month?", not the
 * employee asking. That framing is what keeps this a compliance guide rather
 * than the financial advice the RRSP/TFSA guide is careful not to give.
 */
export const payStatementGuide: ReferenceGuide = {
  slug: 'pay-statement',
  ring: 4,
  jurisdictions: ['ON', 'QC', 'FED'],
  readingMinutes: 8,
  title: bi(
    'Reading a pay statement, and explaining one',
    'Lire un bulletin de paie, et l’expliquer',
  ),
  summary: bi(
    'What the statement must show, which deductions you may make and which you may not, and the questions you will actually be asked.',
    'Ce que le bulletin doit indiquer, les retenues que vous pouvez faire et celles que vous ne pouvez pas, et les questions qu’on vous posera réellement.',
  ),
  tag: bi('Pay · All jurisdictions', 'Paie · Toutes les juridictions'),
  relatedTemplates: ['T45', 'T46', 'T26'],
  sections: [
    {
      heading: bi('Gross, deductions, net', 'Brut, retenues, net'),
      blocks: [
        p(
          'Every pay statement is the same three-part arithmetic, however it is laid out: what was earned this period, what was taken off, and what was paid. Most confusion is not about the arithmetic. It is about which line belongs in which part.',
          'Tout bulletin de paie repose sur la même arithmétique en trois temps, quelle qu’en soit la présentation : ce qui a été gagné pendant la période, ce qui en a été retranché, et ce qui a été versé. La confusion porte rarement sur l’arithmétique. Elle porte sur la partie à laquelle appartient chaque ligne.',
        ),
        li(
          'Earnings are more than salary. Overtime, premiums, commission, bonus, vacation pay and public holiday pay are separate lines because they are separately regulated, not because payroll likes detail.',
          'La rémunération ne se limite pas au salaire. Heures supplémentaires, primes, commissions, bonis, indemnité de vacances et indemnité de jour férié figurent sur des lignes distinctes parce qu’ils sont réglementés séparément, et non par goût du détail.',
        ),
        li(
          'A taxable benefit sits in the earnings side even though no money was paid. It raises the amount tax is calculated on, which is why adding a benefit can lower someone’s net pay — the single most common "my pay was cut" call.',
          'Un avantage imposable figure du côté de la rémunération même si aucune somme n’a été versée. Il augmente le montant sur lequel l’impôt est calculé, ce qui explique qu’ajouter un avantage puisse réduire la paie nette — l’appel « on m’a coupé ma paie » le plus fréquent.',
        ),
        li(
          'Net pay is a result, not a rate. Nobody is owed a particular net figure, which is worth saying plainly before you are asked to restore one.',
          'La paie nette est un résultat, non un taux. Personne n’a droit à un montant net précis, ce qu’il vaut mieux dire clairement avant qu’on vous demande de le rétablir.',
        ),
        p(
          'Year-to-date columns are the part employees ignore and you should not. They are where an error shows up as a pattern rather than a one-off, and where a stub and a year-end slip stop agreeing.',
          'Les colonnes cumulatives sont la partie que les employés ignorent et que vous ne devriez pas ignorer. C’est là qu’une erreur se révèle comme une tendance plutôt qu’un incident isolé, et là où un bulletin et un feuillet de fin d’année cessent de concorder.',
        ),
      ],
    },
    {
      heading: bi('The statement is a legal obligation', 'Le bulletin est une obligation légale'),
      blocks: [
        p(
          'All three jurisdictions Dutiva covers require a written statement of wages at the time of payment, and all three specify what it has to contain. This is a standards obligation with its own enforcement, not a courtesy of your payroll provider.',
          'Les trois juridictions couvertes par Dutiva exigent un état de paie écrit au moment du versement, et toutes trois précisent ce qu’il doit contenir. Il s’agit d’une obligation en matière de normes, assortie de ses propres mécanismes d’application, et non d’une courtoisie de votre fournisseur de paie.',
        ),
        li(
          'The pay period the statement covers, the wage rate where there is one, and the hours the pay was calculated on.',
          'La période de paie visée, le taux de salaire lorsqu’il en existe un, et les heures ayant servi au calcul.',
        ),
        li(
          'Gross wages, each deduction shown separately with what it is for, and net pay.',
          'Le salaire brut, chaque retenue indiquée séparément avec son objet, et la paie nette.',
        ),
        li(
          'Amounts that are wages but not ordinary wages — overtime, vacation pay, a bonus — identified for what they are rather than folded into one figure.',
          'Les sommes qui sont un salaire sans être un salaire ordinaire — heures supplémentaires, indemnité de vacances, boni — désignées pour ce qu’elles sont plutôt que fondues en un seul montant.',
        ),
        p(
          'Look up your own jurisdiction’s list before you assume your provider’s default template satisfies it. Providers are configured for the country, and the required particulars are not identical across the three.',
          'Consultez la liste propre à votre juridiction avant de présumer que le gabarit par défaut de votre fournisseur y satisfait. Les fournisseurs sont configurés à l’échelle du pays, et les mentions obligatoires ne sont pas identiques dans les trois juridictions.',
        ),
        contrast(
          bi(
            'Deduction — group benefits premium, employee share: itemised, named, and traceable to something the employee signed.',
            'Retenue — prime d’assurance collective, part de l’employé : détaillée, nommée, et rattachable à un document signé par l’employé.',
          ),
          bi('Deduction — other.', 'Retenue — autre.'),
        ),
      ],
    },
    {
      heading: bi('Two kinds of deduction', 'Deux types de retenues'),
      blocks: [
        p(
          'The distinction that matters more than any other on this page: some deductions you are required to make, and some you may make only with permission. Treating the second kind like the first is the most common wage complaint there is.',
          'La distinction la plus importante de cette page : certaines retenues sont obligatoires, d’autres ne peuvent être faites qu’avec une autorisation. Traiter les secondes comme les premières est à l’origine de la plainte salariale la plus fréquente.',
        ),
        p(
          'Required by law: income tax withheld at source, contributions to the public pension plan, and employment insurance premiums — plus, in Québec, the provincial parental insurance premium and Québec’s own income tax. You remit these; they are not yours, and the employee cannot waive them.',
          'Exigées par la loi : l’impôt sur le revenu retenu à la source, les cotisations au régime public de retraite et les cotisations d’assurance-emploi — auxquelles s’ajoutent, au Québec, la cotisation au régime provincial d’assurance parentale et l’impôt québécois. Vous les remettez; elles ne vous appartiennent pas, et l’employé ne peut y renoncer.',
        ),
        p(
          'Everything else needs authority: a statute, a court order, a collective agreement, or the employee’s own written authorization for a stated purpose. Verbal agreement is not authorization, and a blanket line in an offer letter permitting "any amounts owing" is not a stated purpose.',
          'Tout le reste exige un fondement : une loi, une ordonnance judiciaire, une convention collective, ou l’autorisation écrite de l’employé pour un objet déterminé. Un accord verbal ne constitue pas une autorisation, et une clause générale d’une lettre d’offre permettant de retenir « toute somme due » ne constitue pas un objet déterminé.',
        ),
        li(
          'Written authorization has limits even when you have it. All three jurisdictions restrict deducting for faulty work or for cash shortages and lost property, particularly where anyone other than the employee had access.',
          'L’autorisation écrite comporte des limites, même lorsque vous l’avez. Les trois juridictions restreignent les retenues pour travail défectueux ainsi que pour manques d’encaisse et pertes de biens, en particulier lorsqu’une personne autre que l’employé y avait accès.',
        ),
        li(
          'In Québec an authorization is revocable — the employee can withdraw it, and the deduction stops.',
          'Au Québec, l’autorisation est révocable : l’employé peut la retirer, et la retenue cesse.',
        ),
        li(
          'Unreturned equipment is not a deduction. It is a debt, and it is collected the way debts are.',
          'Un équipement non rendu ne justifie pas une retenue. Il s’agit d’une créance, qui se recouvre comme telle.',
        ),
        contrast(
          bi(
            'We overpaid you last period. Here is the calculation, here is what we propose to recover and over how long, and we need your agreement in writing before anything comes off.',
            'Nous vous avons versé un montant excédentaire à la dernière période. Voici le calcul, voici ce que nous proposons de récupérer et sur quelle durée, et il nous faut votre accord écrit avant toute retenue.',
          ),
          bi(
            'We overpaid you last period, so we took it back off this one.',
            'Nous vous avions trop payé, alors nous l’avons repris sur cette paie.',
          ),
        ),
        p(
          'Recovering a genuine overpayment is usually possible. Doing it unilaterally, in one instalment, without notice, is where an ordinary payroll error becomes a complaint — and the employee’s objection is rarely that they should keep the money.',
          'Récupérer un trop-payé véritable est généralement possible. Le faire unilatéralement, en un seul versement et sans préavis, est ce qui transforme une simple erreur de paie en plainte — et l’objection de l’employé porte rarement sur le fait qu’il devrait garder la somme.',
        ),
      ],
    },
    {
      heading: bi('Your cost is not their deduction', 'Votre coût n’est pas leur retenue'),
      blocks: [
        p(
          'For the public pension plan and employment insurance you pay an employer portion alongside the employee’s. That portion is a real cost to you and it is not on their statement, because it was never their money.',
          'Pour le régime public de retraite et l’assurance-emploi, vous versez une part patronale en plus de celle de l’employé. Cette part représente un coût réel pour vous et ne figure pas sur son bulletin, parce qu’elle n’a jamais constitué son argent.',
        ),
        li(
          'Put employer contributions in a total compensation summary if you want credit for them. Do not put them on the pay statement, where they read as something taken from the employee.',
          'Présentez les contributions de l’employeur dans un sommaire de rémunération globale si vous souhaitez qu’elles soient reconnues. Ne les inscrivez pas sur le bulletin de paie, où elles se lisent comme une somme prélevée sur l’employé.',
        ),
        li(
          'Keep the two separate in conversation too. An employee who is told their deduction is higher than it is will check, and you will have spent credibility on nothing.',
          'Gardez aussi les deux distincts dans vos échanges. L’employé à qui l’on dit que sa retenue est plus élevée qu’elle ne l’est vérifiera, et vous aurez dilapidé votre crédibilité pour rien.',
        ),
      ],
    },
    {
      heading: bi('The calls you will actually get', 'Les appels que vous recevrez vraiment'),
      blocks: [
        li(
          '"My net pay dropped and nothing changed." Usually a taxable benefit added, a year-to-date threshold reached or passed, or a pay period with a different number of working days.',
          '« Ma paie nette a baissé et rien n’a changé. » Généralement un avantage imposable ajouté, un seuil cumulatif atteint ou franchi, ou une période de paie comptant un nombre différent de jours ouvrables.',
        ),
        li(
          '"My deductions stopped." Annual maximums exist for the pension and insurance contributions, so someone who reaches one sees their net pay rise mid-year and fall again in January. Explain it as a maximum reached, without quoting the maximum.',
          '« Mes retenues ont cessé. » Des maximums annuels s’appliquent aux cotisations de retraite et d’assurance : la personne qui les atteint voit sa paie nette augmenter en cours d’année et redescendre en janvier. Expliquez-le comme un maximum atteint, sans citer le maximum.',
        ),
        li(
          '"I owed tax at filing, so payroll deducted wrong." Withholding is an estimate based on what that employer pays. Second jobs, other income and a partner’s claim all sit outside it, and the reconciliation is the tax return.',
          '« J’avais un solde d’impôt à payer, la paie a donc mal retenu. » La retenue à la source est une estimation fondée sur ce que verse cet employeur. Deuxième emploi, autres revenus et crédits réclamés par le conjoint échappent à ce calcul, et la conciliation se fait par la déclaration de revenus.',
        ),
        li(
          '"Why is my bonus taxed so heavily?" A lump sum is withheld on differently from salary. It is a withholding method, not a higher tax rate, and it comes out in the wash at filing.',
          '« Pourquoi mon boni est-il autant imposé? » Une somme forfaitaire fait l’objet d’une retenue calculée autrement que sur le salaire. Il s’agit d’une méthode de retenue et non d’un taux d’imposition supérieur, et l’écart se résorbe à la déclaration.',
        ),
        li(
          'Point to the tax authority for anything that is genuinely about the employee’s own tax position. You administer withholding; you do not advise on their return.',
          'Renvoyez à l’autorité fiscale toute question qui relève véritablement de la situation fiscale personnelle de l’employé. Vous administrez la retenue à la source; vous ne conseillez pas sur sa déclaration.',
        ),
        contrast(
          bi(
            'That is a maximum being reached — the deduction resumes in January. If you want to know how it affects your return, the tax authority publishes the current figures.',
            'Il s’agit d’un maximum atteint — la retenue reprendra en janvier. Pour savoir comment cela influe sur votre déclaration, l’autorité fiscale publie les montants à jour.',
          ),
          bi(
            'You should be fine — most people in your bracket get that back.',
            'Ça devrait aller — la plupart des gens dans votre tranche récupèrent ce montant.',
          ),
        ),
      ],
    },
    {
      heading: bi('Records, and the year-end slip', 'Les registres, et le feuillet de fin d’année'),
      blocks: [
        p(
          'The statement is one record among several, and they have to agree. Keep the payroll records your standards legislation requires for the period it requires, and keep them retrievable rather than merely stored.',
          'Le bulletin n’est qu’un registre parmi d’autres, et ils doivent concorder. Conservez les registres de paie exigés par votre loi sur les normes, pour la durée qu’elle prévoit, et gardez-les accessibles plutôt que simplement archivés.',
        ),
        li(
          'A year-end slip reports the year; a pay statement reports a period. When an employee says they disagree, the year-to-date column is where you look first.',
          'Le feuillet de fin d’année vise l’année; le bulletin vise une période. Lorsqu’un employé conteste, la colonne cumulative est le premier endroit à examiner.',
        ),
        li(
          'A Record of Employment draws on the same records again. An error left uncorrected on a stub follows the employee into a benefit claim.',
          'Le relevé d’emploi puise dans les mêmes registres. Une erreur laissée sans correction sur un bulletin suit l’employé jusque dans sa demande de prestations.',
        ),
        li(
          'Correct errors in the period you find them and say so on the statement. A silent adjustment looks like a second error.',
          'Corrigez les erreurs dans la période où vous les découvrez et indiquez-le sur le bulletin. Un ajustement silencieux a l’air d’une seconde erreur.',
        ),
      ],
    },
    {
      heading: bi('Where the numbers are', 'Où trouver les chiffres'),
      blocks: [
        p(
          'This guide states no rates, maximums, exemptions or thresholds. They are set annually, they differ between the federal and Québec systems, and a figure repeated here would be one nobody re-audits each January.',
          'Le présent guide n’énonce aucun taux, maximum, exemption ni seuil. Ces éléments sont fixés annuellement, diffèrent entre le régime fédéral et celui du Québec, et un chiffre repris ici serait un chiffre que personne ne réviserait chaque janvier.',
        ),
        li(
          'For withholding, contribution rates and maximums: the Canada Revenue Agency’s current payroll deductions tables, and Revenu Québec’s for Québec employees.',
          'Pour la retenue à la source, les taux de cotisation et les maximums : les tables de retenues à la source à jour de l’Agence du revenu du Canada, et celles de Revenu Québec pour les employés du Québec.',
        ),
        li(
          'For what the statement must contain and what may be deducted: your employment standards act, or the Canada Labour Code if you are federally regulated.',
          'Pour le contenu obligatoire du bulletin et les retenues permises : votre loi sur les normes du travail, ou le Code canadien du travail si vous êtes de compétence fédérale.',
        ),
        li(
          'Check at the time you are answering, and check the year. Most payroll answers that turn out to be wrong were right twelve months earlier.',
          'Vérifiez au moment où vous répondez, et vérifiez l’année. La plupart des réponses de paie qui se révèlent fausses étaient exactes douze mois plus tôt.',
        ),
      ],
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'The Employment Standards Act, 2000 sets both halves of this: the particulars a wage statement must contain, and the rule that wages may not be deducted except as authorized by statute, court order or the employee’s written authorization. Ontario expressly narrows that authorization — it does not permit deducting for faulty work, nor for a cash shortage or lost property where a person other than the employee had access to the money or goods. Deductions run to the federal Canada Pension Plan and Employment Insurance, and income tax is withheld once, federally.',
      fr: 'La Loi de 2000 sur les normes d’emploi encadre les deux volets : les mentions obligatoires de l’état de paie, et la règle voulant qu’aucune retenue ne soit faite sur le salaire sauf autorisation légale, ordonnance judiciaire ou autorisation écrite de l’employé. L’Ontario restreint expressément cette autorisation : elle ne permet pas de retenir pour travail défectueux, ni pour un manque d’encaisse ou une perte de biens lorsqu’une personne autre que l’employé avait accès à l’argent ou aux biens. Les retenues sont versées au Régime de pensions du Canada et à l’assurance-emploi fédéraux, et l’impôt sur le revenu est retenu une seule fois, au fédéral.',
    },
    QC: {
      en: 'Québec statements carry more lines than the others, and for structural reasons rather than provider preference. Employees contribute to the Québec Pension Plan instead of the Canada Pension Plan, pay a Québec Parental Insurance Plan premium alongside a reduced Employment Insurance premium, and have income tax withheld twice — federally and provincially. The Act respecting labour standards sets out what the pay sheet must show and confines deductions to those required by law, a court order, a collective agreement or pension plan, or the employee’s written authorization for a specific purpose — and that authorization may be revoked at any time except where it relates to a pension plan or insurance.',
      fr: 'Les bulletins québécois comptent plus de lignes que les autres, pour des raisons structurelles et non par préférence du fournisseur. Les employés cotisent au Régime de rentes du Québec plutôt qu’au Régime de pensions du Canada, versent une cotisation au Régime québécois d’assurance parentale en plus d’une cotisation d’assurance-emploi réduite, et subissent une double retenue d’impôt — fédérale et provinciale. La Loi sur les normes du travail précise le contenu du bulletin de paie et limite les retenues à celles requises par la loi, une ordonnance judiciaire, une convention collective ou un régime de retraite, ou encore autorisées par écrit par l’employé pour un objet déterminé — autorisation révocable en tout temps, sauf lorsqu’elle porte sur un régime de retraite ou d’assurance.',
    },
    FED: {
      en: 'Federally regulated employers take the statement and deduction rules from the Canada Labour Code, Part III rather than from any provincial act — including for employees working in Québec, whose income tax and pension deductions still follow the province of employment. The Code permits deductions required by law, by court order or by a collective agreement, amounts an employer has overpaid, and other amounts authorized in writing; deductions for damage or loss are confined to cases where the employee was solely responsible, which is narrower than a written authorization on its own.',
      fr: 'Les employeurs de compétence fédérale tirent les règles relatives au bulletin et aux retenues du Code canadien du travail, Partie III plutôt que d’une loi provinciale — y compris pour les employés travaillant au Québec, dont les retenues d’impôt et de retraite suivent néanmoins la province d’emploi. Le Code permet les retenues exigées par la loi, par ordonnance judiciaire ou par convention collective, les sommes versées en trop par l’employeur, ainsi que les autres sommes autorisées par écrit ; les retenues pour dommage ou perte sont limitées aux cas où l’employé en est seul responsable, ce qui est plus restreint qu’une simple autorisation écrite.',
    },
  },
}
