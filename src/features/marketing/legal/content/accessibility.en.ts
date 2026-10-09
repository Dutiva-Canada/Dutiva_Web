import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Accessibility Statement',
  lastUpdated: 'April 8, 2026',
  effectiveDate: 'April 8, 2026',
  callout: [
    'Dutiva Canada Inc. (“Dutiva,” “we,” “us,” or “our”) is committed to making Dutiva usable by people with disabilities and by users who rely on assistive technologies. We are actively working toward conformance with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA across core website and application flows, and we continue to monitor WCAG 2.2 as the platform evolves.',
  ],
  sections: [
    {
      title: '1. Our Commitment',
      blocks: [
        {
          type: 'p',
          text: 'Accessibility is a core product and design consideration at Dutiva. HR compliance tools should be usable by Canadian employers, HR professionals, business operators, and authorized users with a range of abilities and access needs.',
        },
        {
          type: 'p',
          text: 'We design and test the platform to support modern assistive technologies and inclusive interaction patterns, including keyboard navigation, screen readers, visible focus states, text resizing, high-contrast display modes, responsive layouts, and English/French language support.',
        },
      ],
    },
    {
      title: '2. Conformance Status',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva is currently in partial conformance with WCAG 2.1 Level AA. This means some parts of the website and application may not yet fully meet every applicable success criterion, particularly beta features, dynamic content, and generated document workflows.',
        },
        {
          type: 'p',
          text: 'We are conducting accessibility reviews, remediating issues on a rolling basis, and prioritizing WCAG 2.1 Level AA conformance for core user flows, including account access, navigation, the Advisor, document generation, workspace review, billing and account management, and support. We also monitor WCAG 2.2 guidance as the product evolves.',
        },
      ],
    },
    {
      title: '3. Accessibility Features',
      blocks: [
        {
          type: 'p',
          text: 'Current accessibility features and design practices include:',
        },
        {
          type: 'li',
          text: 'Keyboard accessibility for primary actions and core workflows.',
        },
        {
          type: 'li',
          text: 'Visible focus indicators and logical focus order for interactive elements.',
        },
        {
          type: 'li',
          text: 'Semantic HTML structure, meaningful headings, form labels, and ARIA support where native HTML is insufficient.',
        },
        {
          type: 'li',
          text: 'Colour contrast designed to meet WCAG Level AA expectations for body text and primary interactive elements.',
        },
        {
          type: 'li',
          text: 'Responsive layouts and support for text resizing up to 200% without loss of core functionality.',
        },
        {
          type: 'li',
          text: 'Screen-reader-friendly page titles, forms, buttons, navigation elements, and status messages where implemented.',
        },
        {
          type: 'li',
          text: 'English/French language support across core platform areas, with appropriate language attributes where implemented.',
        },
        {
          type: 'li',
          text: 'Reduced reliance on colour alone to communicate important information.',
        },
        {
          type: 'li',
          text: 'Ongoing review of generated content, AI responses, document previews, and export workflows for accessibility.',
        },
      ],
    },
    {
      title: '4. Known Limitations and Improvements in Progress',
      blocks: [
        {
          type: 'p',
          text: 'We are aware of the following areas where accessibility improvements are in progress:',
        },
        {
          type: 'li',
          text: 'Some dynamically generated document content may not always be announced reliably by all screen readers.',
        },
        {
          type: 'li',
          text: 'The AI Advisor interface is undergoing review for streaming responses, screen reader announcements, live-region behaviour, and focus management.',
        },
        {
          type: 'li',
          text: 'Some data tables, calculator-style components, and workflow status views may require enhanced table semantics, ARIA annotations, or header associations in certain browser and assistive-technology combinations.',
        },
        {
          type: 'li',
          text: 'Some third-party checkout, authentication, analytics, or embedded service flows may have accessibility behaviours outside Dutiva’s direct control.',
        },
        {
          type: 'li',
          text: 'Newly released beta features may require additional accessibility testing after deployment.',
        },
        {
          type: 'li',
          text: 'We prioritize accessibility issues by severity, user impact, and frequency. We aim to address high-impact barriers in planned releases and to offer reasonable support or workarounds where feasible.',
        },
      ],
    },
    {
      title: '5. Technical Specifications and Testing',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva relies on the following technologies and practices to support accessibility:',
        },
        {
          type: 'li',
          text: 'HTML5 semantic markup.',
        },
        {
          type: 'li',
          text: 'WAI-ARIA roles, states, and properties when native HTML is insufficient.',
        },
        {
          type: 'li',
          text: 'CSS for visual presentation, with no essential information intended to be conveyed by colour or visual styling alone.',
        },
        {
          type: 'li',
          text: 'React and JavaScript for dynamic interactions, with keyboard and focus-management practices applied to core flows.',
        },
        {
          type: 'li',
          text: 'Testing across modern browsers, including Chrome, Firefox, Safari, and Edge.',
        },
        {
          type: 'li',
          text: 'Testing with assistive technologies and accessibility tooling, including NVDA, VoiceOver, keyboard-only navigation, browser accessibility inspectors, colour-contrast checks, responsive zoom checks, and automated accessibility scans.',
        },
        {
          type: 'li',
          text: 'Automated tools do not detect every accessibility issue. Manual testing and user feedback remain important parts of our accessibility process.',
        },
      ],
    },
    {
      title: '6. Third-Party Content and Services',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may rely on third-party providers for authentication, payment checkout, hosting, analytics where enabled, AI inference, support, and infrastructure services. We select providers intended to support secure and reliable service delivery, but third-party interfaces may have accessibility limitations outside our direct control.',
        },
        {
          type: 'p',
          text: 'We welcome feedback about barriers in third-party flows so we can assess mitigations, vendor options, alternative support, or product adjustments.',
        },
      ],
    },
    {
      title: '7. Feedback and Accessible Formats',
      blocks: [
        {
          type: 'p',
          text: 'We welcome feedback on the accessibility of Dutiva. If you experience a barrier or have suggestions for improvement, please contact us:',
        },
        {
          type: 'p',
          text: 'Email: support@dutiva.ca',
        },
        {
          type: 'p',
          text: 'Suggested subject line: Accessibility Feedback',
        },
        {
          type: 'p',
          text: 'To help us investigate, please include the page or feature involved, the device, browser, and assistive technology used, a description of the barrier, and the outcome you were trying to achieve.',
        },
        {
          type: 'p',
          text: 'We aim to acknowledge accessibility feedback within five business days. Complex issues or format requests may require additional time, but we will provide updates where reasonable.',
        },
        {
          type: 'p',
          text: 'If you require information in an accessible format or need communication support, contact us and we will work with you to provide the information in a manner that meets your needs, subject to technical, legal, and security limitations.',
        },
      ],
    },
    {
      title: '8. Regulatory Context',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva monitors and aims to meet applicable Canadian accessibility requirements. Relevant frameworks may include WCAG, the Accessible Canada Act and its regulations where they apply, the Accessibility for Ontarians with Disabilities Act, 2005 (AODA) where it applies, and other provincial accessibility laws where applicable.',
        },
        {
          type: 'p',
          text: 'As Dutiva’s user base, employee count, operations, and legal obligations evolve, we will publish accessibility plans, progress reports, and feedback-process descriptions where required by applicable law.',
        },
        {
          type: 'p',
          text: 'This Statement describes Dutiva’s current accessibility commitments and practices. It does not replace any formal accessibility plan, progress report, or feedback-process document that may be required under applicable legislation.',
        },
      ],
    },
    {
      title: '9. Updates to This Statement',
      blocks: [
        {
          type: 'p',
          text: 'We may update this Accessibility Statement from time to time to reflect changes in our platform, accessibility testing, known limitations, remediation work, or legal obligations. The “Last updated” date above indicates when this Statement was last revised.',
        },
      ],
    },
    {
      title: '10. Contact',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva Canada Inc.',
        },
        {
          type: 'p',
          text: 'Email: support@dutiva.ca',
        },
        {
          type: 'p',
          text: 'Website: dutiva.ca',
        },
      ],
    },
  ],
} satisfies PolicyEdition
