import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import type { FinanceCurrency } from '../data/types'

export function PartyForm({
  onSubmit,
  onCancel,
  entities,
}: {
  onSubmit: (p: Omit<import('../data/types').FinanceParty, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [name, setName] = useState('')
  const [type, setType] = useState<import('../data/types').FinancePartyType>('supplier')
  const [bankingDetailsOnFile, setBankingDetailsOnFile] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      name,
      type,
      bankingDetailsOnFile,
      contactName: contactName.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      active: true,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]"
    >
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_entity)}</span>
          <select
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.legalName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_party_name)}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_party_type)}</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as import('../data/types').FinancePartyType)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            <option value="supplier">{x(M.finance_party_type_supplier)}</option>
            <option value="customer">{x(M.finance_party_type_customer)}</option>
            <option value="employee">{x(M.finance_party_type_employee)}</option>
            <option value="bank">{x(M.finance_party_type_bank)}</option>
            <option value="advisor">{x(M.finance_party_type_advisor)}</option>
            <option value="investor">{x(M.finance_party_type_investor)}</option>
            <option value="lender">{x(M.finance_party_type_lender)}</option>
          </select>
        </label>
        <label className="flex items-center gap-[6px] pt-[20px]">
          <input
            type="checkbox"
            checked={bankingDetailsOnFile}
            onChange={(e) => setBankingDetailsOnFile(e.target.checked)}
          />
          <span className="text-[12px] text-text-muted">{x(M.finance_party_banking_on_file)}</span>
        </label>
      </div>
      {/* Point of contact — mainly used for investors/lenders on the
          Deals tab, but the columns exist on every party. */}
      <div className="grid grid-cols-3 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_party_contact_name)}</span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_party_contact_email)}</span>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_party_contact_phone)}</span>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
      </div>
      <div className="flex justify-end gap-[8px]">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border"
        >
          {x(M.finance_cancel)}
        </button>
        <button
          type="submit"
          className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white"
        >
          {x(M.finance_save)}
        </button>
      </div>
    </form>
  )
}

export function SubscriptionForm({
  onSubmit,
  onCancel,
  entities,
  parties,
}: {
  onSubmit: (s: Omit<import('../data/types').FinanceSubscription, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
  parties: import('../data/types').FinanceParty[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [label, setLabel] = useState('')
  const [supplierId, setSupplierId] = useState(parties.find((p) => p.type === 'supplier')?.id ?? '')
  const [cost, setCost] = useState('0.00')
  const [currency] = useState<FinanceCurrency>('CAD')
  const [renewalTerm, setRenewalTerm] = useState('')
  const [nextRenewalDate, setNextRenewalDate] = useState('')
  const [noticeDate, setNoticeDate] = useState('')
  const [owner, setOwner] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      label: { en: label, fr: label },
      supplierId,
      cost: Number(cost).toFixed(2),
      currency,
      renewalTerm: { en: renewalTerm, fr: renewalTerm },
      nextRenewalDate,
      noticeDate: noticeDate || undefined,
      owner: owner || 'Workspace user',
      active: true,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]"
    >
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_entity)}</span>
          <select
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.legalName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_subscription_label)}</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_subscription_supplier)}</span>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            <option value="">—</option>
            {parties
              .filter((p) => p.type === 'supplier')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_subscription_cost)}</span>
          <input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">
            {x(M.finance_subscription_renewal_term)}
          </span>
          <input
            value={renewalTerm}
            onChange={(e) => setRenewalTerm(e.target.value)}
            placeholder="Annual"
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">
            {x(M.finance_subscription_next_renewal)}
          </span>
          <input
            type="date"
            value={nextRenewalDate}
            onChange={(e) => setNextRenewalDate(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">
            {x(M.finance_subscription_notice_date)}
          </span>
          <input
            type="date"
            value={noticeDate}
            onChange={(e) => setNoticeDate(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_subscription_owner)}</span>
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Workspace user"
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
      </div>
      <div className="flex justify-end gap-[8px]">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border"
        >
          {x(M.finance_cancel)}
        </button>
        <button
          type="submit"
          className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white"
        >
          {x(M.finance_save)}
        </button>
      </div>
    </form>
  )
}

export function SpendRequestForm({
  onSubmit,
  onCancel,
  entities,
  suppliers,
}: {
  onSubmit: (req: Omit<import('../data/types').FinanceSpendRequest, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
  suppliers: import('../data/types').FinanceParty[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [requester, setRequester] = useState('')
  const [purpose, setPurpose] = useState('')
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '')
  const [amount, setAmount] = useState('0.00')
  const [currency] = useState<FinanceCurrency>('CAD')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      requester: requester || 'Workspace user',
      purpose: { en: purpose, fr: purpose },
      supplierId: supplierId || undefined,
      amount: Number(amount).toFixed(2),
      currency,
      status: 'draft',
      submittedAt: new Date().toISOString(),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]"
    >
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_entity)}</span>
          <select
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.legalName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_spend_requester)}</span>
          <input
            value={requester}
            onChange={(e) => setRequester(e.target.value)}
            placeholder="Workspace user"
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
      </div>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_spend_purpose)}</span>
        <input
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
        />
      </label>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_spend_supplier)}</span>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_spend_amount)}</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
      </div>
      <div className="flex justify-end gap-[8px]">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border"
        >
          {x(M.finance_cancel)}
        </button>
        <button
          type="submit"
          className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white"
        >
          {x(M.finance_save)}
        </button>
      </div>
    </form>
  )
}
