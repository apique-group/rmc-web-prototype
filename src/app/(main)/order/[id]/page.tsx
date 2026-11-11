import { Suspense } from 'react'
import { OrderStatusView } from '@/features/order'

export default function Page() {
  return <Suspense><OrderStatusView /></Suspense>
}
