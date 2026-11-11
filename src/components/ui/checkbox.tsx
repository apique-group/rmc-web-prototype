import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root ref={ref} className={cn('peer h-5 w-5 shrink-0 rounded-[5px] border-2 border-ink-4 transition-[transform,background-color,border-color] duration-fast ease-out hover:border-ink-3 active:scale-90 data-[state=checked]:border-navy data-[state=checked]:bg-navy data-[state=checked]:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-navy/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger', className)} {...props}>
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current"><Check className="h-3.5 w-3.5" strokeWidth={3} /></CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
