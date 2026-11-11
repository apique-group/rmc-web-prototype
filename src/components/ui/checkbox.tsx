'use client'

import * as React from 'react'
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/* shadcn checkbox on base-ui (apique-web-rmc), Resique look kept. */
function Checkbox({ className, ...props }: Omit<CheckboxPrimitive.Root.Props, 'className'> & { className?: string }) {
  return (
    <CheckboxPrimitive.Root data-slot="checkbox" nativeButton render={<button type="button" />} className={cn('peer h-5 w-5 shrink-0 rounded-[5px] border-2 border-ink-4 transition-[transform,background-color,border-color] duration-fast ease-out hover:border-ink-3 active:scale-90 data-checked:border-navy data-checked:bg-navy data-checked:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-navy/30 disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50 aria-invalid:border-danger', className)} {...props}>
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current"><Check className="h-3.5 w-3.5" strokeWidth={3} /></CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
