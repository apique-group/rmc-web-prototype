'use client'

import * as React from 'react'
import { Reveal } from '@/components/common/reveal'
import { cn } from '@/lib/utils'
import { SectionTitle } from './section-title'
import { TierCardV } from './tier-card'
import { useAppConfig } from '@/hooks/use-member-data'

/* 4, Tier = the mock's six columns: emblem, name, per-month, then "Benefit Diskon Tiap Transaksi" + %, "Gratis Ongkir /
   Min Belanja / Rp 500.000", "Gratis Sesi Konsultasi Bisnis / 1x /bulan", "Belanja 6 Bulan (Rp) / band" — the check and
   cross marks sit before the row label as in the mock. Mobile keeps the snap rail. */
export function TierSection() {
  const cfg = useAppConfig()
  const rail = React.useRef<HTMLOListElement>(null)
  const [active, setActive] = React.useState(0)
  React.useEffect(() => {
    const el = rail.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const mq = window.matchMedia('(max-width: 1023px)')
    if (!mq.matches) return
    const items = [...el.querySelectorAll<HTMLElement>(':scope > li')]
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= 0.6) setActive(items.indexOf(e.target as HTMLElement)) })
    }, { root: el, threshold: [0.6] })
    items.forEach(li => io.observe(li))
    let nudged = false
    const hint = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || nudged) return
      nudged = true
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      setTimeout(() => { el.scrollTo({ left: 40, behavior: 'smooth' }); setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 520) }, 700)
    }, { threshold: 0.4 })
    hint.observe(el)
    return () => { io.disconnect(); hint.disconnect() }
  }, [cfg.tiers.length])
  const goTo = (i: number) => { const li = rail.current?.querySelectorAll<HTMLElement>(':scope > li')[i]; li?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }) }
  return (
    <section id="tier" className="relative isolate scroll-mt-20 overflow-hidden border-t border-line bg-linear-to-b from-white via-navy-50/60 to-white py-14 lg:py-24">
      {/* R.045 (Lurd): the streak mesh plus two skewed bands plus the wash was three competing
          layers. One layer now — two oversized, heavily blurred tints bleeding in from the
          corners. No edges to notice, so it reads as depth rather than as pattern. */}
      <span aria-hidden className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[560px] w-[560px] rounded-full bg-navy-100/50 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -right-48 bottom-[-14%] -z-10 h-[620px] w-[620px] rounded-full bg-gold-100/40 blur-3xl" />
      <div className="container">
        <SectionTitle title={cfg.copy.tierTitle} sub={cfg.copy.tierSub} center />
        <ol ref={rail} className="tier-rail no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-3 lg:overflow-visible lg:px-0 lg:pb-0" aria-label="Daftar tier RMC">
          {cfg.tiers.map((t, i) => <TierCardV key={t.key} tier={t} idx={i} top={i === cfg.tiers.length - 1} active={i === active} />)}
        </ol>
        <div className="mt-2 flex items-center justify-center gap-1.5 lg:hidden" role="tablist" aria-label="Geser tier">
          {cfg.tiers.map((t, i) => (
            <button key={t.key} type="button" role="tab" aria-selected={i === active} aria-label={t.name} onClick={() => goTo(i)} className={cn('tier-dot h-2 rounded-full', i === active ? 'w-6' : 'w-2 bg-line')} style={i === active ? { background: t.sw } : undefined} />
          ))}
        </div>
        <Reveal delay={120} className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3 shadow-1" data-mitra-note>
          <span className="t-fig mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gold text-[15px] text-gold-ink" aria-hidden>*</span>
          <p className="t-note text-[15px] leading-relaxed text-gold-ink">*Mitra Apique Management memiliki diskon minimal <strong className="font-medium">{cfg.mitraFloorDiscount}%</strong> sejak Starter. Jika diskon tier lebih besar, itu yang dipakai.</p>
        </Reveal>
      </div>
    </section>
  )
}
