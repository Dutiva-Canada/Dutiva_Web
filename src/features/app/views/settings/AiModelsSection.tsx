import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Cable,
  Cpu,
  Download,
  FlaskConical,
  FolderOpen,
  HardDrive,
  Loader2,
  Trash2,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import { useAuth } from '@/features/app/auth/authContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { supabase } from '@/lib/supabaseClient'
import { aiModelsMessages as M } from '@/i18n/messages/aiModels'
import { LOCAL_MODEL_CATALOG } from '@/lib/localModels/catalog'
import {
  installModel,
  installedRepoIds,
  removeModel,
  storageEstimate,
} from '@/lib/localModels/manager'
import type { InstallProgress } from '@/lib/localModels/manager'
import {
  importDriveFolder,
  isDriveImportSupported,
  pickDriveFolder,
  regrantDriveFolder,
  storedDriveFolder,
} from '@/lib/localModels/driveImport'
import type { DriveFolderState } from '@/lib/localModels/driveImport'
import {
  assignRoute,
  listProviders,
  listRoutes,
  probeProvider,
  registerProvider,
  setProviderStatus,
} from './aiModelsApi'
import type { ModelProviderRow, ModelRouteRow } from './aiModelsApi'
import { Card } from './settingsPrimitives'

/**
 * Settings → AI → "AI models": the two install surfaces for local models.
 *
 * - **Model providers** (admin only): register a self-hosted OpenAI-compatible
 *   endpoint (Ollama / LM Studio / vLLM on the org's LAN) and point the
 *   `advisor_chat` route at a model it serves — docs/LOCAL_INFERENCE.md §7(a),
 *   "completion-only local". The route table is the extension point; the next
 *   turn resolves the new row.
 * - **On this device**: browser-installed models (transformers.js) for
 *   on-device tasks — never the Advisor itself.
 */

const MODALITIES = ['text', 'image', 'document'] as const

function modalityLabel(mod: string, x: (v: { en: string; fr: string }) => string): string {
  if (mod === 'image') return x(M.aimodels_modality_image)
  if (mod === 'document') return x(M.aimodels_modality_document)
  return x(M.aimodels_modality_text)
}

const INPUT =
  'w-full rounded-[8px] border border-border bg-bg px-[11px] py-[8px] text-[13px] text-text outline-none placeholder:text-text-faint'
const LABEL = 'mb-[4px] block text-[11.5px] font-semibold text-text-muted'
const BTN =
  'cursor-pointer rounded-[8px] border border-border bg-accent-soft px-[13px] py-[7px] font-sans text-[12.5px] font-semibold text-accent disabled:cursor-default disabled:opacity-60'
const BTN_GHOST =
  'cursor-pointer rounded-[8px] border border-border bg-transparent px-[11px] py-[6px] font-sans text-[12px] font-semibold text-text-muted hover:text-text disabled:cursor-default disabled:opacity-60'

export function AiModelsSection() {
  const { x } = useI18n()
  const { status: authStatus } = useAuth()
  const { isAdmin } = useWorkspaceMode()
  const canManage = authStatus === 'signed-in' && isAdmin && supabase != null

  return (
    <Card>
      <div className="px-[18px] py-[14px]">
        <div className="text-[13.5px] font-semibold text-text">{x(M.aimodels_title)}</div>
        <div className="mt-[2px] text-[12px] leading-[1.5] text-text-muted">
          {x(M.aimodels_note)}
        </div>
      </div>
      {canManage ? <ProviderPanel /> : null}
      <DeviceModelsPanel />
    </Card>
  )
}

/* ───────────────────────────── server providers ────────────────────────── */

function ProviderPanel() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const [providers, setProviders] = useState<ModelProviderRow[] | null>(null)
  const [routes, setRoutes] = useState<ModelRouteRow[]>([])
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [secretRef, setSecretRef] = useState('')
  const [mods, setMods] = useState<Set<string>>(new Set(['text']))
  const [saving, setSaving] = useState(false)
  const [probe, setProbe] = useState<
    Record<string, { state: 'busy' | 'ok' | 'fail'; count: number }>
  >({})
  const [routeModel, setRouteModel] = useState('')
  const [routeProviderId, setRouteProviderId] = useState('')
  const [routeSaving, setRouteSaving] = useState(false)

  const reload = useCallback(async () => {
    const [p, r] = await Promise.all([listProviders(), listRoutes()])
    setProviders(p)
    setRoutes(r)
  }, [])

  useEffect(() => {
    void reload().catch(() => setProviders([]))
  }, [reload])

  const advisorRoute = useMemo(() => routes.find((r) => r.route_key === 'advisor_chat'), [routes])
  const routeProvider = useMemo(
    () => providers?.find((p) => p.id === advisorRoute?.provider_id),
    [providers, advisorRoute],
  )
  const effectiveRouteProviderId = routeProviderId || routeProvider?.id || ''

  const toggleMod = (m: string) =>
    setMods((prev) => {
      const next = new Set(prev)
      if (next.has(m)) next.delete(m)
      else next.add(m)
      next.add('text')
      return next
    })

  const submitProvider = async () => {
    if (saving) return
    if (!name.trim() || !baseUrl.trim()) {
      showToast(M.aimodels_register_required, 'info')
      return
    }
    setSaving(true)
    try {
      await registerProvider({
        displayName: name.trim(),
        baseUrl: baseUrl.trim(),
        secretRef: secretRef,
        modalities: [...mods],
      })
      setName('')
      setBaseUrl('')
      setSecretRef('')
      showToast(M.aimodels_register_done, 'ok')
      await reload()
    } catch {
      showToast(M.aimodels_register_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const runProbe = async (p: ModelProviderRow) => {
    if (!p.base_url || probe[p.id]?.state === 'busy') return
    setProbe((prev) => ({ ...prev, [p.id]: { state: 'busy', count: 0 } }))
    try {
      const result = await probeProvider(p.base_url)
      setProbe((prev) => ({
        ...prev,
        [p.id]: { state: result.ok ? 'ok' : 'fail', count: result.models.length },
      }))
    } catch {
      setProbe((prev) => ({ ...prev, [p.id]: { state: 'fail', count: 0 } }))
    }
  }

  const applyRoute = async () => {
    if (!advisorRoute || !effectiveRouteProviderId || !routeModel.trim() || routeSaving) return
    const provider = providers?.find((p) => p.id === effectiveRouteProviderId)
    const providerMods = (provider?.metadata?.modalities as string[] | undefined) ?? ['text']
    setRouteSaving(true)
    try {
      await assignRoute({
        routeId: advisorRoute.id,
        providerId: effectiveRouteProviderId,
        modelName: routeModel.trim(),
        modalities: providerMods,
      })
      showToast(M.aimodels_route_saved, 'ok')
      setRouteModel('')
      setRouteProviderId('')
      await reload()
    } catch {
      showToast(M.aimodels_route_failed, 'info')
    } finally {
      setRouteSaving(false)
    }
  }

  const toggleProvider = async (p: ModelProviderRow) => {
    try {
      await setProviderStatus(p.id, p.status === 'active' ? 'inactive' : 'active')
      await reload()
    } catch {
      showToast(M.aimodels_register_failed, 'info')
    }
  }

  return (
    <div className="border-t border-inset px-[18px] py-[14px]">
      <div className="flex items-center gap-[8px]">
        <Cable size={14} strokeWidth={1.9} className="text-text-muted" aria-hidden="true" />
        <div className="text-[12.5px] font-bold text-text">{x(M.aimodels_providers_title)}</div>
      </div>
      <div className="mt-[4px] text-[12px] leading-[1.5] text-text-muted">
        {x(M.aimodels_providers_note)}
      </div>

      {/* Provider rows */}
      <div className="mt-[12px] flex flex-col gap-[8px]">
        {providers === null ? (
          <div className="text-[12px] text-text-faint">
            <Loader2 size={13} className="inline animate-spin" aria-hidden="true" />
          </div>
        ) : providers.length === 0 ? (
          <div className="text-[12px] text-text-faint">{x(M.aimodels_providers_empty)}</div>
        ) : (
          providers.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-[12px] rounded-[10px] border border-border bg-bg px-[12px] py-[10px]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-[8px]">
                  <span className="truncate text-[13px] font-semibold text-text">
                    {p.display_name}
                  </span>
                  <span
                    className={`rounded-[100px] px-[8px] py-[2px] text-[10.5px] font-bold ${
                      p.status === 'active'
                        ? 'bg-support-bg text-support-fg'
                        : 'bg-inset text-text-muted'
                    }`}
                  >
                    {p.status === 'active'
                      ? x(M.aimodels_status_active)
                      : x(M.aimodels_status_inactive)}
                  </span>
                </div>
                <div className="mt-[2px] truncate font-mono text-[11.5px] text-text-muted">
                  {p.base_url}
                </div>
                <div className="mt-[1px] text-[11px] text-text-faint">
                  {p.secret_ref ? x(M.aimodels_keyed) : x(M.aimodels_keyless)}
                  {' · '}
                  {((p.metadata?.modalities as string[] | undefined) ?? ['text'])
                    .map((m) => modalityLabel(m, x))
                    .join(', ')}
                </div>
                {probe[p.id] && probe[p.id]!.state !== 'busy' ? (
                  <div className="mt-[2px] text-[11.5px] text-text-muted">
                    {probe[p.id]!.state === 'ok'
                      ? x(M.aimodels_probe_ok).replace('{count}', String(probe[p.id]!.count))
                      : x(M.aimodels_probe_fail)}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-[6px]">
                <button type="button" onClick={() => void runProbe(p)} className={BTN_GHOST}>
                  {probe[p.id]?.state === 'busy' ? (
                    <Loader2 size={12} className="inline animate-spin" aria-hidden="true" />
                  ) : (
                    x(M.aimodels_probe)
                  )}
                </button>
                <button type="button" onClick={() => void toggleProvider(p)} className={BTN_GHOST}>
                  {p.status === 'active' ? x(M.aimodels_deactivate) : x(M.aimodels_activate)}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Route assignment */}
      <div className="mt-[14px] rounded-[10px] border border-border bg-bg px-[12px] py-[12px]">
        <div className="text-[12.5px] font-bold text-text">{x(M.aimodels_route_title)}</div>
        <div className="mt-[2px] text-[11.5px] leading-[1.5] text-text-muted">
          {x(M.aimodels_route_note)}
        </div>
        {advisorRoute ? (
          <>
            <div className="mt-[8px] text-[11.5px] text-text-faint">
              {x(M.aimodels_route_current)}: {routeProvider?.display_name ?? '—'} ·{' '}
              {advisorRoute.model_name}
            </div>
            <div className="mt-[10px] grid gap-[10px] sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="aimodels-route-provider">
                  {x(M.aimodels_route_provider)}
                </label>
                <select
                  id="aimodels-route-provider"
                  value={effectiveRouteProviderId}
                  onChange={(e) => setRouteProviderId(e.target.value)}
                  className={INPUT}
                >
                  <option value="">—</option>
                  {(providers ?? [])
                    .filter((p) => p.status === 'active')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="aimodels-route-model">
                  {x(M.aimodels_route_model)}
                </label>
                <input
                  id="aimodels-route-model"
                  value={routeModel}
                  onChange={(e) => setRouteModel(e.target.value)}
                  placeholder={x(M.aimodels_route_model_ph)}
                  className={INPUT}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={!effectiveRouteProviderId || !routeModel.trim() || routeSaving}
              onClick={() => void applyRoute()}
              className={`mt-[10px] ${BTN}`}
            >
              {routeSaving ? x(M.aimodels_installing) : x(M.aimodels_route_apply)}
            </button>
          </>
        ) : (
          <div className="mt-[8px] text-[11.5px] text-text-faint">
            {x(M.aimodels_route_missing)}
          </div>
        )}
      </div>

      {/* Register form */}
      <div className="mt-[14px] rounded-[10px] border border-border bg-bg px-[12px] py-[12px]">
        <div className="text-[12.5px] font-bold text-text">{x(M.aimodels_register_title)}</div>
        <div className="mt-[10px] grid gap-[10px] sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="aimodels-name">
              {x(M.aimodels_field_name)}
            </label>
            <input
              id="aimodels-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={x(M.aimodels_field_name_ph)}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="aimodels-url">
              {x(M.aimodels_field_url)}
            </label>
            <input
              id="aimodels-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={x(M.aimodels_field_url_ph)}
              className={INPUT}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="aimodels-secret">
              {x(M.aimodels_field_secret)}
            </label>
            <input
              id="aimodels-secret"
              value={secretRef}
              onChange={(e) => setSecretRef(e.target.value)}
              placeholder={x(M.aimodels_field_secret_ph)}
              className={INPUT}
            />
            <div className="mt-[3px] text-[11px] text-text-faint">
              {x(M.aimodels_field_secret_note)}
            </div>
          </div>
          <div className="sm:col-span-2">
            <span className={LABEL}>{x(M.aimodels_field_modalities)}</span>
            <div className="flex gap-[12px]">
              {MODALITIES.map((m) => (
                <label
                  key={m}
                  className="flex cursor-pointer items-center gap-[5px] text-[12.5px] text-text"
                >
                  <input
                    type="checkbox"
                    checked={mods.has(m)}
                    disabled={m === 'text'}
                    onChange={() => toggleMod(m)}
                    className="accent-[var(--accent)]"
                  />
                  {modalityLabel(m, x)}
                </label>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void submitProvider()}
          className={`mt-[10px] ${BTN}`}
        >
          {saving ? x(M.aimodels_installing) : x(M.aimodels_register_submit)}
        </button>
      </div>
    </div>
  )
}

/* ───────────────────────────── on-device models ────────────────────────── */

type InstallState =
  | { kind: 'installed' }
  | { kind: 'installing'; file: string; progress: number | null }
  | { kind: 'idle' }

function DeviceModelsPanel() {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const [installed, setInstalled] = useState<Set<string>>(new Set())
  const [states, setStates] = useState<Record<string, InstallState>>({})
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null)

  const refresh = useCallback(async () => {
    const ids = await installedRepoIds()
    setInstalled(ids)
    setStorage(await storageEstimate())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const onProgress = useCallback(
    (id: string) => (e: InstallProgress) =>
      setStates((prev) => ({
        ...prev,
        [id]: {
          kind: 'installing',
          file: e.file,
          progress: typeof e.progress === 'number' ? e.progress : null,
        },
      })),
    [],
  )

  const install = async (id: string) => {
    const spec = LOCAL_MODEL_CATALOG.find((m) => m.id === id)
    if (!spec || states[id]?.kind === 'installing') return
    setStates((prev) => ({ ...prev, [id]: { kind: 'installing', file: '', progress: null } }))
    try {
      await installModel(spec, onProgress(id))
      await refresh()
      setStates((prev) => ({ ...prev, [id]: { kind: 'installed' } }))
    } catch {
      setStates((prev) => ({ ...prev, [id]: { kind: 'idle' } }))
      showToast(M.aimodels_install_failed, 'info')
    }
  }

  const remove = async (id: string) => {
    const spec = LOCAL_MODEL_CATALOG.find((m) => m.id === id)
    if (!spec) return
    await removeModel(spec.repoId)
    await refresh()
    setStates((prev) => ({ ...prev, [id]: { kind: 'idle' } }))
    showToast(M.aimodels_removed, 'ok')
  }

  const fmtMb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`

  return (
    <div className="border-t border-inset px-[18px] py-[14px]">
      <div className="flex items-center gap-[8px]">
        <Cpu size={14} strokeWidth={1.9} className="text-text-muted" aria-hidden="true" />
        <div className="text-[12.5px] font-bold text-text">{x(M.aimodels_device_title)}</div>
      </div>
      <div className="mt-[4px] text-[12px] leading-[1.5] text-text-muted">
        {x(M.aimodels_device_note)}
      </div>

      <div className="mt-[12px] flex flex-col gap-[8px]">
        {LOCAL_MODEL_CATALOG.map((m) => {
          const isInstalled = installed.has(m.repoId) || states[m.id]?.kind === 'installed'
          const st = states[m.id]
          const installing = st?.kind === 'installing'
          return (
            <div
              key={m.id}
              className="flex items-center justify-between gap-[12px] rounded-[10px] border border-border bg-bg px-[12px] py-[10px]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-[8px]">
                  <span className="text-[13px] font-semibold text-text">{m.name}</span>
                  {isInstalled && (
                    <span className="rounded-[100px] bg-support-bg px-[8px] py-[2px] text-[10.5px] font-bold text-support-fg">
                      {x(M.aimodels_installed)}
                    </span>
                  )}
                </div>
                <div className="mt-[2px] text-[12px] leading-[1.5] text-text-muted">
                  {pickL(m.description, lang)}
                </div>
                <div className="mt-[2px] text-[11px] text-text-faint">
                  {x(M.aimodels_size_mb).replace('{size}', String(m.approxSizeMb))}
                  {' · '}
                  {m.modalities.join(', ')}
                </div>
                {installing && (
                  <div className="mt-[4px] text-[11px] text-text-faint">
                    {x(M.aimodels_installing)}{' '}
                    {st.progress != null ? `${Math.round(st.progress)}%` : st.file}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-[6px]">
                {isInstalled ? (
                  <button type="button" onClick={() => void remove(m.id)} className={BTN_GHOST}>
                    <Trash2
                      size={12}
                      strokeWidth={1.9}
                      aria-hidden="true"
                      className="mr-[4px] inline"
                    />
                    {x(M.aimodels_remove)}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={installing}
                    onClick={() => void install(m.id)}
                    className={BTN}
                  >
                    {installing ? (
                      <Loader2
                        size={12}
                        className="mr-[4px] inline animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Download
                        size={12}
                        strokeWidth={1.9}
                        aria-hidden="true"
                        className="mr-[4px] inline"
                      />
                    )}
                    {installing ? x(M.aimodels_installing) : x(M.aimodels_install)}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-[10px] flex items-center gap-[6px] text-[11px] text-text-faint">
        <FlaskConical size={11} strokeWidth={1.9} aria-hidden="true" />
        {storage ? x(M.aimodels_storage).replace('{used}', fmtMb(storage.usage)) : null}
      </div>

      <DriveImportPanel onImported={refresh} />
    </div>
  )
}

/* ─────────────────────── drive/folder import (FS Access) ───────────────── */

/**
 * The web-feasible slice of "models on an external drive": pick a folder,
 * copy its <org>/<repo>/ trees into the transformers.js browser cache. The
 * drive is never mounted and nothing loads unprompted — see
 * src/lib/localModels/driveImport.ts for the honest boundary.
 */
function DriveImportPanel({ onImported }: { readonly onImported: () => Promise<void> }) {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const [supported] = useState(isDriveImportSupported)
  const [folder, setFolder] = useState<DriveFolderState | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  useEffect(() => {
    if (supported) void storedDriveFolder().then(setFolder)
  }, [supported])

  const runImport = async (state: DriveFolderState) => {
    if (busy) return
    setBusy(true)
    setProgress(null)
    try {
      const result = await importDriveFolder(state.handle, (done, total) =>
        setProgress({ done, total }),
      )
      const repos = Object.keys(result.repos).length
      if (repos === 0) {
        showToast(M.aimodels_drive_nothing, 'info')
      } else {
        const count = Object.values(result.repos).reduce((a, b) => a + b, 0)
        showToast(
          {
            en: M.aimodels_drive_done.en
              .replace('{count}', String(count))
              .replace('{repos}', String(repos)),
            fr: M.aimodels_drive_done.fr
              .replace('{count}', String(count))
              .replace('{repos}', String(repos)),
          },
          'ok',
        )
      }
      await onImported()
    } catch {
      showToast(M.aimodels_install_failed, 'info')
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const choose = async () => {
    const state = await pickDriveFolder()
    if (!state) return
    setFolder(state)
    await runImport(state)
  }

  const regrant = async () => {
    const state = await regrantDriveFolder()
    if (!state) return
    setFolder(state)
    if (state.permission === 'granted') await runImport(state)
  }

  return (
    <div className="mt-[12px] rounded-[10px] border border-border bg-bg px-[12px] py-[10px]">
      <div className="flex items-center gap-[8px]">
        <HardDrive size={14} strokeWidth={1.9} className="text-text-muted" aria-hidden="true" />
        <div className="text-[12.5px] font-bold text-text">{x(M.aimodels_drive_title)}</div>
      </div>
      <div className="mt-[4px] text-[12px] leading-[1.5] text-text-muted">
        {x(M.aimodels_drive_note)}
      </div>
      {supported ? (
        <div className="mt-[8px] flex flex-wrap items-center gap-[8px]">
          {folder?.permission === 'prompt' ? (
            <button type="button" className={BTN} disabled={busy} onClick={() => void regrant()}>
              <FolderOpen
                size={12}
                strokeWidth={1.9}
                aria-hidden="true"
                className="mr-[4px] inline"
              />
              {x(M.aimodels_drive_regrant)}
            </button>
          ) : (
            <button type="button" className={BTN} disabled={busy} onClick={() => void choose()}>
              <FolderOpen
                size={12}
                strokeWidth={1.9}
                aria-hidden="true"
                className="mr-[4px] inline"
              />
              {x(M.aimodels_drive_choose)}
            </button>
          )}
          {folder ? (
            <span className="text-[11.5px] text-text-muted">
              {x(M.aimodels_drive_linked).replace('{name}', folder.name)}
            </span>
          ) : null}
          {progress ? (
            <span className="text-[11px] text-text-faint">
              {x(M.aimodels_drive_importing)
                .replace('{done}', String(progress.done))
                .replace('{total}', String(progress.total))}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="mt-[6px] text-[11.5px] text-text-faint">
          {x(M.aimodels_drive_unsupported)}
        </div>
      )}
    </div>
  )
}
