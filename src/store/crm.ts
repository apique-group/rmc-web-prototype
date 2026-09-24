import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuditRow, Claim, CrmCustomer, Invite, Kota, Lead } from '@/model/types'
import { SEED_CUSTOMERS } from '@/data/seed-customers'
import { persistOpts, syncAcrossTabs } from './persist'
import { nowISO } from '@/lib/format'
import { uid } from '@/lib/id'

/* Mocked CRM Resique side: customer master, auto-created leads, Klaim Akun queue, audit trail.
   Production: crm-rsq-service endpoints (see PRD Fitur 9). */
interface CrmState {
  customers: CrmCustomer[]
  leads: Lead[]
  claims: Claim[]
  audit: AuditRow[]
  invites: Invite[]
  log: (event: string, meta: string) => void
  backfillPhone: (customerId: string, phone: string, email?: string) => void
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'source'>) => Lead
  addClaim: (accountId: string, candidateCustomerId: string, score: number) => Claim
  decideClaim: (claimId: string, status: 'approved' | 'rejected') => Claim | undefined
  /** path 4 of the cascade (staging): the registrant becomes a NEW customer in CRM Resique, not a lead */
  addCustomer: (c: { outlet: string; pic: string; hp: string; email?: string; kota?: Kota }) => CrmCustomer
  /** one single-use link per customer, 90 days; customers that already hold an active invite are skipped */
  generateInvites: (customerIds: string[], createdBy?: string) => Invite[]
  consumeInvite: (token: string) => Invite | undefined
  revokeInvite: (inviteId: string) => void
  reset: () => void
}

export const INVITE_DAYS = 90
export type InviteStatus = 'active' | 'used' | 'revoked' | 'expired'
export function inviteStatus(i: Invite, now = Date.now()): InviteStatus {
  if (i.revokedAt) return 'revoked'
  if (i.usedAt) return 'used'
  if (Date.parse(i.expiresAt) <= now) return 'expired'
  return 'active'
}
/** Staging masks the member card number on the invite screen: first 3 + ** + last 2 (short codes stay as they are). */
export const maskPosCode = (code: string) => (code.length <= 5 ? code : code.slice(0, 3) + '**' + code.slice(-2))
export const inviteUrl = (token: string) => `${location.origin}${location.pathname}#/register?invite=${token}`
const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('')

export const useCrm = create<CrmState>()(
  persist(
    (set, get) => ({
      customers: SEED_CUSTOMERS,
      leads: [],
      claims: [],
      audit: [],
      invites: [],
      log: (event, meta) => set({ audit: [{ id: uid(), t: nowISO(), event, meta }, ...get().audit].slice(0, 500) }),
      backfillPhone: (customerId, phone, email) => {
        set({ customers: get().customers.map(c => c.id === customerId ? { ...c, hp: phone, email: c.email || email } : c) })
        get().log('Nomor HP dilengkapi dari pendaftaran mandiri', `${customerId} ← ${phone}`)
      },
      addLead: lead => {
        const n = get().leads.length + 1
        const row: Lead = { ...lead, id: `LD-GP-${String(n).padStart(4, '0')}`, createdAt: nowISO(), source: 'Golden Privilege Web' }
        set({ leads: [row, ...get().leads] })
        get().log('Lead baru dari Golden Privilege Web', `${row.id} · ${row.outlet} · ${row.pic}`)
        return row
      },
      addClaim: (accountId, candidateCustomerId, score) => {
        const n = get().claims.length + 1
        const row: Claim = { id: `CLM-${String(n).padStart(4, '0')}`, accountId, candidateCustomerId, score, status: 'open', createdAt: nowISO() }
        set({ claims: [row, ...get().claims] })
        get().log('Klaim akun menunggu verifikasi sales', `${row.id} → ${candidateCustomerId} (skor ${(score * 100).toFixed(0)}%)`)
        return row
      },
      decideClaim: (claimId, status) => {
        const c = get().claims.find(x => x.id === claimId)
        if (!c) return undefined
        const row = { ...c, status, decidedAt: nowISO() }
        set({ claims: get().claims.map(x => x.id === claimId ? row : x) })
        get().log(status === 'approved' ? 'Klaim akun disetujui' : 'Klaim akun ditolak', claimId)
        return row
      },
      addCustomer: c => {
        const n = get().customers.length + 1
        const row: CrmCustomer = { id: `CUS-GP-${String(n).padStart(4, '0')}`, outlet: c.outlet, pic: c.pic, hp: c.hp, email: c.email, kota: c.kota || 'Jakarta', mitra: false, member: false, priorSpend6: 0, priorPointsEarned: 0, monthly: {} }
        set({ customers: [row, ...get().customers] })
        get().log('Pelanggan baru dari Golden Privilege Web', `${row.id} · ${row.outlet} · ${row.pic} (tanpa sales rep)`)
        return row
      },
      generateInvites: (customerIds, createdBy) => {
        const now = Date.now()
        const made: Invite[] = []
        customerIds.forEach(cid => {
          if (!get().customers.some(c => c.id === cid)) return
          if (get().invites.some(i => i.customerId === cid && inviteStatus(i, now) === 'active')) return
          made.push({ id: `INV-${uid()}`, token: randomToken(), customerId: cid, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + INVITE_DAYS * 86_400_000).toISOString(), createdBy })
        })
        if (made.length) { set({ invites: [...made, ...get().invites] }); get().log('Undangan pendaftaran dibuat', `${made.length} undangan · oleh ${createdBy || '-'}`) }
        return made
      },
      consumeInvite: token => {
        const i = get().invites.find(x => x.token === token)
        if (!i || inviteStatus(i) !== 'active') return undefined
        const row = { ...i, usedAt: nowISO() }
        set({ invites: get().invites.map(x => x.id === i.id ? row : x) })
        return row
      },
      revokeInvite: inviteId => {
        set({ invites: get().invites.map(x => x.id === inviteId && !x.usedAt ? { ...x, revokedAt: nowISO() } : x) })
        get().log('Undangan pendaftaran dicabut', inviteId)
      },
      reset: () => set({ customers: SEED_CUSTOMERS, leads: [], claims: [], audit: [], invites: [] }),
    }),
    persistOpts<CrmState>('crm'),
  ),
)
syncAcrossTabs(useCrm)
