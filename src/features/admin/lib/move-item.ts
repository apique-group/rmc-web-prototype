

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = list.slice()
  const [it] = next.splice(from, 1)
  next.splice(to, 0, it)
  return next
}
