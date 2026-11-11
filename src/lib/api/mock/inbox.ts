import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InboxMail } from '@/types/member'
import { persistOpts, syncAcrossTabs } from '@/lib/api/mock/persist'
import { nowISO } from '@/lib/format'
import { uid } from '@/lib/id'

/* PROTOTYPE ONLY, stands in for the transactional email service. Production sends real email
   via the UM Email Templates registry; this panel exists so the demo can show the temp password. */
interface InboxState {
  mails: InboxMail[]
  send: (to: string, subject: string, body: string) => InboxMail
  markRead: (id: string) => void
  clear: () => void
}

export const useInbox = create<InboxState>()(
  persist(
    (set, get) => ({
      mails: [],
      send: (to, subject, body) => {
        const m: InboxMail = { id: uid(), to, subject, body, at: nowISO(), read: false }
        set({ mails: [m, ...get().mails].slice(0, 50) })
        return m
      },
      markRead: id => set({ mails: get().mails.map(m => m.id === id ? { ...m, read: true } : m) }),
      clear: () => set({ mails: [] }),
    }),
    persistOpts<InboxState>('inbox'),
  ),
)
syncAcrossTabs(useInbox)
