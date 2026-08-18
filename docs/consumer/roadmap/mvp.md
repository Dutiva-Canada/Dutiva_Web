# MVP

## Objective

The MVP proves that a trustworthy, jurisdiction-aware, consumer administrative-guidance product can deliver genuine value to individual Canadians. It intentionally does not build the full document-generation catalogue, evidence-analysis suite, or AI chat. It focuses on one core workflow, a small set of situations, and a clean separation of guidance from advice.

---

## Recommended MVP scope

### Canadian Life Admin MVP

**Target user:** A working Canadian who has recently lost a job or is dealing with a landlord repair issue and does not know the steps or deadlines.

**Primary problem:** "I have a situation. I don't know what to do next, what documents to keep, or where the rules are different because of my province."

**Core workflow:**

1. User describes their situation in plain language (or selects from a short list).
2. System asks for province/territory (or federal if relevant).
3. System maps the situation to a structured life event: **job loss** or **tenancy repair**.
4. System retrieves vetted, jurisdiction-neutral and jurisdiction-specific guidance.
5. System presents a plain-language, structured action plan:
   - what to do now;
   - what documents to gather;
   - what deadlines or dates to watch for;
   - what to avoid;
   - when to talk to a professional.
6. System offers to save the situation, capture evidence, or generate a simple letter — if those features are also in MVP.

**Included in MVP:**

- Two life-event workflows: **job loss** and **tenancy repair**.
- All 13 provinces and territories plus federal scope.
- Deterministic rule-based intake (no generative AI chat in the minimal option).
- Vetted knowledge base for the two workflows (general information and administrative guidance only; no statutory figures without source).
- Jurisdiction confirmation, not assumption.
- Confidence indicators and clear disclaimers.
- Save situation, edit, and delete.
- Account creation, language preference, profile with home jurisdiction.
- Mobile-first responsive UI.
- Bilingual EN/FR content for the two workflows.
- Standing legal disclaimer on every substantive screen.
- Escalation to a qualified professional or crisis line when appropriate.

**Explicitly excluded from MVP:**

- Generative AI chat (unless the AI-assisted MVP option is chosen — see below).
- Full document-generation catalogue.
- Full evidence-analysis / OCR / AI extraction.
- Reminders and notifications.
- Family / helper accounts.
- Municipality-level rules beyond a pointer to local resources.
- Multi-jurisdiction complex cases.
- Payment/subscription features.

**Dependencies:**

- Chosen frontend stack and hosting.
- A server-side API and database.
- A small vetted knowledge base for two workflows across 14 jurisdictions.
- Legal review of boundary statements, disclaimers, and the two workflow knowledge items.
- Privacy policy and terms (reviewed, bilingual).
- No third-party AI provider needed for deterministic MVP.

**Risks:**

- Knowledge-base maintenance for 14 jurisdictions with only two workflows is still non-trivial.
- Jurisdiction confirmation adds friction; must be designed carefully.
- Users may expect legal advice despite disclaimers.
- Competing free government resources already exist; differentiation is trust and plain-language actionability.

**Success criteria:**

- Users can complete a situation intake and receive an action plan in under 5 minutes.
- Jurisdiction is confirmed in >80% of completed intakes.
- Users report the action plan is helpful (qualitative survey or follow-up).
- No user-facing statutory figure is unverified or model-generated.
- Support tickets about incorrect legal information are near zero.
- Escalation paths are used appropriately.

---

## MVP Option 1: Deterministic (recommended as lowest risk)

- Intake is a structured, branching questionnaire.
- Situation classification uses rule-based mapping, not an LLM.
- Guidance is assembled from vetted knowledge items deterministically.
- Document generation and evidence capture are lightweight or absent.
- No LLM provider dependency; lower cost, lower risk, faster to launch.

**Pros:** No hallucination risk from the core engine; easy to test; lowest legal exposure.  
**Cons:** Less flexible intake; fewer "surprise" use cases; may feel like a form.

---

## MVP Option 2: AI-assisted intake with deterministic grounding

- User describes the situation in free text.
- A lightweight LLM classifies the situation, proposes a life event, and asks clarifying questions.
- A deterministic safety backstop:
  - crisis/distress intercept;
  - jurisdiction gate (must confirm province/territory);
  - statutory-figure gate (no figures until jurisdiction confirmed and table present);
  - escalation gate (high-risk situations route to professional).
- Guidance is still retrieved from vetted knowledge items; the LLM explains steps in plain language but does not author legal facts.
- AI usage is metered and opt-in where evidence analysis is concerned.

**Pros:** More natural user experience; handles open-ended input; demonstrates AI value.  
**Cons:** Requires LLM provider, usage guardrails, safety testing, and monitoring; higher cost and legal review surface; risk of misuse or prompt injection.

---

## Document Generation MVP

If included, the Document Generation MVP is deliberately small:

- Two low-risk templates:
  - **Repair request to landlord** (housing category).
  - **Record of Employment request** (employment category).
- Wizard with structured questions, live preview, and non-removable disclaimer.
- Bilingual EN/FR.
- No high-risk templates, no prohibited categories, no signature or filing features.
- Generated documents can be downloaded as PDF.

**Explicitly excluded:**

- Full catalogue;
- Word export;
- E-signing;
- Sharing workflows;
- Prohibited or high-risk templates.

---

## Personal Evidence Locker MVP

If included, the Evidence Locker MVP is a basic secure repository:

- Upload and organize evidence into cases/situations.
- Add title, description, date, category, tags, and linked people.
- Build a simple timeline of events.
- Export a case package (ZIP with originals + manifest).
- No AI analysis, no OCR, no sharing in MVP.

**Explicitly excluded:**

- AI extraction;
- OCR;
- Sharing and helper access;
- Advanced integrity verification UI (hash is stored but may not be surfaced).

---

## Recommended MVP composition

| Product | MVP scope | In MVP? |
|---|---|---|
| Canadian Life Admin | Two workflows, deterministic or AI-assisted intake, jurisdiction gate, disclaimers, save/delete | **Yes — core** |
| Canadian Document Generation | Two low-risk templates (repair request, ROE request) | Optional, but recommended if Life Admin handoff is tested |
| Personal Evidence Locker | Basic upload/organize/timeline/export | Optional, but recommended if evidence handoff is tested |

The smallest viable MVP is Canadian Life Admin with deterministic intake. Document Generation and Evidence Locker can be added in Phase 2 if they are not included in MVP.

---

## Open MVP decisions

- Which intake mode: deterministic or AI-assisted?
- Which two Life Admin workflows to start with (job loss + tenancy repair are suggested, but other high-frequency, lower-risk pairs are possible).
- Whether to include Document Generation and/or Evidence Locker in MVP or defer to Phase 2.
- Whether to launch under Dutiva brand, a sub-brand, or a separate brand.
- Whether to require account creation before intake or allow an anonymous preview.
- Whether to include French from day one or launch English-first in a single province.

These are tracked in `decisions/open-questions.md`.
