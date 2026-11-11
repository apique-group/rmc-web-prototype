'use client'

import { cn } from '@/lib/utils'

/* Celebration ground after the Figma Golden Sale frame (Lurd, 11 Sep): deep navy, thin diagonal streaks, gold confetti
   slivers, four-point stars and a few dots. `dim` = streaks only (the banner section ground). Rotation sits on a wrapping
   <g> so the CSS float on the inner shape does not override it. Decorative only. */
export function Streaks({ dim, className }: { dim?: boolean; className?: string }) {
  const lines = [[-40, 120, 260, -60], [60, 380, 420, 140], [200, 620, 620, 340], [520, 80, 760, -80], [640, 540, 980, 320], [880, 300, 1120, 140], [960, 660, 1260, 460], [1040, 40, 1240, -90], [300, -20, 460, -120], [-20, 520, 180, 400], [420, 700, 700, 520], [720, -40, 900, -160], [1140, 560, 1300, 450], [140, 260, 300, 150], [760, 220, 900, 130], [560, 420, 700, 330], [1000, 420, 1130, 340], [240, 480, 360, 400], [820, 620, 1000, 500], [-30, 300, 90, 220]]
  const confetti = [[90, 60, -30], [330, 540, 20], [700, 90, -15], [1080, 470, 35], [1150, 120, -25], [520, 300, 15], [260, 200, -40], [900, 560, 10], [40, 440, 50], [620, 20, -60]]
  const stars = [[150, 140, 9], [1010, 70, 7], [820, 520, 8], [480, 560, 6], [1170, 330, 5], [380, 90, 5]]
  const dots = [[60, 200, 4, '#71BD41'], [980, 200, 3, '#F6E8CC'], [720, 400, 3, '#71BD41'], [240, 620, 4, '#D4A04E'], [1120, 590, 3, '#F6E8CC'], [560, 180, 2.5, '#D4A04E']]
  const star = (r: number) => `M0 ${-r}c${r * .1} ${r * .55} ${r * .45} ${r * .9} ${r} ${r}c${-r * .55} ${r * .1} ${-r * .9} ${r * .45} ${-r} ${r}c${-r * .1} ${-r * .55} ${-r * .45} ${-r * .9} ${-r} ${-r}c${r * .55} ${-r * .1} ${r * .9} ${-r * .45} ${r} ${-r}z`
  return (
    <svg aria-hidden data-streaks className={cn('pointer-events-none absolute inset-0 h-full w-full', className)} viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" fill="none">
      <g stroke="#2E2A7A" strokeLinecap="round" strokeOpacity={dim ? .5 : .7}>
        {lines.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={i % 3 === 0 ? 2 : 1} />)}
      </g>
      {!dim && (
        <>
          <g fill="#D4A04E">
            {confetti.map(([x, y, r], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}><rect x="-7" y="-3" width="14" height="6" rx="1.5" className="float-6" style={{ animationDelay: `${(i * 0.7) % 4}s` }} /></g>)}
          </g>
          <g fill="#F6E8CC">
            {stars.map(([x, y, r], i) => <g key={i} transform={`translate(${x} ${y})`}><path d={star(r)} className="twinkle" style={{ animationDelay: `${(i * 0.5) % 2.6}s` }} /></g>)}
          </g>
          {dots.map(([x, y, r, c], i) => <circle key={i} cx={x as number} cy={y as number} r={r as number} fill={c as string} className="twinkle" style={{ animationDelay: `${(i * 0.9) % 2.6}s` }} />)}
        </>
      )}
    </svg>
  )
}
