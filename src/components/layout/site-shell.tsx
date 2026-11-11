'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { useCurrentAccount, useExpireOrders } from '@/hooks/use-member-data'

/** Consumer shell: floating nav + page + footer. The admin route renders outside this shell. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const acc = useCurrentAccount()
  const { mutate: expire } = useExpireOrders()
  // BR-3.3, a temp password must be replaced before any other page opens.
  React.useEffect(() => {
    if (acc?.mustChangePassword && pathname !== '/change-password') router.replace('/change-password')
  }, [acc?.mustChangePassword, pathname, router])
  React.useEffect(() => { expire(); const t = setInterval(expire, 15_000); return () => clearInterval(t) }, [expire])
  React.useEffect(() => {
    const hash = window.location.hash
    if (hash) { const el = document.getElementById(hash.slice(1)); if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60) }
    else window.scrollTo({ top: 0 })
  }, [pathname])
  return (
    <div className="relative flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
