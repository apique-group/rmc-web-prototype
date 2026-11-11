'use client'

import { Reveal } from '@/components/layout/reveal'
import { cn } from '@/lib/utils'
import { Marked } from './marked'

export function SectionTitle({ title, sub, tone = 'ink', center, phrase, mark }: { title: string; sub?: string; tone?: 'ink' | 'white'; center?: boolean; phrase?: string; mark?: string }) {
  return (
    <Reveal className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <h2 className={cn('t-h2 text-balance', tone === 'white' ? 'text-white' : 'text-ink')}><Marked text={title} phrase={phrase} className={mark ?? (tone === 'white' ? 'mark-light text-green' : undefined)} /></h2>
      {sub && <p className={cn('mt-3 text-[15px] leading-relaxed text-pretty sm:text-[17px]', tone === 'white' ? 'text-white/80' : 'text-ink-2')}>{sub}</p>}
    </Reveal>
  )
}
