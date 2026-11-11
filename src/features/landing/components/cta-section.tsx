'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { BENEFIT_ICONS } from '@/lib/benefit-icons'
import { Reveal } from '@/components/common/reveal'
import { useConfig } from '@/lib/api/mock/config'
import { useCurrentAccount } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Marked } from './marked'
import { RmcCardPreview } from './rmc-card-preview'
import { Streaks } from './streaks'

/* 5, CTA band = the mock's "Daftar RMC Sekarang!": title + sub from the mock, the four benefit highlights (icon
   chips), then the three step chips and the RMC card preview kept from the earlier rounds. Primary = Daftar Sekarang
   (green), secondary = Masuk & cek poin (white). */
export function CtaSection() {
  const cfg = useConfig(s => s.config)
  const { copy, rules, benefits } = cfg
  const acc = useCurrentAccount()
  return (
    <section id="cek-poin" className="relative isolate scroll-mt-20 overflow-hidden bg-navy-700 py-16 text-white lg:py-24">
      <Streaks dim />
      <span aria-hidden className="band bg-navy-800" style={{ left: '-12%', bottom: '-40%', width: '52%', height: '80%' }} />
      <div className="container relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="min-w-0 lg:col-span-7">
          <Reveal>
            <h2 className="t-h1 text-balance text-white"><Marked text={copy.ctaPoints} className="mark-light" /></h2>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-pretty text-white/85 sm:text-[17px]">{copy.ctaPointsSub}</p>
          </Reveal>
          <Reveal delay={60}>
            <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" aria-label="Keuntungan member" data-cta-benefits>
              {benefits.map((b, i) => { const Icon = BENEFIT_ICONS[b.icon] || Sparkles; return (
                <li key={b.id} className="lift-lg card-fx flex min-w-0 flex-col items-center gap-3 rounded-xl bg-white/10 px-3 py-4 text-center ring-1 ring-white/15 sm:py-5" style={{ '--tint': 'rgba(255,255,255,.08)' } as React.CSSProperties}>
                  <span className="chip pulse-ring grid h-14 w-14 shrink-0 place-items-center rounded-full bg-green text-navy-900 shadow-2 sm:h-16 sm:w-16" style={{ '--pd': `${i * 0.6}s` } as React.CSSProperties} aria-hidden><Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.9} /></span>
                  <span className="text-[13px] font-extrabold leading-tight text-white sm:text-[14px]">{b.title}</span>
                </li>
              ) })}
            </ul>
          </Reveal>
          <Reveal delay={160} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            {acc ? (
              <Button asChild size="lg" className="arrow-nudge bg-green text-navy-900 shadow-2 hover:-translate-y-0.5 hover:bg-green-200">
                <Link href="/profile">Buka profil RMC <ArrowRight className="h-4 w-4" strokeWidth={2} /></Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="arrow-nudge bg-green text-navy-900 shadow-2 hover:-translate-y-0.5 hover:bg-green-200">
                  <Link href="/register">Daftar Sekarang <ArrowRight className="h-4 w-4" strokeWidth={2} /></Link>
                </Button>
                <Button asChild size="lg" variant="inverse" className="arrow-nudge hover:-translate-y-0.5">
                  <Link href="/login">Masuk & cek poin <ArrowRight className="h-4 w-4" strokeWidth={2} /></Link>
                </Button>
              </>
            )}
          </Reveal>
        </div>
        <Reveal delay={120} className="min-w-0 lg:col-span-5">
          {/* R.041 (Lurd): QR first, card underneath, and the code big enough to scan off a screen
              across a counter rather than from arm's length. */}
          <div className="mx-auto flex max-w-[400px] items-center gap-5 rounded-xl bg-white p-5 text-ink shadow-3 lg:ml-auto lg:mr-0" data-site-qr>
            <img src="/img/qr-site.svg" alt="QR kode ke rmc-web-beta.vercel.app" width={176} height={176} className="h-36 w-36 shrink-0 rounded-md sm:h-44 sm:w-44" loading="lazy" decoding="async" />
            <div className="min-w-0">
              <p className="text-[15px] font-extrabold leading-tight text-navy-700">Scan untuk buka web Golden Privilege</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">Arahkan kamera HP ke QR ini, atau bagikan ke teman laundry-mu.</p>
              <p className="t-code mt-2 truncate text-[12px] font-bold text-green-700">rmc-web-beta.vercel.app</p>
            </div>
          </div>
          <div className="mt-6"><RmcCardPreview rules={rules} /></div>
        </Reveal>
      </div>
    </section>
  )
}
