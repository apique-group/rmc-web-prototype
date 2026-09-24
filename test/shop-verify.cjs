/* Shop gate — add → basket → guest checkout → QRIS countdown → upload gate → thanks → admin verify → klasemen; expiry. */
const path = require('node:path')
const fs = require('node:fs')
const { ok, launch, go, resetStores, patchConfig, readStore, fill, text, finish } = require('./_lib.cjs')

;(async () => {
  const { b, p, errs } = await launch()
  await resetStores(p)
  await go(p, '/')
  await patchConfig(p, 'cfg.payment = Object.assign({}, cfg.payment, { qrTimeoutSec: 20, uploadDelaySec: 2 }); return cfg')
  await go(p, '/')

  // add 2 items
  const adds = p.locator('#golden-sale button[aria-label^="Tambah"]')
  await adds.nth(0).click(); await p.waitForTimeout(150)
  await adds.nth(1).click(); await p.waitForTimeout(150)
  await p.locator('#golden-sale button[aria-label^="Tambah"]').nth(1).click(); await p.waitForTimeout(300)
  ok(/3 item/.test(await text(p, '[data-basket-bar]')), 'basket bar shows 3 items')
  const cart = await readStore(p, 'cart')
  ok(Object.values(cart.qty).reduce((a, c) => a + c, 0) + Object.values(cart.pkgQty || {}).reduce((a, c) => a + c, 0) === 3, 'cart store qty = 3 (items + packages, R.051)')

  // checkout as guest
  await go(p, '/checkout')
  await fill(p, 'input[name="name"]', 'Budi Tamu')
  await fill(p, 'input[name="laundry"]', 'Laundry Tamu Jaya')
  await fill(p, 'input[name="phone"]', '081100002222')
  // R.040 — email is mandatory and the pay button refuses until consent is ticked
  await fill(p, 'input[name="email"]', 'budi@laundrytamu.co.id')
  await p.locator('#co-consent').click()
  // pick outlet (ambil default)
  await p.locator('button[role="combobox"]').first().click()
  await p.locator('[role="option"]:has-text("Jakarta")').first().click()
  const bayar = p.locator('button[type="submit"]').first()
  ok(/Bayar/.test(await bayar.innerText()), 'submit button says Bayar {total}')
  await bayar.click()
  await p.waitForTimeout(900)

  const orders0 = await readStore(p, 'orders')
  const order = orders0.orders[0]
  ok(order && order.status === 'AWAITING_PAYMENT' && order.buyer.phone === '+6281100002222', `order created ${order && order.id} Menunggu Pembayaran`)
  ok(order && order.buyer.email === 'budi@laundrytamu.co.id' && !!order.consentAt, `order carries email + consent stamp (${order && order.buyer.email})`)
  ok(/^GS-\d{8}-\d{4}$/.test(order.id) && order.fulfil.mode === 'PICKUP', `R.053: order number GS-YYYYMMDD-#### and fulfil mode PICKUP (${order.id}, ${order.fulfil.mode})`)
  ok(Object.keys((await readStore(p, 'cart')).qty).length === 0 && Object.keys((await readStore(p, 'cart')).pkgQty || {}).length === 0, 'cart cleared after order (items + packages)')
  ok(order.lines.some(l => l.packageId) && order.lines.every(l => (l.packageId && !l.itemId) || (l.itemId && !l.packageId)), `order lines carry packageId OR itemId, never both (${order.lines.map(l => (l.packageId ? 'pkg' : 'item') + '×' + l.qty).join(', ')})`)

  const cd = p.locator('[data-qr-countdown]').first()
  ok(await cd.isVisible(), 'QR countdown visible')
  const cdText = await cd.innerText()
  ok(/00:1\d|00:20/.test(cdText), `countdown from configured 20s (${cdText.trim()})`)
  const up = p.locator('[data-upload-btn]').first()
  ok(await up.isDisabled(), 'upload button disabled at t=0')
  await p.waitForTimeout(2600)
  ok(!(await up.isDisabled()), 'upload button enabled after uploadDelaySec')

  // upload a png
  const fixture = path.join(__dirname, '_fixture-proof.png')
  if (!fs.existsSync(fixture)) fs.writeFileSync(fixture, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'))
  const [chooser] = await Promise.all([p.waitForEvent('filechooser'), up.click()])
  await chooser.setFiles(fixture)
  await p.waitForTimeout(900)
  ok(await p.locator('[data-thanks]').first().isVisible(), 'thanks dialog visible')
  ok(/Terima kasih/i.test(await text(p, '[data-thanks]')), 'thanks copy')
  let o = (await readStore(p, 'orders')).orders.find(x => x.id === order.id)
  ok(o.status === 'PROOF_UPLOADED' && o.payment.proofName === '_fixture-proof.png', 'order → Bukti Diunggah with proof')

  // admin verify
  await go(p, '/admin?embed=1&actor=Satrio%20Wibowo&role=BoD&level=Full&caps=super_admin,manage_config&tab=transaksi')
  ok(/Transaksi/i.test(await text(p)), 'admin transaksi section renders')
  await p.locator(`text=${order.id}`).first().click()
  await p.waitForTimeout(400)
  await p.locator('button:has-text("Verifikasi")').first().click()
  await p.waitForTimeout(600)
  o = (await readStore(p, 'orders')).orders.find(x => x.id === order.id)
  ok(o.status === 'PAID' && !!o.verifiedAt, 'admin verify → Lunas')

  // klasemen shows the buyer
  await go(p, '/')
  const kl = await text(p, '#klasemen')
  ok(/Laundry Tamu Jaya/.test(kl), 'klasemen lists the verified guest buyer')

  // expiry: new order, wait past 20s
  await go(p, '/')
  await p.locator('#golden-sale button[aria-label^="Tambah"]').first().click()
  await go(p, '/checkout')
  await fill(p, 'input[name="name"]', 'Cici'); await fill(p, 'input[name="laundry"]', 'Laundry Cici'); await fill(p, 'input[name="phone"]', '081300005555')
  await fill(p, 'input[name="email"]', 'cici@laundrycici.co.id')   // R.040 — mandatory
  await p.locator('#co-consent').click()                            // R.040 — pay button refuses without it
  await p.locator('button[role="combobox"]').first().click(); await p.locator('[role="option"]:has-text("Jakarta")').first().click()
  await p.locator('button[type="submit"]').first().click()
  await p.waitForTimeout(21500)
  const o2 = (await readStore(p, 'orders')).orders[0]
  ok(o2.status === 'EXPIRED', `expired order → Kedaluwarsa (${o2.status})`)
  ok(/kedaluwarsa/i.test(await text(p)), 'QR sheet shows kedaluwarsa state')
  // R.053 — late proof is still accepted after expiry (staging), flagged for manual verification
  ok((await p.locator('[data-late-proof]').count()) === 1, 'expired sheet offers the late-proof upload')
  const [chooser2] = await Promise.all([p.waitForEvent('filechooser'), p.locator('[data-upload-btn]').first().click()])
  await chooser2.setFiles(fixture); await p.waitForTimeout(700)
  const o3 = (await readStore(p, 'orders')).orders.find(x => x.id === o2.id)
  ok(o3.status === 'PROOF_UPLOADED' && o3.payment.proofLate === true, `late proof → Bukti Diunggah with proofLate flag (${o3.status})`)
  // R.053 — guest order page needs the buyer's phone; identity match dialog for a look-alike laundry
  await go(p, '/order/' + o2.id)
  ok((await p.locator('[data-order-phone-gate]').count()) === 1, 'guest order page asks for the buyer phone')
  await go(p, '/order/' + o2.id + '?phone=%2B6281300005555')
  ok((await p.locator('[data-order-phone-gate]').count()) === 0 && (await text(p)).includes(o2.id), 'guest order page opens with the matching phone')
  await go(p, '/'); await p.locator('#golden-sale button[aria-label^="Tambah"]').nth(5).click(); await go(p, '/checkout')
  await fill(p, 'input[name="name"]', 'Maya'); await fill(p, 'input[name="laundry"]', 'Fresh Laundry Kemangg'); await fill(p, 'input[name="phone"]', '081900007777'); await fill(p, 'input[name="email"]', 'maya2@test.id')
  await p.locator('#co-consent').click(); await p.locator('button[role="combobox"]').first().click(); await p.locator('[role="option"]:has-text("Jakarta")').first().click()
  await p.locator('button[type="submit"]').first().click(); await p.waitForTimeout(600)
  ok((await p.locator('[data-match-dialog]').count()) === 1 && /Fresh Laundry Kemang/.test(await text(p, '[data-match-dialog]')), 'guest with a look-alike laundry name gets the identity-match dialog with the candidate outlet')
  await p.locator('[data-match-dialog] button:has-text("Ya, ini outlet saya")').click(); await p.waitForTimeout(800)
  const o4 = (await readStore(p, 'orders')).orders[0]
  ok(o4.crmCustomerId === 'C-2026-0028' && o4.buyer.matchDecision && o4.buyer.matchDecision.confirmed === true, `confirmed match links the order to the CRM customer (${o4.crmCustomerId})`)

  ok(errs.length === 0, `no page errors (${errs.length})`)
  await finish(b, errs, 'shop-verify')
})().catch(e => { console.error(e); process.exit(1) })
