import { describe, it } from 'node:test'
import assert from 'node:assert'
import { normalizePhone } from './phone'

describe('normalizePhone', () => {
  it('08…, +62…, 62… and spaced numbers all become the same +628… number', () => {
    for (const raw of ['081234567890', '+6281234567890', '6281234567890', '0812-3456-7890', '0812 3456 7890']) {
      assert.strictEqual(normalizePhone(raw), '+6281234567890', raw)
    }
  })
  it('empty, too short or not a mobile number: null', () => {
    for (const raw of [null, undefined, '', '0812', '0212345678', 'abc']) assert.strictEqual(normalizePhone(raw as string), null, String(raw))
  })
})
