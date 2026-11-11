import { rmcClient } from '@/lib/api/client'
import type { Account, AuditRow, Claim, Config, CrmCustomer, Invite, Lead, Order, OrderStatus } from '@/types/member'

/** Config surface endpoints (CRM → Member Card (RMC) → Golden Privilege). */
export const adminApi = {
  config: async () => (await rmcClient.get<Config>('/admin/config')).data,
  saveSection: async <K extends keyof Config>(section: K, value: Config[K]) => (await rmcClient.put<Config>(`/admin/config/${section}`, { value })).data,
  resetConfig: async () => (await rmcClient.post<Config>('/admin/config/reset')).data,
  orders: async () => (await rmcClient.get<Order[]>('/admin/orders')).data,
  setOrderStatus: async (id: string, status: OrderStatus, reason?: string) => (await rmcClient.patch<Order>(`/admin/orders/${encodeURIComponent(id)}`, { status, reason })).data,
  importOrders: async (rows: Order[]) => (await rmcClient.post<{ added: number }>('/admin/orders/import', { rows })).data,
  resetOrders: async () => (await rmcClient.post('/admin/orders/reset')).data,
  accounts: async () => (await rmcClient.get<Account[]>('/admin/accounts')).data,
  linkAccount: async (id: string, customerId: string) => (await rmcClient.post(`/admin/accounts/${encodeURIComponent(id)}/link`, { customerId })).data,
  unlinkAccount: async (id: string) => (await rmcClient.post(`/admin/accounts/${encodeURIComponent(id)}/unlink`)).data,
  customers: async () => (await rmcClient.get<CrmCustomer[]>('/admin/customers')).data,
  claims: async () => (await rmcClient.get<Claim[]>('/admin/claims')).data,
  decideClaim: async (id: string, status: 'approved' | 'rejected') => (await rmcClient.post<Claim>(`/admin/claims/${encodeURIComponent(id)}/decide`, { status })).data,
  leads: async () => (await rmcClient.get<Lead[]>('/admin/leads')).data,
  invites: async () => (await rmcClient.get<Invite[]>('/admin/invites')).data,
  generateInvites: async (customerIds: string[], createdBy?: string) => (await rmcClient.post<Invite[]>('/admin/invites', { customerIds, createdBy })).data,
  revokeInvite: async (id: string) => (await rmcClient.post(`/admin/invites/${encodeURIComponent(id)}/revoke`)).data,
  audit: async () => (await rmcClient.get<AuditRow[]>('/admin/audit')).data,
  log: async (event: string, meta: string) => (await rmcClient.post('/admin/audit', { event, meta })).data,
  resetDemo: async () => (await rmcClient.post('/admin/reset')).data,
}
