import { Suspense } from 'react'
import { AdminView } from '@/features/admin'

export default function Page() {
  return <Suspense><AdminView /></Suspense>
}
