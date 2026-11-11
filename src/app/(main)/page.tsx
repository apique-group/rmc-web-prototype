import { Suspense } from 'react'
import { LandingView } from '@/features/landing'

export default function Page() {
  return <Suspense><LandingView /></Suspense>
}
