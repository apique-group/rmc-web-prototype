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
  ok(order && order.status === 'Menunggu Pembayaran' && order.buyer.phone === '+6281100002222', `order created ${order && order.id} Menunggu Pembayaran`)
  ok(order && order.buyer.email === 'budi@laundrytamu.co.id' && !!order.consentAt, `order carries email + consent stamp (${order && order.buyer.email})`)
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
  ok(o.status === 'Bukti Diunggah' && o.payment.proofName === '_fixture-proof.png', 'order → Bukti Diunggah with proof')

  // admin verify
  await go(p, '/admin?embed=1&actor=Satrio%20Wibowo&role=BoD&level=Full&caps=super_admin,manage_config&tab=transaksi')
  ok(/Transaksi/i.test(await text(p)), 'admin transaksi section renders')
  await p.locator(`text=${order.id}`).first().click()
  await p.waitForTimeout(400)
  await p.locator('button:has-text("Verifikasi")').first().click()
  await p.waitForTimeout(600)
  o = (await readStore(p, 'orders')).orders.find(x => x.id === order.id)
  ok(o.status === 'Lunas' && !!o.verifiedAt, 'admin verify → Lunas')

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
  ok(o2.status === 'Kedaluwarsa', `expired order → Kedaluwarsa (${o2.status})`)
  ok(/kedaluwarsa/i.test(await text(p)), 'QR sheet shows kedaluwarsa state')

  ok(errs.length === 0, `no page errors (${errs.length})`)
  await finish(b, errs, 'shop-verify')
})().catch(e => { console.error(e); process.exit(1) })
