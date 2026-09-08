import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { statusChipClass } from '@/components/chips'
import { useSecurityData } from '../SecurityDataContext'
import type { SecurityAsset, SecurityAssetStatus, SecurityAssetType, SecurityCriticality } from '../data/types'

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

function AssetRow({ asset }: { readonly asset: SecurityAsset }) {
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
      <span className={statusChipClass(STATUS_TONE[asset.status])}>{x(M[STATUS_LABELS[asset.status]])}</span>
    </div>
  )
}

export function Assets() {
  const { x } = useI18n()
  const { assets } = useSecurityData()

  if (assets.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.sec_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {assets.map((asset) => (
        <AssetRow key={asset.id} asset={asset} />
      ))}
    </div>
  )
}
