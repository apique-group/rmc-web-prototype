'use client'

import * as React from 'react'
import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { cn } from '@/lib/utils'

/* shadcn progress on base-ui (apique-web-rmc), Resique look kept: the bar slides in from the left. */
export function Progress({ className, value, tone = 'navy', ...props }: Omit<ProgressPrimitive.Root.Props, 'className' | 'value'> & { className?: string; value?: number | null; tone?: 'navy' | 'gold' }) {
  const v = Math.min(100, Math.max(0, value || 0))
  return (
    <ProgressPrimitive.Root data-slot="progress" value={v} className={cn('relative h-2 w-full overflow-hidden rounded-full bg-black/10', className)} {...props}>
      <ProgressPrimitive.Track className="block h-full w-full">
        <ProgressPrimitive.Indicator className={cn('block h-full w-full flex-1 rounded-full transition-transform duration-700 ease-out', tone === 'gold' ? 'gold-gradient' : 'bg-navy')} style={{ transform: `translateX(-${100 - v}%)`, width: '100%' }} />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}
