'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Toaster } from 'sonner'

/* All data lives in this browser (zustand + localStorage, the mock of crm-rsq-service), so the app renders
   after mount, like the old single-page build: no server/browser mismatch, no flash of seed data. */
export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => {
    let alive = true
    void import('@/lib/api/mock/test-bridge').then(() => {
      if (!alive) return
      // Links from before the Next.js move used the hash router: /#/admin?embed=1… → /admin?embed=1…
      const h = window.location.hash
      if (h.startsWith('#/')) router.replace(h.slice(1) || '/')
      const t = setInterval(() => { if (!window.location.hash.startsWith('#/')) { clearInterval(t); if (alive) setReady(true) } }, 20)
    })
    return () => { alive = false }
  }, [router])
  if (!ready) return null
  return (
    <>
      <div id="root">{children}</div>
      <Toaster position="top-center" richColors closeButton toastOptions={{ className: 'font-sans', duration: 3800 }} />
    </>
  )
}
