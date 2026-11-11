'use client'

import { cn } from '@/lib/utils'

/* Last word of a title carries the highlighter mark (draws in when the title scrolls into view, .mark in index.css). */
export function Marked({ text, className, phrase }: { text: string; className?: string; phrase?: string }) {
  if (phrase && text.includes(phrase)) {
    const [before, after] = text.split(phrase)
    return <>{before}<span className={cn('mark', className)}>{phrase}</span>{after}</>
  }
  const words = text.trim().split(' ')
  return <>{words.slice(0, -1).join(' ')}{words.length > 1 ? ' ' : ''}<span className={cn('mark', className)}>{words.slice(-1)[0]}</span></>
}
