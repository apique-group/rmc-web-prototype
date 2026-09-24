/** Sequential, human-readable ids: prefix + yyyymm + 4-digit counter over the existing list. */
export function nextId(prefix: string, existing: { id: string }[], date = new Date()): string {
  const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
  const n = existing.reduce((m, r) => {
    const tail = parseInt(String(r.id).split('-').pop() || '0', 10)
    return Number.isFinite(tail) ? Math.max(m, tail) : m
  }, 0)
  return `${prefix}-${ym}-${String(n + 1).padStart(4, '0')}`
}

export const uid = () => Math.random().toString(36).slice(2, 10)

/** Staging order number: GS-{YYYYMMDD}-#### in WIB, the sequence resets every day (crm-rsq-service codes.ts). */
export function nextOrderNo(existing: { id: string }[], date = new Date()): string {
  const wib = new Date(date.getTime() + 7 * 3600_000)
  const stamp = `${wib.getUTCFullYear()}${String(wib.getUTCMonth() + 1).padStart(2, '0')}${String(wib.getUTCDate()).padStart(2, '0')}`
  const prefix = `GS-${stamp}-`
  const n = existing.reduce((m, r) => { if (!String(r.id).startsWith(prefix)) return m; const tail = parseInt(String(r.id).slice(prefix.length), 10); return Number.isFinite(tail) ? Math.max(m, tail) : m }, 0)
  return `${prefix}${String(n + 1).padStart(4, '0')}`
}
