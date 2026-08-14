# Timeline Model

## Purpose

A situation should be representable as a chronological record. This document defines the conceptual timeline model: events, dates, evidence, sources, and notes.

---

## Core concept

A timeline is an ordered collection of events associated with a case or situation. Each event represents something that happened, with optional links to evidence, documents, people, and notes.

```text
Event → date → evidence → source → notes
```

---

## Event attributes

| Attribute | Description |
|---|---|
| `id` | Stable identifier. |
| `case_id` | The case/situation this event belongs to. |
| `event_date` | The date the event occurred. May be exact or approximate. |
| `date_precision` | exact, month, year, approximate, unknown. |
| `title` | Short event label. |
| `description` | Longer description. |
| `linked_evidence_ids` | Evidence items that support this event. |
| `linked_document_ids` | Generated or uploaded documents related to this event. |
| `linked_person_ids` | People or organizations involved. |
| `source` | Where the event came from: user, evidence_interpretation, document, system_suggestion. |
| `confidence` | confirmed, inferred. |
| `notes` | Free-text user notes. |
| `created_at`, `updated_at` | Timestamps. |

---

## Date precision

`TM-REQ-001`: The system SHALL support multiple levels of date precision:

- **exact** — a specific date, e.g., 2026-08-14.
- **month** — a month, e.g., 2026-08.
- **year** — a year, e.g., 2026.
- **approximate** — a known-approximate date with an explicit note (e.g., "around mid-August 2026").
- **unknown** — the date is not known; the event can still be placed manually.

`TM-REQ-002`: The system SHALL display date precision visually so the user can see how certain a date is.

`TM-REQ-003`: The system SHALL sort events by best-known date, with uncertain dates placed according to the user's preference or at the end of the period.

---

## Event sources

| Source | Description | Confidence |
|---|---|---|
| `user` | User created the event directly. | confirmed |
| `evidence_interpretation` | Suggested by AI or OCR extraction from evidence. | inferred |
| `document` | Derived from a generated or uploaded document. | confirmed / inferred |
| `system_suggestion` | Proposed by the system based on workflow or case context. | inferred |

`TM-REQ-004`: Events from an inferred source SHALL be clearly labeled and editable by the user.

`TM-REQ-005`: Events derived from AI interpretation SHALL be stored as inferred and linked to the `EvidenceInterpretation` that produced them.

---

## Building a timeline

### From evidence

- Evidence items (e.g., emails, letters, photos) have dates.
- The system can suggest events from evidence dates, AI-extracted dates, or user-provided dates.
- Each suggested event links back to the evidence item.
- The user reviews and confirms, edits, or dismisses suggestions.

### From workflow steps

- A Life Admin workflow may generate tasks and deadlines.
- Completed or due tasks can become events (e.g., "sent resignation letter", "landlord received repair request").
- The user controls whether workflow actions appear in the timeline.

### From documents

- Generated documents (e.g., complaint letter) can be linked to an event (e.g., "submitted complaint").
- Uploaded documents with known dates can seed events.

### Manual entry

- The user can add events directly, with title, date, precision, description, and linked items.

---

## Event relationships

`TM-REQ-006`: The system SHALL support linking events to:

- evidence items;
- documents (generated or uploaded);
- people / organizations;
- tasks / deadlines;
- other related events.

`TM-REQ-007`: The system SHALL allow the user to add, edit, reorder, and remove events.

`TM-REQ-008`: The system SHALL support adding free-text notes to any event.

`TM-REQ-009`: The system SHALL support grouping or filtering the timeline by category, source, confidence, or linked entity.

---

## Uncertainty and contradictions

`TM-REQ-010`: The system SHALL allow users to record uncertainty in event dates and descriptions.

`TM-REQ-011`: The system MAY flag potential contradictions (e.g., two events that cannot both be true, evidence dates that conflict with event dates) as interpretations, not as facts.

`TM-REQ-012`: The user SHALL be able to resolve contradictions by editing events, adding notes, or dismissing AI suggestions.

---

## Timeline views

`TM-REQ-013`: The system SHALL provide at least two timeline views:

- **List view** — events sorted by date with filters and search.
- **Visual timeline** — a horizontal or vertical chronological display.

`TM-REQ-014`: The timeline SHALL be accessible (keyboard navigable, screen-reader friendly, with proper heading structure and labels).

`TM-REQ-015`: The timeline SHALL support zooming or grouping by date range (e.g., day, week, month, year) for long cases.

---

## Export

`TM-REQ-016`: The timeline SHALL be exportable as part of a case package.

`TM-REQ-017`: Exported timelines SHALL include:

- event title, date, precision, description;
- linked evidence items (by reference or included, depending on export scope);
- linked documents;
- source and confidence;
- user notes.

`TM-REQ-018`: Exported timelines SHALL distinguish confirmed user-entered events from inferred AI-suggested events.

---

## Integration with other products

- **Life Admin**: A workflow can seed a case and an initial timeline with key events.
- **Document Generation**: Generated documents can be linked to timeline events.
- **Evidence Locker**: Evidence items are the primary source of timeline events and supporting material.

`TM-REQ-019`: Timeline events SHALL be bidirectionally linked to related evidence, documents, and workflow tasks where applicable.

---

## Requirements trace

- `PEL-REQ-009` to `PEL-REQ-011` — timeline support and event attributes.
- `PEL-REQ-007` to `PEL-REQ-008` — AI-suggested dates and confidence.
- `PEL-REQ-060` to `PEL-REQ-061` — confirmed vs inferred dates in exports.
