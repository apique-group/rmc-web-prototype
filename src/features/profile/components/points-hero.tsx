'use client'

import { poin, rupiah } from '@/lib/format'
import type { RmcSummary } from '@/lib/api/mock/rules/rmc'
import type { Account, CrmCustomer } from '@/types/member'
import { useConfig } from '@/lib/api/mock/config'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { HeroShell } from './hero-shell'

export function PointsHero({ account, customer, rmc, isMitra }: { account: Account; customer: CrmCustomer | null; rmc: RmcSummary; isMitra: boolean }) {
  const cfg = useConfig(s => s.config)
  const floorApplied = isMitra && rmc.discount === cfg.mitraFloorDiscount && rmc.tier.discount < cfg.mitraFloorDiscount
  return (
    <HeroShell>
      <div className="flex items-start justify-between gap-3">
        <p className="t-eyebrow text-gold-200">Poin RMC</p>
        <Badge variant="inverse"><span className="h-2 w-2 rounded-full ring-1 ring-white/60" style={{ background: rmc.tier.sw }} aria-hidden />{rmc.tier.name}</Badge>
      </div>
      <p data-points={rmc.points} className="t-fig t-fig-black mt-3 text-[56px] leading-none sm:text-[64px]">{poin(rmc.points)}</p>
      <p className="mt-2 text-[13px] text-white/80">Berlaku sampai {cfg.rules.expiry} · 1 poin = {rupiah(cfg.rules.poinToRp)}</p>

      <div className="mt-6 border-t border-white/15 pt-5">
        <p className="truncate text-[17px] font-bold">{customer?.outlet || account.laundry}</p>
        <p className="truncate text-[13px] text-white/75">{customer?.pic || account.pic} · {customer?.kota || account.kota}</p>
        {(customer?.rsl || account.rsl) && <p className="mt-1 t-code text-[12px] tracking-wider text-gold-200">{customer?.rsl || account.rsl}</p>}
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between gap-3 text-[12px]">
          <span className="text-white/75">Belanja {rmc.win.label}: <strong className="t-code text-white">{rupiah(rmc.spend6)}</strong></span>
          <span className="t-code shrink-0 font-semibold text-gold-200">{rmc.next ? `${rupiah(rmc.toNext, { short: true })} lagi ke ${rmc.next.name}` : 'Tier tertinggi'}</span>
        </div>
        <Progress value={rmc.progress * 100} tone="gold" className="mt-2 bg-white/15" aria-label="Progres ke tier berikutnya" />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
        <div>
          <p className="text-[12px] font-semibold text-white/70">Diskon aktif</p>
          <p className="t-fig t-fig-black text-[24px] leading-tight">{rmc.discount}%</p>
        </div>
        {floorApplied ? <Badge variant="gold">Min. Mitra</Badge> : isMitra ? <Badge variant="inverse">Mitra Apique</Badge> : null}
      </div>
    </HeroShell>
  )
}
