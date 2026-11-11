import { describe, it } from 'node:test'
import assert from 'node:assert'
import type { Tier } from '@/types/member'
import { currentWindow, nextTier, pointsFromSpend, tierForSpend } from './rmc'

const TIERS = [{ key: 'silver', min: 0 }, { key: 'gold', min: 5_000_000 }, { key: 'platinum', min: 15_000_000 }] as Tier[]

describe('currentWindow (fixed 6-month tier window)', () => {
  it('January–June is H1, July–December is H2', () => {
    assert.strictEqual(currentWindow(new Date(2026, 5, 30)).half, 'H1')
    const h2 = currentWindow(new Date(2026, 6, 1))
    assert.strictEqual(h2.half, 'H2'); assert.strictEqual(h2.start, '2026-07-01'); assert.strictEqual(h2.end, '2026-12-31')
  })
})

describe('tierForSpend / nextTier', () => {
  it('the highest tier whose minimum is reached', () => {
    assert.strictEqual(tierForSpend(TIERS, 0).key, 'silver')
    assert.strictEqual(tierForSpend(TIERS, 5_000_000).key, 'gold')
    assert.strictEqual(tierForSpend(TIERS, 99_000_000).key, 'platinum')
  })
  it('next tier, or none at the top', () => {
    assert.strictEqual(nextTier(TIERS, TIERS[0])?.key, 'gold')
    assert.strictEqual(nextTier(TIERS, TIERS[2]), null)
  })
})

describe('pointsFromSpend', () => {
  it('spend ÷ earn rate, rounded down; never negative; default rate 1000', () => {
    assert.strictEqual(pointsFromSpend(12_345, 1000), 12)
    assert.strictEqual(pointsFromSpend(-500, 1000), 0)
    assert.strictEqual(pointsFromSpend(5000, 0), 5)
  })
})
