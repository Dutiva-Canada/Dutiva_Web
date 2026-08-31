import type { PolicyEdition } from '../policyContent'

export default {
  title: 'CASL Compliance Policy',
  lastUpdated: 'June 1, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'Dutiva Canada Inc. ("Dutiva," "we," "us," or "our") designs its commercial electronic message practices around Canada\'s Anti-Spam Legislation (CASL): consent, clear sender identification, truthful content, and a working unsubscribe mechanism.',
    'This Policy explains how Dutiva manages commercial electronic messages sent by or on behalf of Dutiva, including beta access communications, product updates, lifecycle campaigns, promotional messages, customer announcements, partner communications, and event-related outreach.',
    "This Policy should be read with Dutiva's Privacy Policy, Cookie Policy, Terms of Service, AI Usage Disclosure, and related legal pages. It is a public-facing operational policy and does not replace legal review for specific campaigns, channels, jurisdictions, or partner arrangements.",
  ],
  sections: [
    {
      title: '1. Scope',
      blocks: [
        {
          type: 'p',
          text: 'This Policy applies to electronic messages sent by or on behalf of Dutiva that encourage participation in a commercial activity and are sent to an electronic address, to the extent those messages are subject to CASL.',
        },
        {
          type: 'p',
          text: 'Covered messages may include email, SMS or text messages, direct electronic messages, in-app direct messages where applicable, and similar electronic communications used for beta access, product marketing, feature updates, events, promotions, customer lifecycle campaigns, and partner communications.',
        },
        {
          type: 'p',
          text: 'Some service, account, billing, security, legal, support, or transactional messages may be handled differently under CASL depending on their content and purpose. Dutiva separates operational service communications from optional marketing where practical.',
        },
      ],
    },
    {
      title: '2. Core CASL Requirements',
      blocks: [
        {
          type: 'p',
          text: "Dutiva's commercial electronic message practices are designed around CASL's three core requirements: obtain a valid consent basis or permitted exception, clearly identify the sender and any person on whose behalf the message is sent, and include a working unsubscribe mechanism.",
        },
        {
          type: 'p',
          text: "Dutiva also aims to ensure that commercial message content is accurate, not misleading, and consistent with Dutiva's public product, legal, privacy, AI, and compliance statements.",
        },
        {
          type: 'p',
          text: 'If a message cannot be confidently categorized as transactional, exempt, or supported by a documented consent basis, Dutiva should treat it as a commercial electronic message requiring CASL review before sending.',
        },
      ],
    },
    {
      title: '3. Consent Standards',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva sends commercial electronic messages only where it has express consent, implied consent, or another CASL-permitted basis.',
        },
        {
          type: 'p',
          text: 'Express consent should be obtained through a clear positive action, such as submitting a signup form, selecting an unchecked checkbox, or otherwise affirmatively requesting to receive commercial communications. Consent requests should state the purpose of the communications, identify Dutiva and any other relevant sender, include required contact information, and explain that consent can be withdrawn.',
        },
        {
          type: 'p',
          text: 'Express consent must not be bundled into general terms of service, hidden in unrelated consent language, or obtained through a pre-checked box. Where multiple types of optional communications are offered, preference choices should be reasonably clear.',
        },
        {
          type: 'p',
          text: "Implied consent may apply where CASL permits it, such as certain existing business relationships, certain inquiries or applications, business contact information that is conspicuously published without a no-solicitation statement and is relevant to the recipient's role, or other circumstances recognized by CASL. When Dutiva relies on implied consent, the basis and any review or expiry date should be documented.",
        },
        {
          type: 'p',
          text: 'Withdrawal of consent must be respected. A recipient who unsubscribes or otherwise withdraws consent must not be re-added to commercial sends unless a new valid consent basis is obtained or another CASL-permitted basis clearly applies.',
        },
      ],
    },
    {
      title: '4. Transactional, Service, and Exempt Messages',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may send service, account, billing, security, legal, support, or transactional messages where permitted and reasonably necessary to provide the service, maintain account security, complete billing, deliver beta access, communicate legal updates, or administer an existing customer relationship.',
        },
        {
          type: 'p',
          text: 'Transactional or service messages should not include promotional content unless Dutiva has an appropriate CASL basis for that promotional content or the message otherwise qualifies under an applicable CASL rule or exception.',
        },
        {
          type: 'p',
          text: 'Examples of operational messages may include account verification, magic-link authentication, security alerts, payment receipts, billing notices, service-impact notices, legally required updates, support responses, and beta access instructions.',
        },
      ],
    },
    {
      title: '5. Consent Records and Preference Management',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva maintains records intended to show when and how consent was obtained, the source of the electronic address, the communication purpose, the consent language presented, the subscription or preference category, the unsubscribe status, and related timestamps.',
        },
        {
          type: 'p',
          text: 'Where technically available and appropriate, consent records may include form source, campaign source, IP address, user agent, account identifier, workflow identifier, preference category, and the version of the consent copy used at the time.',
        },
        {
          type: 'p',
          text: 'When relying on implied consent, Dutiva should document the basis, supporting facts, review date, and expiry date where applicable. Suppression and unsubscribe records should be retained as needed to honour opt-out requests and demonstrate compliance.',
        },
      ],
    },
    {
      title: '6. Identification Requirements',
      blocks: [
        {
          type: 'p',
          text: 'Commercial electronic messages must clearly identify Dutiva Canada Inc. and, where applicable, any person or organization on whose behalf the message is sent.',
        },
        {
          type: 'p',
          text: 'Messages must include contact information that remains valid for at least 60 days after the message is sent. Depending on the channel and format, contact information may include a mailing address and at least one additional method such as an email address, web address, or telephone number.',
        },
        {
          type: 'p',
          text: 'Where message format is constrained, such as in SMS or short-form electronic messages, Dutiva may use a clear and prominent link to a web page containing the required identification, contact, and unsubscribe information, where legally appropriate.',
        },
      ],
    },
    {
      title: '7. Unsubscribe and Suppression Controls',
      blocks: [
        {
          type: 'p',
          text: 'Each commercial electronic message must include a working unsubscribe mechanism that is clear, prominent, simple, quick, and available at no cost to the recipient.',
        },
        {
          type: 'p',
          text: 'Unsubscribe mechanisms should be readily performed. For email, this may include a direct unsubscribe link or preference centre. For SMS, this may include a recognized reply command such as STOP or a link to a preference page.',
        },
        {
          type: 'p',
          text: 'Unsubscribe requests must be processed without delay and no later than 10 business days after receipt. The unsubscribe mechanism must remain functional for at least 60 days after the message is sent.',
        },
        {
          type: 'p',
          text: 'Dutiva should check suppression lists and unsubscribe records before sending future commercial messages. Where technically feasible, recipients should be able to unsubscribe from all commercial messages or manage categories of optional communications.',
        },
      ],
    },
    {
      title: '8. Beta, Waitlist, and Product Communications',
      blocks: [
        {
          type: 'p',
          text: 'Beta waitlist forms, early-access forms, and product-interest forms should use clear consent language for optional commercial communications. Where consent is requested, the consent action should be affirmative, visible, and not pre-selected.',
        },
        {
          type: 'p',
          text: 'Operational beta access messages may be sent as service or account communications where they are reasonably necessary to administer access, authentication, onboarding, support, or security. Promotional beta messages, launch announcements, newsletters, upsell messages, partner offers, and event invitations must follow this Policy.',
        },
        {
          type: 'p',
          text: 'Product updates that are primarily operational, security-related, legal, or service-administration notices should be kept separate from optional marketing where practical. If an update message includes promotional content, Dutiva should confirm the CASL basis before sending.',
        },
      ],
    },
    {
      title: '9. Third-Party, Partner, and Vendor Sends',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva must not upload, purchase, rent, or use third-party contact lists unless the source, consent basis, permitted purpose, data provenance, unsubscribe responsibility, and privacy implications have been reviewed.',
        },
        {
          type: 'p',
          text: 'Partner campaigns must clearly identify the sender and any party on whose behalf the message is sent. The parties should define who is responsible for consent records, message approval, unsubscribe processing, suppression-list management, complaint handling, and record production if requested.',
        },
        {
          type: 'p',
          text: 'Vendors or service providers sending commercial electronic messages for Dutiva must be required to follow CASL-aligned practices, maintain appropriate suppression records, process unsubscribes within required timelines, and provide send, consent, and unsubscribe records on request.',
        },
      ],
    },
    {
      title: '10. Content and Claim Controls',
      blocks: [
        {
          type: 'p',
          text: 'Commercial messages must not include false or misleading sender information, subject lines, claims, offers, pricing, urgency statements, endorsements, product capabilities, legal-compliance claims, AI claims, privacy claims, or employment-law support claims.',
        },
        {
          type: 'p',
          text: "Claims about Dutiva's HR compliance support, legal boundaries, AI use, privacy posture, Quebec Law 25 readiness, PIPEDA alignment, or document-generation capabilities should be accurate, reviewable, and consistent with Dutiva's public legal pages.",
        },
        {
          type: 'p',
          text: 'Messages should avoid dark patterns, hidden conditions, unclear trial or pricing claims, false scarcity, or language that could mislead a recipient about whether a message is promotional or required for service administration.',
        },
      ],
    },
    {
      title: '11. Campaign Review Before Sending',
      blocks: [
        {
          type: 'p',
          text: 'Before launching a new marketing channel, lifecycle campaign, partner send, event campaign, SMS workflow, or other commercial message type, Dutiva should confirm the following:',
        },
        {
          type: 'li',
          text: 'The message has been categorized as commercial, transactional, service-related, exempt, or otherwise CASL-permitted.',
        },
        {
          type: 'li',
          text: 'The consent basis or permitted exception is documented.',
        },
        {
          type: 'li',
          text: 'The identification block, sender name, and contact information are present and accurate.',
        },
        {
          type: 'li',
          text: 'The unsubscribe mechanism works, is readily performed, and updates suppression records.',
        },
        {
          type: 'li',
          text: 'The send list excludes unsubscribed recipients and suppressed addresses.',
        },
        {
          type: 'li',
          text: "The message content is accurate, not misleading, and consistent with Dutiva's legal, privacy, AI, and product positioning.",
        },
        {
          type: 'li',
          text: 'Any partner, vendor, or third-party data source has been reviewed before use.',
        },
      ],
    },
    {
      title: '12. Monitoring, Training, and Recordkeeping',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva should maintain internal ownership for commercial-message compliance, including consent language, campaign review, suppression-list hygiene, unsubscribe testing, vendor oversight, and complaint handling.',
        },
        {
          type: 'p',
          text: "Personnel or contractors involved in marketing, beta access, lifecycle messaging, customer communications, or partner campaigns should receive reasonable guidance on CASL basics and Dutiva's internal approval process.",
        },
        {
          type: 'p',
          text: 'Dutiva may periodically review sample messages, forms, consent records, unsubscribe workflows, and suppression-list operation to confirm that commercial-message practices remain aligned with this Policy and applicable law.',
        },
      ],
    },
    {
      title: '13. Changes to This Policy',
      blocks: [
        {
          type: 'p',
          text: "Dutiva may update this Policy from time to time to reflect changes in CASL guidance, communication channels, product flows, marketing practices, service providers, or internal controls. Material changes to Dutiva's commercial electronic message practices should be reflected in this Policy or related public-facing materials.",
        },
      ],
    },
    {
      title: '14. Official References',
      blocks: [
        {
          type: 'p',
          text: "Reference points include the text of Canada's Anti-Spam Legislation, CRTC guidance and FAQs on commercial electronic messages, consent, identification, unsubscribe mechanisms, and CRTC guidance on information to be included in commercial electronic messages and requests for consent.",
        },
      ],
    },
    {
      title: '15. Contact',
      blocks: [
        {
          type: 'p',
          text: "Questions about Dutiva's commercial electronic message practices can be sent to:",
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
        {
          type: 'p',
          text: 'You may also use the unsubscribe or preference controls included in Dutiva commercial messages where available.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
