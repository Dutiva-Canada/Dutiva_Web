import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Data Retention and Deletion Policy',
  lastUpdated: 'June 1, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'Dutiva Canada Inc. ("Dutiva," "we," "us," or "our") keeps personal information and Customer Data only as long as needed to provide, secure, support, and administer the Dutiva service; meet legal, tax, accounting, security, audit, and dispute-resolution obligations; and maintain accurate business records.',
    'This Policy explains how Dutiva approaches retention, deletion, anonymization, backups, account deletion, and privacy requests. It should be read with the Privacy Policy, Terms of Service, Data Processing Agreement, Cookie Policy, AI Usage Disclosure, AI & Technology Policy, and any applicable subscription or order terms.',
    'Retention periods may vary depending on the type of information, the customer’s configuration, legal requirements, product functionality, security needs, and whether the information is controlled by an individual user, an organization, or Dutiva.',
  ],
  sections: [
    {
      title: '1. Retention Principles',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva applies the following retention principles:',
        },
        {
          type: 'li',
          text: 'collect and retain only information reasonably needed for defined product, legal, security, billing, support, operational, or compliance purposes;',
        },
        {
          type: 'li',
          text: 'retain personal information only as long as needed for the purposes for which it was collected, unless a longer period is required or permitted by law;',
        },
        {
          type: 'li',
          text: 'support account-level and organization-level deletion workflows where available and appropriate;',
        },
        {
          type: 'li',
          text: 'delete, de-identify, aggregate, or anonymize information when it is no longer needed in identifiable form, where technically and legally appropriate;',
        },
        {
          type: 'li',
          text: 'retain records that are required for legal, tax, accounting, breach, audit, dispute, security, fraud-prevention, or regulatory purposes;',
        },
        {
          type: 'li',
          text: 'retain information used to make or support a decision about an individual long enough to allow legally required access, review, or challenge rights where applicable; and',
        },
        {
          type: 'li',
          text: 'apply reasonable safeguards to information awaiting deletion, archival, backup expiry, legal review, or secure destruction.',
        },
      ],
    },
    {
      title: '2. Retention Schedule',
      blocks: [
        {
          type: 'p',
          text: 'The following schedule describes Dutiva’s current retention approach. The exact period may vary based on product configuration, customer instructions, legal requirements, provider retention settings, security needs, and whether an account or organization remains active.',
        },
        {
          type: 'li',
          text: 'Account and profile data: retained while the account is active, then deleted or anonymized after account deletion unless retained for legal, billing, security, fraud-prevention, support, audit, or dispute purposes.',
        },
        {
          type: 'li',
          text: 'Organization and workspace settings: retained while the organization account is active so dashboards, Advisor, document workflows, templates, settings, permissions, and product configuration can function together.',
        },
        {
          type: 'li',
          text: 'Onboarding and employer profile context: retained while the account or organization workspace is active, or until deleted, replaced, archived, or reset through available product functionality.',
        },
        {
          type: 'li',
          text: 'Generated documents, document inputs, and saved drafts: retained until a user or authorized customer administrator deletes or archives the document, the account or organization is deleted, or a required retention period ends, subject to legal, security, and backup limitations.',
        },
        {
          type: 'li',
          text: 'Electronic-signature records, if enabled: retained while needed to prove signing workflow status, recipient activity, audit events, cancellation, expiry, completion, delivery, or dispute handling.',
        },
        {
          type: 'li',
          text: 'Advisor messages and AI workflow context: current browser workflows may keep conversation state for the in-session user experience. Server-side calls may process limited context for inference, safety, troubleshooting, rate limiting, and service reliability. Dutiva does not use customer Advisor messages or generated HR documents to train third-party foundation models unless separately agreed or expressly opted in.',
        },
        {
          type: 'li',
          text: 'Billing, tax, and subscription records: retained for required accounting, tax, payment processing, fraud-prevention, chargeback, subscription administration, and business-record purposes.',
        },
        {
          type: 'li',
          text: 'Support, communications, and beta feedback records: retained as needed to respond to requests, maintain support history, improve service reliability, document consent or preferences, and protect Dutiva and its users.',
        },
        {
          type: 'li',
          text: 'Usage, analytics, and device information: retained as needed for service operations, aggregate usage measurement, troubleshooting, abuse prevention, rate limiting, security monitoring, and product improvement. First-party support analytics raw event data is retained for 90 days, after which it is automatically deleted; daily aggregates (which no longer identify an individual in a reasonably foreseeable way) are retained indefinitely. Optional third-party analytics are handled as described in the Privacy Policy and Cookie Policy.',
        },
        {
          type: 'li',
          text: 'Security and infrastructure logs: retained for operational security, debugging, abuse prevention, compliance, availability monitoring, incident investigation, and provider or Dutiva operational needs.',
        },
        {
          type: 'li',
          text: 'Breach and incident records: retained for the minimum periods required by applicable law and for longer where needed for investigation, security, audit, insurance, dispute, or regulatory purposes.',
        },
        {
          type: 'li',
          text: 'Backups: retained until they expire through the normal backup lifecycle. Backups may not be reasonably capable of selective deletion before expiry, but they are protected by access controls and are not used for ordinary production access.',
        },
      ],
    },
    {
      title: '3. Account Deletion',
      blocks: [
        {
          type: 'p',
          text: 'Self-initiated account deletion is handled through a server-side deletion workflow where available. The workflow verifies the requesting user, deletes or disconnects account-owned records within the current service scope, deletes generated documents owned by the account where supported, relies on configured cascades for related account-owned tables, and records an anonymized deletion audit entry.',
        },
        {
          type: 'p',
          text: 'The deletion audit entry stores HMAC-hashed identifiers, deletion status, timestamps, and limited operational information so Dutiva can demonstrate that a deletion request was handled without retaining recoverable account identifiers in the audit row.',
        },
        {
          type: 'p',
          text: 'After account deletion, access to the account normally ends and the deleted records may not be recoverable. Some retained records may remain for the purposes described in this Policy.',
        },
      ],
    },
    {
      title: '4. Organization Accounts and Customer-Controlled Data',
      blocks: [
        {
          type: 'p',
          text: 'If you use Dutiva through an organization, some information may belong to or be controlled by that organization rather than by an individual user. Deleting an individual user account may not delete organization records, shared documents, audit records, billing records, or Customer Data that the organization controls.',
        },
        {
          type: 'p',
          text: 'Customers and authorized administrators may delete, archive, export, or update supported workspace records through product functionality where available. If a deletion control is not available for a specific record type, customers may contact privacy@dutiva.ca for assistance.',
        },
        {
          type: 'p',
          text: 'Dutiva may need to verify the requester’s identity, role, organization authority, and legal entitlement before acting on a deletion, export, or retention-related request.',
        },
      ],
    },
    {
      title: '5. Information Not Deleted Immediately',
      blocks: [
        {
          type: 'p',
          text: 'Some information may be retained after an account deletion, document deletion, organization closure, or privacy request where retention is required or reasonably necessary. This may include:',
        },
        {
          type: 'li',
          text: 'billing, tax, accounting, subscription, payment dispute, invoice, and chargeback records;',
        },
        {
          type: 'li',
          text: 'security logs, abuse-prevention records, fraud-prevention records, access logs, and incident investigation records;',
        },
        {
          type: 'li',
          text: 'anonymized or aggregated operational metrics that no longer identify an individual in a reasonably foreseeable way;',
        },
        {
          type: 'li',
          text: 'anonymized deletion audit entries and limited accountability records;',
        },
        {
          type: 'li',
          text: 'records needed to establish, exercise, or defend legal claims, resolve disputes, enforce the Terms of Service, or respond to regulators;',
        },
        {
          type: 'li',
          text: 'records subject to a legal hold, court order, investigation, preservation request, or mandatory retention obligation;',
        },
        {
          type: 'li',
          text: 'records retained by service providers in logs, backups, or operational systems under applicable provider retention controls; and',
        },
        {
          type: 'li',
          text: 'backups that are not reasonably capable of selective deletion until those backups expire through the normal backup lifecycle.',
        },
      ],
    },
    {
      title: '6. Local Browser Storage',
      blocks: [
        {
          type: 'p',
          text: 'Deleting browser preferences, clearing local storage, clearing session storage, removing cookies, or logging out may remove local device state, language settings, theme choices, onboarding progress, or in-browser workflow state. These actions do not delete server-side account records, Customer Data, generated documents, billing records, or retained audit records.',
        },
        {
          type: 'p',
          text: 'More information about cookies, local storage, session storage, and analytics is available in the Cookie Policy.',
        },
      ],
    },
    {
      title: '7. Subprocessors, Provider Logs, and Backups',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva’s service providers may retain limited data in logs, backups, security systems, payment systems, model-inference systems, support tools, or operational environments for limited periods under their own retention controls and applicable contracts.',
        },
        {
          type: 'p',
          text: 'Dutiva works with providers intended to support deletion, security, privacy, and operational obligations appropriate to the service. Provider-side deletion or backup expiry may not occur at the exact same time as deletion inside Dutiva’s application database.',
        },
        {
          type: 'p',
          text: 'If user-owned storage buckets, file-upload features, or expanded attachment storage are introduced later, deletion coverage must be extended to those storage locations before those features are made generally available.',
        },
      ],
    },
    {
      title: '8. Legal Holds and Preservation',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may suspend deletion or preserve information where reasonably necessary to comply with law, preserve evidence, respond to a regulator, resolve a dispute, investigate suspected abuse, investigate security incidents, enforce the Terms of Service, collect amounts owed, or protect the rights, safety, and security of Dutiva, users, customers, individuals, or third parties.',
        },
        {
          type: 'p',
          text: 'When a legal hold or preservation need ends, Dutiva will return the affected information to the applicable retention, deletion, backup-expiry, or archival process.',
        },
      ],
    },
    {
      title: '9. Anonymized, Aggregated, and De-Identified Information',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may retain anonymized, aggregated, or de-identified information for service operations, security, analytics, product improvement, benchmarking, troubleshooting, and business reporting where the information no longer identifies an individual in a reasonably foreseeable way.',
        },
        {
          type: 'p',
          text: 'Anonymized or aggregated information may be retained after account deletion because it is no longer treated as identifiable personal information. Dutiva does not attempt to re-identify anonymized information except where required for security, fraud-prevention, legal, or compliance reasons.',
        },
      ],
    },
    {
      title: '10. Privacy Requests',
      blocks: [
        {
          type: 'p',
          text: 'Requests for access, correction, deletion, retention information, consent withdrawal, or information about Dutiva’s privacy practices can be sent to the Privacy Officer at privacy@dutiva.ca.',
        },
        {
          type: 'p',
          text: 'We may need to verify your identity and authority before acting on a request. If your request relates to information controlled by an organization that uses Dutiva, we may direct you to that organization or work with the organization to respond, where appropriate and legally permitted.',
        },
        {
          type: 'p',
          text: 'We aim to respond to privacy requests within the period required by applicable law, subject to permitted extensions, identity verification, legal limits, and customer-controlled data responsibilities.',
        },
      ],
    },
    {
      title: '11. Changes to This Policy',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may update this Policy from time to time to reflect changes in the service, providers, data categories, deletion workflows, backup practices, legal requirements, or retention practices. For material changes, Dutiva will provide notice by email, in-app notice, website notice, or another reasonable method.',
        },
      ],
    },
    {
      title: '12. Contact',
      blocks: [
        {
          type: 'p',
          text: 'Questions about this Policy or Dutiva’s retention and deletion practices can be sent to privacy@dutiva.ca.',
        },
        {
          type: 'p',
          text: 'Dutiva Canada Inc. - Privacy Officer',
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
