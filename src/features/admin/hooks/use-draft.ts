import * as React from 'react'
import { toast } from 'sonner'
import type { Config } from '@/types/member'
import { useConfig } from '@/lib/api/mock/config'
import { DEFAULT_CONFIG } from '@/lib/api/mock/seed/seed-config'
import { useCrm } from '@/lib/api/mock/crm'
import { useAdminAccess } from '@/features/admin/hooks/use-admin-access'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export interface Draft<K extends keyof Config> {
  draft: Config[K]
  setDraft: React.Dispatch<React.SetStateAction<Config[K]>>
  /** shallow patch, object sections only (copy, assets, payment, …) */
  patch: (p: Partial<Config[K]>) => void
  dirty: boolean
  /** write the draft into the store + toast */
  save: (label?: string) => void
  /** discard local edits, back to the stored value */
  reset: () => void
  /** seed value for "Pakai bawaan" */
  defaults: Config[K]
}

/** Clone one config section into local state; explicit Simpan writes it back (UM settings idiom). */
export function useDraft<K extends keyof Config>(key: K, label = 'Pengaturan'): Draft<K> {
  const value = useConfig(s => s.config[key])
  const setSection = useConfig(s => s.setSection)
  const [draft, setDraft] = React.useState<Config[K]>(() => clone(value))
  const synced = React.useRef(value)

  // store changed from outside (another tab, reset) → follow it unless the user has unsaved edits
  React.useEffect(() => {
    if (value === synced.current) return
    setDraft(d => (same(d, synced.current) ? clone(value) : d))
    synced.current = value
  }, [value])

  const dirty = !same(draft, value)
  const { actor, role } = useAdminAccess()
  const patch = React.useCallback((p: Partial<Config[K]>) => setDraft(d => ({ ...(d as object), ...p }) as Config[K]), [])
  const save = React.useCallback((what = label) => {
    setSection(key, clone(draft))
    useCrm.getState().log('Konfigurasi Golden Privilege disimpan', `${what} · oleh ${actor || '-'} (${role || '-'})`)
    toast.success(`${what} disimpan`)
  }, [draft, key, label, setSection, actor, role])
  const reset = React.useCallback(() => setDraft(clone(value)), [value])

  return { draft, setDraft, patch, dirty, save, reset, defaults: DEFAULT_CONFIG[key] }
}
