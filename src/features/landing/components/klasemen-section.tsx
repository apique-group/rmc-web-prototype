'use client'

import * as React from 'react'
import { Medal, ShoppingBag, Sparkles, Trophy } from 'lucide-react'
import { Reveal } from '@/components/common/reveal'
import { rupiah } from '@/lib/format'
import { maskPhone } from '@/lib/phone'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/api/mock/config'
import { klasemen, klasemenIsYou, useOrders } from '@/lib/api/mock/orders'
import { useCurrentAccount } from '@/stores/auth.store'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/empty-state'
import { CountRupiah } from './count-rupiah'
import { Rings } from './rings'
import { SectionTitle } from './section-title'
import { Streaks } from './streaks'

/* 7, Klasemen: a podium for the top three (rank 1 in navy with the trophy, the grand-prize chip and a gold ring;
   2 and 3 flank it in silver / bronze), then rows 4–10 with a spend bar that fills on reveal. One <ol> so the ranking
   stays a single ordered list; the podium is laid out with CSS `order` so DOM order = rank order. */
export function KlasemenSection() {
  const cfg = useConfig(s => s.config)
  const orders = useOrders(s => s.orders)
  const acc = useCurrentAccount()
  const rows = React.useMemo(() => klasemen(orders, cfg.campaign.start, cfg.campaign.end, cfg.klasemen.showPic), [orders, cfg.campaign.start, cfg.campaign.end, cfg.klasemen.showPic])
  const top = rows.slice(0, cfg.klasemen.topN)
  const mine = rows.find(r => klasemenIsYou(r, acc))
  const leadSpend = top[0]?.spend || 1
  const grand = cfg.assets.heroPrizes[0]
  const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <section id="klasemen" className="scroll-mt-20 bg-white pb-10 pt-14 lg:pb-14 lg:pt-24">
      <div className="container">
        {/* the frame: a gold panel that carries the arena (navy stage floor, spotlight beams, rings, sparkles);
            the section itself stays plain white (Lurd, 11 Sep) */}
        <div data-klasemen-frame className="relative isolate overflow-hidden rounded-2xl bg-navy-900 px-5 py-8 text-white ring-1 ring-white/10 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <Streaks className="-z-10" />
          <span aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] -z-10 h-[520px] w-[140%] -translate-x-1/2 rounded-[50%] bg-navy-800 lg:top-[34%] lg:h-[620px] lg:w-[110%]" />
          <span aria-hidden className="pointer-events-none absolute left-[18%] top-[-10%] -z-10 h-[70%] w-[22%] origin-top skew-x-18 bg-white/4" />
          <span aria-hidden className="pointer-events-none absolute right-[18%] top-[-10%] -z-10 h-[70%] w-[22%] origin-top skew-x-[-18deg] bg-white/4" />
          <Rings className="right-[-120px] bottom-[-100px] -z-10 h-[380px] w-[380px] text-gold" />
          <Rings className="left-[-160px] top-[-140px] -z-10 h-[360px] w-[360px] text-navy-500" />
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            {['left-[8%] top-[140px]', 'right-[10%] top-[40px] hidden md:block', 'left-[48%] top-[24px] hidden lg:block'].map((st, i) => <Sparkles key={st} className={cn('float-6 absolute h-6 w-6 text-gold', st)} strokeWidth={1.6} style={{ animationDelay: `${1 + i}s` }} />)}
          </div>
<SectionTitle title={cfg.copy.klasemenTitle} sub={cfg.copy.klasemenSub} tone="white" mark="mark-gold text-gold [--mark:rgba(212,160,78,.38)]" />
        {top.length === 0 ? <EmptyState className="mt-8" title="Belum ada pesanan Lunas" desc="Pesanan yang sudah Lunas akan tampil di sini." /> : (
          <ol className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3 sm:items-end sm:gap-4" aria-label="Peringkat belanja Golden Sale">
            {top.map((r, i) => {
              const me = !!mine && r.key === mine.key
              const share = Math.max(4, Math.round((r.spend / leadSpend) * 100))
              if (i < 3) {
                const first = i === 0
                const medal = ['Emas', 'Perak', 'Perunggu'][i]
                return (
                  <Reveal as="li" key={r.key} data-rank={r.rank} data-you={me || undefined} delay={first ? 320 : i === 1 ? 160 : 0}
                    className={cn('lift podium-rise relative flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 rounded-xl p-4 text-left sm:flex-col sm:flex-nowrap sm:items-center sm:justify-start sm:gap-0 sm:px-4 sm:pb-4 sm:pt-5 sm:text-center', ['podium-1', 'podium-2', 'podium-3'][i],
                      first ? 'ring-pulse bg-navy-700 text-white ring-2 ring-gold ring-offset-2 ring-offset-navy-900 sm:order-2 sm:min-h-[340px] sm:pb-6 sm:pt-7' : 'border sm:order-1',
                      i === 1 && 'border-[#C0C6CE] bg-[#F3F5F8] sm:min-h-[292px]',
                      i === 2 && 'border-[#E3C3A8] bg-[#FBF3EC] sm:order-3 sm:min-h-[256px]')}>
                    {/* big faint rank number, like the tier columns */}
                    <span aria-hidden className={cn('t-fig pointer-events-none absolute -bottom-3 right-2 select-none text-[88px] leading-none', first ? 'text-white/10' : 'text-navy-900/6')}>{r.rank}</span>
                    {/* medal: trophy for rank 1 (the only svg in that li, the gate counts it); a medal icon in silver / bronze for 2 and 3 */}
                    <span className={cn('medal grid shrink-0 place-items-center rounded-full', first ? 'h-14 w-14 bg-gold text-gold-ink sm:h-16 sm:w-16' : 'h-12 w-12 text-white sm:h-14 sm:w-14')} style={first ? undefined : { background: 'var(--pod)' }} aria-hidden>
                      {first ? <Trophy className="h-7 w-7" strokeWidth={1.6} /> : <Medal className="h-6 w-6" strokeWidth={1.7} />}
                    </span>
                    <span className={cn('hidden h-11 w-11 place-items-center rounded-full text-[14px] font-extrabold sm:mt-3 sm:grid', first ? 'bg-white/15 text-white' : 'bg-white text-navy-700 shadow-1')} aria-hidden>{initials(r.laundry)}</span>
                    <div className="relative min-w-0 flex-1 sm:w-full sm:flex-none">
                      <p className={cn('t-num text-[11px] font-bold sm:mt-2', first ? 'text-gold' : i === 1 ? 'text-[#6B7480]' : 'text-[#9A5F33]')}>Peringkat {r.rank} · {medal}{first && <span> · kandidat hadiah utama</span>}</p>
                      <p className={cn('mt-0.5 wrap-break-word text-[16px] font-extrabold leading-tight sm:mt-1 sm:line-clamp-2 sm:text-balance', first ? 'text-white' : 'text-ink')}>{r.laundry}{me && <Badge className="ml-1 align-middle">Kamu</Badge>}</p>
                      <p className={cn('t-num mt-0.5 truncate text-[12px]', first ? 'text-white/75' : 'text-ink-2')} data-klasemen-sub>{cfg.klasemen.showPic ? `${r.pic} (${maskPhone(r.phone)})` : maskPhone(r.phone)}</p>
                    </div>
                    <CountRupiah value={r.spend} className={cn('relative shrink-0 text-[17px] leading-none sm:mt-2 sm:w-full sm:truncate sm:text-[22px]', first ? 'text-gold' : 'text-navy-700')} />
                    {first && grand && (
                      <span className="relative inline-flex min-w-full shrink-0 items-center gap-2 self-start rounded-md bg-white/10 py-1 pl-1 pr-2.5 text-[12px] font-semibold text-white sm:mt-3 sm:min-w-0">
                        <img src={grand.image} alt="" width={800} height={600} className="h-6 w-6 shrink-0 rounded-sm object-cover" loading="lazy" />
                        <span className="truncate">Hadiah utama: {grand.label}</span>
                      </span>
                    )}
                    {/* spend relative to the leader */}
                    <div className={cn('relative h-1.5 min-w-full shrink-0 overflow-hidden rounded-full sm:mt-4', first ? 'bg-white/15' : 'bg-navy-900/10')} aria-hidden>
                      <div className="bar-fill h-full rounded-full" style={{ width: `${share}%`, background: first ? '#D4A04E' : 'var(--pod)' }} />
                    </div>
                  </Reveal>
                )
              }
              return (
                <Reveal as="li" key={r.key} data-rank={r.rank} data-you={me || undefined} delay={Math.min(i, 9) * 40} className={cn('slide -mx-3 rounded-md px-3 py-3 hover:bg-white/10 sm:order-4 sm:col-span-3 sm:-mx-4 sm:px-4', i === 3 && 'mt-2 sm:mt-4', me && 'bg-green/15 hover:bg-green/15')}>
                  <div className="flex items-center gap-4">
                    <span className="t-fig grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/10 text-[15px] text-white/70">{r.rank}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold text-white">{r.laundry}{me && <Badge className="ml-2 align-middle">Kamu</Badge>}</p>
                      <p className="t-num truncate text-[13px] text-white/65" data-klasemen-sub>{cfg.klasemen.showPic ? `${r.pic} (${maskPhone(r.phone)})` : maskPhone(r.phone)}</p>
                    </div>
                    <p className="t-fig shrink-0 text-[15px] text-gold sm:text-[17px]">{rupiah(r.spend)}</p>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15" style={{ marginLeft: 52 }} aria-hidden>
                    <div className="bar-fill h-full rounded-full bg-green" style={{ width: `${share}%` }} />
                  </div>
                </Reveal>
              )
            })}
            {mine && mine.rank > cfg.klasemen.topN && (
              <li className="-mx-3 mt-2 flex items-center gap-4 rounded-md bg-green/15 px-3 py-3.5 sm:order-5 sm:col-span-3 sm:-mx-4 sm:px-4">
                <span className="t-fig grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[15px] text-navy-700">{mine.rank}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-bold text-white">{mine.laundry} <Badge className="ml-1 align-middle">Kamu</Badge></p><p className="text-[13px] text-white/65">Peringkatmu saat ini</p></div>
                <p className="t-fig text-[15px] text-gold">{rupiah(mine.spend)}</p>
              </li>
            )}
          </ol>
        )}
        </div>
        <p className="t-num mt-6 max-w-2xl text-[13px] leading-relaxed text-ink-2">Yang dihitung: pesanan Lunas (bukti bayar sudah diverifikasi) dalam periode {cfg.campaign.label}. Rp{cfg.rules.earnPerRp.toLocaleString('id-ID')} belanja = 1 poin.</p>
        <span className="hidden"><ShoppingBag /></span>
      </div>
    </section>
  )
}
