import { Suspense } from 'react'
import { RegisterView } from '@/features/auth'

export default function Page() {
  return <Suspense><RegisterView /></Suspense>
}
