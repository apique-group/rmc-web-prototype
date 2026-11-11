'use client'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { orderApi } from '../api/order.api'

/* apique-web-rmc features/order/hooks/use-order.ts. Suspense queries: the screens render once the data is there,
   as before (the stand-in server answers within the same tick). Any data change refreshes them (providers.tsx). */
export const orderKeys = {
  list: ['member', 'orders'] as const,
  one: (id: string) => ['member', 'orders', id] as const,
}

export const useMyOrders = () => useSuspenseQuery({ queryKey: orderKeys.list, queryFn: orderApi.getMyOrders }).data
export const useOrder = (id: string) => useSuspenseQuery({ queryKey: orderKeys.one(id), queryFn: () => orderApi.getOrder(id) }).data
export const useExpireOrders = () => useMutation({ mutationFn: orderApi.expireOrders })
export const useUploadProof = () => useMutation({ mutationFn: ({ id, file }: { id: string; file: { name: string; type: string; dataUrl: string } }) => orderApi.uploadProof(id, file) })
