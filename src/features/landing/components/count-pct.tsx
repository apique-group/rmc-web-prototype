'use client'

import { useCountUp } from '@/features/landing/hooks/use-count-up'
import { useInView } from '@/hooks/use-in-view'
import { cn } from '@/lib/utils'

/* the discount figure counts up from 0 once the card is in view (final value under reduced motion) */
export function CountPct({ value, className }: { value: number; className?: string }) {
  const { ref, inView } = useInView<HTMLParagraphElement>()
  const v = useCountUp(value, inView)
  return <p ref={ref} className={cn('t-fig t-fig-black origin-left text-[36px] leading-none transition-transform duration-slow ease-out group-hover:scale-110', className)} data-pct={value}>{v}%</p>
}
