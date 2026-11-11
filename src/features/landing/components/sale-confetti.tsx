'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Confetti behind the Golden Sale band (dark ground): gold coins, green + white dots, a few stars; drift on the float
   keyframes; fewer on phones. */
export function SaleConfetti() {
  const dots = ['left-[8%] top-[70px] h-3 w-3 bg-gold', 'left-[44%] top-[36px] h-2 w-2 bg-green', 'right-[14%] top-[80px] h-4 w-4 bg-gold', 'left-[12%] bottom-[160px] h-2 w-2 bg-white/70 hidden md:block', 'right-[6%] bottom-[120px] h-3 w-3 bg-green hidden md:block', 'left-[36%] bottom-[40px] h-2 w-2 bg-gold', 'right-[36%] top-[150px] h-2.5 w-2.5 bg-white/60 hidden lg:block', 'left-[60%] bottom-[90px] h-3 w-3 bg-gold hidden lg:block']
  const stars = ['left-[20%] top-[120px]', 'right-[22%] top-[40px] hidden md:block', 'left-[70%] bottom-[60px] hidden lg:block']
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => <span key={i} className={cn('float-6 absolute rounded-full', d)} style={{ animationDelay: `${(i * 0.9) % 5}s` }} />)}
      {stars.map((st, i) => <Sparkles key={i} className={cn('float-6 absolute h-6 w-6 text-gold', st)} strokeWidth={1.6} style={{ animationDelay: `${1 + i}s` }} />)}
      <span className="absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full border-24 border-white/5" />
      <span className="absolute -left-20 -bottom-28 h-[300px] w-[300px] rounded-full bg-navy-800" />
    </div>
  )
}
