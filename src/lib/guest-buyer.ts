import type { Kota } from '@/model/types'

/* Guest checkout prefill (staging checkout-prefill.ts): a guest's buyer fields and pick-up choice are remembered in the
   browser so the next order starts filled in. Members never use this — their fields come from the account. */
const KEY = 'rmcweb_guest_buyer_v1'
export interface GuestBuyer { name: string; laundry: string; phone: string; email: string; mode: 'PICKUP' | 'DELIVERY'; outlet?: Kota; address?: string }
export function loadGuestBuyer(): GuestBuyer | null {
  try {
    const raw = localStorage.getItem(KEY); if (!raw) return null
    const v = JSON.parse(raw) as Partial<GuestBuyer>
    if (typeof v.name !== 'string' || typeof v.laundry !== 'string' || typeof v.phone !== 'string' || typeof v.email !== 'string') return null
    return { name: v.name, laundry: v.laundry, phone: v.phone, email: v.email, mode: v.mode === 'DELIVERY' ? 'DELIVERY' : 'PICKUP', outlet: v.outlet as Kota | undefined, address: v.address }
  } catch { return null }
}
export function saveGuestBuyer(v: GuestBuyer) { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* storage full or blocked: prefill is a convenience */ } }
