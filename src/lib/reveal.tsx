import * as React from 'react'
import { cn } from '@/lib/utils'

/** IntersectionObserver-driven entry reveal (fade-up + slight blur). No scroll listeners. */
export function useInView<T extends HTMLElement>(opts: { once?: boolean; margin?: string } = {}) {
  const ref = React.useRef<T>(null)
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); if (opts.once !== false) io.disconnect() }
      else if (opts.once === false) setInView(false)
    }, { rootMargin: opts.margin || '0px 0px -10% 0px', threshold: 0.08 })
    io.observe(el)
    return () => io.disconnect()
  }, [opts.once, opts.margin])
  return { ref, inView }
}

export function Reveal({ children, className, delay = 0, as: Tag = 'div', ...rest }: { children: React.ReactNode; className?: string; delay?: number; as?: keyof React.JSX.IntrinsicElements } & Record<string, unknown>) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const Comp = Tag as unknown as React.ElementType
  // the stagger delay only applies to the entrance; once revealed it is cleared so hover/press stay instant
  const [settled, setSettled] = React.useState(false)
  React.useEffect(() => { if (!inView) return; const t = setTimeout(() => setSettled(true), delay + 300); return () => clearTimeout(t) }, [inView, delay])
  return (
    <Comp
      ref={ref}
      {...rest}
      data-reveal={inView ? 'in' : 'out'}
      style={{ ...((rest as { style?: React.CSSProperties }).style || {}), transitionDelay: settled ? '0ms' : `${delay}ms` }}
      className={cn('transition-[opacity,transform,box-shadow,background-color,border-color] duration-slow ease-out', inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2', className)}
    >
      {children}
    </Comp>
  )
}

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

/** Hover/pointer capability, gate hover-only affordances. */
export function useFinePointer() {
  const [fine, setFine] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const h = () => setFine(mq.matches)
    h(); mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return fine
}

export function useIsMobile(bp = 768) {
  const [m, setM] = React.useState(() => typeof window !== 'undefined' && window.innerWidth < bp)
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`)
    const h = () => setM(mq.matches)
    h(); mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [bp])
  return m
}
