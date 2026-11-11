const STOP = new Set(['laundry', 'loundry', 'cuci', 'express', 'pt', 'cv', 'ud', 'the', 'dan', '&'])

/** lowercase, strip punctuation, drop generic tokens, collapse spaces. */
export function normName(s: string | null | undefined): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t && !STOP.has(t))
    .join(' ')
    .trim()
}

function bigrams(s: string): Map<string, number> {
  const m = new Map<string, number>()
  const t = ` ${s} `
  for (let i = 0; i < t.length - 1; i++) {
    const g = t.slice(i, i + 2)
    m.set(g, (m.get(g) || 0) + 1)
  }
  return m
}

/** Sørensen–Dice bigram similarity on normalized names, 0..1. */
export function dice(a: string | null | undefined, b: string | null | undefined): number {
  const x = normName(a), y = normName(b)
  if (!x || !y) return 0
  if (x === y) return 1
  const ba = bigrams(x), bb = bigrams(y)
  let inter = 0, na = 0, nb = 0
  ba.forEach(v => { na += v })
  bb.forEach(v => { nb += v })
  ba.forEach((v, k) => { const w = bb.get(k); if (w) inter += Math.min(v, w) })
  return (2 * inter) / (na + nb)
}
