import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Legal Disclaimer',
  lastUpdated: 'June 1, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'Important Notice. Dutiva is a software platform, not a law firm. Dutiva content, workflows, document templates, calculators, checklists, risk flags, compliance scores, and AI-generated responses are provided for general HR compliance support and workflow assistance only. They are not legal advice, legal opinions, or a substitute for advice from a qualified lawyer or other appropriate professional.',
    "This Disclaimer should be read together with Dutiva’s Terms of Service, Privacy Policy, AI Usage Disclosure, and any applicable Data Processing Agreement.",
  ],
  sections: [
    {
      title: '1. No Legal Advice',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva provides practical HR workflow support, compliance-oriented information, document drafting tools, and AI-assisted guidance. Dutiva does not provide legal advice, legal opinions, representation, advocacy, or professional services reserved to lawyers, paralegals, or other regulated professionals.',
        },
        {
          type: 'p',
          text: 'Employment standards, privacy, labour, human rights, occupational health and safety, tax, benefits, payroll, pension, and workplace obligations vary by province, federal regime, industry, contract, policy, collective agreement, and fact pattern. You are responsible for confirming how any law, rule, requirement, entitlement, deadline, or document applies to your organization.',
        },
      ],
    },
    {
      title: '2. No Solicitor-Client or Professional Relationship',
      blocks: [
        {
          type: 'p',
          text: 'Using Dutiva, contacting Dutiva support, generating documents, or asking the Advisor questions does not create a solicitor-client, attorney-client, paralegal-client, consultant-client, fiduciary, or other professional advisory relationship.',
        },
        {
          type: 'p',
          text: 'Communications through or with Dutiva do not receive solicitor-client privilege or any other legal privilege merely because they relate to a legal, HR, or compliance issue. Do not submit privileged legal communications or legal strategy to Dutiva unless a workflow expressly supports that use and you have obtained appropriate advice.',
        },
      ],
    },
    {
      title: '3. AI Output Limits',
      blocks: [
        {
          type: 'p',
          text: 'Some Dutiva features use artificial intelligence, automated logic, and retrieved context. AI-generated outputs can be useful starting points, but they may be wrong, incomplete, outdated, internally inconsistent, or unsuitable for your facts.',
        },
        {
          type: 'li',
          text: 'AI may produce incorrect statutory references, deadlines, entitlements, thresholds, legal standards, or procedural steps.',
        },
        {
          type: 'li',
          text: 'AI does not know all facts about your workplace, employees, contracts, policies, bargaining unit status, benefits arrangements, industry, or decision history.',
        },
        {
          type: 'li',
          text: 'AI-generated outputs are not reviewed by a lawyer before delivery.',
        },
        {
          type: 'li',
          text: 'AI should not be the only source for decisions involving legal, financial, employment, privacy, health, safety, tax, or reputational risk.',
        },
        {
          type: 'p',
          text: 'See the AI Usage Disclosure for more detail about how Dutiva uses AI.',
        },
      ],
    },
    {
      title: '4. Templates and Generated Documents',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva templates and generated documents are general drafting aids. They are not customized legal instruments and are not guaranteed to satisfy every statutory, common-law, civil-law, collective agreement, industry, language, accessibility, or workplace-specific requirement.',
        },
        {
          type: 'p',
          text: 'You should review every document before use. Obtain professional review for employment agreements, independent contractor agreements, termination letters or packages, layoff communications, accommodation plans, harassment or investigation materials, privacy incident notices, executive compensation documents, unionized workplace documents, and any document with significant legal, financial, operational, or reputational exposure.',
        },
      ],
    },
    {
      title: '5. Calculators, Checklists, Risk Flags, and Compliance Scores',
      blocks: [
        {
          type: 'p',
          text: 'Any calculator, checklist, risk flag, compliance score, recommendation, or workflow status is an aid for issue spotting and workflow prioritization. It is not a final determination of legal compliance, employee entitlement, damages exposure, or regulatory risk.',
        },
        {
          type: 'p',
          text: 'You remain responsible for verifying inputs, applying current law, documenting decisions, and seeking professional review where appropriate.',
        },
      ],
    },
    {
      title: '6. High-Risk Matters Requiring Professional Review',
      blocks: [
        {
          type: 'p',
          text: 'You should consult qualified legal or professional advisors before relying on Dutiva for matters involving:',
        },
        {
          type: 'li',
          text: 'Terminations, layoffs, constructive dismissal, severance, or common-law reasonable notice exposure.',
        },
        {
          type: 'li',
          text: 'Human rights, disability, accommodation, harassment, violence, reprisal, or workplace investigation matters.',
        },
        {
          type: 'li',
          text: 'Unionized workplaces, collective agreements, or labour board proceedings.',
        },
        {
          type: 'li',
          text: 'Privacy breaches, employee monitoring, cross-border transfers, or sensitive employee data processing.',
        },
        {
          type: 'li',
          text: 'Pay equity, executive compensation, incentive plans, tax, pension, benefits, or equity arrangements.',
        },
        {
          type: 'li',
          text: 'Any actual or threatened claim, regulator contact, litigation, arbitration, or tribunal proceeding.',
        },
      ],
    },
    {
      title: '7. External Sources and Links',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may link to government websites, legal resources, third-party platforms, and provider documentation. Links are provided for convenience and verification. Dutiva does not control or guarantee third-party content, availability, accuracy, or privacy practices.',
        },
      ],
    },
    {
      title: '8. No Warranty',
      blocks: [
        {
          type: 'p',
          text: 'To the maximum extent permitted by law, Dutiva content, features, templates, calculators, checklists, risk flags, compliance scores, AI responses, workflows, and related materials are provided “as is” and “as available” without warranties of any kind, whether express, implied, statutory, or otherwise.',
        },
        {
          type: 'p',
          text: 'Dutiva does not warrant that any content or output will be accurate, complete, current, error-free, or suitable for your specific circumstances, or that any document or workflow will satisfy your legal or business requirements.',
        },
      ],
    },
    {
      title: '9. Limitation of Liability',
      blocks: [
        {
          type: 'p',
          text: 'To the maximum extent permitted by law, Dutiva will not be liable for any loss, damage, claim, cost, or expense arising from or related to your reliance on Dutiva content, templates, calculations, checklists, risk flags, compliance scores, AI outputs, or workflows.',
        },
        {
          type: 'p',
          text: 'This Disclaimer operates together with the limitations of liability and other risk-allocation provisions in the Terms of Service. If there is a conflict between this Disclaimer and the Terms of Service, the Terms of Service control to the extent of the conflict.',
        },
      ],
    },
    {
      title: '10. Contact',
      blocks: [
        {
          type: 'p',
          text: 'Questions about this Disclaimer can be sent to legal@dutiva.ca.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
