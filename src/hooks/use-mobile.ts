import * as React from 'react'

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
