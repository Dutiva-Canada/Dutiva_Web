import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Security Overview',
  lastUpdated: 'July 15, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'Dutiva Canada Inc. takes the security of customer data seriously. This overview describes the security controls, infrastructure design, encryption practices, access management, vulnerability management, and incident response capabilities in place to protect the Dutiva platform and the data you entrust to us.',
  ],
  sections: [
    {
      title: '1. Infrastructure Security',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva is hosted on Vercel (frontend and edge delivery) and Supabase (database, authentication, and backend API). Both platforms are built on major cloud infrastructure providers with industry-standard physical and network security controls, including geographic redundancy, DDoS mitigation, and infrastructure-level monitoring.',
        },
        {
          type: 'p',
          text: 'Production infrastructure is logically separated from development and staging environments. Access to production systems is restricted to authorized personnel on a need-to-know basis.',
        },
      ],
    },
    {
      title: '2. Encryption',
      blocks: [
        {
          type: 'p',
          text: 'Data in transit: All communication between users and the Dutiva platform is encrypted using TLS 1.2 or higher. This includes web application traffic, API calls, and communication between platform components.',
        },
        {
          type: 'p',
          text: 'Data at rest: User data stored in Supabase databases is encrypted at rest using AES-256 encryption. Generated documents, workspace data, and account information are stored in encrypted form.',
        },
        {
          type: 'p',
          text: 'AI API communication: Data submitted to AI service providers is transmitted over encrypted channels. We do not transmit sensitive personal employee data to AI providers beyond what is required by the specific workflow and template.',
        },
      ],
    },
    {
      title: '3. Access Controls',
      blocks: [
        {
          type: 'p',
          text: 'Authentication: Dutiva uses Supabase Auth for user authentication, which supports email/password authentication with email verification, as well as OAuth-based flows where configured. Password storage uses bcrypt hashing.',
        },
        {
          type: 'p',
          text: 'Authorization: Access to user data is enforced through row-level security (RLS) policies at the database level. Users can only access data belonging to their own account or organization. Dutiva staff access to customer data is restricted and logged.',
        },
        {
          type: 'p',
          text: 'Internal access: Internal access to production systems and customer data is restricted to authorized personnel and requires multi-factor authentication where supported. Access rights are reviewed periodically and revoked promptly when no longer required.',
        },
      ],
    },
    {
      title: '4. Vulnerability Management',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva uses automated dependency scanning to identify known vulnerabilities in platform dependencies. Security updates are applied on a priority basis, with critical vulnerabilities addressed promptly.',
        },
        {
          type: 'p',
          text: 'We use static application security testing (SAST) and secret detection in our development pipeline to identify security issues before code reaches production.',
        },
        {
          type: 'p',
          text: 'Penetration testing is on our security roadmap. We will publish results summaries when third-party assessments are completed.',
        },
      ],
    },
    {
      title: '5. Incident Response',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva maintains an incident and breach response policy covering detection, containment, eradication, notification, and post-incident review. Security incidents involving personal data are handled in accordance with PIPEDA, Quebec Law 25, and our public Incident and Breach Response Policy.',
        },
        {
          type: 'p',
          text: 'To report a security vulnerability, contact security@dutiva.ca. We aim to acknowledge reports promptly in accordance with our published support response targets and keep you informed of our investigation. We do not currently offer a formal bug bounty program but appreciate responsible disclosure.',
        },
      ],
    },
    {
      title: '6. AI and Data Handling Security',
      blocks: [
        {
          type: 'p',
          text: 'Queries sent to the Dutiva Advisor and document generator are processed using third-party AI APIs. We minimize the data submitted to AI providers to what is required for the specific request. We do not send social insurance numbers, medical records, full payment credentials, or other highly sensitive data to AI APIs.',
        },
        {
          type: 'p',
          text: 'AI API providers we use have committed, under their respective API terms, not to use submitted data to train their foundation models. We maintain data processing agreements with our AI providers where available.',
        },
      ],
    },
    {
      title: '7. Compliance Roadmap',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva is building toward SOC 2 Type II compliance. We will update this page as compliance milestones are achieved. Our current security program is designed with SOC 2 trust service criteria (Security, Availability, Confidentiality, and Privacy) as a framework.',
        },
        {
          type: 'p',
          text: 'Enterprise customers requiring security questionnaire responses, data processing agreements, or evidence of specific controls should contact security@dutiva.ca.',
        },
      ],
    },
    {
      title: '8. Contact',
      blocks: [
        {
          type: 'p',
          text: 'Security questions and vulnerability reports: security@dutiva.ca. Privacy and data handling questions: privacy@dutiva.ca. General questions: support@dutiva.ca.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
