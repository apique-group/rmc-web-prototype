/** Rupiah formatter, "Rp1.250.000" (no space, id-ID grouping). */
export function rupiah(n: number | null | undefined, opts: { short?: boolean } = {}): string {
  const v = Math.round(Number(n) || 0)
  if (opts.short) {
    if (Math.abs(v) >= 1_000_000_000) return `Rp${trim((v / 1_000_000_000).toFixed(1))} M`
    if (Math.abs(v) >= 1_000_000) return `Rp${trim((v / 1_000_000).toFixed(1))} jt`
    if (Math.abs(v) >= 1_000) return `Rp${Math.round(v / 1_000)} rb`
  }
  return 'Rp' + v.toLocaleString('id-ID')
}
const trim = (s: string) => s.replace(/\.0$/, '').replace('.', ',')

/** Points, "6.027" */
export function poin(n: number | null | undefined): string {
  return Math.max(0, Math.round(Number(n) || 0)).toLocaleString('id-ID')
}

/** "04 Sep 2026" */
export function fmtDate(iso: string | Date | null | undefined, withTime = false): string {
  if (!iso) return '-'
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return '-'
  const s = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  return withTime ? `${s} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : s
}

/** "Sep 2026" */
export function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
}

/** mm:ss countdown */
export function mmss(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export const todayISO = () => new Date().toISOString().slice(0, 10)
export const nowISO = () => new Date().toISOString()

/** ISO with the local offset (staging stores campaign start/end as full datetimes): 2026-09-01T00:00:00+07:00 */
export function isoLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const off = -d.getTimezoneOffset(), sign = off >= 0 ? '+' : '-', a = Math.abs(off)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`
}
/** value for <input type="datetime-local"> (local wall time, no seconds) */
export function toLocalInput(iso: string): string {
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
/** datetime-local value → ISO with offset; an empty / invalid value returns '' */
export function fromLocalInput(v: string): string {
  if (!v) return ''
  const d = new Date(v); return Number.isNaN(d.getTime()) ? '' : isoLocal(d)
}
/** a date-only campaign value (older stored config) becomes a full local datetime: start of day / end of day */
export function campaignIso(v: string, endOfDay: boolean): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return isoLocal(new Date(`${v}T${endOfDay ? '23:59:59' : '00:00:00'}`))
  return v
}
