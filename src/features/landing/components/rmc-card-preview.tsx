'use client'

import * as React from 'react'
import { poin } from '@/lib/format'
import type { Config } from '@/types/member'
import { srcSet2x } from '@/lib/logo'
import { rmcFor } from '@/lib/rules/rmc'
import { SEED_ACCOUNTS } from '@/lib/api/mock/seed/seed-accounts'
import { cn } from '@/lib/utils'
import { useAppConfig, useOrderList, useCustomers } from '@/hooks/use-member-data'

/* The demo member's card, computed with the same rmcFor() the profile uses, real tier, real points, real months. */
export function RmcCardPreview({ rules }: { rules: Config['rules'] }) {
  const cfg = useAppConfig()
  const orders = useOrderList()
  const demo = SEED_ACCOUNTS[0]
  const customer = useCustomers().find(c => c.id === demo.crmCustomerId) || null
  const rmc = React.useMemo(() => rmcFor(cfg, customer, orders, [], demo.id, demo.isMitra), [cfg, customer, orders, demo.id, demo.isMitra])
  if (!customer) return null
  const months = rmc.monthly.slice(-6)
  const maxPts = Math.max(1, ...months.map(m => m.points))
  return (
    <div className="tilt-wrap relative mx-auto max-w-[340px] pt-3 pr-3 lg:ml-auto lg:mr-0">
      <p className="mb-4 text-[13px] font-semibold text-white/70">Contoh profil member: {demo.laundry}</p>
      <div className="relative">
        <div className="tilt-back absolute inset-0 rounded-xl bg-gold" aria-hidden />
        <div data-rmc-card className="tilt relative rounded-xl bg-white p-5 text-ink shadow-3 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img src={cfg.assets.mark} srcSet={srcSet2x(cfg.assets.mark)} alt="" width={28} height={28} className="h-7 w-7" />
              <p className="text-[13px] font-bold text-ink">Resique Member Card</p>
            </div>
            <span className="rounded-md px-2.5 py-1 text-[12px] font-extrabold text-white" style={{ background: rmc.tier.sw }}>{rmc.tier.name}</span>
          </div>
          <p className="mt-6 text-[13px] font-semibold text-ink-3">Poin RMC</p>
          <p className="t-fig t-fig-black mt-1 text-[40px] leading-none text-navy-700 sm:text-[44px]">{poin(rmc.points)}</p>
          <p className="t-code mt-1.5 text-[13px] text-ink-2">Diskon {rmc.discount}% · poin berlaku sampai {rules.expiry}</p>
          <div className="mt-5 flex items-end justify-between gap-4 border-t border-line-2 pt-4">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-ink">{demo.laundry}</p>
              <p className="truncate text-[13px] text-ink-2">{demo.pic} · {demo.rsl}</p>
            </div>
            <div className="flex h-9 shrink-0 items-end gap-1" aria-label="Poin 6 bulan terakhir">
              {months.map((m, i) => (
                <span key={m.ym} className={cn('w-2 rounded-sm', i === months.length - 1 ? 'bg-gold' : 'bg-green-200')} style={{ height: `${Math.max(12, Math.round((m.points / maxPts) * 100))}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
