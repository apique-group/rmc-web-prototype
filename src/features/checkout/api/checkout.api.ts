import { rmcClient } from '@/lib/api/client'
import type { CrmCustomer, Order } from '@/types/member'
import type { CheckoutInput } from '../types'

export const checkoutApi = {
  /** GET /member/customers — CRM customers, to match a buyer to an existing customer */
  getCustomers: async () => (await rmcClient.get<CrmCustomer[]>('/member/customers')).data,
  /** POST /member/orders — guest or member checkout; 429 when one buyer orders too often. */
  createOrder: async (input: CheckoutInput) => (await rmcClient.post<Order>('/member/orders', input)).data,
}
