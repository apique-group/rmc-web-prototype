import * as React from 'react'

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
