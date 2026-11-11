'use client'

import { cn } from '@/lib/utils'

/* Concentric ring outlines, a recurring background motif (paper sections). Decorative, thin, brand tints. */
export function Rings({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={cn('pointer-events-none absolute hidden opacity-70 md:block', className)} viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={1.2}>
      <circle cx="100" cy="100" r="98" /><circle cx="100" cy="100" r="74" /><circle cx="100" cy="100" r="50" /><circle cx="100" cy="100" r="26" />
    </svg>
  )
}
