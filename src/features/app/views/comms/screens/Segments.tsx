import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { Bi } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormField'
import { useStakeholders } from '../data/useStakeholders'
import { useSegments } from '../data/useSegments'
import type { CommsContact, CommsSegment, CommsSegmentMembership } from '../data/types'
import { CONTACT_TYPE_LABEL } from '../commsLabels'

/**
 * Segments screen — groups of contacts used for targeted outreach.
 *
 * Demo mode renders the fixture segments read-only (`canWrite === false`);
 * production mode persists through `useSegments`, which deletes a segment's
 * memberships before the segment itself (the schema does not cascade).
 */

type SegmentDraft = { name: Bi; description?: Bi }

function biInput(value: string, lang: 'en' | 'fr'): Bi | undefined {
  const text = value.trim()
  if (!text) return undefined
  return lang === 'fr'
    ? { en: `[EN review] ${text}`, fr: text }
    : { en: text, fr: `[FR review] ${text}` }
}

function SegmentForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: CommsSegment
  onCancel: () => void
  onSubmit: (item: SegmentDraft) => void
}) {
  const { x, lang } = useI18n()
  const [name, setName] = useState(initial ? pick(initial.name, lang) : '')
  const [description, setDescription] = useState(
    initial?.description ? pick(initial.description, lang) : '',
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit({
      name: biInput(trimmed, lang) ?? { en: trimmed, fr: trimmed },
      description: biInput(description, lang),
    })
    onCancel()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] rounded-[10px] border border-border bg-inset p-[14px]"
    >
      <div className="grid grid-cols-1 gap-[14px]">
        <FormField label={x(M.comms_segments_name)}>
          <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label={x(M.comms_segments_description)}>
          <FormTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </FormField>
      </div>
      <div className="mt-[14px] flex gap-[8px]">
        <button
          type="submit"
          className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
        >
          {initial ? x(M.comms_save) : x(M.comms_create)}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
        >
          {x(M.comms_cancel)}
        </button>
      </div>
    </form>
  )
}

function SegmentCard({
  segment,
  memberships,
  contacts,
  organizationName,
  canWrite,
  onUpdate,
  onDelete,
  onAddContact,
  onRemoveContact,
}: {
  segment: CommsSegment
  memberships: CommsSegmentMembership[]
  contacts: CommsContact[]
  organizationName: (id?: string) => string | undefined
  canWrite: boolean
  onUpdate: (id: string, patch: Partial<CommsSegment>) => void
  onDelete: (id: string) => void
  onAddContact: (contactId: string, segmentId: string) => void
  onRemoveContact: (membershipId: string) => void
}) {
  const { x } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [contactChoice, setContactChoice] = useState('')

  const memberRows = memberships
    .map((membership) => ({
      membership,
      contact: contacts.find((c) => c.id === membership.contactId),
    }))
    .filter(
      (row): row is { membership: CommsSegmentMembership; contact: CommsContact } =>
        row.contact != null,
    )

  const memberIds = new Set(memberships.map((m) => m.contactId))
  const availableContacts = contacts.filter((c) => !memberIds.has(c.id))

  const handleDelete = () => {
    if (window.confirm(x(M.comms_segments_delete_confirm))) {
      onDelete(segment.id)
    }
  }

  const handleAddContact = () => {
    if (!contactChoice) return
    onAddContact(contactChoice, segment.id)
    setContactChoice('')
  }

  return (
    <li className="rounded-[10px] border border-border bg-surface p-[14px]">
      <div className="flex items-start justify-between gap-[12px]">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-[8px] border-none bg-transparent p-0 text-left font-sans"
        >
          {expanded ? (
            <ChevronDown size={15} className="mt-[2px] shrink-0 text-text-muted" aria-hidden="true" />
          ) : (
            <ChevronRight size={15} className="mt-[2px] shrink-0 text-text-muted" aria-hidden="true" />
          )}
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold text-text">{x(segment.name)}</span>
            {segment.description && (
              <span className="mt-[2px] block text-[12px] text-text-muted">
                {x(segment.description)}
              </span>
            )}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-[8px]">
          <span className="rounded-[100px] bg-accent-soft px-[8px] py-[2px] text-[11px] font-semibold text-accent">
            {memberships.length} {x(M.comms_segments_members_count)}
          </span>
          {canWrite && (
            <>
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                aria-label={x(M.comms_edit)}
                className="text-text-muted hover:text-text"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                aria-label={x(M.comms_remove)}
                className="text-text-muted hover:text-risk-fg"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {editing && canWrite && (
        <div className="mt-[10px]">
          <SegmentForm
            initial={segment}
            onCancel={() => setEditing(false)}
            onSubmit={(item) => onUpdate(segment.id, item)}
          />
        </div>
      )}

      {expanded && (
        <div className="mt-[12px] border-t border-border-soft pt-[12px]">
          <h4 className="m-0 mb-[8px] text-[12px] font-semibold text-text-3">
            {x(M.comms_segments_contacts)}
          </h4>
          {memberRows.length === 0 ? (
            <p className="m-0 text-[12.5px] text-text-muted">
              {x(M.comms_segments_contacts_empty)}
            </p>
          ) : (
            <ul className="m-0 flex flex-col gap-[8px] p-0">
              {memberRows.map(({ membership, contact }) => (
                <li
                  key={membership.id}
                  className="flex items-start justify-between gap-[12px] rounded-[8px] bg-inset p-[10px]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-[8px]">
                      <span className="text-[13.5px] font-semibold text-text">{contact.name}</span>
                      <span className="rounded-[100px] bg-accent-soft px-[8px] py-[2px] text-[11px] font-semibold text-accent">
                        {x(CONTACT_TYPE_LABEL[contact.type])}
                      </span>
                      {!contact.active && (
                        <span className="rounded-[100px] bg-surface px-[8px] py-[2px] text-[11px] font-semibold text-text-muted">
                          {x(M.comms_content_status_withdrawn)}
                        </span>
                      )}
                    </div>
                    {organizationName(contact.organizationId) && (
                      <div className="mt-[2px] text-[12px] text-text-muted">
                        {organizationName(contact.organizationId)}
                      </div>
                    )}
                  </div>
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => onRemoveContact(membership.id)}
                      aria-label={x(M.comms_segments_remove_contact)}
                      className="shrink-0 text-text-muted hover:text-risk-fg"
                    >
                      <X size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canWrite && availableContacts.length > 0 && (
            <div className="mt-[10px] flex items-end gap-[8px]">
              <div className="flex-1">
                <FormField label={x(M.comms_segments_add_contact)}>
                  <FormSelect
                    value={contactChoice}
                    onChange={(e) => setContactChoice(e.target.value)}
                  >
                    <option value="">{x(M.comms_segments_add_contact)}</option>
                    {availableContacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>
              </div>
              <button
                type="button"
                onClick={handleAddContact}
                disabled={!contactChoice}
                className="rounded-[8px] border-none bg-navy px-[12px] py-[9px] font-sans text-[12.5px] font-semibold text-white disabled:opacity-50"
              >
                {x(M.comms_add)}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export function Segments() {
  const { x } = useI18n()
  const {
    contacts,
    organizations,
    loading: contactsLoading,
  } = useStakeholders()
  const {
    segments,
    segmentMemberships,
    loading,
    canWrite,
    addSegment,
    updateSegment,
    removeSegment,
    addContact: addMember,
    removeContact: removeMember,
  } = useSegments()
  const [adding, setAdding] = useState(false)

  const membershipsBySegment = useMemo(() => {
    const map = new Map<string, CommsSegmentMembership[]>()
    for (const m of segmentMemberships) {
      const list = map.get(m.segmentId) ?? []
      list.push(m)
      map.set(m.segmentId, list)
    }
    return map
  }, [segmentMemberships])

  const organizationName = (id?: string) => organizations.find((o) => o.id === id)?.name

  if (loading || contactsLoading) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <div className="text-[13px] text-text-muted">{x(M.comms_loading)}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-start justify-between gap-[12px]">
        <div>
          <h2 className="m-0 text-[18px] font-semibold text-text">{x(M.comms_segments_title)}</h2>
          <p className="m-0 mt-[4px] text-[13px] text-text-muted">
            {x(M.comms_segments_subtitle)}
          </p>
        </div>
        {canWrite && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
          >
            <Plus size={14} aria-hidden="true" />
            {x(M.comms_segments_add)}
          </button>
        )}
      </div>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        {adding && canWrite && (
          <SegmentForm
            onCancel={() => setAdding(false)}
            onSubmit={(item) => void addSegment(item)}
          />
        )}

        {segments.length === 0 ? (
          <p className="m-0 text-[13px] text-text-muted">{x(M.comms_segments_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {segments.map((segment) => (
              <SegmentCard
                key={segment.id}
                segment={segment}
                memberships={membershipsBySegment.get(segment.id) ?? []}
                contacts={contacts}
                organizationName={organizationName}
                canWrite={canWrite}
                onUpdate={(id, patch) => void updateSegment(id, patch)}
                onDelete={(id) => void removeSegment(id)}
                onAddContact={(contactId, segmentId) => void addMember(contactId, segmentId)}
                onRemoveContact={(membershipId) => void removeMember(membershipId)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
