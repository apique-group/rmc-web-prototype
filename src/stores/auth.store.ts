import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Account } from '@/types/member'
import { useAccounts } from '@/lib/api/mock/accounts'

interface SessionState {
  accountId: string | null
  signIn: (id: string) => void
  signOut: () => void
}

/** Session lives in sessionStorage, a closed tab = signed out (production: httpOnly cookie). */
export const useSession = create<SessionState>()(
  persist(
    set => ({
      accountId: null,
      signIn: id => set({ accountId: id }),
      signOut: () => set({ accountId: null }),
    }),
    { name: 'rmcweb_session', storage: createJSONStorage(() => sessionStorage) },
  ),
)

export function useCurrentAccount(): Account | null {
  const id = useSession(s => s.accountId)
  const accounts = useAccounts(s => s.accounts)
  return id ? accounts.find(a => a.id === id) || null : null
}
