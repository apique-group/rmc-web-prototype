import * as React from 'react'
import { cn } from '@/lib/utils'
import { useInView } from '@/hooks/use-in-view'

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
