import { rmcClient } from '@/lib/api/client'
import type { Account, Config, CrmCustomer, Order, Redemption } from '@/types/member'

/** Reads shared by several features (site header/footer, landing, checkout, profile). */
export const memberApi = {
  config: async () => (await rmcClient.get<Config>('/member/config')).data,
  orders: async () => (await rmcClient.get<Order[]>('/member/orders')).data,
  order: async (id: string) => (await rmcClient.get<Order | null>(`/member/orders/${encodeURIComponent(id)}`)).data,
  expireOrders: async () => (await rmcClient.post<{ expired: number }>('/member/orders/expire')).data,
  uploadProof: async (id: string, file: { name: string; type: string; dataUrl: string }) => (await rmcClient.post<Order>(`/member/orders/${encodeURIComponent(id)}/proof`, file)).data,
  me: async () => (await rmcClient.get<Account | null>('/member/me')).data,
  customers: async () => (await rmcClient.get<CrmCustomer[]>('/member/customers')).data,
  redemptions: async () => (await rmcClient.get<Redemption[]>('/member/redemptions')).data,
}
