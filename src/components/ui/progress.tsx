import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

export const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { tone?: 'navy' | 'gold' }>(({ className, value, tone = 'navy', ...props }, ref) => (
  <ProgressPrimitive.Root ref={ref} className={cn('relative h-2 w-full overflow-hidden rounded-full bg-black/10', className)} {...props}>
    <ProgressPrimitive.Indicator className={cn('h-full w-full flex-1 rounded-full transition-transform duration-700 ease-out', tone === 'gold' ? 'gold-gradient' : 'bg-navy')} style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value || 0))}%)` }} />
  </ProgressPrimitive.Root>
))
Progress.displayName = 'Progress'
