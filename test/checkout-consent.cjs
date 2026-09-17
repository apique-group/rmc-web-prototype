/* R.040 — checkout consent tickbox + mandatory Email.
 *
 * The pay button is deliberately NOT disabled and NOT aria-disabled: both swallow the click,
 * and the requirement is that clicking it while unticked explains why it will not pay. So this
 * gate clicks it for real and asserts the warning appears instead of an order.
 */
const { chromium } = require('playwright')
const { go, fill, readStore, resetStores } = require('./_lib.cjs')

const fails = []
const ok = (c, m) => { console.log((c ? 'PASS: ' : 'FAIL: ') + m); if (!c) fails.push(m) }

async function run(p, width) {
  const tag = `${width}px`
  await resetStores(p)
  // one item in the cart, otherwise checkout shows the empty state instead of the form
  await go(p, '/golden-sale')
  await p.waitForTimeout(600)
  await p.locator('[data-add-to-cart], button:has-text("Tambah")').first().click().catch(() => {})
  await p.waitForTimeout(400)

  await go(p, '/checkout')
  await p.waitForTimeout(600)

  // ---- Email field
  const email = p.locator('input[name="email"]').first()
  ok(await email.count() === 1, `${tag}: Email field is present`)
  const hint = await p.evaluate(() => {
    const i = document.querySelector('input[name="email"]')
    const field = i && i.closest('div')
    return field ? (field.parentElement || field).innerText : ''
  })
  ok(/Email digunakan untuk tracking transaksi ini\./.test(hint), `${tag}: Email carries the tracking hint`)
  const required = await p.evaluate(() => {
    const lab = [...document.querySelectorAll('label')].find(l => /^Email/.test(l.textContent.trim()))
    return lab ? lab.textContent.includes('*') : false
  })
  ok(required, `${tag}: Email is marked required`)

  // ---- the button refuses, and says why
  await fill(p, 'input[name="name"]', 'Budi Tamu')
  await fill(p, 'input[name="laundry"]', 'Laundry Tamu Jaya')
  await fill(p, 'input[name="phone"]', '081100002222')
  await fill(p, 'input[name="email"]', 'budi@laundrytamu.co.id')
  await p.locator('button[role="combobox"]').first().click()
  await p.locator('[role="option"]').first().click()
  await p.waitForTimeout(300)

  const bayar = p.locator('button[type="submit"]').first()
  ok(await bayar.getAttribute('data-inactive') === 'true', `${tag}: pay button reads as inactive while unticked`)
  ok(await bayar.isEnabled(), `${tag}: ...but stays operable, so it can explain itself`)

  const before = (await readStore(p, 'orders')).orders.length
  await bayar.click()
  await p.waitForTimeout(700)
  const warned = await p.evaluate(() => /Centang persetujuan dihubungi/i.test(document.body.innerText))
  ok(warned, `${tag}: clicking it warns the user why`)
  ok((await readStore(p, 'orders')).orders.length === before, `${tag}: no order was created`)

  // ---- tick it, and the same click pays
  await p.locator('#co-consent').click()
  await p.waitForTimeout(400)
  ok(await bayar.getAttribute('data-inactive') === null, `${tag}: ticking clears the inactive state`)
  await bayar.click()
  await p.waitForTimeout(1000)
  const order = (await readStore(p, 'orders')).orders[0]
  ok(!!order && order.buyer.email === 'budi@laundrytamu.co.id', `${tag}: order carries the email (${order && order.buyer.email})`)
  ok(!!order && !!order.consentAt, `${tag}: order carries the consent stamp (${order && order.consentAt})`)
  return order
}

;(async () => {
  const b = await chromium.launch()
  const errs = []
  for (const width of [1440, 390]) {
    const p = await b.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } })
    p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
    await run(p, width)
    await p.close()
  }

  // ---- the admin order detail surfaces both
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
  p.on('pageerror', e => errs.push(String(e).slice(0, 160)))
  await go(p, '/admin?embed=1&actor=Gate&role=BoD&level=Full&caps=super_admin,manage_config&tab=transaksi')
  await p.waitForTimeout(1500)
  // the section may not honour the tab param; reach it the way a person would
  await p.locator('button:has-text("Transaksi")').first().click().catch(() => {})
  await p.waitForTimeout(900)
  // each row has an explicit Detail button, which is steadier than clicking the row itself
  await p.locator('button:has-text("Detail")').first().click()
  await p.waitForTimeout(900)
  const detail = await p.evaluate(() => document.body.innerText)
  ok(/^\s*EMAIL\s*$/im.test(detail) || /EMAIL/i.test(detail), 'admin order detail shows an Email row')
  ok(/Bersedia dihubungi/i.test(detail), 'admin order detail shows the consent row')
  ok(/Ya ·/i.test(detail), 'the consent row reads as granted, with its date')
  await p.close()

  ok(errs.length === 0, `no page errors (${errs.length})` + (errs.length ? ' -> ' + JSON.stringify(errs.slice(0, 2)) : ''))
  await b.close()
  console.log(`\ncheckout-consent: ${fails.length ? 'FAIL ' + fails.length : 'ALL PASS'}`)
  process.exit(fails.length ? 1 : 0)
})()
