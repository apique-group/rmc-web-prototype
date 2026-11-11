'use client'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'

export const useLogin = () => useMutation({ mutationFn: ({ phone, password }: { phone: string; password: string }) => authApi.login(phone, password) })
export const useRegister = () => useMutation({ mutationFn: authApi.register })
export const useRegisterInvite = () => useMutation({ mutationFn: authApi.registerInvite })
export const useForgotPassword = () => useMutation({ mutationFn: authApi.forgot })
export const useChangePassword = () => useMutation({ mutationFn: ({ accountId, newPassword }: { accountId: string; newPassword: string }) => authApi.changePassword(accountId, newPassword) })
export const useInvite = (token: string) => useSuspenseQuery({ queryKey: ['member', 'invites', token], queryFn: () => authApi.invite(token) }).data
export const useInbox = () => useSuspenseQuery({ queryKey: ['member', 'inbox'], queryFn: authApi.inbox }).data
export const useMarkMailRead = () => useMutation({ mutationFn: authApi.markRead })

export const meKey = ['member', 'me'] as const
/** The signed-in member, or null (site header, checkout, profile). */
export const useCurrentAccount = () => useSuspenseQuery({ queryKey: meKey, queryFn: authApi.getMe }).data
