import type { Invite } from '@/types/member'

/** Registration-invite rules shared by the member register page and the config surface. */
export const INVITE_DAYS = 90
export type InviteStatus = 'active' | 'used' | 'revoked' | 'expired'
export function inviteStatus(i: Invite, now = Date.now()): InviteStatus {
  if (i.revokedAt) return 'revoked'
  if (i.usedAt) return 'used'
  if (Date.parse(i.expiresAt) <= now) return 'expired'
  return 'active'
}
/** Staging masks the member card number on the invite screen: first 3 + ** + last 2 (short codes stay as they are). */
export const maskPosCode = (code: string) => (code.length <= 5 ? code : code.slice(0, 3) + '**' + code.slice(-2))
export const inviteUrl = (token: string) => `${location.origin}/register?invite=${token}`
