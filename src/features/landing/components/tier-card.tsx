'use client'

import * as React from 'react'
import { Check, Crown, Medal, X } from 'lucide-react'
import { Reveal } from '@/components/layout/reveal'
import type { Tier } from '@/types/member'
import { cn } from '@/lib/utils'
import { CountPct } from './count-pct'

const rpFull = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

export function TierCardV({ tier, idx, top, active }: { tier: Tier; idx: number; top: boolean; active?: boolean }) {
  const ongkirOn = tier.freeDelivMin !== null
  const konsulOn = tier.consult > 0
  return (
    <Reveal as="li" delay={idx * 60} data-active={active ? 'true' : 'false'} className={cn('lift tier-card card-fx reveal-pop group relative flex w-[76%] shrink-0 snap-center flex-col overflow-hidden rounded-xl p-4 text-white sm:w-[44%] lg:w-auto', top && 'sweep ring-2 ring-gold ring-offset-2 ring-offset-white hover:shadow-gold')}
      style={{ '--tier': tier.sw, '--tint': 'rgba(255,255,255,.10)', background: tier.sw } as React.CSSProperties}>
      <span aria-hidden className="t-fig pointer-events-none absolute -bottom-3 -right-1 select-none text-[96px] leading-none text-white/10">{idx + 1}</span>
      <div className="tier-head relative flex items-start justify-between gap-2">
        <span className={cn('badge grid h-11 w-11 shrink-0 place-items-center rounded-full', top ? 'bg-gold text-gold-ink' : 'bg-white/15 text-white')} aria-hidden>
          {top ? <Crown className="h-6 w-6" strokeWidth={1.6} fill="currentColor" /> : <Medal className="h-6 w-6" strokeWidth={1.7} />}
        </span>
      </div>
      <h3 className="mt-3 text-[18px] font-extrabold leading-tight">{tier.name}</h3>
      <p className="t-num text-[12px] text-white/75">{tier.perMonth} / bulan</p>
      <div className="mt-3 border-t border-white/20 pt-3" data-row="diskon">
        <p className="text-[11px] font-semibold leading-tight text-white/80">Benefit Diskon<br />Tiap Transaksi</p>
        <CountPct value={tier.discount} className={cn('mt-1', top ? 'text-gold' : 'text-white')} />
      </div>
      <TierRow on={ongkirOn} label="Gratis Ongkir" sub="Min Belanja" value={tier.freeDelivMin === null ? undefined : tier.freeDelivMin === 0 ? 'Tanpa min.' : rpFull(tier.freeDelivMin)} row="ongkir" />
      <TierRow on={konsulOn} label="Gratis Sesi" sub="Konsultasi Bisnis" value={konsulOn ? `${tier.consult}x /bulan` : undefined} row="konsul" />
      {/* bands are inclusive both ends (0–8.999.999, next tier starts sharp at 9.000.000), the exact rupiah, Lurd's rule */}
      <div className="mt-3 border-t border-white/20 pt-3" data-row="belanja">
        <p className="text-[11px] font-semibold text-white/80">Belanja 6 Bulan (Rp)</p>
        <p className="t-num mt-0.5 text-[13px] font-bold">{tier.max !== null ? <>{tier.min.toLocaleString('id-ID')} –<br />{tier.max.toLocaleString('id-ID')}</> : `≥ ${tier.min.toLocaleString('id-ID')}`}</p>
      </div>
      <span className="bar" aria-hidden />
    </Reveal>
  )
}

/* one benefit row of a tier column: the mock's filled check (green) / cross (muted) disc before the label */
function TierRow({ on, label, sub, value, row }: { on: boolean; label: string; sub: string; value?: string; row: string }) {
  return (
    <div className="mt-3 border-t border-white/20 pt-3" data-row={row}>
      <div className="flex items-start gap-2">
        <span className={cn('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ring-1 ring-white/40', on ? 'bg-green text-white' : 'bg-danger text-white')} aria-hidden data-mark={on ? 'check' : 'x'}>
          {on ? <Check className="h-3 w-3" strokeWidth={3.4} /> : <X className="h-3 w-3" strokeWidth={3.2} />}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-tight">{label}</p>
          <p className="text-[11px] font-semibold leading-tight text-white/75">{sub}</p>
          {value && <p className="t-num mt-1 text-[14px] font-extrabold leading-none">{value}</p>}
        </div>
      </div>
    </div>
  )
}
