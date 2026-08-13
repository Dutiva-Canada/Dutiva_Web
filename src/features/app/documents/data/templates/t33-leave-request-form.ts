/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 2, Pillar D (docs/FOUR_RING_FRAMEWORK.md).

   Deliberately one form for every leave type rather than a family of them.
   The information an employer may collect barely differs between a
   bereavement and a medical leave — dates, type, contact preference — and
   what does differ is the evidence rule, which belongs in the jurisdiction
   notes rather than in a separate document per leave. A form per leave type
   is also how an employer ends up asking a bereaved employee to complete
   something designed around a doctor's note. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT33: DocTemplate = {
  id: 'tpl_t33',
  tid: 'T33',
  key: 'leave_request_form',
  kind: 'form',
  category: 'changes',
  core: false,
  name: {
    en: 'Leave request form',
    fr: 'Formulaire de demande de congé',
  },
  desc: {
    en: 'One form for any leave — records the dates, the type, and how to stay in touch, without asking for more than the leave requires.',
    fr: 'Un seul formulaire pour tout congé : dates, type et modalités de contact, sans exiger plus que ce que le congé requiert.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'low',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 4,
  usageCount: 0,
  statutory: [
    {
      en: 'Employment standards — statutory leaves are a right, not a request to approve',
      fr: 'Normes du travail — les congés légaux sont un droit, non une demande à approuver',
    },
    {
      en: 'Reprisal prohibition — taking a leave cannot be held against an employee',
      fr: 'Interdiction de représailles — la prise d’un congé ne peut être reprochée à un employé',
    },
    {
      en: 'Privacy — evidence is limited to what the leave actually requires',
      fr: 'Vie privée — la preuve se limite à ce que le congé exige réellement',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'The Employment Standards Act, 2000 sets the leaves and the notice an employee owes — which is generally as much as is reasonable in the circumstances, not a fixed period. What evidence you may require is limited and has changed in recent years; confirm the current rule for the leave in question before asking.',
      fr: 'La Loi de 2000 sur les normes d’emploi établit les congés et le préavis que doit l’employé(e) — soit généralement ce qui est raisonnable dans les circonstances, et non un délai fixe. La preuve exigible est limitée et a changé ces dernières années ; vérifiez la règle en vigueur pour le congé visé avant de la demander.',
    },
    QC: {
      en: 'The Act respecting labour standards sets the leaves, including those for family or parental obligations, sickness, organ or tissue donation, accident, and domestic or sexual violence. It bars dismissal, suspension or any sanction for taking one, and the form must be available in French.',
      fr: 'La Loi sur les normes du travail établit les congés, notamment pour obligations familiales ou parentales, maladie, don d’organes ou de tissus, accident et violence conjugale ou à caractère sexuel. Elle interdit le congédiement, la suspension ou toute sanction liés à leur prise, et le formulaire doit être disponible en français.',
    },
    FED: {
      en: 'The Canada Labour Code, Part III sets the leaves for federally regulated employers and prohibits dismissal, suspension, demotion or discipline for taking one. Check Part III’s limits on requiring a medical certificate before asking for evidence.',
      fr: 'Le Code canadien du travail, Partie III établit les congés pour les employeurs de compétence fédérale et interdit le congédiement, la suspension, la rétrogradation ou toute mesure disciplinaire liés à leur prise. Vérifiez les limites de la Partie III quant au certificat médical avant d’exiger une preuve.',
    },
  },
  includes: [
    {
      en: 'Type of leave',
      fr: 'Type de congé',
    },
    {
      en: 'Dates and expected return',
      fr: 'Dates et retour prévu',
    },
    {
      en: 'Contact during the leave',
      fr: 'Contact pendant le congé',
    },
    {
      en: 'What continues while away',
      fr: 'Ce qui se poursuit pendant l’absence',
    },
    {
      en: 'Confirmation of the right to return',
      fr: 'Confirmation du droit au retour',
    },
  ],
  questions: [
    {
      id: 'employee_name',
      section: {
        en: 'Employee',
        fr: 'Employé',
      },
      label: {
        en: 'Employee full name',
        fr: 'Nom complet de l’employé(e)',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Full name',
        fr: 'Nom complet',
      },
    },
    {
      id: 'leave_type',
      section: {
        en: 'The leave',
        fr: 'Le congé',
      },
      label: {
        en: 'Type of leave',
        fr: 'Type de congé',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Name the leave as your jurisdiction names it.',
        fr: 'Nommez le congé comme votre juridiction le désigne.',
      },
      hint: {
        en: 'Recording the statutory name matters: it is what determines the protections, the evidence you may ask for, and whether it is paid.',
        fr: 'Consigner l’appellation légale est important : elle détermine les protections, la preuve exigible et le caractère rémunéré ou non du congé.',
      },
    },
    {
      id: 'start_date',
      section: {
        en: 'The leave',
        fr: 'Le congé',
      },
      label: {
        en: 'First day of leave',
        fr: 'Premier jour du congé',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'expected_return',
      section: {
        en: 'The leave',
        fr: 'Le congé',
      },
      label: {
        en: 'Expected return date',
        fr: 'Date de retour prévue',
      },
      type: 'date',
      required: true,
      hint: {
        en: 'An estimate. A leave that runs longer than expected is still the same leave, and the date moving is not a change of plan the employee has to justify.',
        fr: 'Une estimation. Un congé qui se prolonge demeure le même congé, et le report de la date n’est pas un changement que l’employé(e) doit justifier.',
      },
    },
    {
      id: 'contact_preference',
      section: {
        en: 'While away',
        fr: 'Pendant l’absence',
      },
      label: {
        en: 'Contact during the leave',
        fr: 'Contact pendant le congé',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Whether they want to be contacted, how, and about what.',
        fr: 'Souhaitent-ils être contactés, par quel moyen et à quel sujet.',
      },
      hint: {
        en: 'Ask rather than assume. Routine contact during a medical or bereavement leave is one of the ways an employer ends up defending a reprisal claim.',
        fr: 'Demandez plutôt que de présumer. Les contacts routiniers pendant un congé de maladie ou de deuil font partie des situations qui mènent l’employeur à se défendre d’une plainte de représailles.',
      },
    },
    {
      id: 'continuing',
      section: {
        en: 'While away',
        fr: 'Pendant l’absence',
      },
      label: {
        en: 'What continues',
        fr: 'Ce qui se poursuit',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Benefits, pension contributions, service accrual, and any top-up.',
        fr: 'Avantages, cotisations de retraite, accumulation du service et complément salarial le cas échéant.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Leave Request',
        fr: 'Demande de congé',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{employee_name}} · {{today}} · Confidential',
        fr: '{{org}} · {{employee_name}} · {{today}} · Confidentiel',
      },
    },
    {
      type: 'para',
      text: {
        en: 'This records a request by {{employee_name}} for {{leave_type}}, beginning {{start_date}} and expected to end {{expected_return}}.',
        fr: 'Le présent document consigne une demande de {{employee_name}} pour un(e) {{leave_type}}, débutant le {{start_date}} et devant se terminer le {{expected_return}}.',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Where the law gives you this leave, {{org}} is recording it rather than deciding it. You do not need to explain why you need it beyond naming the leave, and you do not need our permission to take what you are entitled to.',
        fr: 'Lorsque la loi vous accorde ce congé, {{org}} le consigne plutôt que de l’autoriser. Vous n’avez pas à en expliquer les motifs au-delà de la désignation du congé, et notre permission n’est pas requise pour prendre ce à quoi vous avez droit.',
      },
      n: 1,
      heading: {
        en: 'What this form is',
        fr: 'Ce qu’est ce formulaire',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{contact_preference}} Outside what is agreed here, {{org}} will not contact you about work while you are away.',
        fr: '{{contact_preference}} En dehors de ce qui est convenu ici, {{org}} ne vous contactera pas au sujet du travail pendant votre absence.',
      },
      n: 2,
      heading: {
        en: 'Staying in touch',
        fr: 'Rester en contact',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{continuing}} For the part of this leave that {{statute}} protects, service continues to accrue for its whole length — that is the statute’s rule, not ours. If we have agreed to time beyond the protected part, what continues during it is what is recorded above, and it continues because {{org}} has agreed to it here.',
        fr: '{{continuing}} Pour la partie du congé que protège {{statute}}, le service continue de s’accumuler pendant toute sa durée — c’est la règle de la loi, non la nôtre. Si nous avons convenu d’une période au-delà de la partie protégée, ce qui se poursuit pendant celle-ci est ce qui est consigné ci-dessus, et s’y poursuit parce que {{org}} s’y engage par les présentes.',
      },
      n: 3,
      heading: {
        en: 'What continues while you are away',
        fr: 'Ce qui se poursuit pendant votre absence',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'At the end of the part of this leave that {{statute}} protects, the statute returns you to the position you left, or to a comparable one if it no longer exists, at no less than the pay you would have been earning. Where we have agreed to time beyond that part, {{org}} commits to the same return. Taking this leave will not be counted against you in any decision {{org}} makes. We will confirm the return in writing before it happens.',
        fr: 'À la fin de la partie du congé que protège {{statute}}, la loi vous fait réintégrer le poste que vous avez quitté ou, s’il n’existe plus, un poste comparable, à une rémunération au moins égale à celle que vous auriez touchée. Lorsque nous avons convenu d’une période au-delà de cette partie, {{org}} s’engage au même retour. La prise de ce congé ne vous sera reprochée dans aucune décision de {{org}}. Nous confirmerons le retour par écrit avant qu’il n’ait lieu.',
      },
      n: 4,
      heading: {
        en: 'Coming back',
        fr: 'Le retour',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Where the leave follows an employment injury, the CNESST process governs the absence and the return, and this form records it rather than replacing it.',
        fr: 'Lorsque le congé fait suite à une lésion professionnelle, le processus de la CNESST régit l’absence et le retour, et le présent formulaire le consigne sans s’y substituer.',
      },
      heading: {
        en: 'Employment injury',
        fr: 'Lésion professionnelle',
      },
      when: {
        juris: 'QC',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This workplace is unionized: the collective agreement may add to these entitlements or set its own notice and top-up terms, and where it does, those apply.',
        fr: 'Ce milieu de travail est syndiqué : la convention collective peut bonifier ces droits ou fixer ses propres modalités de préavis et de complément salarial ; le cas échéant, celles-ci s’appliquent.',
      },
      heading: {
        en: 'Collective agreement',
        fr: 'Convention collective',
      },
      when: {
        union: true,
      },
    },
    {
      type: 'sig',
      roles: [
        {
          en: 'Employee',
          fr: 'Employé(e)',
        },
        {
          en: 'Received by',
          fr: 'Reçu par',
        },
      ],
    },
    {
      type: 'note',
      text: {
        en: 'Do not ask for a reason, a diagnosis, or documentation beyond what the leave actually requires — and check what it requires before asking, because the limits differ by leave and by jurisdiction and have moved recently. What you receive is kept separately from the general personnel file.',
        fr: 'Ne demandez ni motif, ni diagnostic, ni document au-delà de ce que le congé exige réellement — et vérifiez cette exigence avant de demander, car les limites varient selon le congé et la juridiction et ont changé récemment. Ce que vous recevez est conservé séparément du dossier d’employé général.',
      },
      tone: 'risk',
    },
    {
      type: 'note',
      tone: 'info',
      text: {
        en: 'Generated from your answers as a starting point.',
        fr: 'Généré à partir de vos réponses comme point de départ.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: DOC_DISCLAIMER_NOTE,
    },
  ],
  subject: 'employee',
}
