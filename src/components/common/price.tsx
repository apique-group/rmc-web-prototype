import { rupiah } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Promo price with struck list price + savings badge. */
export function Price({ real, promo, size = 'md', className }: { real: number; promo: number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const pct = real > 0 ? Math.round((1 - promo / real) * 100) : 0
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('t-fig text-navy-700', size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-[26px]' : 'text-[19px]')}>{rupiah(promo)}</span>
      {real > promo && (
        <>
          <span className={cn('t-num strike text-ink-4', size === 'sm' ? 'text-[12px]' : 'text-[13px]')}>{rupiah(real)}</span>
          <span className="rounded-full bg-gold-100 px-1.5 py-px text-[10px] font-extrabold tracking-wide text-gold-ink">-{pct}%</span>
        </>
      )}
    </div>
  )
}
