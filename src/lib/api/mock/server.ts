import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { Config, Order, OrderStatus } from '@/types/member'
import { useAccounts, type RegisterForm } from './accounts'
import { useConfig } from './config'
import { useCrm } from './crm'
import { useInbox } from './inbox'
import { useOrders, type CheckoutInput } from './orders'
import { resetAllStores } from './persist'
import { useAuthStore } from '@/stores/auth.store'

/* In-browser stand-in for crm-rsq-service. Paths follow apique-web-rmc (member plane /member/…) and the
   CRM's config surface (/admin/…). Data lives in the zustand stores next to this file (localStorage). */

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
const fail = (status: number, message: string): never => { throw new HttpError(status, message) }

type Ctx = { params: Record<string, string>; query: URLSearchParams; body: any } // eslint-disable-line @typescript-eslint/no-explicit-any
type Handler = (ctx: Ctx) => unknown
const routes: [string, RegExp, string[], Handler][] = []
function route(method: string, path: string, handler: Handler) {
  const keys: string[] = []
  const rx = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)' }) + '$')
  routes.push([method, rx, keys, handler])
}

const accounts = () => useAccounts.getState()
const crm = () => useCrm.getState()
const orders = () => useOrders.getState()
const config = () => useConfig.getState()

/* ── member plane ─────────────────────────────────────────────────────────────── */
route('GET', '/member/config', () => config().config)
route('GET', '/member/orders', () => orders().orders)
route('GET', '/member/orders/:id', ({ params }) => orders().orders.find(o => o.id === params.id) ?? null)
route('POST', '/member/orders', ({ body }) => {
  try { return orders().create(body as CheckoutInput) } catch (e) { return fail(429, (e as Error).message) }
})
route('POST', '/member/orders/:id/proof', ({ params, body }) => orders().uploadProof(params.id, body) ?? fail(409, 'Bukti tidak bisa diunggah untuk pesanan ini'))
route('POST', '/member/orders/expire', () => ({ expired: orders().expireStale() }))
route('GET', '/member/customers', () => crm().customers)
route('GET', '/member/me', () => { const id = useAuthStore.getState().accountId; return (id && accounts().accounts.find(a => a.id === id)) || null })
route('GET', '/member/accounts/lookup', ({ query }) => accounts().byPhone(query.get('phone') || '') ?? null)
route('POST', '/member/auth/login', ({ body }) => { const r = accounts().login(body.phone, body.password); return r.ok ? r : fail(401, r.reason) })
route('POST', '/member/auth/register', ({ body }) => { try { return accounts().register(body as RegisterForm) } catch (e) { return fail(400, (e as Error).message) } })
route('POST', '/member/auth/register-invite', ({ body }) => { const r = accounts().registerInvite(body); return r.ok ? r : fail(400, r.reason) })
route('POST', '/member/auth/forgot', ({ body }) => accounts().requestReset(body.phone))
route('POST', '/member/auth/change-password', ({ body }) => { accounts().changePassword(body.accountId, body.newPassword); return { ok: true } })
route('GET', '/member/invites/:token', ({ params }) => {
  const invite = crm().invites.find(i => i.token === params.token) ?? null
  return { invite, customer: invite ? crm().customers.find(c => c.id === invite.customerId) ?? null : null }
})
route('GET', '/member/redemptions', () => accounts().redemptions)
route('POST', '/member/redemptions', ({ body }) => {
  const prize = config().config.prizes.find(p => p.id === body.prizeId) ?? fail(404, 'Hadiah tidak ditemukan')
  const r = accounts().redeem(body.accountId, prize.id, prize.name, prize.pointCost, body.balanceAfter)
  config().setSection('prizes', config().config.prizes.map(p => p.id === prize.id ? { ...p, stock: Math.max(0, p.stock - 1) } : p))
  return r
})
route('GET', '/member/inbox', () => useInbox.getState().mails)
route('POST', '/member/inbox/:id/read', ({ params }) => { useInbox.getState().markRead(params.id); return { ok: true } })

/* ── config surface (CRM → Member Card (RMC) → Golden Privilege) ─────────────────── */
route('GET', '/admin/config', () => config().config)
route('PUT', '/admin/config/:section', ({ params, body }) => { config().setSection(params.section as keyof Config, body.value); return config().config })
route('POST', '/admin/config/reset', () => { config().reset(); return config().config })
route('GET', '/admin/orders', () => orders().orders)
route('PATCH', '/admin/orders/:id', ({ params, body }) => { orders().setStatus(params.id, body.status as OrderStatus, body.reason); return orders().orders.find(o => o.id === params.id) })
route('POST', '/admin/orders/import', ({ body }) => ({ added: orders().importRows(body.rows as Order[]) }))
route('POST', '/admin/orders/reset', () => { orders().reset(); return { ok: true } })
route('GET', '/admin/accounts', () => accounts().accounts)
route('POST', '/admin/accounts/:id/link', ({ params, body }) => { accounts().linkAccount(params.id, body.customerId); return { ok: true } })
route('POST', '/admin/accounts/:id/unlink', ({ params }) => { accounts().unlinkToLead(params.id); return { ok: true } })
route('GET', '/admin/customers', () => crm().customers)
route('GET', '/admin/claims', () => crm().claims)
route('POST', '/admin/claims/:id/decide', ({ params, body }) => crm().decideClaim(params.id, body.status) ?? fail(404, 'Klaim tidak ditemukan'))
route('GET', '/admin/leads', () => crm().leads)
route('GET', '/admin/invites', () => crm().invites)
route('POST', '/admin/invites', ({ body }) => crm().generateInvites(body.customerIds, body.createdBy))
route('POST', '/admin/invites/:id/revoke', ({ params }) => { crm().revokeInvite(params.id); return { ok: true } })
route('GET', '/admin/audit', () => crm().audit)
route('POST', '/admin/audit', ({ body }) => { crm().log(body.event, body.meta); return { ok: true } })
route('POST', '/admin/reset', () => { resetAllStores(); return { ok: true } })

/** axios adapter: answers every request from the routes above, in this browser. */
export const mockAdapter: AxiosAdapter = async (cfg: InternalAxiosRequestConfig) => {
  const method = (cfg.method || 'get').toUpperCase()
  const url = new URL(cfg.url || '/', 'http://mock')
  const query = new URLSearchParams(url.search)
  Object.entries(cfg.params || {}).forEach(([k, v]) => { if (v !== undefined && v !== null) query.set(k, String(v)) })
  const body = typeof cfg.data === 'string' ? JSON.parse(cfg.data || 'null') : cfg.data
  const res = (status: number, data: unknown): AxiosResponse => ({ data, status, statusText: String(status), headers: {}, config: cfg, request: null })
  for (const [m, rx, keys, handler] of routes) {
    if (m !== method) continue
    const hit = rx.exec(url.pathname)
    if (!hit) continue
    const params = Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(hit[i + 1])]))
    try {
      return res(200, handler({ params, query, body }))
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500
      const err = Object.assign(new Error((e as Error).message), { isAxiosError: true, response: res(status, { message: (e as Error).message }), config: cfg })
      throw err
    }
  }
  const err = Object.assign(new Error(`No mock route for ${method} ${url.pathname}`), { isAxiosError: true, response: res(404, { message: 'Not found' }), config: cfg })
  throw err
}

/** The signed-in account, read synchronously: Providers writes it into the GET /member/me cache the moment the
    session or the accounts change, so a page opened right after sign-in / sign-out / a password change never sees
    the previous answer (the old single-page build read the store synchronously too). */
export const peekMe = () => { const id = useAuthStore.getState().accountId; return (id && accounts().accounts.find(a => a.id === id)) || null }

/** The stores behind the mock, so Providers can refresh queries whenever the data changes. */
export const MOCK_STORES = [useAccounts, useConfig, useCrm, useInbox, useOrders, useAuthStore] as const
