# Dependency License Audit — Dutiva Open-Core Assessment

This document audits the licenses of dependencies declared in `package.json` and `package-lock.json`, and evaluates their compatibility with a future open-source release under a copyleft license. It does not provide legal advice. **LEGAL REVIEW REQUIRED** for any license decision.

---

## Audit scope and method

- **Files inspected:** `package.json`, `package-lock.json`.
- **Service inspected:** `services/attachment-scanner/package.json`.
- **Method:** License fields were read from each direct dependency via `npm view`, and `package-lock.json` was searched for copyleft/source-available license strings.
- **Limitations:** A full transitive dependency audit would require a dedicated license scanner (e.g., `license-checker`, `fossa`, `snyk`). The audit below covers direct dependencies and known transitive concerns identified from the lockfile.

---

## Direct production dependencies

| Package | Declared range | Resolved version | License | Direct / transitive | Permissive? | Copyleft? | Notes |
|---|---|---|---|---|---|---|---|
| `@supabase/supabase-js` | `^2.110.2` | `2.110.2` | MIT | Direct | Yes | No | Supabase client SDK |
| `@tailwindcss/vite` | `^4.3.2` | `4.3.2` | MIT | Direct | Yes | No | Tailwind v4 Vite plugin |
| `lucide-react` | `^0.542.0` | `0.542.0` | ISC | Direct | Yes | No | Icon library |
| `react` | `^19.2.7` | `19.2.7` | MIT | Direct | Yes | No | React framework |
| `react-dom` | `^19.2.7` | `19.2.7` | MIT | Direct | Yes | No | React DOM |
| `react-markdown` | `^10.1.0` | `10.1.0` | MIT | Direct | Yes | No | Markdown renderer |
| `react-router-dom` | `^7.18.1` | `7.18.1` | MIT | Direct | Yes | No | Routing library |
| `recharts` | `^3.10.1` | `3.10.1` | MIT | Direct | Yes | No | Charting library |
| `remark-gfm` | `^4.0.1` | `4.0.1` | MIT | Direct | Yes | No | GitHub-flavored Markdown plugin |
| `tailwindcss` | `^4.3.2` | `4.3.2` | MIT | Direct | Yes | No | CSS framework |
| `zod` | `^4.4.3` | `4.4.3` | MIT | Direct | Yes | No | Schema validation |

**Result:** All 11 direct production dependencies use permissive licenses (MIT or ISC). No copyleft, source-available, or custom commercial licenses were found.

---

## Development dependencies

| Package | Declared range | Resolved version | License | Direct / transitive | Notes |
|---|---|---|---|---|---|
| `@babel/parser` | `^7.29.7` | `7.29.7` | MIT | Dev | Used by the dev source-location Vite plugin |
| `@playwright/test` | `^1.62.1` | `1.62.1` | Apache-2.0 | Dev | E2E testing |
| `@testing-library/jest-dom` | `^6.9.1` | `6.9.1` | MIT | Dev | Test assertions |
| `@testing-library/react` | `^16.3.2` | `16.3.2` | MIT | Dev | React test utilities |
| `@testing-library/user-event` | `^14.6.1` | `14.6.1` | MIT | Dev | User-event simulation |
| `@types/node` | `^24.13.2` | `24.13.2` | MIT | Dev | Node types |
| `@types/react` | `^19.2.17` | `19.2.17` | MIT | Dev | React types |
| `@types/react-dom` | `^19.2.3` | `19.2.3` | MIT | Dev | React DOM types |
| `@vitejs/plugin-react` | `^6.0.3` | `6.0.3` | MIT | Dev | Vite React plugin |
| `@vitest/coverage-v8` | `^4.1.10` | `4.1.10` | MIT | Dev | Vitest coverage |
| `jsdom` | `^29.1.1` | `29.1.1` | MIT | Dev | Browser environment for tests |
| `magic-string` | `^0.30.21` | `0.30.21` | MIT | Dev | Source manipulation in Vite plugin |
| `oxlint` | `^1.71.0` | `1.71.0` | MIT | Dev | Linter |
| `prettier` | `^3.9.4` | `3.9.4` | MIT | Dev | Formatter |
| `typescript` | `~6.0.2` | `6.0.2` | Apache-2.0 | Dev | TypeScript compiler |
| `vite` | `^8.1.1` | `8.1.1` | MIT | Dev | Build tool |
| `vitest` | `^4.1.10` | `4.1.10` | MIT | Dev | Test runner |

**Result:** All dev dependencies are permissive. `@playwright/test` and `typescript` are Apache-2.0; the rest are MIT.

---

## Attachment scanner service

| File | Production deps | License concern |
|---|---|---|
| `services/attachment-scanner/package.json` | None declared | None |
| `services/attachment-scanner/server.js` | Uses Node built-ins + `express` (not declared in package.json) | **Not determined from repository evidence** — the service's dependency manifest is incomplete; production install behavior should be verified |

**Recommendation:** If `services/attachment-scanner` is published or distributed, its runtime dependencies must be declared and audited.

---

## Transitive dependencies of concern

### `lightningcss` family — MPL-2.0

`package-lock.json` contains 12 MPL-2.0 entries. All are `lightningcss` and its platform-specific optional packages:

| Package | Version | License | How it is reached |
|---|---|---|---|
| `lightningcss` | `1.32.0` | MPL-2.0 | Vite → lightningcss; `@tailwindcss/node` → lightningcss |
| `lightningcss-android-arm64` | `1.32.0` | MPL-2.0 | Optional dependency of `lightningcss` |
| `lightningcss-darwin-arm64` | `1.32.0` | MPL-2.0 | Optional dependency of `lightningcss` |
| `lightningcss-darwin-x64` | `1.32.0` | MPL-2.0 | Optional dependency of `lightningcss` |
| `lightningcss-freebsd-x64` | `1.32.0` | MPL-2.0 | Optional dependency of `lightningcss` |
| `lightningcss-linux-arm-gnueabihf` | `1.32.0` | MPL-2.0 | Optional dependency of `lightningcss` |
| `lightningcss-linux-arm64-gnu` | `1.32.0` | MPL-2.0 | Optional dependency of `lightningcss` |
| `lightningcss-linux-arm64-musl` | `1.32.0` | MPL-2.0 | Optional dependency of `lightningcss` |
| `lightningcss-linux-x64-gnu` | `1.32.0` | MPL-2.0 | Optional dependency of `lightningcss` |
| `lightningcss-linux-x64-musl` | `1.32.0` | MPL-2.0 | Optional dependency of `lightningcss` |
| `lightningcss-win32-arm64-msvc` | `1.32.0` | MPL-2.0 | Optional dependency of `lightningcss` |
| `lightningcss-win32-x64-msvc` | `1.32.0` | MPL-2.0 | Optional dependency of `lightningcss` |

**MPL-2.0 summary:**
- File-level weak copyleft.
- Modifications to MPL-licensed files must remain under MPL-2.0.
- The license does not "infect" other files in the project.
- Compatible with proprietary, MIT, Apache-2.0, and (per MPL-2.0 §3.3) GPLv3/AGPLv3 projects.

**Risk for Dutiva:** Low. `lightningcss` is a build-time dependency. Dutiva is not modifying it. Attribution and license notice should be preserved as usual.

### No strong copyleft detected

A search of `package-lock.json` for `GPL`, `AGPL`, `LGPL`, `SSPL`, `Elastic`, `BUSL`, or `proprietary` found only the MPL-2.0 entries above. No GPL/AGPL/LGPL/SSPL/custom commercial dependencies were detected.

---

## AI / model / data-specific dependencies

No AI model SDK, embedding library, vector database client, or training-data utility is declared in `package.json`. Dutiva's AI usage is implemented via raw `fetch` calls in Supabase Edge Functions to remote providers (DigitalOcean Gradient AI, Hugging Face, OpenAI-compatible chat-completions endpoints).

**Implications:**
- No model weights or datasets are redistributed in the npm dependency tree.
- Obligations from AI providers arise from the terms of service of those remote APIs, not from npm licenses.
- **LEGAL REVIEW REQUIRED** to confirm compliance with DigitalOcean Gradient AI, Hugging Face, and any future model-provider terms, especially for commercial use and data retention.

---

## License compatibility with proposed AGPLv3 open layer

| License | Can be used in an AGPLv3 package? | Notes |
|---|---|---|
| MIT | Yes | Permissive; can be relicensed under AGPLv3 in combined work. |
| ISC | Yes | Same as MIT. |
| Apache-2.0 | Generally yes, with caveats | FSF considers Apache-2.0 and GPLv3 one-way compatible. Apache-2.0 code can be included in an AGPLv3 project, and the combined work is AGPLv3. The reverse is not allowed. **Legal review recommended** because Playwright and TypeScript are dev dependencies and not shipped to end users, which reduces risk. |
| MPL-2.0 | Yes | MPL-2.0 §3.3 explicitly allows combination with copyleft licenses. |

**Compatibility conclusion:** The current dependency stack does not create an obvious legal blocker to licensing the generic open packages under AGPLv3. The Apache-2.0 dev dependencies should be reviewed by counsel, but they are build-time tools, not runtime components.

---

## Redistribution and attribution obligations

- **MIT / ISC / Apache-2.0:** Preserve copyright notices, license text, and disclaimers. Include a `NOTICE` or `THIRD-PARTY-LICENSES` file if required.
- **MPL-2.0:** Preserve MPL notices for `lightningcss`. No obligation to disclose Dutiva's own source.

---

## Items requiring legal review

1. **AGPLv3 + Apache-2.0 interaction** for any published package that depends on or ships TypeScript/Playwright code.
2. **MPL-2.0 compliance** if Dutiva ever modifies or redistributes `lightningcss` source.
3. **AI provider terms** (DigitalOcean Gradient AI, Hugging Face) for commercial use and data handling.
4. **Complete transitive audit** using a dedicated license scanner before public release.
5. **`services/attachment-scanner` runtime dependencies** are not declared; must be audited before distribution.

---

## Summary

- **Production dependency risk:** Low. All direct production dependencies are permissive (MIT/ISC).
- **Development dependency risk:** Low. All dev dependencies are permissive (MIT/Apache-2.0).
- **Transitive copyleft risk:** Low. Only `lightningcss` (MPL-2.0, weak copyleft, build-time) was found.
- **AI dependency risk:** Low for redistribution (no model SDKs/weights in repo), but provider terms must be reviewed.
- **Compatibility with AGPLv3:** No blockers detected, but Apache-2.0 dev-dependency compatibility and MPL-2.0 notice preservation require counsel confirmation.
