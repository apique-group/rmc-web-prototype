import { describe, it } from 'node:test'
import assert from 'node:assert'
import type { CrmCustomer } from '@/types/member'
import { matchCheckoutIdentity, matchRegistration } from './match'

const cust = (o: Partial<CrmCustomer>) => ({ id: 'c', outlet: '', pic: '', kota: 'Jakarta', hp: '', ...o }) as CrmCustomer
const CUSTOMERS = [
  cust({ id: 'c1', outlet: 'Wangi Bersih Laundry', pic: 'Budi Santoso', hp: '081234567890', rsl: 'RSL001' }),
  cust({ id: 'c2', outlet: 'Kilat Express', pic: 'Siti Aminah', hp: '', rsl: 'RSL002' }),
]

describe('matchRegistration (PRD Fitur 2 cascade)', () => {
  it('1. same phone (any format): linked at once', () => {
    const r = matchRegistration({ phone: '+62 812-3456-7890', laundry: 'x', pic: 'y' }, CUSTOMERS)
    assert.strictEqual(r.path, 1); assert.strictEqual(r.link, 'LINKED'); assert.strictEqual(r.customer?.id, 'c1')
  })
  it('2. member card + matching PIC name: pending, and the missing phone is filled on approval', () => {
    const r = matchRegistration({ phone: '089900000000', laundry: 'other', pic: 'Siti Aminah', rsl: 'rsl-002' }, CUSTOMERS)
    assert.strictEqual(r.path, 2); assert.strictEqual(r.link, 'PENDING'); assert.strictEqual(r.backfillPhone, true)
  })
  it('3. similar laundry + PIC name: pending (sales confirms)', () => {
    const r = matchRegistration({ phone: '089900000000', laundry: 'Wangi Bersih', pic: 'Budi Santoso' }, CUSTOMERS)
    assert.strictEqual(r.path, 3); assert.strictEqual(r.customer?.id, 'c1')
  })
  it('4. nothing close: a new customer', () => {
    const r = matchRegistration({ phone: '089900000000', laundry: 'Totally Different', pic: 'Nobody' }, CUSTOMERS)
    assert.strictEqual(r.path, 4); assert.strictEqual(r.link, 'NEW_CUSTOMER'); assert.strictEqual(r.customer, null)
  })
})

describe('matchCheckoutIdentity (guest checkout)', () => {
  it('same phone: linked silently', () => {
    const r = matchCheckoutIdentity({ laundry: 'x', phone: '081234567890' }, CUSTOMERS)
    assert.ok(r && 'byPhone' in r && r.byPhone.id === 'c1')
  })
  it('similar laundry name: offered as a candidate, without phone or e-mail', () => {
    const r = matchCheckoutIdentity({ laundry: 'Kilat Express', phone: '089900000000' }, CUSTOMERS)
    assert.ok(r && 'candidate' in r)
    assert.strictEqual(r.candidate.id, 'c2'); assert.ok(!('hp' in r.candidate) && !('email' in r.candidate))
  })
  it('no close name: nothing offered', () => assert.strictEqual(matchCheckoutIdentity({ laundry: 'Zzz', phone: '' }, CUSTOMERS), null))
})
