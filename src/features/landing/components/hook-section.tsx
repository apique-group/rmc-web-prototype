'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { rupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/api/mock/config'
import { Button } from '@/components/ui/button'
import { BannerGround } from './banner-ground'
import { Marked } from './marked'
import { StaggerWords } from './stagger-words'

/* 1, Hook = the RGP mock's banner card with a slider, styled like the drenched R.025 hook (Lurd, 11 Sep): navy-900
   drench, wire-frame cubes, floating green dot, doodle; slide 1 carries the mock's exact words and a floating collage
   of the three biggest Golden Sale drops with the HEMAT seal. 3 slides, dots + arrows, autoplay paused on hover/focus
   and under reduced motion. Copy is config-driven. */
export function HookSection() {
  const { copy, items, assets } = useConfig(s => s.config)
  const drops = items.filter(i => i.active && i.realPrice > i.promoPrice)
    .map(i => ({ ...i, pct: Math.round((1 - i.promoPrice / i.realPrice) * 100), save: i.realPrice - i.promoPrice }))
    .sort((a, b) => b.save - a.save)
  const maxPct = Math.max(...drops.map(d => d.pct), 0)
  const jump = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }
  const track = React.useRef<HTMLDivElement>(null)
  const [idx, setIdx] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const count = 3
  // pointer parallax (desktop): the ground layers shift by their depth, --px / --py in -1..1 on the banner
  const banner = React.useRef<HTMLDivElement>(null)
  const onMove = (e: React.PointerEvent) => {
    const el = banner.current; if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--px', String(((e.clientX - r.left) / r.width - 0.5) * 2))
    el.style.setProperty('--py', String(((e.clientY - r.top) / r.height - 0.5) * 2))
  }
  const onLeave = () => { const el = banner.current; if (el) { el.style.setProperty('--px', '0'); el.style.setProperty('--py', '0') } }
  const goTo = React.useCallback((i: number) => { const el = track.current; if (!el) return; const n = ((i % count) + count) % count; el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' }) }, [])
  React.useEffect(() => {
    const el = track.current; if (!el) return
    const onScroll = () => setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
    el.addEventListener('scroll', onScroll, { passive: true }); return () => el.removeEventListener('scroll', onScroll)
  }, [])
  React.useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => goTo(idx + 1), 6000); return () => clearInterval(t)
  }, [idx, paused, goTo])
  const slides = [
    { id: 'harga', kicker: 'Resique Supermarket Laundry', title: copy.hook, sub: copy.hookSub, h1: true },
    { id: 'hadiah', kicker: 'Resique Member Card', title: copy.tagline, sub: copy.taglineSub, h1: false },
    { id: 'sale', kicker: 'Golden Sale', title: 'Golden Sale!!', sub: `Harga turun paling besar sampai -${maxPct}%`, h1: false },
  ]
  const tile = (j: number) => cn('hook-float absolute overflow-hidden rounded-xl bg-white shadow-3', j === 0 && 'left-0 top-8 z-20 w-[54%] rotate-[-5deg]', j === 1 && 'right-0 top-0 z-10 w-[48%] rotate-6 [animation-delay:1.5s]', j === 2 && 'bottom-0 right-[4%] w-[48%] -rotate-3 [animation-delay:3s]')
  return (
    <section id="hook" className="scroll-mt-20 bg-white pb-10 pt-5 lg:pb-14 lg:pt-8">
      {/* plain white like the prize section under it; the card carries all the depth (Lurd, 11 Sep) */}
      <div className="container relative">
        <div ref={banner} className="relative isolate overflow-hidden rounded-xl bg-navy-900 text-white shadow-3" data-banner data-reveal="in" onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); onLeave() }} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onPointerMove={onMove}>
          <BannerGround />
          <div ref={track} className="banner-track no-scrollbar flex snap-x snap-mandatory overflow-x-auto" role="region" aria-roledescription="carousel" aria-label="Banner Golden Privilege">
            {slides.map((sl, i) => {
              const Title = sl.h1 ? 'h1' : 'h2'
              return (
                <div key={sl.id} data-slide={sl.id} className={cn('relative grid w-full shrink-0 snap-start grid-cols-1 items-center gap-8 px-6 pb-14 pt-8 sm:px-10 lg:min-h-[460px] lg:grid-cols-12 lg:gap-6 lg:px-14 lg:py-12', sl.id === 'harga' && 'grid-rows-[1fr_auto] lg:grid-rows-none')} aria-roledescription="slide" aria-label={`${i + 1} dari ${count}`}>
                  <div className="min-w-0 lg:col-span-7">
                    <Title className={cn('t-mega mt-4 max-w-3xl text-balance uppercase text-white', !sl.h1 && 'text-[clamp(30px,5vw,60px)]')}>{sl.h1 ? <StaggerWords text={sl.title} neon /> : <Marked text={sl.title} className="mark-neon text-green" />}</Title>
                    {sl.sub && <p className={cn('mt-3 max-w-xl text-balance font-extrabold uppercase text-white', sl.h1 ? 'text-[20px] sm:text-[26px]' : 'text-[15px] font-semibold normal-case text-white/85 sm:text-[17px]')}>{sl.sub}</p>}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                      {sl.id === 'hadiah' ? (
                        <Button asChild size="lg" className="arrow-nudge bg-green text-navy-900 shadow-2 hover:-translate-y-0.5 hover:bg-green-200"><Link href="/register">Daftar Sekarang <ArrowRight className="h-4 w-4" strokeWidth={2} /></Link></Button>
                      ) : (
                        <Button asChild size="lg" className="arrow-nudge bg-green text-navy-900 shadow-2 hover:-translate-y-0.5 hover:bg-green-200"><a href="#golden-sale" onClick={jump('golden-sale')}>Lihat Golden Sale <ArrowRight className="h-4 w-4" strokeWidth={2} /></a></Button>
                      )}
                      {sl.h1 && <Link href="/login" className="u-slide arrow-nudge inline-flex min-h-[44px] items-center gap-1 text-[15px] font-semibold text-white [--u-bottom:8px]">Cek poin-mu! <ChevronsRight className="h-4 w-4" strokeWidth={2} /></Link>}
                    </div>
                  </div>
                  <div className={cn('min-w-0 lg:col-span-5', sl.id === 'harga' && 'lg:self-end')}>
                    {sl.id === 'harga' && (
                      /* the mock's own hero picture: phone-in-hand with the Resique WhatsApp profile, Rinso pouch + jerrycan, washing
                         machine and scale floating around it (layers lifted from the RGP PDF, composited once → hero-phone.webp).
                         It sits on the banner floor and the hand runs off the bottom edge, exactly like the source. */
                      <div className="hook-card-wrap relative -mx-6 -mb-14 w-[calc(100%+48px)] sm:mx-auto sm:w-full sm:max-w-[560px] lg:absolute lg:bottom-0 lg:right-0 lg:m-0 lg:w-[680px] lg:max-w-none">
                        <img src="/img/hero-phone.webp" alt="Profil WhatsApp Customer Solution Resique di HP, dikelilingi produk laundry" width={1010} height={606} className="hook-float block w-full" loading="eager" decoding="async" data-hero-art />
                      </div>
                    )}
                    {sl.id === 'hadiah' && (
                      <div className="relative mx-auto h-[220px] w-full max-w-[420px] sm:h-[260px]">
                        {assets.heroPrizes.slice(0, 3).map((p, j) => (
                          <div key={p.id} className={tile(j)}>
                            <img src={p.image} alt={p.label} width={800} height={600} className="aspect-4/3 w-full object-cover" loading="lazy" decoding="async" />
                            <p className="truncate px-3 py-1.5 text-[12px] font-bold text-ink">{p.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {sl.id === 'sale' && (
                      <div className="mx-auto grid w-full max-w-[420px] grid-cols-2 gap-3">
                        {drops.slice(0, 4).map((d, j) => (
                          <a key={d.id} href="#golden-sale" onClick={jump('golden-sale')} data-no-press className={cn('lift group relative overflow-hidden rounded-xl bg-white shadow-3', j % 2 ? 'prize-b' : 'prize-a')}>
                            <img src={d.image} alt={d.name} width={800} height={600} className="zoom-img aspect-4/3 w-full object-cover" loading="lazy" decoding="async" />
                            <span className="absolute left-2 top-2 rounded-md bg-gold px-2 py-0.5 text-[11px] font-extrabold text-gold-ink">-{d.pct}%</span>
                            <span className="flex items-baseline gap-2 px-3 py-1.5"><span className="t-fig text-[14px] text-navy-700">{rupiah(d.promoPrice)}</span><span className="t-num strike text-[11px] text-ink-3">{rupiah(d.realPrice)}</span></span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <button type="button" aria-label="Slide sebelumnya" onClick={() => goTo(idx - 1)} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-[background-color,transform] duration-base hover:-translate-x-0.5 hover:bg-white/20 lg:grid"><ChevronLeft className="h-5 w-5" strokeWidth={2} /></button>
          <button type="button" aria-label="Slide berikutnya" onClick={() => goTo(idx + 1)} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-[background-color,transform] duration-base hover:translate-x-0.5 hover:bg-white/20 lg:grid"><ChevronRight className="h-5 w-5" strokeWidth={2} /></button>
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5" role="tablist" aria-label="Pilih slide">
            {slides.map((sl, i) => (
              <button key={sl.id} type="button" role="tab" aria-selected={i === idx} aria-label={`Slide ${i + 1}`} onClick={() => goTo(i)} className={cn('banner-dot h-2 rounded-full transition-[width,background-color] duration-base', i === idx ? 'w-7 bg-green' : 'w-2 bg-white/40 hover:bg-white/70')} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
