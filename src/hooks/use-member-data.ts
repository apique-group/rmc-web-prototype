'use client'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { memberApi } from '@/lib/api/member.api'

/* Shared member-plane reads. Suspense queries: the screens render once the data is there, as before
   (the stand-in server answers within the same tick). Any data change refreshes them (providers.tsx). */
export const memberKeys = {
  config: ['member', 'config'] as const,
  orders: ['member', 'orders'] as const,
  order: (id: string) => ['member', 'orders', id] as const,
  me: ['member', 'me'] as const,
  customers: ['member', 'customers'] as const,
  redemptions: ['member', 'redemptions'] as const,
}

export const useAppConfig = () => useSuspenseQuery({ queryKey: memberKeys.config, queryFn: memberApi.config }).data
export const useOrderList = () => useSuspenseQuery({ queryKey: memberKeys.orders, queryFn: memberApi.orders }).data
export const useOrderById = (id: string) => useSuspenseQuery({ queryKey: memberKeys.order(id), queryFn: () => memberApi.order(id) }).data
export const useCurrentAccount = () => useSuspenseQuery({ queryKey: memberKeys.me, queryFn: memberApi.me }).data
export const useCustomers = () => useSuspenseQuery({ queryKey: memberKeys.customers, queryFn: memberApi.customers }).data
export const useRedemptions = () => useSuspenseQuery({ queryKey: memberKeys.redemptions, queryFn: memberApi.redemptions }).data

/** POST /member/orders/expire, the stand-in for the server's expiry job. */
export const useExpireOrders = () => useMutation({ mutationFn: memberApi.expireOrders })
/** POST /member/orders/:id/proof */
export const useUploadProof = () => useMutation({ mutationFn: ({ id, file }: { id: string; file: { name: string; type: string; dataUrl: string } }) => memberApi.uploadProof(id, file) })
