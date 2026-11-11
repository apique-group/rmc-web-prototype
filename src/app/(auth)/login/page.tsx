import { Suspense } from 'react'
import { LoginView } from '@/features/auth'

export default function Page() {
  return <Suspense><LoginView /></Suspense>
}
