'use client'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { profileApi } from '../api/profile.api'

export const useRedeemPrize = () => useMutation({ mutationFn: profileApi.redeemPrize })

export const redemptionsKey = ['member', 'redemptions'] as const
export const useRedemptions = () => useSuspenseQuery({ queryKey: redemptionsKey, queryFn: profileApi.getRedemptions }).data
