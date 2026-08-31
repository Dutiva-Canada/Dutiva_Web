import type { PolicyEdition } from '../policyContent'

export default {
  title: 'AI Usage Disclosure',
  lastUpdated: 'June 1, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'Dutiva uses AI to support HR compliance workflows, document generation, and practical employer guidance. AI outputs are general workflow support and drafting assistance only. They are not legal advice, do not replace human judgment, and should not be used as the sole basis for workplace decisions.',
  ],
  sections: [
    {
      title: '1. Purpose and Relationship to Other Policies',
      blocks: [
        {
          type: 'p',
          text: 'This Disclosure explains, in user-facing terms, how Dutiva may use artificial intelligence to support HR compliance workflows, document generation, and practical employer guidance.',
        },
        {
          type: 'p',
          text: 'It is intended to complement, not duplicate, the AI & Technology Policy. The AI & Technology Policy describes current model routing, provider stack, and technical controls in more detail. This Disclosure focuses on user responsibilities, AI limits, human review, and the practical meaning of AI-assisted outputs.',
        },
        {
          type: 'p',
          text: 'This Disclosure should be read with Dutiva’s Privacy Policy, Terms of Service, Legal Disclaimer, AI & Technology Policy, Data Processing Agreement, and Data Retention and Deletion Policy, as applicable.',
        },
      ],
    },
    {
      title: '2. Where Dutiva Uses AI',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may use AI in the following product and operational areas:',
        },
        {
          type: 'li',
          text: 'Advisor: conversational HR compliance guidance, suggested next steps, risk flags, and suggested documents.',
        },
        {
          type: 'li',
          text: 'Document workflows: drafting support, contextual suggestions, generated text, and structured document assistance based on user inputs, templates, and selected workflow context.',
        },
        {
          type: 'li',
          text: 'Compliance review and issue spotting: summaries, checklist support, consistency flags, and prompts that help users review documents or workflows.',
        },
        {
          type: 'li',
          text: 'Context retrieval and guidance support: retrieval of relevant internal HR guidance context to help ground Advisor responses and workflow suggestions.',
        },
        {
          type: 'li',
          text: 'Internal quality and safety workflows: operational summaries, testing, content improvement, abuse prevention, debugging, and reliability review where personal information is minimized or restricted to what is reasonably necessary.',
        },
      ],
    },
    {
      title: '3. What AI Does Not Do',
      blocks: [
        {
          type: 'p',
          text: 'AI-assisted features in Dutiva are designed to support employer and HR workflows. They do not:',
        },
        {
          type: 'li',
          text: 'provide legal advice, legal opinions, or professional employment-law services;',
        },
        {
          type: 'li',
          text: 'create a solicitor-client, attorney-client, paralegal-client, consultant-client, fiduciary, or other professional advisory relationship;',
        },
        {
          type: 'li',
          text: 'make final employment, termination, accommodation, discipline, hiring, compensation, privacy, payroll, benefits, or workplace safety decisions for customers;',
        },
        {
          type: 'li',
          text: 'guarantee that any response, checklist, draft, clause, template, or generated document complies with every applicable law, contract, policy, collective agreement, language requirement, accessibility requirement, or workplace fact;',
        },
        {
          type: 'li',
          text: 'independently verify all facts, dates, roles, policies, contracts, collective agreements, or workplace context supplied by users; or',
        },
        {
          type: 'li',
          text: 'replace qualified review by legal, HR, payroll, privacy, tax, benefits, safety, or other professional advisors where the matter requires professional judgment.',
        },
      ],
    },
    {
      title: '4. Human Review Required',
      blocks: [
        {
          type: 'p',
          text: 'Users must review AI outputs before sending, signing, storing, exporting, implementing, or relying on them. Dutiva outputs should be treated as starting points for review, not final determinations.',
        },
        {
          type: 'p',
          text: 'Human review is especially important for matters involving:',
        },
        {
          type: 'li',
          text: 'terminations, layoffs, constructive dismissal, severance, common-law notice exposure, or without-cause dismissal risk;',
        },
        {
          type: 'li',
          text: 'accommodation, disability, harassment, violence, reprisal, human rights, or workplace investigation matters;',
        },
        {
          type: 'li',
          text: 'privacy incidents, employee monitoring, cross-border transfers, automated decision-making, or sensitive data processing;',
        },
        {
          type: 'li',
          text: 'pay equity, payroll, tax, pension, benefits, incentive plans, executive compensation, or equity arrangements;',
        },
        {
          type: 'li',
          text: 'unionized workplaces, collective agreements, labour board proceedings, regulated industries, or federally regulated workplaces;',
        },
        {
          type: 'li',
          text: 'any actual or threatened claim, regulator contact, tribunal proceeding, litigation, or matter with significant legal, financial, health, safety, human-rights, or reputational risk.',
        },
      ],
    },
    {
      title: '5. Information AI Features May Use',
      blocks: [
        {
          type: 'p',
          text: 'Depending on the feature and workflow, AI-assisted requests may use limited context needed to produce a useful response. This may include:',
        },
        {
          type: 'li',
          text: 'message text or prompt text submitted by the user;',
        },
        {
          type: 'li',
          text: 'limited recent conversation turns needed to maintain context;',
        },
        {
          type: 'li',
          text: 'the selected province, territory, or applicable federal regime;',
        },
        {
          type: 'li',
          text: 'retrieved HR guidance context and structured workflow notes;',
        },
        {
          type: 'li',
          text: 'document template selections, document inputs, active workflow ID, checklist state, or draft context; and',
        },
        {
          type: 'li',
          text: 'limited workspace context such as organization name, employer size, role, language preference, plan, jurisdiction or coverage context, and relevant workflow settings.',
        },
      ],
    },
    {
      title: '6. Sensitive Information and User Inputs',
      blocks: [
        {
          type: 'p',
          text: 'Users are responsible for controlling what they enter into Dutiva and for ensuring they have the authority, consent, notice, internal policies, and lawful basis required to use Dutiva for that information.',
        },
        {
          type: 'p',
          text: 'Do not submit the following to AI features unless Dutiva expressly provides a controlled workflow for that data type and your organization has a lawful basis to use it:',
        },
        {
          type: 'li',
          text: 'social insurance numbers, government identification numbers, passport numbers, driver’s licence numbers, or similar identifiers;',
        },
        {
          type: 'li',
          text: 'payment card numbers, banking credentials, full billing credentials, or account passwords;',
        },
        {
          type: 'li',
          text: 'medical records, personal health information, disability documentation, or highly sensitive accommodation records;',
        },
        {
          type: 'li',
          text: 'protected legal communications, privileged legal advice, settlement communications, or litigation strategy;',
        },
        {
          type: 'li',
          text: 'union grievance files, workplace investigation records, harassment or violence investigation files, or highly sensitive employee relations files; or',
        },
        {
          type: 'li',
          text: 'other information that is unnecessary for the workflow or could create disproportionate privacy, legal, safety, or reputational risk if processed by an AI provider.',
        },
      ],
    },
    {
      title: '7. Accuracy, Bias, and Current Law',
      blocks: [
        {
          type: 'p',
          text: 'AI systems can produce inaccurate, incomplete, outdated, fabricated, biased, internally inconsistent, or unsuitable content. AI outputs may misunderstand facts, omit exceptions, cite incorrect provisions, rely on outdated legal standards, or make assumptions that do not fit your workplace.',
        },
        {
          type: 'p',
          text: 'Dutiva may provide retrieved guidance context to improve grounding, but retrieval does not guarantee that a response is complete, current, legally sufficient, or appropriate for your circumstances.',
        },
        {
          type: 'p',
          text: 'Users should verify statutory references, effective dates, jurisdictional assumptions, legal thresholds, employee classifications, contract terms, policy requirements, collective agreement obligations, and factual inputs before acting. When in doubt, consult qualified legal or HR professionals.',
        },
      ],
    },
    {
      title: '8. Privacy, Retention, and Model Training',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva does not use customer Advisor prompts or generated HR documents to train third-party foundation models unless a separate written agreement or explicit opt-in provides otherwise.',
        },
        {
          type: 'p',
          text: 'Provider-side processing, logging, abuse monitoring, security review, and retention are governed by applicable provider terms, configurations, and data-processing arrangements. Dutiva aims to use contractual, technical, and operational controls intended to limit unnecessary retention and use of customer content where available.',
        },
        {
          type: 'p',
          text: 'Related practices are described in the Privacy Policy, AI & Technology Policy, Data Processing Agreement, and Data Retention and Deletion Policy.',
        },
      ],
    },
    {
      title: '9. Automated Outputs and Workplace Decisions',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva is designed to assist employers, HR professionals, and authorized users. It is not designed to make decisions based exclusively on automated processing about candidates, employees, contractors, or other individuals.',
        },
        {
          type: 'p',
          text: 'Customers should not use AI outputs as the sole basis for decisions that have legal, disciplinary, employment, privacy, compensation, benefit, accommodation, health, safety, or similarly significant effects on a person.',
        },
        {
          type: 'p',
          text: 'Where an AI-assisted output supports a workplace decision, the customer remains responsible for meaningful human review, fact-checking, documentation, lawful decision-making, and any required notice, explanation, appeal, reconsideration, or review process under applicable law or internal policy.',
        },
      ],
    },
    {
      title: '10. User Responsibilities and Prohibited Uses',
      blocks: [
        {
          type: 'p',
          text: 'Users are responsible for using Dutiva and AI-assisted outputs lawfully and professionally. You must not:',
        },
        {
          type: 'li',
          text: 'use AI outputs to discriminate, harass, retaliate, intimidate, mislead, or otherwise violate employment, human rights, privacy, labour, workplace safety, consumer protection, or other applicable laws;',
        },
        {
          type: 'li',
          text: 'misrepresent AI outputs as legal advice, legal opinions, lawyer-reviewed work product, or final professional advice;',
        },
        {
          type: 'li',
          text: 'use AI outputs without appropriate review in high-risk employment, privacy, health, safety, financial, or legal matters;',
        },
        {
          type: 'li',
          text: 'attempt to extract system prompts, provider secrets, model routing details, hidden instructions, training data, or other users’ information;',
        },
        {
          type: 'li',
          text: 'submit unlawful, malicious, deceptive, infringing, discriminatory, or rights-violating content; or',
        },
        {
          type: 'li',
          text: 'bypass, overload, manipulate, probe, or defeat Dutiva’s security controls, safety controls, access controls, rate limits, or usage limits.',
        },
      ],
    },
    {
      title: '11. Changes to AI Features',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may update AI features, prompts, retrieval sources, context windows, guardrails, output formats, rate limits, model versions, provider routing, and available AI capabilities over time to improve reliability, bilingual support, safety, security, latency, cost, or product quality.',
        },
        {
          type: 'p',
          text: 'Material public-facing changes to AI practices will be reflected in this Disclosure, the AI & Technology Policy, the Privacy Policy, in-product notices, or other appropriate legal pages.',
        },
      ],
    },
    {
      title: '12. Questions',
      blocks: [
        {
          type: 'p',
          text: 'Questions about Dutiva’s AI use can be sent to support@dutiva.ca. Privacy-specific questions can be sent to privacy@dutiva.ca.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
