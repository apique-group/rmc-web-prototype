'use client'

import { useMutation } from '@tanstack/react-query'
import { profileApi } from '../api/profile.api'

export const useRedeemPrize = () => useMutation({ mutationFn: profileApi.redeemPrize })
