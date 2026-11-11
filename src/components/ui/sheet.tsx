'use client'

import * as React from 'react'
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* shadcn sheet on base-ui (apique-web-rmc), Resique look kept. */
const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

function SheetOverlay({ className, ...props }: Omit<SheetPrimitive.Backdrop.Props, 'className'> & { className?: string }) {
  return <SheetPrimitive.Backdrop data-slot="sheet-overlay" className={cn('fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px] data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0', className)} {...props} />
}

const sheetVariants = cva('fixed z-50 bg-white shadow-3 transition ease-drawer data-open:animate-in data-closed:animate-out data-closed:duration-drawer data-open:duration-drawer', {
  variants: {
    side: {
      top: 'inset-x-0 top-0 data-closed:slide-out-to-top data-open:slide-in-from-top',
      bottom: 'inset-x-0 bottom-0 rounded-t-2xl data-closed:slide-out-to-bottom data-open:slide-in-from-bottom pb-safe-b max-h-[92dvh] overflow-y-auto',
      left: 'inset-y-0 left-0 h-full w-3/4 data-closed:slide-out-to-left data-open:slide-in-from-left sm:max-w-sm',
      right: 'inset-y-0 right-0 h-full w-full data-closed:slide-out-to-right data-open:slide-in-from-right sm:max-w-md',
    },
  },
  defaultVariants: { side: 'bottom' },
})

type SheetContentProps = Omit<SheetPrimitive.Popup.Props, 'className'> & VariantProps<typeof sheetVariants> & { className?: string; hideClose?: boolean }

function SheetContent({ side = 'bottom', className, children, hideClose, ...props }: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup data-slot="sheet-content" className={cn(sheetVariants({ side }), 'p-5 sm:p-6', className)} {...props}>
        {side === 'bottom' && <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />}
        {children}
        {!hideClose && (
          <SheetPrimitive.Close className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-[transform,background-color,color] duration-base ease-out hover:rotate-90 hover:bg-surface-2 hover:text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Tutup</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col stack-y-1 text-left', className)} {...props} />
const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col gap-2 sm:flex-row sm:justify-end', className)} {...props} />

function SheetTitle({ className, ...props }: Omit<SheetPrimitive.Title.Props, 'className'> & { className?: string }) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn('text-lg font-bold tracking-tight', className)} {...props} />
}

function SheetDescription({ className, ...props }: Omit<SheetPrimitive.Description.Props, 'className'> & { className?: string }) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={cn('text-sm text-ink-3', className)} {...props} />
}

export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription }
