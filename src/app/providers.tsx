'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { memberApi } from '@/lib/api/member.api'
import { memberKeys } from '@/hooks/use-member-data'

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, gcTime: 5 * 60 * 1000 } } })
}

/* Like apique-web-rmc's providers: one QueryClient for the app. The data lives in this browser (the
   stand-in for crm-rsq-service, lib/api/mock), so the app renders after mount like the old single-page
   build, and every change to that data refreshes the queries that read it. */
export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const [queryClient] = React.useState(createQueryClient)
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => {
    let alive = true
    const unsubs: (() => void)[] = []
    void (async () => {
      const [{ MOCK_STORES, peekMe }] = await Promise.all([import('@/lib/api/mock/server'), import('@/lib/api/mock/test-bridge')])
      MOCK_STORES.forEach(s => unsubs.push(s.subscribe(() => {
        queryClient.setQueryData(memberKeys.me, peekMe())
        void queryClient.invalidateQueries({ predicate: q => !(q.queryKey[0] === 'member' && q.queryKey[1] === 'me') })
      })))
      // the data every page shows (header, footer, session) is fetched once before the first paint
      await Promise.all([
        queryClient.prefetchQuery({ queryKey: memberKeys.config, queryFn: memberApi.config }),
        queryClient.prefetchQuery({ queryKey: memberKeys.me, queryFn: memberApi.me }),
        queryClient.prefetchQuery({ queryKey: memberKeys.orders, queryFn: memberApi.orders }),
        queryClient.prefetchQuery({ queryKey: memberKeys.customers, queryFn: memberApi.customers }),
      ])
      if (!alive) return
      // Links from before the Next.js move used the hash router: /#/admin?embed=1… → /admin?embed=1…
      const h = window.location.hash
      if (h.startsWith('#/')) router.replace(h.slice(1) || '/')
      const t = setInterval(() => { if (!window.location.hash.startsWith('#/')) { clearInterval(t); if (alive) setReady(true) } }, 20)
    })()
    return () => { alive = false; unsubs.forEach(u => u()) }
  }, [router, queryClient])
  if (!ready) return null
  return (
    <QueryClientProvider client={queryClient}>
      <div id="root"><React.Suspense>{children}</React.Suspense></div>
      <Toaster position="top-center" richColors closeButton toastOptions={{ className: 'font-sans', duration: 3800 }} />
    </QueryClientProvider>
  )
}
