import { bi } from '@/i18n/core'
import type { Flow } from '../flowModel'

/**
 * Deadline / milestone tracker — temporary layoff awareness (TODO.md EF11,
 * handoff T32). All FR is [FR self-authored].
 *
 * Describes process shape and primary-source hedges. Does **not** hardcode
 * duration caps (e.g. Ontario week limits) — those differ by jurisdiction,
 * benefit continuation, and statute amendments. T32's jurisdiction notes
 * already speak in shapes, not invented counts.
 */

export const temporaryLayoffAwarenessFlow: Flow = {
  slug: 'temporary-layoff-awareness',
  ring: 1,
  jurisdictions: ['ON', 'QC', 'FED'],
  estMinutes: 6,
  title: bi('Temporary layoff awareness', 'Sensibilisation — mise à pied temporaire'),
  summary: bi(
    'Check contractual right, statutory duration caps, and deemed-termination traps before you issue a temporary layoff — confirm limits against the statute, not against memory.',
    'Vérifiez le droit contractuel, les plafonds de durée légaux et les pièges de cessation réputée avant une mise à pied temporaire — confirmez les limites dans la loi, pas de mémoire.',
  ),
  start: 'jurisdiction',
  steps: [
    {
      id: 'jurisdiction',
      kind: 'choice',
      title: bi(
        'Which employment standards statute covers this role?',
        'Quelle loi sur les normes d’emploi couvre ce poste?',
      ),
      body: bi(
        'Temporary layoff rules and duration caps differ by jurisdiction. Name the statute before you set an end date.',
        'Les règles de mise à pied temporaire et les plafonds de durée diffèrent selon la compétence. Nommez la loi avant de fixer une date de fin.',
      ),
      caution: bi(
        'Permission in the statute is not a contractual right to lay off. Absent a contract clause or established past practice, a layoff can be constructive dismissal from day one. Dutiva does not provide legal advice.',
        'L’autorisation prévue par la loi n’est pas un droit contractuel de mise à pied. Sans clause ou pratique établie, une mise à pied peut être un congédiement déguisé dès le premier jour. Dutiva ne fournit pas de conseils juridiques.',
      ),
      options: [
        {
          id: 'on',
          label: bi(
            'Ontario — Employment Standards Act, 2000',
            'Ontario — Loi de 2000 sur les normes d’emploi',
          ),
          to: 'contract_on',
        },
        {
          id: 'qc',
          label: bi(
            'Québec — Act respecting labour standards',
            'Québec — Loi sur les normes du travail',
          ),
          to: 'contract_qc',
        },
        {
          id: 'fed',
          label: bi(
            'Federal — Canada Labour Code Part III',
            'Fédéral — Code canadien du travail, Partie III',
          ),
          to: 'contract_fed',
        },
      ],
    },
    {
      id: 'contract_on',
      kind: 'task',
      title: bi(
        'Ontario — contract first, then the ESA cap',
        'Ontario — le contrat d’abord, puis le plafond LNE',
      ),
      body: bi(
        'Confirm you may impose a temporary layoff at all, then confirm how long the ESA currently allows before it becomes a termination.',
        'Confirmez que vous pouvez imposer une mise à pied temporaire, puis confirmez combien de temps la LNE permet actuellement avant qu’elle ne devienne une cessation.',
      ),
      points: [
        bi(
          'Read the employment agreement and past practice for a temporary-layoff right. The ESA alone does not create that right.',
          'Lisez le contrat de travail et la pratique antérieure pour un droit de mise à pied temporaire. La LNE seule ne crée pas ce droit.',
        ),
        bi(
          'On the official ESA text or ministry guidance, confirm the current temporary-layoff duration rules — including any longer cap where benefits or certain payments continue. Do not invent a week count from this workflow.',
          'Dans le texte officiel de la LNE ou les consignes du ministère, confirmez les règles actuelles de durée de mise à pied temporaire — y compris tout plafond plus long lorsque les avantages ou certains versements se poursuivent. N’inventez pas un nombre de semaines à partir de ce processus.',
        ),
        bi(
          'Past the statutory cap the employment is terminated by operation of the Act; notice and severance are often calculated from the first day of the layoff — not from the day you noticed. Confirm before setting a recall date.',
          'Au-delà du plafond légal, l’emploi prend fin par l’effet de la Loi; le préavis et l’indemnité se calculent souvent à compter du premier jour de la mise à pied — non du jour où vous vous en apercevez. Confirmez avant de fixer une date de rappel.',
        ),
      ],
      to: 'issue',
    },
    {
      id: 'contract_qc',
      kind: 'task',
      title: bi(
        'Québec — contract, LNT duration, and good faith',
        'Québec — contrat, durée LNT et bonne foi',
      ),
      body: bi(
        'Confirm authority to lay off, then confirm when a layoff triggers termination notice under the LNT.',
        'Confirmez le pouvoir de mise à pied, puis confirmez quand une mise à pied déclenche le préavis de cessation sous la LNT.',
      ),
      points: [
        bi(
          'Confirm contractual or practice authority to impose a temporary layoff. Civil Code good-faith obligations apply to how the layoff is imposed and communicated.',
          'Confirmez l’autorité contractuelle ou par pratique d’imposer une mise à pied temporaire. Les obligations de bonne foi du Code civil s’appliquent à la manière dont la mise à pied est imposée et communiquée.',
        ),
        bi(
          'On the official LNT text, confirm when a layoff of a given duration requires the notice a termination requires, assessed from the layoff itself. Do not invent a duration from this workflow.',
          'Dans le texte officiel de la LNT, confirmez quand une mise à pied d’une durée donnée exige le préavis requis pour une cessation, apprécié à compter de la mise à pied elle-même. N’inventez pas une durée à partir de ce processus.',
        ),
      ],
      to: 'issue',
    },
    {
      id: 'contract_fed',
      kind: 'task',
      title: bi(
        'Federal — Part III conditions for a non-termination layoff',
        'Fédéral — conditions de la Partie III pour une mise à pied non constitutive de cessation',
      ),
      body: bi(
        'Confirm authority to lay off, then confirm when Part III still treats the layoff as not a termination.',
        'Confirmez le pouvoir de mise à pied, puis confirmez quand la Partie III traite encore la mise à pied comme non constitutive de cessation.',
      ),
      points: [
        bi(
          'Confirm contractual or practice authority. Statute permission is not enough on its own.',
          'Confirmez l’autorité contractuelle ou par pratique. L’autorisation légale ne suffit pas à elle seule.',
        ),
        bi(
          'On the Canada Labour Code Part III and its regulations, confirm the current conditions that turn on duration, recall arrangements, and benefit continuation. Where they are not met, the layoff is a termination and Part III notice applies. Do not invent those thresholds here.',
          'Dans la Partie III du Code canadien du travail et ses règlements, confirmez les conditions actuelles liées à la durée, aux modalités de rappel et au maintien des avantages. Lorsqu’elles ne sont pas remplies, la mise à pied constitue une cessation et le préavis de la Partie III s’applique. N’inventez pas ces seuils ici.',
        ),
      ],
      to: 'issue',
    },
    {
      id: 'issue',
      kind: 'task',
      title: bi(
        'Set recall, benefits, and selection on the record',
        'Consigner rappel, avantages et sélection',
      ),
      body: bi(
        'What continues during the layoff belongs in the notice — ambiguity becomes a dispute.',
        'Ce qui se poursuit pendant la mise à pied appartient à l’avis — l’ambiguïté devient un litige.',
      ),
      points: [
        bi(
          'State the layoff start, expected recall (or that it is unknown), and what pay or benefits continue.',
          'Indiquez le début de la mise à pied, le rappel prévu (ou qu’il est inconnu) et ce qui se poursuit en paie ou avantages.',
        ),
        bi(
          'Record why this role was selected and that the selection was non-discriminatory under human rights legislation.',
          'Consignez pourquoi ce poste a été retenu et que la sélection est exempte de discrimination sous la législation sur les droits de la personne.',
        ),
        bi(
          'Diary the statutory duration you confirmed so someone notices before a deemed termination date.',
          'Inscrivez au calendrier la durée légale confirmée pour qu’on s’en aperçoive avant une date de cessation réputée.',
        ),
      ],
      to: 'done',
    },
    {
      id: 'done',
      kind: 'outcome',
      tone: 'caution',
      title: bi('Draft the temporary layoff notice', 'Rédigez l’avis de mise à pied temporaire'),
      body: bi(
        'Document Studio T32 is the individual temporary-layoff notice. Enter the duration and recall facts you confirmed from the statute and contract — the template does not invent jurisdiction caps for you.',
        'Le T32 du Studio de documents est l’avis de mise à pied temporaire individuelle. Inscrivez la durée et le rappel que vous avez confirmés dans la loi et le contrat — le modèle n’invente pas les plafonds de compétence à votre place.',
      ),
      documents: ['T32'],
    },
  ],
}
