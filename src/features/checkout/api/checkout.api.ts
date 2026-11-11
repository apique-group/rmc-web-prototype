import { rmcClient } from '@/lib/api/client'
import type { Order } from '@/types/member'
import type { CheckoutInput } from '../types'

export const checkoutApi = {
  /** POST /member/orders — guest or member checkout; 429 when one buyer orders too often. */
  createOrder: async (input: CheckoutInput) => (await rmcClient.post<Order>('/member/orders', input)).data,
}
