'use client'

import * as React from 'react'
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cn } from '@/lib/utils'

/* shadcn tabs on base-ui (apique-web-rmc), Resique look kept. */
const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }: Omit<TabsPrimitive.List.Props, 'className'> & { className?: string }) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn('no-scrollbar inline-flex h-10 items-center gap-1 overflow-x-auto rounded-lg bg-surface-2 p-1 text-ink-3', className)} {...props} />
}

function TabsTrigger({ className, ...props }: Omit<TabsPrimitive.Tab.Props, 'className'> & { className?: string }) {
  return <TabsPrimitive.Tab data-slot="tabs-trigger" className={cn('inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 text-[13px] font-semibold transition-all hover:bg-white/70 hover:text-ink focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-active:bg-white data-active:text-ink data-active:shadow-1', className)} {...props} />
}

function TabsContent({ className, ...props }: Omit<TabsPrimitive.Panel.Props, 'className'> & { className?: string }) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn('mt-4 focus-visible:outline-hidden', className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
