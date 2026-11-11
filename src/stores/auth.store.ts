import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AuthState {
  accountId: string | null
  signIn: (id: string) => void
  signOut: () => void
}

/** Who is signed in, like apique-web-rmc's auth.store. Lives in sessionStorage: a closed tab = signed out
    (production: token cookie). The account itself is read with useCurrentAccount (GET /member/me). */
export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      accountId: null,
      signIn: id => set({ accountId: id }),
      signOut: () => set({ accountId: null }),
    }),
    { name: 'rmcweb_session', storage: createJSONStorage(() => sessionStorage) },
  ),
)
