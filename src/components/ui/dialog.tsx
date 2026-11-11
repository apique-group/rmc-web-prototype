'use client'

import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* shadcn dialog on base-ui (apique-web-rmc), Resique look kept. */
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

function DialogOverlay({ className, ...props }: Omit<DialogPrimitive.Backdrop.Props, 'className'> & { className?: string }) {
  return <DialogPrimitive.Backdrop data-slot="dialog-overlay" className={cn('fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px] data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0', className)} {...props} />
}

function DialogContent({ className, children, hideClose, ...props }: Omit<DialogPrimitive.Popup.Props, 'className'> & { className?: string; hideClose?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-[calc(100vw-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-white p-6 shadow-3 duration-slow data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-[.98] data-open:zoom-in-[.98] data-closed:slide-out-to-top-[2%] data-open:slide-in-from-top-[2%]',
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-[transform,background-color,color] duration-base ease-out hover:rotate-90 hover:bg-surface-2 hover:text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Tutup</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col stack-y-1.5 text-left', className)} {...props} />
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />

function DialogTitle({ className, ...props }: Omit<DialogPrimitive.Title.Props, 'className'> & { className?: string }) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn('text-lg font-bold leading-tight tracking-tight', className)} {...props} />
}

function DialogDescription({ className, ...props }: Omit<DialogPrimitive.Description.Props, 'className'> & { className?: string }) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn('text-sm text-ink-3', className)} {...props} />
}

export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
