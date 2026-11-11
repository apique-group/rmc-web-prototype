/** Normalize any Indonesian mobile input to E.164-ish "+628xxxxxxxxx". Returns null when not plausible. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let d = String(raw).replace(/[^\d+]/g, '')
  if (d.startsWith('+')) d = d.slice(1)
  if (d.startsWith('62')) d = d.slice(2)
  else if (d.startsWith('0')) d = d.slice(1)
  if (!/^8\d{7,12}$/.test(d)) return null
  return '+62' + d
}

/** "+628123345889" → "0812-3345-8891"-ish display (local format, grouped). */
export function displayPhone(e164: string | null | undefined): string {
  const n = normalizePhone(e164)
  if (!n) return e164 || '-'
  const local = '0' + n.slice(3)
  return local.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')
}

export const samePhone = (a?: string | null, b?: string | null) => {
  const x = normalizePhone(a), y = normalizePhone(b)
  return !!x && !!y && x === y
}

/** Public display mask (staging klasemen label): "+6281234567890" → "0812****890" (first 4 + **** + last 3). */
export function maskPhone(raw: string | null | undefined): string {
  const n = normalizePhone(raw)
  if (!n) return '****'
  const local = '0' + n.slice(3)
  return local.slice(0, 4) + '****' + local.slice(-3)
}
