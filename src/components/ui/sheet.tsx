import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay className={cn('fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className)} {...props} ref={ref} />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva('fixed z-50 bg-white shadow-3 transition ease-drawer data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-drawer data-[state=open]:duration-drawer', {
  variants: {
    side: {
      top: 'inset-x-0 top-0 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
      bottom: 'inset-x-0 bottom-0 rounded-t-2xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom pb-safe-b max-h-[92dvh] overflow-y-auto',
      left: 'inset-y-0 left-0 h-full w-3/4 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
      right: 'inset-y-0 right-0 h-full w-full data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-md',
    },
  },
  defaultVariants: { side: 'bottom' },
})

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>, VariantProps<typeof sheetVariants> { hideClose?: boolean }

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(({ side = 'bottom', className, children, hideClose, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), 'p-5 sm:p-6', className)} {...props}>
      {side === 'bottom' && <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />}
      {children}
      {!hideClose && (
        <SheetPrimitive.Close className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-[transform,background-color,color] duration-base ease-out hover:rotate-90 hover:bg-surface-2 hover:text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
          <X className="h-4 w-4" />
          <span className="sr-only">Tutup</span>
        </SheetPrimitive.Close>
      )}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col stack-y-1 text-left', className)} {...props} />
const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col gap-2 sm:flex-row sm:justify-end', className)} {...props} />

const SheetTitle = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Title>, React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn('text-lg font-bold tracking-tight', className)} {...props} />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Description>, React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn('text-sm text-ink-3', className)} {...props} />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription }
