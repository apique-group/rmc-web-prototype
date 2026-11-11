'use client'

import * as React from 'react'
import Link from 'next/link'
import { Coins } from 'lucide-react'
import { Reveal } from '@/components/layout/reveal'
import { useCountUp } from '@/features/landing/hooks/use-count-up'
import { useInView } from '@/hooks/use-in-view'
import { poin } from '@/lib/format'
import type { Prize } from '@/types/member'
import { cn } from '@/lib/utils'

export function PrizeCard({ prize, idx }: { prize: Prize; idx: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>()
  const pts = useCountUp(prize.pointCost, inView, 900)
  return (
    <Reveal as="li" delay={idx * 80} className="reveal-pop">
      <Link href="/login" data-prize-card className={cn('lift card-fx sweep group relative flex h-full flex-col rounded-lg border border-line bg-white p-3 sm:p-4', idx % 2 ? 'prize-b' : 'prize-a')} data-no-press style={{ '--tint': '#F1F9EA' } as React.CSSProperties}>
        {idx === 0 && <span className="absolute left-4 top-4 z-10 -rotate-6 rounded-md bg-navy-700 px-2 py-1 text-[11px] font-extrabold text-white shadow-2 sm:left-5 sm:top-5">Hadiah utama</span>}
        <span className="block overflow-hidden rounded-md bg-surface-2"><img src={prize.image} alt={prize.name} width={800} height={600} className="zoom-img aspect-4/3 w-full object-cover" loading="lazy" decoding="async" /></span>
        <span className="mt-3 line-clamp-2 min-h-[2.6em] text-[13px] font-bold leading-snug text-ink sm:text-[14px]">{prize.name}</span>
        <span ref={ref} className="chip mt-2 inline-flex w-fit items-center gap-1.5 rounded-md bg-gold-100 px-2 py-1 text-[12px] font-extrabold text-gold-ink transition-transform duration-base group-hover:-rotate-3 group-hover:scale-105"><Coins className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /><span className="t-fig text-[13px]">{poin(pts)}</span> Pt</span>
      </Link>
    </Reveal>
  )
}
