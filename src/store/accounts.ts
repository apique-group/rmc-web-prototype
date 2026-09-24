import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account, Kota, Redemption } from '@/model/types'
import { persistOpts, syncAcrossTabs } from './persist'
import { matchRegistration, type MatchResult } from '@/model/match'
import { normalizePhone } from '@/model/phone'
import { checkPassword, genTempPassword, hashPassword, verifyPassword } from '@/model/password'

/** staging member-auth.middleware.ts */
const LOCKOUT_THRESHOLD = 5
const LOCKOUT_MINUTES = 15
import { nowISO } from '@/lib/format'
import { uid } from '@/lib/id'
import { useCrm } from './crm'
import { useInbox } from './inbox'
import { cfg } from './config'
import { SEED_ACCOUNTS } from '@/data/seed-accounts'

export interface RegisterForm {
  /** legacy (R.001–R.051): no longer asked; Mitra status is derived from the RSL0 card prefix / the CRM customer */
  isMitra?: boolean
  hasCard: boolean
  laundry: string
  pic: string
  phone: string
  email: string
  kota?: Kota
  rsl?: string
  referral?: string
  password?: string
}

export interface RegisterOutcome { account: Account; match: MatchResult; tempPassword?: string }

interface AccountsState {
  accounts: Account[]
  redemptions: Redemption[]
  register: (form: RegisterForm) => RegisterOutcome
  login: (phone: string, password: string) => { ok: true; account: Account } | { ok: false; reason: string }
  changePassword: (accountId: string, newPassword: string) => void
  /** staging POST /member/auth/forgot: always ok — never reveals whether the phone exists */
  requestReset: (phone: string) => { ok: true; sent: boolean; tempPassword?: string }
  /** staging POST /member/auth/register-invite: one step, account LINKED to the invite's customer, no temp password */
  registerInvite: (input: { token: string; pic: string; phone: string; email: string; password: string }) => { ok: true; account: Account } | { ok: false; reason: string }
  linkAccount: (accountId: string, crmCustomerId: string) => void
  unlinkToLead: (accountId: string) => void
  /** staging POST /member/redemptions → code RDM-XXXXXXXX + balance after */
  redeem: (accountId: string, prizeId: string, prizeName: string, points: number, balanceAfter: number) => Redemption
  byPhone: (phone: string) => Account | undefined
  reset: () => void
}

export const useAccounts = create<AccountsState>()(
  persist(
    (set, get) => ({
      accounts: SEED_ACCOUNTS,
      redemptions: [],
      byPhone: phone => { const p = normalizePhone(phone); return p ? get().accounts.find(a => a.phone === p) : undefined },

      register: form => {
        const phone = normalizePhone(form.phone)
        if (!phone) throw new Error('Nomor HP tidak valid')
        if (get().accounts.some(a => a.phone === phone)) throw new Error('Nomor HP sudah terdaftar')
        const crm = useCrm.getState()
        const match = matchRegistration({ phone, laundry: form.laundry, pic: form.pic, rsl: form.rsl }, crm.customers, cfg().matching.fuzzyThreshold)

        let tempPassword: string | undefined
        let passwordHash: string
        let mustChange = false
        if (match.link === 'LINKED') {
          tempPassword = genTempPassword()
          passwordHash = hashPassword(tempPassword)
          mustChange = true
        } else {
          passwordHash = hashPassword(form.password || genTempPassword())
        }

        const rsl = form.rsl?.trim().toUpperCase() || undefined
        // path 4 (staging): no match at all → a NEW customer is created in CRM (no sales rep), the account links to it as NEW_CUSTOMER
        const newCustomer = match.link === 'NEW_CUSTOMER' ? crm.addCustomer({ outlet: form.laundry.trim(), pic: form.pic.trim(), hp: phone, email: form.email.trim().toLowerCase(), kota: form.kota }) : null
        const account: Account = {
          id: `ACC-${uid()}`,
          phone, email: form.email.trim().toLowerCase(),
          laundry: form.laundry.trim(), pic: form.pic.trim(), kota: form.kota,
          isMitra: !!(rsl && rsl.startsWith('RSL0')) || !!match.customer?.mitra, hasCard: form.hasCard,
          rsl: form.rsl?.trim().toUpperCase() || undefined, referral: form.referral?.trim() || undefined,
          consentAt: nowISO(), passwordHash, mustChangePassword: mustChange,
          link: match.link, crmCustomerId: match.customer?.id || newCustomer?.id, matchPath: match.path, matchScore: match.score,
          createdAt: nowISO(),
        }
        set({ accounts: [account, ...get().accounts] })

        // side effects, mirrored in PRD Fitur 2 / Fitur 9
        if (match.link === 'LINKED' && match.customer) {
          if (match.backfillPhone) crm.backfillPhone(match.customer.id, phone, account.email)
          crm.log('Akun RMC Web terhubung ke pelanggan', `${account.id} → ${match.customer.id} (jalur ${match.path})`)
          useInbox.getState().send(
            account.email,
            'Kata sandi sementara Resique Golden Privilege',
            `Halo ${account.pic},\n\nAkun RMC-mu untuk ${match.customer.outlet} sudah aktif.\n\nMasuk dengan nomor HP ${phone} dan kata sandi sementara:\n\n${tempPassword}\n\nKamu akan diminta membuat kata sandi baru saat pertama kali masuk.\n\nSalam,\nTim Resique`,
          )
        } else if (match.link === 'PENDING' && match.customer) {
          crm.addClaim(account.id, match.customer.id, match.score)
        } else if (match.link === 'LEAD') {
          crm.addLead({ outlet: account.laundry, pic: account.pic, hp: phone, email: account.email, kota: account.kota, referral: account.referral, accountId: account.id })
        }
        return { account, match, tempPassword }
      },

      /* staging: one generic message for unknown phone and wrong password; 5 failures lock the account for 15 minutes,
         and the lock is checked before the password so a locked account never reveals whether the password was right */
      login: (phone, password) => {
        const GENERIC = 'Nomor atau kata sandi salah'
        const a = get().byPhone(phone)
        if (!a) return { ok: false, reason: GENERIC }
        if (a.lockedUntil && Date.parse(a.lockedUntil) > Date.now()) return { ok: false, reason: 'Akun terkunci sementara, coba lagi nanti' }
        if (!verifyPassword(password, a.passwordHash)) {
          const failed = (a.failedLoginCount || 0) + 1
          const lock = failed >= LOCKOUT_THRESHOLD ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString() : a.lockedUntil
          set({ accounts: get().accounts.map(x => x.id === a.id ? { ...x, failedLoginCount: failed, lockedUntil: lock } : x) })
          return { ok: false, reason: failed >= LOCKOUT_THRESHOLD ? 'Akun terkunci sementara, coba lagi nanti' : GENERIC }
        }
        if (a.failedLoginCount || a.lockedUntil) set({ accounts: get().accounts.map(x => x.id === a.id ? { ...x, failedLoginCount: 0, lockedUntil: undefined } : x) })
        return { ok: true, account: a }
      },

      changePassword: (accountId, newPassword) => set({
        accounts: get().accounts.map(a => a.id === accountId ? { ...a, passwordHash: hashPassword(newPassword), mustChangePassword: false } : a),
      }),

      requestReset: phone => {
        const a = get().byPhone(phone)
        if (!a) return { ok: true, sent: false }
        const tempPassword = genTempPassword()
        set({ accounts: get().accounts.map(x => x.id === a.id ? { ...x, passwordHash: hashPassword(tempPassword), mustChangePassword: true } : x) })
        useInbox.getState().send(a.email, 'Reset kata sandi Resique Golden Privilege', `Halo ${a.pic},\n\nKata sandi sementara baru:\n\n${tempPassword}\n\nMasuk lalu buat kata sandi baru.`)
        return { ok: true, sent: true, tempPassword }
      },

      registerInvite: input => {
        const phone = normalizePhone(input.phone)
        if (!phone) return { ok: false, reason: 'Nomor HP tidak valid' }
        if (get().accounts.some(a => a.phone === phone)) return { ok: false, reason: 'Nomor HP sudah terdaftar' }
        if (!checkPassword(input.password, cfg().password.minLength).ok) return { ok: false, reason: 'Kata sandi belum memenuhi syarat' }
        const crm = useCrm.getState()
        const invite = crm.consumeInvite(input.token)
        if (!invite) return { ok: false, reason: 'Undangan tidak valid atau sudah digunakan' }
        const c = crm.customers.find(x => x.id === invite.customerId)!
        const account: Account = {
          id: `ACC-${uid()}`, phone, email: input.email.trim().toLowerCase(), laundry: c.outlet, pic: input.pic.trim(), kota: c.kota,
          isMitra: c.mitra, hasCard: !!c.rsl, rsl: c.rsl, consentAt: nowISO(), passwordHash: hashPassword(input.password), mustChangePassword: false,
          link: 'LINKED', crmCustomerId: c.id, matchPath: 0, matchScore: 1, createdAt: nowISO(),
        }
        set({ accounts: [account, ...get().accounts] })
        if (!normalizePhone(c.hp)) crm.backfillPhone(c.id, phone, account.email)
        crm.log('Akun RMC Web dibuat lewat undangan', `${account.id} → ${c.id} (${c.outlet})`)
        return { ok: true, account }
      },

      linkAccount: (accountId, crmCustomerId) => {
        const a = get().accounts.find(x => x.id === accountId)
        if (!a) return
        const crm = useCrm.getState()
        const c = crm.customers.find(x => x.id === crmCustomerId)
        if (c && !normalizePhone(c.hp)) crm.backfillPhone(c.id, a.phone, a.email)
        set({ accounts: get().accounts.map(x => x.id === accountId ? { ...x, link: 'LINKED', crmCustomerId } : x) })
        crm.log('Akun RMC Web terhubung ke pelanggan (verifikasi sales)', `${accountId} → ${crmCustomerId}`)
        useInbox.getState().send(a.email, 'Akun RMC-mu sudah terverifikasi', `Halo ${a.pic},\n\nSales Resique sudah memverifikasi akunmu. Poin RMC kini tampil di profil.\n\nSalam,\nTim Resique`)
      },

      unlinkToLead: accountId => {
        const a = get().accounts.find(x => x.id === accountId)
        if (!a) return
        set({ accounts: get().accounts.map(x => x.id === accountId ? { ...x, link: 'LEAD', crmCustomerId: undefined } : x) })
        useCrm.getState().addLead({ outlet: a.laundry, pic: a.pic, hp: a.phone, email: a.email, kota: a.kota, referral: a.referral, accountId: a.id })
      },

      redeem: (accountId, prizeId, prizeName, points, balanceAfter) => {
        const n = get().redemptions.length + 1
        const bytes = new Uint8Array(4); crypto.getRandomValues(bytes)
        const code = 'RDM-' + [...bytes].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
        const r: Redemption = { id: `RDM-${String(n).padStart(4, '0')}`, code, accountId, prizeId, prizeName, points, balanceAfter, at: nowISO() }
        set({ redemptions: [r, ...get().redemptions] })
        useCrm.getState().log('Penukaran poin', `${accountId} · ${prizeName} · ${points} poin · ${code} · sisa ${balanceAfter}`)
        return r
      },

      reset: () => set({ accounts: SEED_ACCOUNTS, redemptions: [] }),
    }),
    {
      ...persistOpts<AccountsState>('accounts'),
      // browsers that persisted an account list before the demo account existed still get it
      merge: (persisted, current) => {
        const p = (persisted as Partial<AccountsState> | undefined) || {}
        const accounts = p.accounts || []
        const withDemo = SEED_ACCOUNTS.filter(d => !accounts.some(a => a.phone === d.phone)).concat(accounts)
        return { ...current, ...p, accounts: withDemo } as AccountsState
      },
    },
  ),
)
syncAcrossTabs(useAccounts)
