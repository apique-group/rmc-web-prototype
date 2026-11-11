import { Suspense } from 'react'
import { ProfileView } from '@/features/profile'

export default function Page() {
  return <Suspense><ProfileView /></Suspense>
}
