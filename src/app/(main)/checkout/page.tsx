import { Suspense } from 'react'
import { CheckoutView } from '@/features/checkout'

export default function Page() {
  return <Suspense><CheckoutView /></Suspense>
}
