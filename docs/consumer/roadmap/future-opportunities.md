# Future Opportunities

## Purpose

This document lists longer-term opportunities for the consumer product family. None of these are committed scope. They are ideas to consider once the core platform is stable, legally reviewed, and trusted by users.

---

## Product expansion

### New life-event domains

- **Estate administration** — plain-language checklists for executors and family members, with strong professional-referral boundaries.
- **Immigration and citizenship** — document checklists and timelines, without preparing applications or giving immigration advice.
- **Tax preparation support** — document organization, record keeping, and checklists; no tax filing or tax advice.
- **Education and student life** — enrollment, student loans, accommodation, records requests.
- **Healthcare navigation** — record requests, consent forms, insurance appeals; no medical advice.
- **Small business / side hustle** — invoice templates, record-keeping workflows, HST/GST checklists, contract review guidance.
- **Seniors and caregivers** — power-of-attorney information (not document generation), retirement benefit checklists, record keeping.

### Family and household accounts

- Family plan with multiple profiles under one billing account.
- Shared cases with granular permissions (view, edit, upload, export).
- Designated "helper" role for adult children assisting aging parents.
- Revocable access and full audit of helper actions.

### Municipality and hyper-local coverage

- City-specific bylaw information (noise, rental licensing, zoning, transit).
- Integration with open-data feeds where available.
- Crowdsourced or partner-verified local resources (with clear provenance).

---

## Document generation expansion

### New categories

- Small-business correspondence (invoices, late-payment reminders, contract amendments).
- Insurance claim letters.
- Neighbourhood / community issue correspondence.
- Formal school / landlord / employer records requests.
- Standardized authorization and consent letters.

### Format and delivery

- E-signing integration (provider-agnostic envelope model).
- Certified/tracked delivery options (Canada Post, registered email).
- Accessible tagged PDF output.
- Plain-language summaries alongside formal documents.

### Professional-review marketplace

- Optional paid review by vetted paralegals, lawyers, or tenant advocates.
- Review status embedded in document metadata.
- Clear separation between product-generated draft and professional-reviewed final.

---

## Evidence locker expansion

### Advanced intelligence

- Automatic document classification (e.g., contract, lease, pay stub, letter).
- Entity resolution across cases (e.g., same landlord appears in multiple disputes).
- Deadline extraction and proactive reminders.
- Contradiction detection across cases.
- Evidence-quality scoring (completeness, relevance, date coverage).

### Integrations

- Email import (Gmail, Outlook) with user consent.
- Cloud storage import (Google Drive, OneDrive, Dropbox).
- Government account linking where APIs are available (CRA My Account, Service Canada, provincial services — subject to privacy and terms).
- Calendar integration for deadlines.

### Sharing and collaboration

- Secure vault for sharing with a lawyer, accountant, or family member.
- Time-limited access with revocation.
- Activity dashboards for shared cases.

---

## AI and automation

### Conversational AI

- Persistent chat with memory of confirmed facts.
- Proactive check-ins when a situation has upcoming deadlines.
- Multi-turn interviews to complete complex workflows.

### Predictive assistance

- Suggest situations the user may face based on life events (e.g., after job loss, suggest tax slip timeline).
- Surface relevant templates and evidence requests before the user asks.

### Automated monitoring

- Monitor selected government websites for changes relevant to the user's saved situations.
- Notify users of relevant legislative changes (with source links and review status).

---

## Trust and compliance

### Certifications and assessments

- Third-party security audit (SOC 2 Type II, ISO 27001).
- Privacy impact assessment by external counsel.
- Accessibility conformance report (WCAG 2.1 AAA target).
- AI transparency and safety audit.

### Transparency tools

- Public trust centre with security, privacy, and AI practices.
- User-facing explanation of how AI was used in a recommendation.
- "Why did I get this recommendation?" feature.

### Advocacy and education

- Free public guides on common Canadian administrative topics (no statutory figures).
- Partnerships with legal-aid clinics, tenant advocacy groups, and community organizations.
- Bilingual educational content for newcomers.

---

## Business model opportunities

- **Subscription tiers:** free, premium, family, professional (e.g., landlords, small-business owners).
- **Usage bundles:** document-generation credits, evidence storage tiers, AI analysis credits.
- **Professional referrals:** vetted partner network; product takes no success fee to avoid conflicts of interest.
- **Enterprise / white-label:** licensed platform for legal clinics, HR consultancies, or employee-assistance programs (requires careful boundary management).
- **Open-source generic packages:** release `dutiva-i18n`, `dutiva-ui`, `dutiva-infra` under AGPLv3 per the existing open-core proposal, with consumer-specific knowledge kept proprietary.

---

## Risks to monitor

| Opportunity | Risk |
|---|---|
| Estate, immigration, tax, health domains | High regulated-professional exposure; requires careful scope boundaries. |
| Municipality coverage | Fragmented sources, rapid changes, many edge cases. |
| E-signing / certified delivery | Vendor lock-in, legal validity questions across jurisdictions. |
| Professional-review marketplace | Potential to be seen as referral fee / unauthorized practice; requires legal review. |
| Government account linking | OAuth scope, privacy terms, data-residency, and reliability risks. |
| AI predictive assistance | Could feel intrusive or create liability if recommendations are wrong. |
| Enterprise white-label | Brand dilution and boundary confusion with professional services. |

---

## Evaluation criteria for future opportunities

Before any future opportunity moves from this list to the roadmap, it must be evaluated against:

1. **Trust impact** — does it strengthen or weaken user trust?
2. **Legal exposure** — does it risk unauthorized practice, privacy, or consumer-protection issues?
3. **Knowledge maintenance burden** — can the knowledge base be kept current and reviewed?
4. **Technical feasibility** — can it be built securely and maintainably?
5. **Market need** — is there genuine consumer demand?
6. **Differentiation** — does it leverage the platform's moat (Canadian jurisdiction graph, source provenance, evidence graph, bilingual support)?
