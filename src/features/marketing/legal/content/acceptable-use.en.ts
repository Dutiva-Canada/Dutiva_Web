import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Acceptable Use Policy',
  lastUpdated: 'June 1, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'This Acceptable Use Policy ("AUP") governs your use of Dutiva\'s platform, services, templates, Advisor, and generated content. By accessing or using Dutiva, you agree to comply with this AUP. Violations may result in suspension or termination of access.',
  ],
  sections: [
    {
      title: '1. Purpose',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva is designed to help Canadian employers and HR professionals create structured workplace documents, access compliance-oriented guidance, and organize HR workflows. This AUP defines uses that are prohibited because they are harmful, unlawful, misleading, or contrary to the purpose for which Dutiva was built.',
        },
        {
          type: 'p',
          text: "This policy applies to all users, including free accounts, paid subscribers, enterprise accounts, and administrators, as well as any use of Dutiva's API or integrations.",
        },
      ],
    },
    {
      title: '2. Prohibited Uses',
      blocks: [
        {
          type: 'p',
          text: 'You may not use Dutiva to:',
        },
        {
          type: 'li',
          text: "Generate documents that discriminate against employees or applicants on the basis of a protected ground under the Canadian Human Rights Act, the Ontario Human Rights Code, Quebec's Charter of Human Rights and Freedoms, or any other applicable human rights legislation, including but not limited to race, national or ethnic origin, colour, religion, age, sex, sexual orientation, gender identity or expression, marital status, family status, or disability.",
        },
        {
          type: 'li',
          text: 'Produce, distribute, or use documents designed to circumvent or violate applicable employment standards legislation, including minimum wage obligations, overtime entitlements, statutory leave rights, termination notice requirements, or pay equity obligations.',
        },
        {
          type: 'li',
          text: 'Represent or imply that AI-generated outputs, Advisor responses, or template drafts constitute legal advice, legal opinions, or a solicitor-client relationship.',
        },
        {
          type: 'li',
          text: 'Use the Advisor or any AI feature to solicit or fabricate legal positions, regulatory opinions, or binding workplace determinations.',
        },
        {
          type: 'li',
          text: 'Input social insurance numbers, full financial account credentials, medical records, protected health information, or other highly sensitive personal data into AI prompts or template fields where Dutiva does not expressly support that data type.',
        },
        {
          type: 'li',
          text: "Attempt to reverse-engineer, scrape, extract, or reproduce Dutiva's template content, AI models, guidance databases, or platform infrastructure for use outside Dutiva.",
        },
        {
          type: 'li',
          text: 'Use Dutiva to facilitate harassment, intimidation, or retaliation against employees, former employees, or any other individual.',
        },
        {
          type: 'li',
          text: 'Generate content for use in collective agreement negotiations with a trade union where doing so conflicts with applicable labour relations legislation or the duty to bargain in good faith.',
        },
        {
          type: 'li',
          text: 'Share, resell, sublicense, or provide access to your Dutiva account or generated content to third parties in a manner inconsistent with the Terms of Service.',
        },
        {
          type: 'li',
          text: 'Use Dutiva to generate documents intended to deceive regulators, courts, arbitrators, or government agencies.',
        },
        {
          type: 'li',
          text: "Interfere with, disrupt, or attempt to gain unauthorized access to Dutiva's services, servers, networks, or user data.",
        },
        {
          type: 'li',
          text: 'Use Dutiva in any manner that violates applicable Canadian federal or provincial law, including PIPEDA, Quebec Law 25, the Canadian Human Rights Act, the Canada Labour Code, the Criminal Code of Canada, or any other applicable statute or regulation.',
        },
      ],
    },
    {
      title: '3. Responsible Use of AI Outputs',
      blocks: [
        {
          type: 'p',
          text: 'AI-generated responses and template outputs are drafting aids. You are responsible for reviewing all outputs before use, verifying accuracy against applicable law and your specific workplace facts, and ensuring that documents are reviewed by qualified professionals where the risk profile requires it.',
        },
        {
          type: 'p',
          text: 'You must not rely on Dutiva as the final decision-maker for high-risk employment, privacy, labour, health, or safety matters. Acceptable use includes using Dutiva outputs as a starting point for professional review, not as a substitute for it.',
        },
      ],
    },
    {
      title: '4. User-Provided Content',
      blocks: [
        {
          type: 'p',
          text: 'You are responsible for the accuracy and appropriateness of all information you enter into Dutiva, including names, roles, compensation, dates, policy choices, and Advisor message content. Do not enter false, fabricated, or misleading information in connection with an actual employment relationship.',
        },
        {
          type: 'p',
          text: 'Do not enter personal data about employees, candidates, or other individuals beyond what is required for the specific document or workflow. You are responsible for ensuring that your collection and use of employee personal data complies with applicable privacy legislation.',
        },
      ],
    },
    {
      title: '5. Enforcement',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva reserves the right to investigate suspected violations of this AUP and to suspend or terminate access to any account that violates it. We may also refer confirmed violations to appropriate legal or regulatory authorities where required by law.',
        },
        {
          type: 'p',
          text: 'If you believe another user is violating this AUP, please report it to support@dutiva.ca. We will investigate and take appropriate action consistent with our policies and applicable law.',
        },
      ],
    },
    {
      title: '6. Changes to This Policy',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may update this AUP from time to time to reflect changes to the platform, applicable law, or risk landscape. The updated policy will be posted at dutiva.ca/acceptable-use with a revised effective date. Continued use of Dutiva after the updated effective date constitutes acceptance of the revised AUP.',
        },
      ],
    },
    {
      title: '7. Contact',
      blocks: [
        {
          type: 'p',
          text: 'Questions about this Acceptable Use Policy may be directed to legal@dutiva.ca.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
