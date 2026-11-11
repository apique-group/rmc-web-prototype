'use client'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import type { Config, Order, OrderStatus } from '@/types/member'
import { adminApi } from '../api/admin.api'

const useAdminQuery = <T,>(key: string, fn: () => Promise<T>) => useSuspenseQuery({ queryKey: ['admin', key], queryFn: fn }).data

export const useAdminConfig = () => useAdminQuery('config', adminApi.config)
export const useAdminOrders = () => useAdminQuery('orders', adminApi.orders)
export const useAdminAccounts = () => useAdminQuery('accounts', adminApi.accounts)
export const useAdminCustomers = () => useAdminQuery('customers', adminApi.customers)
export const useAdminClaims = () => useAdminQuery('claims', adminApi.claims)
export const useAdminLeads = () => useAdminQuery('leads', adminApi.leads)
export const useAdminInvites = () => useAdminQuery('invites', adminApi.invites)
export const useAdminAudit = () => useAdminQuery('audit', adminApi.audit)

export const useSaveSection = () => useMutation({ mutationFn: ({ section, value }: { section: keyof Config; value: Config[keyof Config] }) => adminApi.saveSection(section, value) })
export const useResetConfig = () => useMutation({ mutationFn: adminApi.resetConfig })
export const useSetOrderStatus = () => useMutation({ mutationFn: ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) => adminApi.setOrderStatus(id, status, reason) })
export const useImportOrders = () => useMutation({ mutationFn: (rows: Order[]) => adminApi.importOrders(rows) })
export const useResetOrders = () => useMutation({ mutationFn: adminApi.resetOrders })
export const useLinkAccount = () => useMutation({ mutationFn: ({ id, customerId }: { id: string; customerId: string }) => adminApi.linkAccount(id, customerId) })
export const useUnlinkAccount = () => useMutation({ mutationFn: adminApi.unlinkAccount })
export const useDecideClaim = () => useMutation({ mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => adminApi.decideClaim(id, status) })
export const useGenerateInvites = () => useMutation({ mutationFn: ({ customerIds, createdBy }: { customerIds: string[]; createdBy?: string }) => adminApi.generateInvites(customerIds, createdBy) })
export const useRevokeInvite = () => useMutation({ mutationFn: adminApi.revokeInvite })
export const useAuditLog = () => useMutation({ mutationFn: ({ event, meta }: { event: string; meta: string }) => adminApi.log(event, meta) })
export const useResetDemo = () => useMutation({ mutationFn: adminApi.resetDemo })
