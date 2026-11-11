'use client'

import { useCountUp } from '@/hooks/use-count-up'
import { useInView } from '@/hooks/use-in-view'
import { rupiah } from '@/lib/format'
import { cn } from '@/lib/utils'

/* a rupiah figure that counts up once in view (podium spend) */
export function CountRupiah({ value, className }: { value: number; className?: string }) {
  const { ref, inView } = useInView<HTMLParagraphElement>()
  const v = useCountUp(value, inView, 1100)
  return <p ref={ref} className={cn('t-fig', className)} data-spend={value}>{rupiah(v)}</p>
}
