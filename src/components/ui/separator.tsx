import * as React from 'react'
import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import { cn } from '@/lib/utils'

/* shadcn separator on base-ui (apique-web-rmc), Resique look kept. */
export function Separator({ className, orientation = 'horizontal', ...props }: Omit<SeparatorPrimitive.Props, 'className'> & { className?: string }) {
  return <SeparatorPrimitive data-slot="separator" orientation={orientation} className={cn('shrink-0 bg-line', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)} {...props} />
}
