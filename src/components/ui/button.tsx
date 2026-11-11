import * as React from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[transform,background-color,box-shadow,color] duration-base ease-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-px active:translate-y-0 active:scale-[.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none',
  {
    variants: {
      variant: {
        default: 'bg-green-700 text-white shadow-1 hover:bg-green-600 hover:shadow-2',
        gold: 'gold-gradient text-gold-ink shadow-gold hover:brightness-[1.05]',
        secondary: 'bg-green-50 text-green-700 hover:bg-green-100',
        outline: 'border border-line bg-white text-ink hover:bg-surface-2',
        ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        link: 'text-navy-700 underline-offset-4 hover:underline',
        destructive: 'bg-danger text-white hover:bg-danger/90',
        inverse: 'bg-white text-navy-700 shadow-2 hover:bg-navy-50',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 rounded-md px-3.5 text-[13px]',
        lg: 'h-12 px-7 text-[15px]',
        xl: 'h-14 px-8 text-base rounded-xl',
        icon: 'h-11 w-11',
        'icon-sm': 'h-9 w-9 rounded-md',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ButtonProps = Omit<ButtonPrimitive.Props, 'className'> & VariantProps<typeof buttonVariants> & { className?: string }

/* shadcn (base-ui) button, as in apique-web-rmc. A link that looks like a button is written
   `<Button nativeButton={false} render={<Link href="/x" />}>Label</Button>`. */
function Button({ className, variant, size, type, nativeButton, render, ...props }: ButtonProps) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} nativeButton={nativeButton} render={render} type={render ? undefined : type || 'button'} {...props} />
}

export { Button, buttonVariants }
