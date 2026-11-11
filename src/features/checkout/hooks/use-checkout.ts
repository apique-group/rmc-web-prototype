'use client'

import { useMutation } from '@tanstack/react-query'
import { checkoutApi } from '../api/checkout.api'

export const useCreateOrder = () => useMutation({ mutationFn: checkoutApi.createOrder })
