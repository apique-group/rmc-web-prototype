/** Password policy: min length (config), uppercase, lowercase, digit, symbol. */
export interface PasswordCheck { minLength: boolean; upper: boolean; lower: boolean; digit: boolean; symbol: boolean; ok: boolean }

export function checkPassword(pw: string, minLength = 8): PasswordCheck {
  const r = {
    minLength: pw.length >= minLength,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
    symbol: /[^A-Za-z0-9\s]/.test(pw),
  }
  return { ...r, ok: Object.values(r).every(Boolean) }
}

/** Prototype-only hash (FNV-1a hex). Production uses bcrypt/argon2 server-side, never this. */
export function hashPassword(pw: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < pw.length; i++) { h ^= pw.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return 'p1$' + h.toString(16).padStart(8, '0') + '$' + pw.length
}
export const verifyPassword = (pw: string, hash: string) => hashPassword(pw) === hash

/** Temporary password that satisfies the policy, e.g. "Rsq-7Kp3xM2!" */
export function genTempPassword(): string {
  const U = 'ABCDEFGHJKLMNPQRSTUVWXYZ', L = 'abcdefghjkmnpqrstuvwxyz', D = '23456789', S = '!@#$%'
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)]
  const body = Array.from({ length: 5 }, () => pick(U + L + D)).join('')
  return `Rsq-${pick(U)}${pick(D)}${body}${pick(L)}${pick(S)}`
}
