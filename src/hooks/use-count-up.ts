import * as React from 'react'

/** Counts from 0 to `target` once `active` flips true (tier % on scroll-in). Reduced motion renders the final value. */
export function useCountUp(target: number, active: boolean, duration = 600) {
  const [v, setV] = React.useState(() => (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? target : 0))
  React.useEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration)
      const e = 1 - Math.pow(1 - k, 3)
      setV(Math.round(target * e))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration])
  return v
}
