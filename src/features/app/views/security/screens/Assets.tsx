import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect } from '@/components/FormField'
import { useSecurityData } from '../SecurityDataContext'
import type { SecurityAsset, SecurityAssetStatus, SecurityAssetType, SecurityCriticality } from '../data/types'

const TYPES: SecurityAssetType[] = ['hardware', 'software', 'cloud_service', 'domain', 'data_store']
const STATUSES: SecurityAssetStatus[] = ['active', 'decommissioned', 'at_risk']
const CRITICALITIES: NonNullable<SecurityCriticality>[] = ['critical', 'high', 'medium', 'low']

const TYPE_LABELS: Record<SecurityAssetType, keyof typeof M> = {
  hardware: 'sec_asset_type_hardware',
  software: 'sec_asset_type_software',
  cloud_service: 'sec_asset_type_cloud_service',
  domain: 'sec_asset_type_domain',
  data_store: 'sec_asset_type_data_store',
}

const STATUS_LABELS: Record<SecurityAssetStatus, keyof typeof M> = {
  active: 'sec_status_active',
  decommissioned: 'sec_status_decommissioned',
  at_risk: 'sec_status_at_risk',
}

const STATUS_TONE: Record<SecurityAssetStatus, 'success' | 'neutral' | 'risk'> = {
  active: 'success',
  decommissioned: 'neutral',
  at_risk: 'risk',
}

const CRIT_LABELS: Record<NonNullable<SecurityCriticality>, keyof typeof M> = {
  critical: 'sec_criticality_critical',
  high: 'sec_criticality_high',
  medium: 'sec_criticality_medium',
  low: 'sec_criticality_low',
}

function generateId() {
  return `sa-${Math.random().toString(36).slice(2, 9)}`
}

function emptyAsset(): SecurityAsset {
  return {
    id: generateId(),
    organization_id: '',
    name: '',
    asset_type: 'hardware',
    owner_id: null,
    status: 'active',
    criticality: 'low',
    renewal_date: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function AssetRow({
  asset,
  onEdit,
  onRemove,
}: {
  readonly asset: SecurityAsset
  readonly onEdit: (asset: SecurityAsset) => void
  readonly onRemove: (id: string) => void
}) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{asset.name}</div>
        <div className="text-[12px] text-text-muted">
          {x(M[TYPE_LABELS[asset.asset_type]])}
          {asset.criticality ? ` · ${x(M[CRIT_LABELS[asset.criticality]])}` : null}
          {asset.renewal_date ? ` · ${asset.renewal_date}` : null}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        <span className={statusChipClass(STATUS_TONE[asset.status])}>{x(M[STATUS_LABELS[asset.status]])}</span>
        <button
          type="button"
          onClick={() => onEdit(asset)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.sec_edit)}
        </button>
        <button
          type="button"
          onClick={() => onRemove(asset.id)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.sec_remove)}
        </button>
      </div>
    </div>
  )
}

export function Assets() {
  const { x } = useI18n()
  const { assets, addAsset, updateAsset, removeAsset } = useSecurityData()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<SecurityAsset | null>(null)

  const initial = editing ?? emptyAsset()
  const [name, setName] = useState(initial.name)
  const [assetType, setAssetType] = useState<SecurityAssetType>(initial.asset_type)
  const [status, setStatus] = useState<SecurityAssetStatus>(initial.status)
  const [criticality, setCriticality] = useState<NonNullable<SecurityCriticality>>(initial.criticality ?? 'low')
  const [renewalDate, setRenewalDate] = useState(initial.renewal_date ?? '')
  const [notes, setNotes] = useState(initial.notes ?? '')

  useEffect(() => {
    const base = editing ?? emptyAsset()
    setName(base.name)
    setAssetType(base.asset_type)
    setStatus(base.status)
    setCriticality(base.criticality ?? 'low')
    setRenewalDate(base.renewal_date ?? '')
    setNotes(base.notes ?? '')
  }, [editing])

  const reset = () => {
    setShow(false)
    setEditing(null)
    const base = emptyAsset()
    setName(base.name)
    setAssetType(base.asset_type)
    setStatus(base.status)
    setCriticality(base.criticality ?? 'low')
    setRenewalDate(base.renewal_date ?? '')
    setNotes(base.notes ?? '')
  }

  const onSubmit = async () => {
    const now = new Date().toISOString()
    const asset: SecurityAsset = {
      ...(editing ?? emptyAsset()),
      name,
      asset_type: assetType,
      status,
      criticality,
      renewal_date: renewalDate || null,
      notes: notes || null,
      updated_at: now,
    }
    if (editing) {
      await updateAsset(asset)
    } else {
      await addAsset({ ...asset, created_at: now })
    }
    reset()
  }

  const openCreate = () => {
    setEditing(null)
    setShow(true)
  }

  return (
    <div className="space-y-[14px]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => (show ? reset() : openCreate())}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(show && !editing ? M.sec_cancel : M.sec_add_asset)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.sec_name)} className="sm:col-span-2">
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label={x(M.sec_type)}>
            <FormSelect value={assetType} onChange={(e) => setAssetType(e.target.value as SecurityAssetType)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {x(M[TYPE_LABELS[t]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.sec_status)}>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value as SecurityAssetStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.sec_criticality)}>
            <FormSelect
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as NonNullable<SecurityCriticality>)}
            >
              {CRITICALITIES.map((c) => (
                <option key={c} value={c}>
                  {x(M[CRIT_LABELS[c]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.sec_renewal_date)}>
            <FormInput type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.sec_notes)} className="sm:col-span-2">
            <FormInput value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.sec_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(editing ? M.sec_save_changes : M.sec_save)}
            </button>
          </div>
        </div>
      ) : null}

      {assets.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.sec_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {assets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              onEdit={(a) => { setEditing(a); setShow(true) }}
              onRemove={(id) => removeAsset(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
