'use client'

import * as React from 'react'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { cn } from '@/lib/utils'

/* shadcn radio group on base-ui (apique-web-rmc), Resique look kept. */
function RadioGroup({ className, ...props }: Omit<RadioGroupPrimitive.Props, 'className'> & { className?: string }) {
  return <RadioGroupPrimitive data-slot="radio-group" className={cn('grid gap-2', className)} {...props} />
}

function RadioGroupItem({ className, ...props }: Omit<RadioPrimitive.Root.Props, 'className'> & { className?: string }) {
  return (
    <RadioPrimitive.Root data-slot="radio-group-item" nativeButton render={<button type="button" />} className={cn('aspect-square h-5 w-5 rounded-full border-2 border-ink-4 text-navy transition-colors data-checked:border-navy focus:outline-hidden focus-visible:ring-2 focus-visible:ring-navy/30 disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50', className)} {...props}>
      <RadioPrimitive.Indicator className="flex items-center justify-center"><span className="h-2.5 w-2.5 rounded-full bg-navy" /></RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  )
}

/** Big tappable option card, 44px+ target, whole row clickable. */
export function RadioCard({ value, title, desc, disabled, badge, id }: { value: string; title: string; desc?: string; disabled?: boolean; badge?: React.ReactNode; id?: string }) {
  const rid = id || `rc-${value}`
  return (
    <label htmlFor={rid} className={cn('lift flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white p-4 active:scale-[.98] has-data-checked:border-navy has-data-checked:bg-navy-50/60 hover:border-ink-4', disabled && 'cursor-not-allowed opacity-55')}>
      <RadioGroupItem value={value} id={rid} disabled={disabled} className="mt-0.5" />
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">{title}{badge}</span>
        {desc && <span className="mt-0.5 block text-[13px] text-ink-3">{desc}</span>}
      </span>
    </label>
  )
}

export { RadioGroup, RadioGroupItem }
