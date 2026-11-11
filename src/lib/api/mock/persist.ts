import { createJSONStorage, type PersistOptions } from 'zustand/middleware'

/** Every store persists under `rmcweb_<name>_v1`. Admin (iframe) and consumer tabs share the
    origin, so the browser `storage` event is enough to keep both in sync. */
export const KEY = (name: string) => `rmcweb_${name}_v1`

export function persistOpts<T>(name: string, version = 1): PersistOptions<T> {
  return { name: KEY(name), version, storage: createJSONStorage(() => localStorage) }
}

type Rehydratable = { persist: { rehydrate: () => void | Promise<void>; getOptions: () => { name?: string } } }
const registry: Rehydratable[] = []

/** Register a store so a `storage` event from another tab re-reads it. */
export function syncAcrossTabs(store: Rehydratable) {
  registry.push(store)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (!e.key || !e.key.startsWith('rmcweb_')) return
    registry.forEach(s => { if (s.persist.getOptions().name === e.key) void s.persist.rehydrate() })
  })
}

/** Wipe every rmcweb_* key (admin "Reset demo"). */
export function resetAllStores() {
  Object.keys(localStorage).filter(k => k.startsWith('rmcweb_')).forEach(k => localStorage.removeItem(k))
  sessionStorage.removeItem('rmcweb_session')
  location.reload()
}
