import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Incident and Breach Response Policy',
  lastUpdated: 'June 1, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'This Incident and Breach Response Policy explains how Dutiva Canada Inc. ("Dutiva," "we," "us," or "our") identifies, escalates, contains, assesses, documents, communicates, and learns from security incidents, privacy breaches, confidentiality incidents, and related provider incidents involving Dutiva systems or personal information.',
    "This Policy should be read with Dutiva's Privacy Policy, Data Processing Agreement, Data Retention and Deletion Policy, Terms of Service, AI Usage Disclosure, AI & Technology Policy, and any applicable subscription or order terms.",
  ],
  sections: [
    {
      title: '1. Scope and Definitions',
      blocks: [
        {
          type: 'p',
          text: 'This Policy applies to suspected or confirmed incidents involving Dutiva systems, production infrastructure, authentication systems, provider credentials, customer data, personal information, generated documents, Advisor processing, AI model-provider requests, electronic-signature workflows, payment-related integrations, support systems, subprocessors, or related operational records.',
        },
        {
          type: 'p',
          text: 'For this Policy, a security incident means an event that may compromise the confidentiality, integrity, availability, or resilience of Dutiva systems, data, accounts, credentials, workflows, or infrastructure. A privacy breach means loss of, unauthorized access to, unauthorized disclosure of, or unauthorized use of personal information. Under PIPEDA, this may be described as a breach of security safeguards. For Quebec personal information, this may be described as a confidentiality incident.',
        },
        {
          type: 'p',
          text: 'Not every security event is a reportable privacy breach. Dutiva assesses each incident based on the information involved, likelihood of misuse, affected individuals or customers, legal thresholds, contractual obligations, and the steps needed to reduce harm and prevent recurrence.',
        },
      ],
    },
    {
      title: '2. Response Roles',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva assigns response responsibilities based on the incident type, severity, affected systems, and personal-information impact. The following roles may be involved:',
        },
        {
          type: 'li',
          text: 'Incident Lead: coordinates triage, containment, investigation, status updates, decision logging, and post-incident review.',
        },
        {
          type: 'li',
          text: 'Privacy Officer: assesses personal-information impact, notification duties, privacy-risk thresholds, breach records, confidentiality-incident registers, and regulator communications.',
        },
        {
          type: 'li',
          text: 'Engineering Owner: investigates technical cause, reviews logs, rotates credentials, patches code, validates fixes, and verifies remediation.',
        },
        {
          type: 'li',
          text: 'Customer Communications Owner: prepares customer-facing updates, support guidance, affected-user notices, and follow-up messaging where required.',
        },
        {
          type: 'li',
          text: 'Legal Counsel: reviews high-risk notifications, regulator filings, contractual duties, evidence preservation, privilege considerations, and litigation or tribunal exposure.',
        },
        {
          type: 'li',
          text: 'Executive Sponsor, where needed: supports priority decisions, customer-impact decisions, resource allocation, and external communications for material incidents.',
        },
      ],
    },
    {
      title: '3. Response Phases',
      blocks: [
        {
          type: 'p',
          text: "Dutiva's incident response process generally follows these phases. Some phases may run in parallel where urgency requires immediate containment or notification support:",
        },
        {
          type: 'li',
          text: 'Detect: receive and review signals from monitoring, logs, provider alerts, users, support tickets, security researchers, internal review, or unusual service behaviour.',
        },
        {
          type: 'li',
          text: 'Triage: classify severity, systems affected, data categories, customer impact, individual impact, active exploitation risk, provider involvement, and whether personal information may be involved.',
        },
        {
          type: 'li',
          text: 'Contain: revoke or rotate credentials, isolate systems, disable affected features, block abusive traffic, suspend risky processing, apply emergency fixes, or preserve affected workflows while preventing further harm.',
        },
        {
          type: 'li',
          text: 'Investigate: preserve relevant evidence, identify root cause, determine affected records, estimate affected individuals or customers, reconstruct the timeline, and confirm whether a provider or subprocessor was involved.',
        },
        {
          type: 'li',
          text: 'Assess: determine legal, privacy, contractual, customer, operational, security, and reputational implications, including whether notification thresholds are met.',
        },
        {
          type: 'li',
          text: 'Notify: provide notices to customers, regulators, affected individuals, providers, insurers, law enforcement, or other parties where required or appropriate.',
        },
        {
          type: 'li',
          text: 'Recover: restore service, validate fixes, monitor for recurrence, update safeguards, and move the incident to post-incident review once operationally stable.',
        },
        {
          type: 'li',
          text: 'Improve: track corrective actions, policy updates, technical changes, training needs, and product or process changes separately from the incident record.',
        },
      ],
    },
    {
      title: '4. Timing Standards',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva treats potential security incidents and privacy incidents as urgent. Where feasible, Dutiva targets initial triage within 24 hours of discovery and an initial privacy or legal notification assessment within 72 hours after confirming that personal information may be involved.',
        },
        {
          type: 'p',
          text: 'These timing standards are internal escalation targets. They do not replace legal or contractual requirements, and they may vary depending on incident complexity, evidence availability, provider involvement, law-enforcement restrictions, or the need to prevent additional harm.',
        },
        {
          type: 'p',
          text: "Under PIPEDA, reportable breaches must be reported to the Office of the Privacy Commissioner of Canada and affected individuals must be notified as soon as feasible after Dutiva determines that the breach creates a real risk of significant harm. Quebec confidentiality incidents that present a risk of serious injury must be reported to the Commission d'accès à l'information du Québec and affected persons with diligence, subject to applicable investigation limits.",
        },
      ],
    },
    {
      title: '5. PIPEDA Breach Assessment',
      blocks: [
        {
          type: 'p',
          text: "For personal information under Dutiva's control, Dutiva assesses whether a breach of security safeguards creates a real risk of significant harm by considering the sensitivity of the personal information involved and the probability that the information has been, is being, or will be misused. Dutiva may also consider the circumstances of the breach, exposure duration, threat actor indicators, mitigation already taken, likelihood of identity theft, financial loss, humiliation, reputational harm, employment harm, or other reasonably foreseeable harms.",
        },
        {
          type: 'p',
          text: 'Where Dutiva determines that the real-risk-of-significant-harm threshold is met, Dutiva will:',
        },
        {
          type: 'li',
          text: 'report the breach to the Office of the Privacy Commissioner of Canada as soon as feasible;',
        },
        {
          type: 'li',
          text: 'notify affected individuals as soon as feasible unless prohibited by law;',
        },
        {
          type: 'li',
          text: 'notify other organizations or government institutions where appropriate and where doing so may reduce or mitigate harm;',
        },
        {
          type: 'li',
          text: 'provide notice content required by applicable law and information reasonably useful for affected individuals to reduce risk;',
        },
        {
          type: 'li',
          text: 'keep records of every breach of security safeguards for at least 24 months after the day Dutiva determines that the breach occurred, unless a longer period is required or reasonably necessary.',
        },
      ],
    },
    {
      title: '6. Quebec Confidentiality Incidents',
      blocks: [
        {
          type: 'p',
          text: 'For Quebec personal information, Dutiva assesses whether a confidentiality incident presents a risk of serious injury. The assessment considers, among other factors, the sensitivity of the personal information, the anticipated consequences of its use, and the likelihood that the information will be used for injurious purposes. Dutiva consults the Privacy Officer as part of this assessment where required or appropriate.',
        },
        {
          type: 'p',
          text: 'Where Dutiva determines that the risk-of-serious-injury threshold is met, Dutiva will:',
        },
        {
          type: 'li',
          text: "notify the Commission d'accès à l'information du Québec with diligence;",
        },
        {
          type: 'li',
          text: 'notify affected persons with diligence unless doing so could hamper an investigation carried out under law to prevent, detect, or repress crime or offences under law;',
        },
        {
          type: 'li',
          text: 'take reasonable measures to reduce the risk of injury and prevent new incidents of the same nature;',
        },
        {
          type: 'li',
          text: "provide supplementary information to the Commission d'accès à l'information du Québec with diligence if Dutiva becomes aware of additional required information after the initial notice;",
        },
        {
          type: 'li',
          text: "record the incident in Dutiva's confidentiality-incident register; and",
        },
        {
          type: 'li',
          text: 'retain Quebec confidentiality-incident register entries for at least five years after the date or period on which Dutiva became aware of the incident.',
        },
      ],
    },
    {
      title: '7. Customer and Processor Notifications',
      blocks: [
        {
          type: 'p',
          text: 'Where Dutiva processes Customer Personal Information on behalf of a customer, Dutiva will notify the affected customer without undue delay after Dutiva confirms an incident involving Customer Personal Information that requires customer action, notification support, or contractual escalation.',
        },
        {
          type: 'p',
          text: 'Customer notices will include information reasonably available to Dutiva, which may include the nature of the incident, known or estimated timing, affected systems, affected data categories, containment and remediation steps taken, recommended customer actions, whether regulator or individual notification may be required, and the Dutiva contact point for follow-up.',
        },
        {
          type: 'p',
          text: 'Where the customer is responsible for the underlying personal information, the customer remains responsible for assessing and meeting its own notification, recordkeeping, employee, regulator, contractual, and workplace obligations. Dutiva will provide reasonable cooperation through available product, support, legal, and technical channels.',
        },
      ],
    },
    {
      title: '8. Provider and Subprocessor Incidents',
      blocks: [
        {
          type: 'p',
          text: 'Some incidents may originate from or involve a service provider, subprocessor, model provider, payment provider, hosting provider, security provider, analytics provider where enabled, or other third-party system used to provide Dutiva.',
        },
        {
          type: 'p',
          text: "When Dutiva receives notice of a provider incident, Dutiva will assess the incident in the context of Dutiva's service, determine whether Dutiva systems, Customer Data, or personal information may be affected, request information reasonably needed for Dutiva's assessment, and coordinate customer or regulator communications where required.",
        },
        {
          type: 'p',
          text: 'A provider outage, vulnerability, or security event does not automatically mean that Dutiva personal information was affected. Dutiva will assess the available facts before communicating confirmed personal-information impact, while providing timely operational updates where appropriate.',
        },
      ],
    },
    {
      title: '9. Communications and Notice Content',
      blocks: [
        {
          type: 'p',
          text: 'Incident communications should be accurate, proportionate, timely, and based on known facts. Dutiva avoids speculation, overstatement, under-disclosure, and unnecessary disclosure of sensitive technical details that could increase security risk.',
        },
        {
          type: 'p',
          text: 'Depending on the incident and legal requirements, notices may include a description of the incident, the date or period when it occurred, when Dutiva became aware of it, affected data categories, affected individuals or customers, mitigation steps taken, steps individuals or customers can take to reduce risk, whether public notice is used, contact information, and any required regulator filing details.',
        },
        {
          type: 'p',
          text: 'Dutiva may update incident communications as additional facts are confirmed. Supplemental notices may be provided where required by law, contractual commitments, regulator expectations, or customer-support needs.',
        },
      ],
    },
    {
      title: '10. Incident Records and Retention',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva maintains incident records appropriate to the incident type, severity, legal requirements, and operational need. Incident records may include:',
        },
        {
          type: 'li',
          text: 'date discovered, estimated date or period of occurrence, internal timeline, and date Dutiva became aware of the incident;',
        },
        {
          type: 'li',
          text: 'systems, providers, subprocessors, customers, individuals, accounts, records, and data categories involved;',
        },
        {
          type: 'li',
          text: 'containment, eradication, recovery, monitoring, and mitigation steps taken or planned;',
        },
        {
          type: 'li',
          text: 'risk assessment, privacy threshold analysis, notification analysis, notices sent, and regulator filings;',
        },
        {
          type: 'li',
          text: 'customer communications, affected-individual communications, public notices, and support guidance where applicable;',
        },
        {
          type: 'li',
          text: 'root cause, corrective actions, responsible owners, deadlines, verification evidence, and closure decision.',
        },
        {
          type: 'p',
          text: "Incident and breach records are retained according to Dutiva's Data Retention and Deletion Policy and applicable legal requirements, including statutory breach-record and confidentiality-incident register periods.",
        },
      ],
    },
    {
      title: '11. Post-Incident Review and Improvement',
      blocks: [
        {
          type: 'p',
          text: 'After material incidents, Dutiva will conduct a post-incident review to identify root cause, missed signals, delayed decisions, control gaps, vendor issues, training needs, product changes, policy updates, and follow-up owners.',
        },
        {
          type: 'p',
          text: 'Security fixes and policy updates are tracked separately from the incident so remediation does not depend on memory or informal notes. Dutiva may update safeguards, monitoring, escalation paths, user messaging, provider controls, documentation, or training based on incident learnings.',
        },
      ],
    },
    {
      title: '12. Official References and Related Policies',
      blocks: [
        {
          type: 'p',
          text: "Reference points include guidance from the Office of the Privacy Commissioner of Canada on mandatory PIPEDA breach reporting and guidance from the Commission d'accès à l'information du Québec on confidentiality incidents for private enterprises.",
        },
        {
          type: 'p',
          text: 'Related Dutiva policies include the Privacy Policy, Data Processing Agreement, Data Retention and Deletion Policy, Terms of Service, Legal Disclaimer, Cookie Policy, AI Usage Disclosure, and AI & Technology Policy.',
        },
      ],
    },
    {
      title: '13. Contact',
      blocks: [
        {
          type: 'p',
          text: 'Questions about this Policy or privacy-related incident handling can be sent to the Dutiva Privacy Officer at privacy@dutiva.ca.',
        },
        {
          type: 'p',
          text: 'Security concerns or suspected misuse of Dutiva can also be reported through support channels at support@dutiva.ca with the subject line "Security Incident".',
        },
      ],
    },
  ],
} satisfies PolicyEdition
