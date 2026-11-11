'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/* Hook headline: each word rises in on load (stagger), the last word keeps the highlighter mark for the gate. */
export function StaggerWords({ text, neon }: { text: string; neon?: boolean }) {
  const words = text.trim().split(' ')
  return (
    <>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className="hook-word inline-block" style={{ '--i': `${i * 90}ms` } as React.CSSProperties}>
            {i === words.length - 1 ? <span className={cn('mark', neon ? 'mark-neon text-green' : 'mark-green text-navy-700')}>{w}</span> : w}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </>
  )
}
