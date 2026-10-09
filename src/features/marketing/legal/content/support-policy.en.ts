import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Customer Support Policy',
  lastUpdated: 'July 15, 2026',
  effectiveDate: 'July 15, 2026',
  callout: [
    'Digital-first customer support, with phone or video assistance arranged when necessary.',
    'This Policy describes how Dutiva Canada Inc. provides customer support: the channels available, our hours, initial-response targets by priority, what support covers, and how exceptional telephone or video appointments are arranged.',
  ],
  sections: [
    {
      title: '1. Our support model',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva provides customer support through our Help Centre, secure support requests and email. General inbound telephone support is not currently available. Where an issue cannot reasonably be resolved through digital support — including certain accessibility, security, account-recovery or exceptional service matters — we may arrange a telephone or video appointment.',
        },
        {
          type: 'p',
          text: 'Support is self-service and asynchronous by default. Our Help Centre and in-product guidance resolve most questions immediately; when you need a person, a written support request is reviewed and answered by our team.',
        },
        {
          type: 'p',
          text: 'Dutiva provides practical HR workflow support and compliance-oriented guidance. It does not provide legal advice.',
        },
      ],
    },
    {
      title: '2. Support channels',
      blocks: [
        {
          type: 'p',
          text: 'General support — support@dutiva.ca: Help Centre, product questions, and general support requests.',
        },
        {
          type: 'p',
          text: 'Billing — billing@dutiva.ca: invoices, subscriptions, payments, and billing disputes.',
        },
        {
          type: 'p',
          text: 'Privacy — privacy@dutiva.ca: privacy requests and questions under PIPEDA and Québec Law 25. Privacy requests are handled separately from ordinary support.',
        },
        {
          type: 'p',
          text: 'Security — security@dutiva.ca: vulnerability reports and security concerns, handled with restricted visibility.',
        },
        {
          type: 'p',
          text: 'Accessibility — accessibility@dutiva.ca: accessibility barriers and requests for an alternative communication method. You may request telephone or video contact as an accommodation.',
        },
        {
          type: 'p',
          text: 'Sales and onboarding — sales@dutiva.ca: plans, onboarding, and enterprise enquiries.',
        },
      ],
    },
    {
      title: '3. Hours',
      blocks: [
        {
          type: 'p',
          text: 'Support requests are reviewed Monday to Friday, 9:00 a.m. to 5:00 p.m. Eastern Time, excluding Ontario statutory holidays. You may submit a request at any time. Dutiva does not currently offer continuously staffed 24/7 support.',
        },
      ],
    },
    {
      title: '4. Initial-response targets',
      blocks: [
        {
          type: 'p',
          text: 'Critical (confirmed platform outage, credible active security incident, widespread authentication failure, severe data-access issue, or time-sensitive privacy incident): initial response within 4 business hours.',
        },
        {
          type: 'p',
          text: 'High (you cannot access an essential account or workflow, a billing issue is interrupting your service, a significant accessibility barrier, or a major feature failure without a reasonable workaround): initial response within 1 business day.',
        },
        {
          type: 'p',
          text: 'Standard (an isolated defect, a product question, a billing clarification, or a general support issue): initial response within 2 business days.',
        },
        {
          type: 'p',
          text: 'Low (a feature request, general feedback, or a non-urgent documentation suggestion): initial response within 5 business days.',
        },
        {
          type: 'p',
          text: 'These are initial-response targets, not guaranteed resolution times. Business days exclude weekends and Ontario statutory holidays. Priority is determined by Dutiva after reviewing the impact and urgency you describe, and may be reassessed. Privacy and security incidents may follow separate procedures.',
        },
      ],
    },
    {
      title: '5. Telephone and video appointments',
      blocks: [
        {
          type: 'p',
          text: 'Because support is digital-first, a scheduled telephone or video appointment is arranged only where an issue cannot reasonably be resolved in writing — for example complex account recovery, accessibility accommodations, serious security concerns, escalated billing disputes, enterprise onboarding, or a sensitive complaint where written communication is unsuitable.',
        },
        {
          type: 'p',
          text: 'A call normally requires an existing support request, initial written triage, identity verification where account information will be discussed, and a scheduled appointment. A written summary is added to the request afterward. Calls are not guaranteed, and the written request remains the record of your issue.',
        },
      ],
    },
    {
      title: '6. What support covers',
      blocks: [
        {
          type: 'p',
          text: 'Support covers account access and authentication, billing and subscriptions, technical issues and error reports, product and workflow questions, HR Advisor response quality concerns, accessibility feedback, privacy and security matters, and complaints.',
        },
        {
          type: 'p',
          text: 'Support does not provide legal advice, legal opinions, or a determination that generated content is correct or lawful for a specific workplace situation. Where a question requires professional legal or HR advice, we will point you to appropriate qualified resources.',
        },
        {
          type: 'p',
          text: 'Accessibility, privacy, security, and complaint requests are available to all customers and do not depend on a paid plan.',
        },
      ],
    },
    {
      title: '7. Protecting sensitive information',
      blocks: [
        {
          type: 'p',
          text: 'Do not include unnecessary employee personal information, medical information, investigation evidence or other confidential workplace records in a support request. Dutiva will provide secure instructions if additional information is required.',
        },
      ],
    },
    {
      title: '8. Changes and questions',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may update this Policy as its support operations evolve; material changes are reflected by updating the date above. Questions about this Policy can be sent to support@dutiva.ca.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
