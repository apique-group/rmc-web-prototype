import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/* `stack-y-*` (index.css) is the Tailwind 3 space-y rule; tell tailwind-merge it is one group so
   `stack-y-1.5` + `stack-y-0` resolves to the later one, as space-y did. */
const twMerge = extendTailwindMerge<'stack-y'>({ extend: { classGroups: { 'stack-y': [{ 'stack-y': [(v: string) => /^(\d+(\.\d+)?|\[.+\])$/.test(v)] }] } } })

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
