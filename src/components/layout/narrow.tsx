import * as React from 'react'

/** Narrow page container for auth/checkout flows. */
export function Narrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`container max-w-xl pb-16 pt-24 sm:pt-32 ${className}`}>{children}</div>
}
