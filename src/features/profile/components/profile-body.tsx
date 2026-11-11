'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Gift, LogOut } from 'lucide-react'
import { Reveal } from '@/components/layout/reveal'
import { ledgerFor, rmcFor } from '@/lib/rmc'
import type { Account, CrmCustomer } from '@/types/member'
import { CONTACTS } from '@/lib/contacts'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LedgerCard } from './ledger-list'
import { LinkStateCard } from './link-state-card'
import { OrderList } from './order-history-list'
import { PendingHero } from './pending-hero'
import { PointsChart } from './points-chart'
import { PointsHero } from './points-hero'
import { PrizeGrid } from './prize-grid'
import { useAppConfig } from '@/features/landing/hooks/use-config'
import { useMyOrders } from '@/features/order/hooks/use-order'
import { useCustomers } from '@/features/checkout/hooks/use-checkout'
import { useRedemptions } from '@/features/profile/hooks/use-profile'

export const SALES_WA = CONTACTS.wa

export function ProfileBody({ account }: { account: Account }) {
  const router = useRouter()
  const cfg = useAppConfig()
  const customers = useCustomers()
  const orders = useMyOrders()
  const redemptions = useRedemptions()
  const signOut = useAuthStore(s => s.signOut)

  const customer: CrmCustomer | null = account.link === 'LINKED' ? customers.find(c => c.id === account.crmCustomerId) || null : null
  const isMitra = account.isMitra || !!customer?.mitra
  const rmc = React.useMemo(() => rmcFor(cfg, customer, orders, redemptions, account.id, isMitra), [cfg, customer, orders, redemptions, account.id, isMitra])
  const ledger = React.useMemo(() => ledgerFor(cfg, customer, orders, redemptions, account.id), [cfg, customer, orders, redemptions, account.id])
  const myOrders = React.useMemo(
    () => orders.filter(o => o.accountId === account.id || (account.crmCustomerId && o.crmCustomerId === account.crmCustomerId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, account.id, account.crmCustomerId],
  )

  const linked = account.link === 'LINKED'
  const pending = account.link === 'PENDING'
  const firstName = account.pic.split(' ')[0]

  return (
    <div className="container max-w-5xl pb-20 pt-24 sm:pt-32">
      <Reveal>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="t-eyebrow">Profil RMC</p>
            <h1 className="t-h2 mt-1 truncate text-ink">Halo, {firstName}</h1>
          </div>
          <Button variant="outline" className="" onClick={() => { signOut(); toast('Kamu sudah keluar'); router.push('/') }}>
            <LogOut className="h-4 w-4" strokeWidth={1.6} /> Keluar
          </Button>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Left column: hero + lists */}
        <div className="min-w-0 stack-y-6 lg:col-span-5">
          <Reveal>
            {linked ? (
              <PointsHero account={account} customer={customer} rmc={rmc} isMitra={isMitra} />
            ) : pending ? (
              <PendingHero account={account} rmc={rmc} />
            ) : account.link === 'NEW_CUSTOMER' ? (
              <LinkStateCard state="NEW_CUSTOMER" />
            ) : account.link === 'UNLINKED' ? (
              <LinkStateCard state="UNLINKED" />
            ) : (
              <LinkStateCard state="LEAD" />
            )}
          </Reveal>
          {linked && (
            <Reveal delay={60} className="hidden lg:block"><LedgerCard rows={ledger} /></Reveal>
          )}
        </div>

        {/* Right column: chart + prizes + orders */}
        <div className="min-w-0 stack-y-6 lg:col-span-7">
          {linked ? (
            <>
              <Reveal delay={40}><PointsChart rmc={rmc} earnPerRp={cfg.rules.earnPerRp} /></Reveal>
              {/* Riwayat pesanan sits right under the transaction graph (Lurd, 10 Sep) */}
              <Reveal delay={60}><OrderList rows={myOrders} /></Reveal>
              <Reveal delay={80}><PrizeGrid account={account} points={rmc.points} /></Reveal>
              <Reveal delay={100} className="lg:hidden"><LedgerCard rows={ledger} /></Reveal>
            </>
          ) : (
            <Reveal delay={40}>
              <Card>
                <CardContent className="flex items-start gap-3 pt-5 sm:pt-6">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-50 text-gold-700"><Gift className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
                  <div>
                    <p className="text-[14px] font-bold text-ink">Grafik & riwayat poin tampil di sini</p>
                    <p className="mt-0.5 text-[13px] text-ink-3">{pending ? 'Setelah sales Resique konfirmasi akun ini milikmu.' : account.link === 'NEW_CUSTOMER' ? 'Setelah transaksi pertamamu di outlet Resique.' : account.link === 'UNLINKED' ? 'Setelah akunmu ditautkan kembali ke data pelanggan.' : 'Setelah laundry-mu terdaftar di Resique.'}</p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          )}
          {!linked && <Reveal delay={120}><OrderList rows={myOrders} /></Reveal>}
        </div>
      </div>
    </div>
  )
}
