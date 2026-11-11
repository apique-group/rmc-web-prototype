import { cn } from '@/lib/utils'

/** Section eyebrow + title + sub, used on every landing section for a consistent rhythm. */
export function SectionHead({ eyebrow, title, sub, align = 'left', tone = 'ink', className }: { eyebrow?: string; title: string; sub?: string; align?: 'left' | 'center'; tone?: 'ink' | 'white'; className?: string }) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className={cn('t-eyebrow mb-3', tone === 'white' && 'text-gold-200')}>{eyebrow}</p>}
      <h2 className={cn('t-h1', tone === 'white' ? 'text-white' : 'text-ink')}>{title}</h2>
      {sub && <p className={cn('mt-3 text-[15px] leading-relaxed sm:text-base sm:leading-6', tone === 'white' ? 'text-white/75' : 'text-ink-3')}>{sub}</p>}
    </div>
  )
}
