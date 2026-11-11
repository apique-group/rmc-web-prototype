import { rmcClient } from '@/lib/api/client'
import type { Account, CrmCustomer, InboxMail, Invite } from '@/types/member'
import type { RegisterForm, RegisterOutcome } from '../types'

/** Member auth endpoints (apique-web-rmc features/auth/api/auth.api.ts). */
export const authApi = {
  /** GET /member/me — the signed-in member, or null */
  getMe: async () => (await rmcClient.get<Account | null>('/member/me')).data,
  login: async (phone: string, password: string) => (await rmcClient.post<{ ok: true; account: Account }>('/member/auth/login', { phone, password })).data,
  register: async (form: RegisterForm) => (await rmcClient.post<RegisterOutcome>('/member/auth/register', form)).data,
  registerInvite: async (input: { token: string; pic: string; phone: string; email: string; password: string }) =>
    (await rmcClient.post<{ ok: true; account: Account }>('/member/auth/register-invite', input)).data,
  forgot: async (phone: string) => (await rmcClient.post<{ ok: true; sent: boolean }>('/member/auth/forgot', { phone })).data,
  changePassword: async (accountId: string, newPassword: string) => (await rmcClient.post('/member/auth/change-password', { accountId, newPassword })).data,
  /** prototype only: is this phone already registered (the form warns before submitting) */
  lookup: async (phone: string) => (await rmcClient.get<Account | null>('/member/accounts/lookup', { params: { phone } })).data,
  invite: async (token: string) => (await rmcClient.get<{ invite: Invite | null; customer: CrmCustomer | null }>(`/member/invites/${encodeURIComponent(token)}`)).data,
  /** prototype only: the mock e-mail inbox that shows the temporary password */
  inbox: async () => (await rmcClient.get<InboxMail[]>('/member/inbox')).data,
  markRead: async (id: string) => (await rmcClient.post(`/member/inbox/${encodeURIComponent(id)}/read`)).data,
}
