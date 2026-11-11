import { rmcClient } from '@/lib/api/client'
import type { Order } from '@/types/member'

/** apique-web-rmc features/order/api/order.api.ts */
export const orderApi = {
  /** GET /member/orders */
  getMyOrders: async () => (await rmcClient.get<Order[]>('/member/orders')).data,
  /** GET /member/orders/:id */
  getOrder: async (id: string) => (await rmcClient.get<Order | null>(`/member/orders/${encodeURIComponent(id)}`)).data,
  /** POST /member/orders/expire — the stand-in for the server's expiry job */
  expireOrders: async () => (await rmcClient.post<{ expired: number }>('/member/orders/expire')).data,
  /** POST /member/orders/:id/proof — payment proof */
  uploadProof: async (id: string, file: { name: string; type: string; dataUrl: string }) => (await rmcClient.post<Order>(`/member/orders/${encodeURIComponent(id)}/proof`, file)).data,
}
