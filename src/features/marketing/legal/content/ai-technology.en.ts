import type { PolicyEdition } from '../policyContent'

export default {
  title: 'AI & Technology Policy',
  lastUpdated: 'August 26, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'This Policy explains the technology used to operate Dutiva, including the current Advisor model flow, technology providers, data-handling boundaries, retrieval controls, and safeguards around AI-assisted HR workflows.',
    'This Policy should be read together with the Privacy Policy, Terms of Service, Legal Disclaimer, AI Usage Disclosure, Data Processing Agreement, and Data Retention and Deletion Policy.',
  ],
  sections: [
    {
      title: '1. Purpose and Scope',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva is a Canadian HR compliance software-as-a-service platform for employers, HR professionals, and business operators. Some features use artificial intelligence, retrieval, automation, and third-party technology providers to support HR workflows.',
        },
        {
          type: 'p',
          text: 'This Policy is intended to provide practical transparency about how these technologies are currently used. It does not create service commitments beyond the Terms of Service and does not replace product-specific notices shown in the application.',
        },
      ],
    },
    {
      title: '2. Current Advisor Model Flow',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva Advisor is served through Dutiva’s server-side advisor-chat edge function. The current production configuration routes Advisor messages to DigitalOcean Gradient AI and uses DeepSeek 3.2 (`deepseek-3.2`) to generate responses. The provider and model are resolved at request time from Dutiva’s routing table and can change without a software deploy.',
        },
        {
          type: 'p',
          text: 'Dutiva may update models, providers, retrieval methods, system instructions, safety controls, and routing logic over time to improve reliability, bilingual performance, latency, cost, security, or responsible-use controls. Material public-facing changes will be reflected in this Policy, the AI Usage Disclosure, or in-product notices where appropriate.',
        },
      ],
    },
    {
      title: '3. What May Be Sent to AI Providers',
      blocks: [
        {
          type: 'p',
          text: 'Advisor requests may include:',
        },
        {
          type: 'li',
          text: 'the user’s message;',
        },
        {
          type: 'li',
          text: 'limited recent conversation turns;',
        },
        {
          type: 'li',
          text: 'the selected province, territory, or federal regime;',
        },
        {
          type: 'li',
          text: 'retrieved HR guidance context;',
        },
        {
          type: 'li',
          text: 'the active workflow ID or template context; and',
        },
        {
          type: 'li',
          text: 'limited workspace context such as organization name, selected jurisdiction or coverage context, role, employer size, language preference, plan, and workflow state.',
        },
        {
          type: 'p',
          text: 'Dutiva limits context sent to AI providers to what is reasonably needed to generate a useful response. Dutiva does not intentionally include payment card numbers, banking credentials, full account identifiers, or billing portal credentials in AI requests.',
        },
        {
          type: 'p',
          text: 'Users should not submit social insurance numbers, medical records, personal health information, banking details, protected employee records, collective agreement files, or other highly sensitive employee information to the Advisor unless Dutiva expressly provides a controlled workflow for that information and the customer has a lawful basis to use it.',
        },
      ],
    },
    {
      title: '4. Retrieval and Guidance Context',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may provide the model with internal HR guidance context from Dutiva’s compliance knowledge pipeline, including jurisdiction-specific notes, workflow checklists, template context, and structured guidance.',
        },
        {
          type: 'p',
          text: 'The Advisor is instructed to use retrieved guidance where available, avoid inventing citations or statutory references, identify assumptions and uncertainty, and flag high-risk matters for qualified HR, legal, payroll, privacy, or other professional review.',
        },
        {
          type: 'p',
          text: 'Retrieved guidance improves grounding, but it does not guarantee that a response is complete, current, or suitable for the customer’s facts, workplace, contracts, policies, collective agreements, or industry.',
        },
      ],
    },
    {
      title: '5. Output Controls and Safety Measures',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva applies practical controls around AI-assisted responses, including:',
        },
        {
          type: 'li',
          text: 'server-side provider calls so model provider secrets are not exposed in the browser;',
        },
        {
          type: 'li',
          text: 'prompt and context minimization where reasonably possible;',
        },
        {
          type: 'li',
          text: 'message length limits, limited conversation history, and rate limiting;',
        },
        {
          type: 'li',
          text: 'system instructions that call for jurisdiction notes, risk levels, next steps, legal basis, and professional-review guidance where appropriate;',
        },
        {
          type: 'li',
          text: 'safety, abuse-prevention, and formatting controls; and',
        },
        {
          type: 'li',
          text: 'persistent user-facing reminders that Dutiva provides HR workflow support and compliance-oriented guidance, not legal advice.',
        },
        {
          type: 'p',
          text: 'These controls reduce risk, but they cannot eliminate AI errors or inappropriate outputs.',
        },
      ],
    },
    {
      title: '6. Technology Providers',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva currently relies on the following core provider categories:',
        },
        {
          type: 'li',
          text: 'Supabase: authentication, database, storage, edge functions, and app data infrastructure.',
        },
        {
          type: 'li',
          text: 'Vercel: hosting, serverless functions, deployment, and operational logs.',
        },
        {
          type: 'li',
          text: 'DigitalOcean Gradient AI: AI model routing and inference for Advisor-related features.',
        },
        {
          type: 'li',
          text: 'Stripe: subscription billing, checkout, invoices, tax, and payment processing.',
        },
        {
          type: 'li',
          text: 'Cloudflare: DNS, traffic routing, performance, availability, and network protection.',
        },
        {
          type: 'li',
          text: 'Google Analytics, if enabled: product or website analytics.',
        },
        {
          type: 'li',
          text: 'React and Vite: frontend application framework and build tooling.',
        },
        {
          type: 'p',
          text: 'Not every provider receives every category of information. Provider access depends on the feature, configuration, and data required to operate that part of the service.',
        },
      ],
    },
    {
      title: '7. AI Limits and Professional Review',
      blocks: [
        {
          type: 'p',
          text: 'AI systems can produce inaccurate, incomplete, outdated, fabricated, biased, or internally inconsistent content. Dutiva does not guarantee that AI responses reflect all current statutes, regulations, case law, collective agreements, employment contracts, workplace policies, agency guidance, payroll requirements, human rights obligations, or workplace facts.',
        },
        {
          type: 'p',
          text: 'Dutiva does not make final workplace decisions for customers. Employers, HR professionals, and authorized users remain responsible for reviewing outputs, confirming facts, applying current law and workplace context, documenting decisions, and obtaining qualified professional review where appropriate.',
        },
        {
          type: 'p',
          text: 'Before acting on terminations, layoffs, accommodations, investigations, privacy incidents, pay equity, unionized workplace issues, executive compensation, cross-border employment arrangements, or other high-risk matters, customers should obtain qualified legal or professional review.',
        },
      ],
    },
    {
      title: '8. Data Retention, Training, and Product Improvement',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva’s current browser workflow may keep Advisor conversation state in-session for user experience and workflow continuity. Dutiva may also process limited operational records, logs, usage signals, and security events to provide, troubleshoot, secure, monitor, and improve the service as described in the Privacy Policy and Data Retention and Deletion Policy.',
        },
        {
          type: 'p',
          text: 'Dutiva does not use customer Advisor prompts or generated HR documents to train third-party foundation models unless a separate written agreement or explicit opt-in provides otherwise.',
        },
        {
          type: 'p',
          text: 'Provider-side processing and retention are governed by provider terms, configurations, and Dutiva’s agreements with those providers. Where available, Dutiva uses configuration, contractual, and operational controls intended to limit unnecessary retention and use of customer content.',
        },
      ],
    },
    {
      title: '9. Automated Systems and Human Review',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva uses automation to support draft generation, guidance retrieval, rate limits, security monitoring, and workflow status. Dutiva is designed to assist employer and HR workflows; it is not designed to make final hiring, discipline, accommodation, termination, compensation, or other employment decisions on behalf of customers.',
        },
        {
          type: 'p',
          text: 'Where an automated or AI-assisted output is used to support a workplace decision, the customer remains responsible for human review, fact-checking, and decision-making. Customers should consider additional privacy, human rights, employment standards, labour relations, and internal governance requirements before using automated outputs in workplace decisions.',
        },
      ],
    },
    {
      title: '10. Changes to This Policy',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may update this Policy as its service, provider stack, model configuration, retrieval system, security controls, or legal obligations evolve. Material changes will be reflected by updating the date above, publishing a revised Policy, or providing additional notice where appropriate.',
        },
      ],
    },
    {
      title: '11. Questions',
      blocks: [
        {
          type: 'p',
          text: 'Questions about Dutiva’s use of AI, automation, or technology providers can be sent to support@dutiva.ca.',
        },
        {
          type: 'p',
          text: 'FRANÇAIS',
        },
      ],
    },
  ],
} satisfies PolicyEdition
