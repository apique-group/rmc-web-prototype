'use client'

import * as React from 'react'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/* shadcn select on base-ui (apique-web-rmc), Resique look kept. base-ui shows an item's label in the
   trigger only when it is told the labels, so Select reads them from its own <SelectItem>s. An empty
   string value means "nothing chosen" (shows the placeholder), as with the old Radix select. */
type ItemLike = { value: string; label: React.ReactNode }
function collectItems(node: React.ReactNode, out: ItemLike[] = []): ItemLike[] {
  React.Children.forEach(node, child => {
    if (!React.isValidElement<{ value?: string; children?: React.ReactNode }>(child)) return
    if (child.type === SelectItem && child.props.value !== undefined) out.push({ value: child.props.value, label: child.props.children })
    else if (child.props.children) collectItems(child.props.children, out)
  })
  return out
}

function Select({ value, defaultValue, onValueChange, children, ...props }: Omit<SelectPrimitive.Root.Props<string>, 'value' | 'defaultValue' | 'onValueChange'> & {
  value?: string; defaultValue?: string; onValueChange?: (value: string) => void
}) {
  const items = React.useMemo(() => collectItems(children), [children])
  return (
    <SelectPrimitive.Root<string>
      items={items}
      value={value === undefined ? undefined : value === '' ? null : value}
      defaultValue={defaultValue === '' ? null : defaultValue}
      onValueChange={v => onValueChange?.(v ?? '')}
      {...props}
    >
      {children}
    </SelectPrimitive.Root>
  )
}

const SelectGroup = SelectPrimitive.Group

function SelectValue({ className, ...props }: Omit<SelectPrimitive.Value.Props, 'className'> & { className?: string }) {
  return <SelectPrimitive.Value data-slot="select-value" className={className} {...props} />
}

function SelectTrigger({ className, children, ...props }: Omit<SelectPrimitive.Trigger.Props, 'className'> & { className?: string }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn('flex h-11 w-full items-center justify-between rounded-lg border border-line bg-white px-3.5 py-2 text-[15px] text-ink transition-colors hover:border-ink-4 focus:outline-hidden focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/25 disabled:cursor-not-allowed disabled:opacity-60 data-placeholder:text-ink-4 [&>span]:line-clamp-1', className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon render={<ChevronDown className="h-4 w-4 opacity-60" />} />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({ className, children, ...props }: Omit<SelectPrimitive.Popup.Props, 'className'> & { className?: string }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner alignItemWithTrigger={false} sideOffset={4} className="z-60">
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn('relative max-h-72 w-(--anchor-width) min-w-32 overflow-y-auto rounded-lg border border-line bg-white p-1 text-ink shadow-2 data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95', className)}
          {...props}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: Omit<SelectPrimitive.Item.Props, 'className'> & { className?: string }) {
  return (
    <SelectPrimitive.Item data-slot="select-item" className={cn('relative flex w-full cursor-default select-none items-center rounded-md py-2.5 pl-8 pr-2 text-[15px] outline-hidden data-highlighted:bg-navy-50 data-highlighted:text-navy-700 data-disabled:pointer-events-none data-disabled:opacity-50', className)} {...props}>
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="h-4 w-4" /></SelectPrimitive.ItemIndicator></span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem }
