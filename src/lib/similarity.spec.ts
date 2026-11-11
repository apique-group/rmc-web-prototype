import { describe, it } from 'node:test'
import assert from 'node:assert'
import { dice, normName } from './similarity'

describe('normName', () => {
  it('drops case, punctuation and generic words (laundry, pt, cv, &)', () => {
    assert.strictEqual(normName('PT. Bersih Laundry & Co'), 'bersih co')
    assert.strictEqual(normName(null), '')
  })
})

describe('dice (name similarity, 0..1)', () => {
  it('same name after normalising: 1', () => assert.strictEqual(dice('Bersih Laundry', 'bersih'), 1))
  it('empty on either side: 0', () => { assert.strictEqual(dice('', 'Bersih'), 0); assert.strictEqual(dice('Bersih', null), 0) })
  it('a small typo stays high, a different name stays low', () => {
    assert.ok(dice('Wangi Bersih', 'Wangi Bersh') > 0.8)
    assert.ok(dice('Wangi Bersih', 'Kilat Express') < 0.3)
  })
})
