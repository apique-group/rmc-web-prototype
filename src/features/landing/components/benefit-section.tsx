'use client'

import * as React from 'react'
import { ArrowRight, ShoppingBag, ShoppingCart, Star, Ticket } from 'lucide-react'
import { Reveal } from '@/components/common/reveal'
import { useInView } from '@/hooks/use-in-view'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/api/mock/config'
import { BenefitRow } from './benefit-row'
import { Marked } from './marked'
import { MemberCardArt } from './member-card-art'
import { Streaks } from './streaks'

/* 3, Benefit = the mock's navy band: title with "Tak Terbatas" in green (translucent green band under it, not a
   solid one), the member card, four benefits (icon disc · title · one line) whose discs breathe, then the four-step
   strip in the mock's colours (green / blue / blue / green discs, numbered) with an active step that cycles
   left → right so the flow reads itself (Lurd, 11 Sep: "the user is no fun"). */
const STEPS = [
  { n: 1, icon: ShoppingCart, label: ['Diskon', 'Belanja'], tone: 'bg-green text-navy-900', badge: 'bg-navy-700 text-white' },
  { n: 2, icon: Star, label: ['Dapatkan', 'Point'], tone: 'bg-navy-500 text-white', badge: 'bg-green text-navy-900' },
  { n: 3, icon: Ticket, label: ['Tukarkan', 'Voucher'], tone: 'bg-navy-500 text-white', badge: 'bg-green text-navy-900' },
  { n: 4, icon: ShoppingBag, label: ['Nikmati', 'Keuntungannya'], tone: 'bg-green text-navy-900', badge: 'bg-navy-700 text-white' },
]

export function BenefitSection() {
  const { copy, benefits } = useConfig(s => s.config)
  const { ref: stepsRef, inView: stepsIn } = useInView<HTMLOListElement>()
  const [step, setStep] = React.useState(-1)
  React.useEffect(() => {
    if (!stepsIn) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setStep(0); return }
    let i = 0; setStep(0)
    const t = setInterval(() => { i = (i + 1) % STEPS.length; setStep(i) }, 1500)
    return () => clearInterval(t)
  }, [stepsIn])
  return (
    <section id="benefit" className="scroll-mt-20">
      <div className="relative isolate overflow-hidden bg-navy-700 py-14 text-white lg:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"><Streaks dim /><span className="band bg-navy-800" style={{ left: '-12%', bottom: '-40%', width: '48%', height: '80%' }} /></div>
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="t-h2 text-balance text-white"><Marked text={copy.benefitTitle} phrase="Tak Terbatas" className="mark-neon text-green" /></h2>
            <p className="mt-3 text-[15px] leading-relaxed text-pretty text-white/80 sm:text-[17px]">{copy.benefitSub}</p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="min-w-0 lg:col-span-5"><MemberCardArt /></div>
            <ul className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7 lg:gap-5">
              {benefits.map((b, i) => <BenefitRow key={b.id} b={b} idx={i} />)}
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-navy-50 py-10 lg:py-14" data-steps>
        <div className="container">
          <div className="relative overflow-hidden rounded-xl bg-white shadow-3 ring-1 ring-line">
            {/* banner head: green bar + kicker, the strip reads as one highlighted object */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-green" />
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border-14 border-green-50" />
            <span aria-hidden className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-green-50" />
            <div className="relative flex flex-col items-center gap-1 px-5 pb-2 pt-7 text-center">
              <h3 className="text-[20px] font-extrabold text-balance text-navy-700 sm:text-[24px]">4 langkah, langsung untung</h3>
            </div>
        <ol ref={stepsRef} className="relative flex flex-wrap items-start justify-center gap-y-6 px-4 pb-8 pt-4" aria-label="Cara kerja Resique Member Card">
          {STEPS.map((st, i) => (
            <li key={st.n} className="step flex items-start" data-active={step === i ? 'true' : 'false'}>
              <Reveal delay={i * 110} className="reveal-pop flex w-[150px] flex-col items-center text-center sm:w-[170px]">
                <span className={cn('step-circle relative grid h-[88px] w-[88px] place-items-center rounded-full shadow-2 sm:h-[96px] sm:w-[96px]', st.tone)}>
                  <st.icon className="h-9 w-9" strokeWidth={1.7} aria-hidden />
                  <span className={cn('t-fig absolute -top-1 left-1/2 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full text-[13px] ring-2 ring-white', st.badge)}>{st.n}</span>
                </span>
                <span className="mt-3 text-[14px] font-extrabold leading-tight text-navy-700">{st.label[0]}<br />{st.label[1]}</span>
              </Reveal>
              {i < STEPS.length - 1 && <ArrowRight className="step-arrow mx-1 mt-8 hidden h-6 w-6 shrink-0 text-navy-700/50 sm:mx-4 sm:block" strokeWidth={2.2} aria-hidden data-on={step === i ? 'true' : 'false'} />}
            </li>
          ))}
        </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
