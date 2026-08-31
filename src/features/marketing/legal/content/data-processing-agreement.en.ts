import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Data Processing Agreement',
  lastUpdated: 'July 15, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'This Data Processing Agreement ("DPA") applies when Dutiva Canada Inc. ("Dutiva," "we," "us," or "our") processes Customer Personal Information on behalf of a customer through the Dutiva service, unless the parties sign a separate written data processing agreement.',
    'This DPA forms part of Dutiva’s Terms of Service and should be read with the Privacy Policy, Data Retention and Deletion Policy, AI Usage Disclosure, AI & Technology Policy, and any applicable subscription or order terms.',
  ],
  sections: [
    {
      title: '1. Roles and Scope',
      blocks: [
        {
          type: 'p',
          text: 'For personal information Dutiva collects directly for its own account administration, billing, support, security, analytics where enabled, product operations, and legal compliance purposes, Dutiva is responsible for that processing as described in the Privacy Policy.',
        },
        {
          type: 'p',
          text: 'For personal information a customer submits, uploads, generates, or otherwise makes available to Dutiva for HR workflows, generated documents, Advisor context, electronic-signature workflows, saved records, or related workspace use, the customer determines the purposes for processing and Dutiva processes the information as a service provider or processor, as applicable under the relevant privacy law.',
        },
        {
          type: 'p',
          text: 'For this DPA, "Customer Personal Information" means personal information contained in Customer Data that Dutiva processes on behalf of a customer through the service. "Customer Data" has the meaning given in the Terms of Service.',
        },
        {
          type: 'p',
          text: 'The customer is responsible for ensuring that it has the authority, consent, notice, lawful basis, internal approvals, workplace policies, and compliance controls required to submit Customer Personal Information to Dutiva and to instruct Dutiva to process it.',
        },
      ],
    },
    {
      title: '2. Subject Matter, Duration, and Nature of Processing',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva processes Customer Personal Information to provide, secure, support, administer, maintain, troubleshoot, and improve the subscribed service during the customer’s account term and any post-termination retention period described in the Data Retention and Deletion Policy.',
        },
        {
          type: 'p',
          text: 'Processing may include hosting, storing, retrieving, generating, displaying, transmitting, exporting, deleting, securing, monitoring, troubleshooting, metering, logging, supporting, and administering customer HR workflows, documents, Advisor interactions, electronic-signature workflows, and related workspace activity.',
        },
        {
          type: 'p',
          text: 'Dutiva will not process Customer Personal Information for purposes materially different from those described in this DPA, the Terms of Service, the Privacy Policy, the customer’s configuration and use of the service, or other documented instructions accepted by Dutiva.',
        },
      ],
    },
    {
      title: '3. Categories of Customer Personal Information',
      blocks: [
        {
          type: 'p',
          text: 'Depending on the customer’s configuration and use of the service, Customer Personal Information may include:',
        },
        {
          type: 'li',
          text: 'user, organization, and workspace details, such as names, work email addresses, organization names, roles, province, territory, federal-regime selection, language, plan, account status, and settings;',
        },
        {
          type: 'li',
          text: 'employer profile and HR workflow context entered by the customer, including organization size, workplace facts, role details, policy context, onboarding answers, and information used in lifecycle workflows;',
        },
        {
          type: 'li',
          text: 'document information, including template selections, document titles, document inputs, saved drafts, generated documents, review notes, export records, electronic-signature records, and document-workflow metadata;',
        },
        {
          type: 'li',
          text: 'Advisor information, including prompts, limited recent conversation context, selected province, territory, or federal regime, retrieved guidance context, and limited workspace context needed to produce a useful response;',
        },
        {
          type: 'li',
          text: 'electronic-signature information, where enabled, including signing workflow records, recipient details, audit events, delivery status, completion status, and related metadata; and',
        },
        {
          type: 'li',
          text: 'support, security, and operational information associated with customer workflows, authorized users, error reports, troubleshooting requests, security logs, and usage records.',
        },
        {
          type: 'p',
          text: 'Individuals whose information may be processed include customer users, administrators, employees, candidates, contractors, document recipients, signatories, HR contacts, and other individuals whose information the customer chooses to include in Dutiva workflows.',
        },
        {
          type: 'p',
          text: 'Customers should not submit social insurance numbers, government identification numbers, payment card numbers, banking credentials, medical records, protected health information, privileged legal communications, union grievance files, or highly sensitive employee records unless a specific Dutiva workflow expressly supports that data type and the customer has a lawful basis to provide it.',
        },
      ],
    },
    {
      title: '4. Customer Instructions and Responsibilities',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva will process Customer Personal Information only on documented customer instructions. Documented instructions include the Terms of Service, this DPA, the customer’s configuration and use of the service, workflow selections, account settings, support requests, deletion requests, and any written instructions accepted by Dutiva.',
        },
        {
          type: 'p',
          text: 'The customer is responsible for the lawfulness, accuracy, completeness, and relevance of the Customer Personal Information it submits to Dutiva, and for managing authorized users, access permissions, workplace approvals, and internal use of Dutiva outputs.',
        },
        {
          type: 'p',
          text: 'If Dutiva reasonably believes that a customer instruction violates applicable law, exceeds the service scope, creates a material security, privacy, legal, or operational risk, or could harm Dutiva, another customer, an individual, or a third party, Dutiva may pause the affected processing and request clarification.',
        },
      ],
    },
    {
      title: '5. Dutiva Processing Obligations',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva will process Customer Personal Information only as needed to provide, secure, support, administer, maintain, troubleshoot, improve, and operate the service; comply with law; enforce the Terms of Service; and carry out documented customer instructions.',
        },
        {
          type: 'p',
          text: 'Dutiva does not sell Customer Personal Information. Dutiva does not use customer HR documents or Advisor messages for third-party advertising.',
        },
        {
          type: 'p',
          text: 'Dutiva does not use customer Advisor prompts or generated customer documents to train third-party foundation models unless the customer separately agrees or expressly opts in to a specific training or improvement program.',
        },
      ],
    },
    {
      title: '6. Confidentiality and Access Controls',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva restricts access to Customer Personal Information to personnel, contractors, and subprocessors who need access to provide, secure, support, administer, or improve the service and who are subject to confidentiality obligations appropriate to their role.',
        },
        {
          type: 'p',
          text: 'Dutiva will not disclose Customer Personal Information except as authorized by the customer, required to provide the service, required by law, permitted by the Terms of Service, Privacy Policy, or this DPA, or reasonably necessary to protect the service, users, rights, safety, or security.',
        },
        {
          type: 'p',
          text: 'Dutiva may use aggregated, de-identified, or anonymized information for service operations, security, analytics, troubleshooting, and product improvement where the information no longer identifies an individual or customer in a reasonably foreseeable way.',
        },
      ],
    },
    {
      title: '7. Security Safeguards',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva maintains administrative, technical, and organizational safeguards appropriate to the sensitivity of Customer Personal Information. Current safeguards include:',
        },
        {
          type: 'li',
          text: 'TLS encryption in transit and provider-managed infrastructure safeguards;',
        },
        {
          type: 'li',
          text: 'authentication controls, account access controls, record-level ownership controls, service-role separation, and restricted administrative access;',
        },
        {
          type: 'li',
          text: 'rate limiting, input limits, server-side model calls, API secret isolation, and abuse-prevention controls;',
        },
        {
          type: 'li',
          text: 'operational monitoring, logging, incident triage, and audit-oriented deletion records;',
        },
        {
          type: 'li',
          text: 'secure development practices, validation before production changes, and periodic review of security-relevant workflows; and',
        },
        {
          type: 'li',
          text: 'subprocessor selection and contractual commitments intended to support the confidentiality, integrity, availability, and resilience of the service.',
        },
        {
          type: 'p',
          text: 'No system is perfectly secure. Dutiva’s safeguards are designed to reduce risk and support the service commitments described in this DPA, the Privacy Policy, and the Terms of Service.',
        },
      ],
    },
    {
      title: '8. Subprocessors and Service Providers',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may use subprocessors and service providers to provide hosting, authentication, database, storage, edge functions, AI inference, billing, network security, analytics where enabled, logging, monitoring, support, and related operational functions.',
        },
        {
          type: 'p',
          text: 'Current core subprocessors or provider categories may include Supabase, Vercel, DigitalOcean Gradient AI, Stripe, Cloudflare, Google Analytics if enabled, and other providers that support the operation, security, reliability, or administration of the service.',
        },
        {
          type: 'p',
          text: 'Dutiva remains responsible for its subprocessors’ processing of Customer Personal Information to the extent required by applicable law and uses contractual commitments intended to protect Customer Personal Information at a level appropriate to the service. Dutiva will maintain subprocessor information in its legal pages or make it available on reasonable request.',
        },
        {
          type: 'p',
          text: 'Dutiva may update subprocessors from time to time. Where required by applicable law or a separate written agreement, Dutiva will provide notice or information about material subprocessor changes through a reasonable method, such as a legal page update, account notice, or support-channel response.',
        },
      ],
    },
    {
      title: '9. Cross-Border Processing and Quebec Transfers',
      blocks: [
        {
          type: 'p',
          text: 'Customer Personal Information may be processed or stored in Canada, the United States, and other locations where Dutiva or its subprocessors operate. Information processed outside a province or outside Canada may be subject to the laws of that jurisdiction.',
        },
        {
          type: 'p',
          text: 'Dutiva uses contractual, technical, and organizational safeguards designed to protect Customer Personal Information during cross-border processing.',
        },
        {
          type: 'p',
          text: 'For Quebec personal information, Dutiva reviews transfers outside Quebec through a privacy impact assessment process where required by applicable law and uses written agreements intended to address the risks identified by the assessment.',
        },
        {
          type: 'p',
          text: 'Customers remain responsible for determining whether their own use of Dutiva triggers organization-specific cross-border notice, assessment, approval, recordkeeping, or policy obligations. Dutiva will provide reasonable information about its subprocessors, processing locations, and safeguards to support those assessments.',
        },
      ],
    },
    {
      title: '10. AI and Model Provider Processing',
      blocks: [
        {
          type: 'p',
          text: 'Advisor and document-workflow features may send limited Customer Personal Information to AI model providers or routing providers acting as subprocessors, only as reasonably needed to generate responses, retrieve context, support document workflows, or operate safety and reliability controls.',
        },
        {
          type: 'p',
          text: 'AI requests may include message text, limited recent conversation context, selected province, territory, or federal regime, retrieved guidance context, workflow or template context, and limited workspace fields needed to make the output useful.',
        },
        {
          type: 'p',
          text: 'Dutiva does not intentionally include payment card details, full billing credentials, account passwords, internal authentication secrets, or unnecessary account identifiers in AI provider requests. Users should not submit highly sensitive information to AI features unless Dutiva expressly provides a controlled workflow for that type of information.',
        },
      ],
    },
    {
      title: '11. Security Incident and Breach Support',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva will assess suspected security incidents involving Customer Personal Information. Dutiva will notify affected customers without unreasonable delay after confirming an incident that requires customer action, customer assessment, notification, or mitigation under applicable law or the customer’s obligations.',
        },
        {
          type: 'p',
          text: 'Dutiva will provide information reasonably available to help the customer assess its legal and operational obligations, which may include the nature of the incident, affected data categories, known timing, likely consequences, remediation steps, and recommended mitigation where appropriate.',
        },
        {
          type: 'p',
          text: 'The customer remains responsible for determining and fulfilling its own notification, reporting, recordkeeping, employee-communication, regulator-communication, and remediation obligations unless applicable law assigns responsibility directly to Dutiva.',
        },
      ],
    },
    {
      title: '12. Assistance With Privacy Rights Requests',
      blocks: [
        {
          type: 'p',
          text: 'Where Dutiva processes Customer Personal Information on behalf of a customer, the customer is generally responsible for responding to individuals’ access, correction, deletion, portability, de-indexing or erasure, consent withdrawal, complaint, and automated-processing information requests, unless applicable law assigns responsibility directly to Dutiva.',
        },
        {
          type: 'p',
          text: 'Dutiva will provide reasonable technical assistance through existing product functionality, support channels, export tools, account deletion workflows, and information reasonably available to Dutiva.',
        },
        {
          type: 'p',
          text: 'If Dutiva receives a request from an individual that appears to relate to Customer Personal Information controlled by a customer, Dutiva may redirect the individual to the customer or notify the customer where legally appropriate, unless Dutiva is required by law to respond directly.',
        },
      ],
    },
    {
      title: '13. Return, Export, Deletion, and Retention',
      blocks: [
        {
          type: 'p',
          text: 'Customers may export supported Customer Data while their account is active and the relevant export functionality is available under their plan.',
        },
        {
          type: 'p',
          text: 'On account deletion, Dutiva deletes owned account rows and generated documents through its deletion workflow, subject to retention required or permitted for legal, tax, billing, accounting, security, dispute, audit, backup, anonymized analytics, or operational reasons.',
        },
        {
          type: 'p',
          text: 'Dutiva may retain anonymized deletion audit entries, security records, billing records, and other limited records where reasonably necessary for accountability, fraud prevention, dispute resolution, legal compliance, or service integrity. Operational retention schedules are described in the Data Retention and Deletion Policy.',
        },
      ],
    },
    {
      title: '14. Audit and Information Rights',
      blocks: [
        {
          type: 'p',
          text: 'Upon reasonable written request, Dutiva will provide information reasonably necessary to demonstrate compliance with this DPA, such as policy summaries, subprocessor information, security-control descriptions, cross-border transfer information, deletion workflow details, or other relevant documentation available to Dutiva.',
        },
        {
          type: 'p',
          text: 'Any audit or information request must be reasonable in scope, scheduled in advance, subject to appropriate confidentiality protections, and conducted in a way that avoids disrupting service operations or compromising Dutiva’s security, confidential information, or other customers’ information.',
        },
        {
          type: 'p',
          text: 'Dutiva may decline, narrow, or delay requests that are duplicative, excessive, technically unsafe, legally restricted, unrelated to Customer Personal Information, or likely to compromise security or confidentiality.',
        },
      ],
    },
    {
      title: '15. Order of Precedence, Changes, and Contact',
      blocks: [
        {
          type: 'p',
          text: 'If there is a conflict between this DPA and the Terms of Service, this DPA governs only for the processing of Customer Personal Information on behalf of the customer. The Terms of Service govern all other matters, including subscriptions, acceptable use, intellectual property, disclaimers, limitation of liability, indemnity, governing law, and dispute terms.',
        },
        {
          type: 'p',
          text: 'Dutiva may update this DPA from time to time to reflect changes in the service, providers, security controls, privacy practices, or legal obligations. For material changes, Dutiva will provide notice by email, in-app notice, website notice, or another reasonable method.',
        },
        {
          type: 'p',
          text: 'Questions about this DPA or Dutiva’s processing of Customer Personal Information can be sent to privacy@dutiva.ca.',
        },
        {
          type: 'p',
          text: 'Dutiva Canada Inc.',
        },
        {
          type: 'p',
          text: 'Email: privacy@dutiva.ca',
        },
        {
          type: 'p',
          text: 'Website: dutiva.ca',
        },
      ],
    },
  ],
} satisfies PolicyEdition
