'use client'

import * as React from 'react'
import { Streaks } from './streaks'

/* Banner ground (Lurd, 11 Sep: "more depth"): three layers at different distances. Far = a perspective floor grid
   and the doodle; mid = big solid shapes (navy-800 disc, navy-500 ring, band); near = wire cubes and dots, bigger and
   brighter the closer they are. Each layer translates by its depth with the pointer (--px / --py set on the banner),
   so the ground moves like a room, not a poster. Reduced motion: static. */
export function BannerGround() {
  return (
    <div aria-hidden data-ground className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* far — R.041 (Lurd): no more scratch/line-art. The banner now carries the same ground as
          Golden Sale and Klasemen: coloured streaks, confetti and stars, nothing wire-framed. */}
      <div className="depth absolute inset-0" data-depth="far" style={{ '--d': '6px' } as React.CSSProperties}>
        <Streaks />
      </div>
      {/* mid */}
      <div className="depth absolute inset-0" data-depth="mid" style={{ '--d': '14px' } as React.CSSProperties}>
        <span className="absolute -left-24 -bottom-40 h-[420px] w-[420px] rounded-full bg-navy-800" />
        <span className="absolute -right-16 -top-24 h-[300px] w-[300px] rounded-full border-22 border-navy-500/60" />
        <span className="band bg-navy-800" style={{ right: '-10%', bottom: '-40%', width: '55%', height: '90%' }} />
      </div>
      {/* near */}
      <div className="depth absolute inset-0" data-depth="near" style={{ '--d': '26px' } as React.CSSProperties}>
        <span className="float-6 absolute left-[-24px] top-[190px] hidden h-14 w-14 rounded-full bg-green/80 lg:block" />
        <span className="float-6 absolute right-[22%] bottom-[40px] hidden h-4 w-4 rounded-full bg-gold lg:block [animation-delay:2s]" />
        <span className="float-6 absolute left-[30%] top-[60px] hidden h-2.5 w-2.5 rounded-full bg-green-200 lg:block [animation-delay:1s]" />
      </div>
    </div>
  )
}
