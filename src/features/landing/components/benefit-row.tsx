'use client'

import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { BENEFIT_ICONS } from '@/lib/benefit-icons'
import { Reveal } from '@/components/layout/reveal'
import type { Benefit } from '@/types/member'

export function BenefitRow({ b, idx }: { b: Benefit; idx: number }) {
  const Icon = BENEFIT_ICONS[b.icon] || Sparkles
  return (
    <Reveal as="li" delay={idx * 90} className="reveal-pop min-w-0">
      <div className="lift-lg card-fx flex h-full items-start gap-4 rounded-lg p-3" style={{ '--tint': 'rgba(255,255,255,.08)' } as React.CSSProperties}>
        <span className="chip pulse-ring grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green text-navy-900 shadow-1" style={{ '--pd': `${idx * 0.7}s` } as React.CSSProperties} aria-hidden><Icon className="h-6 w-6" strokeWidth={1.9} /></span>
        <div className="min-w-0">
          <h3 className="text-[16px] font-extrabold leading-tight text-white sm:text-[17px]">{b.title}</h3>
          <p className="mt-1 text-[14px] leading-relaxed text-pretty text-white/80">{b.desc}</p>
        </div>
      </div>
    </Reveal>
  )
}
