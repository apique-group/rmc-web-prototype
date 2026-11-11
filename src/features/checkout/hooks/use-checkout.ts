'use client'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { checkoutApi } from '../api/checkout.api'

export const useCreateOrder = () => useMutation({ mutationFn: checkoutApi.createOrder })

export const customersKey = ['member', 'customers'] as const
export const useCustomers = () => useSuspenseQuery({ queryKey: customersKey, queryFn: checkoutApi.getCustomers }).data
