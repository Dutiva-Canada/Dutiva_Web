# Licensing Analysis — Dutiva Open-Core Assessment

This document evaluates licensing models for any future open-source release of generic Dutiva infrastructure. It does not provide legal advice. **LEGAL REVIEW REQUIRED** before selecting a license.

---

## Current state

- `LICENSE.md` at the repository root is a proprietary, all-rights-reserved license for Dutiva Canada Inc.
- No open-source license is applied to any part of the codebase today.
- Third-party dependencies remain governed by their own licenses (separately analyzed in `DEPENDENCY_LICENSE_AUDIT.md`).

---

## License candidates evaluated

### 1. MIT

**Advantages**

- Maximum adoption and minimal friction for downstream users.
- Simple, well understood by developers and enterprises.
- Compatible with almost all other permissive and copyleft licenses.

**Risks**

- Permits commercial forks with no reciprocity.
- A competitor could build a Canadian HR-compliance SaaS on top of the open code without contributing back.
- No patent grant.

**Suitability for Dutiva**

- Appropriate for the most generic layers (`dutiva-i18n`, `dutiva-ui`) if Dutiva is comfortable with unrestricted reuse.
- Less suitable for any open-core engine that Dutiva might later publish.

### 2. Apache-2.0

**Advantages**

- Permissive and business-friendly.
- Includes an explicit patent grant, which reduces patent risk for contributors and users.
- Strong compatibility with the existing dependency stack.
- Widely accepted in enterprise procurement.

**Risks**

- Still permits commercial forks without reciprocity.
- Does not prevent a competitor from using the code in a closed SaaS.

**Suitability for Dutiva**

- A good default for generic infrastructure packages.
- Better than MIT for patent clarity and enterprise trust.

### 3. AGPLv3

**Advantages**

- Strong copyleft: users who interact with the software over a network must be offered the source code.
- Deters closed SaaS forks of the open layer.
- Aligns with a philosophy of reciprocity for network services.
- Can protect against competitors using the open UI/i18n/infra to build a competing hosted product.

**Risks**

- More restrictive; some enterprises avoid AGPLv3 code.
- Requires careful architectural separation so that the copyleft license does not create uncertainty about what constitutes a "modified version" of the open packages when they are combined with Dutiva's proprietary SaaS.
- Compatibility issues with Apache-2.0 dependencies (see below).
- Must be clearly communicated so customers do not believe the whole Dutiva SaaS is AGPLv3.

**Suitability for Dutiva**

- Matches the user's stated preference for a strong copyleft approach.
- Best applied only to self-contained generic packages (`dutiva-i18n`, `dutiva-ui`, `dutiva-infra`) that do not embed proprietary Dutiva logic.

### 4. Source-available / business-source models (e.g., BSL, Elastic License, SSPL)

**Advantages**

- Maximum control over commercial use.
- Can prevent direct SaaS competition against Dutiva.
- Allows public inspection and non-commercial contribution.

**Risks**

- Not accepted as "open source" by OSI and many developer communities.
- Reduces ecosystem adoption and contributor goodwill.
- More complex license management and compliance.
- SSPL in particular is controversial and has been rejected by some organizations.

**Suitability for Dutiva**

- Consider only for the `dutiva-shared-core` engines if Dutiva later wants public visibility without full open-source rights.
- Not recommended for the generic UI/i18n/infra layers, where true open source provides more value.

---

## Dependency license compatibility

### Direct production dependencies

All production dependencies use permissive licenses (MIT or ISC). MIT and ISC are compatible with all the candidate licenses evaluated above.

### Development dependencies

- `@playwright/test` is Apache-2.0.
- `typescript` is Apache-2.0.
- All other dev dependencies are MIT.

### Transitive dependencies

- `lightningcss` and its platform-specific optional packages are **MPL-2.0**.
  - MPL-2.0 is a file-level weak copyleft license.
  - It is compatible with proprietary, MIT, Apache-2.0, and (per MPL-2.0 §3.3) LGPL/AGPL projects.
  - Dutiva's own files can remain under any license.
  - Any modifications to `lightningcss` files must remain under MPL-2.0.

### Compatibility with AGPLv3

**MIT / ISC → AGPLv3:** Compatible. Permissive code can be combined with AGPLv3 code; the combined work is governed by AGPLv3.

**Apache-2.0 → AGPLv3:** This is the most important compatibility question for Dutiva.

- The Free Software Foundation considers Apache-2.0 and GPLv3 (and therefore AGPLv3) compatible in one direction only: Apache-2.0 code can be included in a GPLv3/AGPLv3 project, and the combined work is GPLv3/AGPLv3.
- The Apache Software Foundation historically considered Apache-2.0 and GPLv3 incompatible in the other direction (GPLv3 code cannot be relicensed under Apache-2.0).
- For Dutiva this means: if the open packages include Apache-2.0 dependencies such as Playwright or TypeScript as runtime/linked components, the packages can be licensed under AGPLv3, but Dutiva cannot take external AGPLv3 contributions and relicense them under Apache-2.0.
- **Practical impact:** Playwright and TypeScript are dev/build-time dependencies, not shipped to end users, so the compatibility question is less acute than for runtime dependencies. Nevertheless, **LEGAL REVIEW REQUIRED** to confirm the intended distribution model.

**MPL-2.0 → AGPLv3:** MPL-2.0 §3.3 explicitly allows combination with copyleft licenses. Compatible.

---

## Recommended licensing model

Based on the user's decision to optimize for strong copyleft, the recommended model is:

| Package / Repository                                                                         | Recommended License                                | Rationale                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dutiva-i18n`                                                                                | AGPLv3                                             | Self-contained utility; strong reciprocity for any network use.                                                                                                            |
| `dutiva-ui`                                                                                  | AGPLv3                                             | Self-contained design-system components; network-use copyleft.                                                                                                             |
| `dutiva-infra`                                                                               | AGPLv3                                             | Generic mechanisms (error reporting, export guard, Supabase client wrapper); network-use copyleft.                                                                         |
| `dutiva-shared-core`                                                                         | Proprietary / source-available to be decided later | Document/workflow/support engines are Dutiva-controlled; do not publish now. If later opened, consider BSL/Elastic-style source-available or AGPLv3 with clear separation. |
| `dutiva-advisor`, `dutiva-compliance`, `dutiva-knowledge`, `dutiva-web`, `dutiva-enterprise` | Proprietary                                        | Core Canadian HR/compliance IP and commercial layer remain closed.                                                                                                         |

**Primary recommendation:** Apply **AGPLv3** to any packages that are published, with clear documentation that the license applies only to those packages and not to the broader Dutiva SaaS.

**Alternative if AGPLv3 creates procurement friction:** Use **Apache-2.0** for the generic packages and rely on trademark and proprietary content (templates, corpus, prompts) for the moat. This trades copyleft protection for broader enterprise adoption.

---

## Trademark considerations

Open-source licensing grants rights to the source code, not to Dutiva trademarks.

**Assets to protect:**

- The word mark **"Dutiva"** (CIPO application no. 2465617, status FORMALIZED / awaiting examination as of CANONICAL_FACTS.md).
- The **"Dutiva Advisor"** product name.
- The Dutiva logo / leaf mark (`public/brand/dutiva-leaf.png`, `public/brand/icon-app.svg`).
- The `dutiva.ca` domain and brand colors.

**Recommended trademark policy for any public repository:**

1. State that the source code is licensed under the chosen open-source license.
2. State that the "Dutiva" name, logo, and "Dutiva Advisor" name are trademarks of Dutiva Canada Inc. and may not be used without permission.
3. Permit use of the name only to refer accurately to the upstream project (nominative use).
4. Prohibit use of the marks in fork names, marketing, or SaaS branding without a written trademark license.
5. Include the policy in `TRADEMARK.md` and in every published package's README.

**LEGAL REVIEW REQUIRED** to draft trademark policy language and ensure it aligns with Canadian trademark practice.

---

## Contributor strategy

If Dutiva proceeds with public repositories, the following are recommended:

### Contribution model

- Public GitHub repositories with issue templates and pull-request templates.
- Clear `CONTRIBUTING.md` describing coding standards, bilingual string requirements, and test expectations.
- Separate private repositories for proprietary packages; do not accept PRs against closed code.

### Contributor License Agreement (CLA) or Developer Certificate of Origin (DCO)

- Use a **CLA** if Dutiva needs to retain broad relicensing or enforcement rights.
- Use a **DCO** (Signed-off-by) if Dutiva prefers a lightweight approach aligned with common open-source practice.
- **LEGAL REVIEW REQUIRED** to choose and implement either mechanism.

### Copyright ownership

- Require contributors to grant a license to their contributions.
- Keep a `NOTICE` file listing copyright holders.
- Ensure employee/contractor agreements assign IP to Dutiva Canada Inc.

### Governance

- Start with a benevolent-dictator model (founder/maintainer decides).
- Document maintainers in `MAINTAINERS.md`.
- Reserve the right to keep proprietary extensions closed.

### Release management

- Semantic versioning for published packages.
- Published changelogs.
- Breaking-change policy: at least one deprecation cycle before major version bumps for public APIs.

### Security disclosure

- Public `SECURITY.md` with an email address (`security@dutiva.ca`).
- Private security advisory process before public disclosure.
- Clear scope and safe-harbour language.

---

## Monorepo vs multi-repo licensing

| Approach                                         | Licensing implication                                                                                                                                                                    |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single monorepo with mixed open/proprietary code | Complex; root license cannot be open-source, and accidental contamination of open packages by proprietary code is a constant risk. **Not recommended.**                                  |
| Monorepo with package-level licenses             | Possible during preparation, but every package directory needs its own `LICENSE` and `package.json` license field. CI must enforce that open packages never import proprietary packages. |
| Multi-repo (recommended for public release)      | Cleanest separation; each repo has one license; external contributors cannot accidentally see proprietary code.                                                                          |

---

## Risks requiring legal review

1. **AGPLv3 + Apache-2.0 dependency compatibility** for any distribution that links or ships Apache-2.0 code.
2. **Network-use copyleft scope** — what constitutes a "modified version" when the open UI/i18n packages are consumed by the proprietary Dutiva SaaS.
3. **Trademark policy** for the Dutiva name, logo, and product names.
4. **Employee/contractor IP assignment** for any code Dutiva intends to publish.
5. **AI provider / model terms** — whether publishing client code that calls DigitalOcean Gradient AI or Hugging Face creates any additional obligations.
6. **MPL-2.0 compliance** for `lightningcss` if Dutiva ever modifies or distributes its source.
7. **Patent landscape** around HR/compliance tooling; Apache-2.0 provides a patent grant, AGPLv3 does not in the same explicit way.

---

## Summary

- **Current license:** Proprietary, all rights reserved.
- **Recommended open layer license:** AGPLv3, applied package-by-package.
- **Recommended proprietary layer license:** Remain proprietary.
- **Trademark policy:** Required before any public release.
- **Contributor process:** CLA or DCO required before accepting external contributions.
- **Dependencies:** No license blockers detected, but AGPLv3/Apache-2.0 compatibility and MPL-2.0 compliance must be confirmed by counsel.
