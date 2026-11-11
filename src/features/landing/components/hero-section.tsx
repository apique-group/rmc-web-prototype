'use client'

import { Reveal } from '@/components/common/reveal'
import { useConfig } from '@/lib/api/mock/config'
import { EmptyState } from '@/components/common/empty-state'
import { Marked } from './marked'
import { PrizeCard } from './prize-card'

/* 2, Hero = the mock's prize grid, made playful (Lurd, 11 Sep): the "TANPA DIUNDI!" of the sub is a gold sticker,
   the four prize cards rest with an alternating tilt, pop in staggered, straighten + zoom on hover with a light sweep,
   the point chip counts up, and the biggest prize carries a "Hadiah utama" seal. Prizes come from config. */
export function HeroSection() {
  const { copy, prizes } = useConfig(s => s.config)
  const top = [...prizes].filter(p => p.active).sort((a, b) => b.pointCost - a.pointCost).slice(0, 4)
  const STICK = 'TANPA DIUNDI!'
  const sub = copy.taglineSub.includes(STICK) ? copy.taglineSub.split(STICK) : null
  return (
    <section id="hero" className="scroll-mt-20 bg-white py-14 lg:py-20">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="t-h2 text-balance text-ink"><Marked text={copy.tagline} /></h2>
          <p className="mt-3 text-[15px] leading-relaxed text-pretty text-ink-2 sm:text-[17px]">
            {sub ? <>{sub[0]}<span className="sticker-in inline-block -rotate-3 rounded-md bg-gold px-2 py-0.5 text-[13px] font-extrabold uppercase text-gold-ink shadow-1 sm:text-[14px]">{STICK}</span>{sub[1]}</> : copy.taglineSub}
          </p>
        </Reveal>
        {top.length === 0 ? <EmptyState className="mt-8" title="Hadiah belum diatur" desc="Admin menambahkan hadiah lewat CRM." /> : (
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5" aria-label="Hadiah Golden Privilege">
            {top.map((p, i) => <PrizeCard key={p.id} prize={p} idx={i} />)}
          </ul>
        )}
      </div>
    </section>
  )
}
