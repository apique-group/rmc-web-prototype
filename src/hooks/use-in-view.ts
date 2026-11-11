import * as React from 'react'

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
