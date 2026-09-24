/* Admin gate — actor context (denied / View read-only / Full), copy edit reflects on landing, xlsx export (phone as text), claims approve, audit actor. */
const path = require('node:path')
const fs = require('node:fs')
const XLSX = require('xlsx')
const { ok, launch, go, resetStores, readStore, fill, text, finish } = require('./_lib.cjs')

;(async () => {
  const { b, p, errs } = await launch({ width: 1440, height: 900 })
  await resetStores(p)

  // R.014 — no passcode: direct URL is denied, the CRM embed passes actor + level + caps
  await go(p, '/admin')
  ok((await p.locator('[data-admin-denied]').count()) === 1 && !(await p.locator('[data-admin-section]').count()), 'direct #/admin → access denied, no config rendered')
  await go(p, '/admin?embed=1&actor=Andi&role=Admin&level=None&caps=manage_config')
  ok((await p.locator('[data-admin-denied]').count()) === 1, 'level None → denied even when embedded')
  await go(p, '/admin?embed=1&actor=Andi%20Prasetyo&role=Sales%20Team%20Leader&level=View&caps=crm_sales_member&tab=konten')
  ok((await p.locator('[data-admin-section]').count()) >= 1 && (await p.locator('[data-admin-readonly]').count()) === 1, 'level View → config renders read-only (banner)')
  ok(/Andi Prasetyo/.test(await text(p, '[data-admin-actor]')) && /View/.test(await text(p, '[data-admin-actor]')), 'actor strip shows name + level')
  await p.locator('[data-admin-section="konten"] input').first().fill('coba').catch(() => {})
  ok(await p.locator('[data-admin-section="konten"] button:has-text("Simpan")').first().isDisabled(), 'View: Simpan disabled')
  await go(p, '/admin?embed=1&actor=Andi%20Prasetyo&role=Sales%20Team%20Leader&level=View&caps=crm_sales_member&tab=transaksi')
  await p.locator('#transaksi-table tr, [data-admin-section="transaksi"] tbody tr').first().click().catch(() => {}); await p.waitForTimeout(300)
  ok(await p.locator('button:has-text("Verifikasi")').first().isDisabled().catch(() => true), 'View: Verifikasi disabled')
  await p.keyboard.press('Escape')
  await go(p, '/admin?embed=1&actor=Satrio%20Wibowo&role=BoD&level=Full&caps=super_admin,manage_config&tab=konten')
  ok((await p.locator('[data-admin-section]').count()) >= 1 && (await p.locator('[data-admin-readonly]').count()) === 0, 'Full + manage_config → editable config')
  ok((await p.locator('[data-admin-nav]').count()) >= 10, `nav has ≥10 sections (${await p.locator('[data-admin-nav]').count()})`)
  ok((await p.evaluate(() => window.__rmcweb.access())).canEdit === true, 'test bridge: access().canEdit')

  // edit headline
  await p.locator('[data-admin-nav="konten"]').first().click(); await p.waitForTimeout(300)
  const hook = p.locator('[data-admin-section="konten"] input').first()
  await hook.fill('Resique Diskon Gede')
  await p.locator('[data-admin-section="konten"] button:has-text("Simpan")').first().click(); await p.waitForTimeout(400)
  ok((await readStore(p, 'config')).config.copy.hook === 'Resique Diskon Gede', 'config.copy.hook saved')
  ok((await readStore(p, 'crm')).audit.some(a => /oleh Satrio Wibowo \(BoD\)/.test(a.meta)), 'audit records the actor')
  await go(p, '/')
  ok(/Resique Diskon Gede/i.test(await text(p, '#hook')), 'landing reflects new headline (banner renders uppercase)')

  // export xlsx
  await go(p, '/admin?embed=1&actor=Satrio%20Wibowo&role=BoD&level=Full&caps=super_admin,manage_config&tab=transaksi')
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }), p.locator('button:has-text("Export")').first().click()])
  const out = path.join(__dirname, '_export.xlsx')
  await dl.saveAs(out)
  const wb = XLSX.read(fs.readFileSync(out))
  const ws = wb.Sheets[wb.SheetNames[0]]
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 })
  ok(/golden-privilege-transaksi-\d{8}\.xlsx/.test(dl.suggestedFilename()), `export filename ${dl.suggestedFilename()}`)
  ok(aoa[0].length === 16 && aoa[0][0] === 'ID Pesanan', `16 header columns (${aoa[0].length})`)
  const hpCell = ws[XLSX.utils.encode_cell({ r: 1, c: 5 })]
  ok(hpCell && hpCell.t === 's' && /^\+62/.test(String(hpCell.v)), `phone column stored as text (${hpCell && hpCell.v})`)
  ok(aoa.length - 1 === (await readStore(p, 'orders')).orders.length, 'row count = orders')
  fs.unlinkSync(out)

  // claims approve
  await go(p, '/')
  await p.evaluate(() => window.__rmcweb.register({ isMitra: false, hasCard: false, laundry: 'Laundry Bunda Palembng', pic: 'Rina Marlina', phone: '085200003333', email: 'rina@test.id', kota: 'Palembang', password: 'Resique#2026' }))
  await go(p, '/admin?embed=1&actor=Satrio%20Wibowo&role=BoD&level=Full&caps=super_admin,manage_config&tab=klaim')
  ok(/Rina Marlina/.test(await text(p)), 'claim row visible')
  await p.locator('button:has-text("Setujui")').first().click(); await p.waitForTimeout(500)
  const acc = (await readStore(p, 'accounts')).accounts.find(a => a.phone === '+6285200003333')
  ok(acc.link === 'LINKED' && acc.crmCustomerId === 'C-2026-0043', 'approve → account LINKED to candidate')
  const c = (await readStore(p, 'crm')).customers.find(x => x.id === 'C-2026-0043')
  ok(c.hp === '+6285200003333', 'approve backfills phone into CRM customer')

  // embed keeps the site chrome out
  await go(p, '/admin?embed=1&actor=Satrio%20Wibowo&role=BoD&level=Full&caps=super_admin,manage_config')
  ok((await p.locator('header[data-site-header]').count()) === 0, 'embed: no site header')
  ok((await p.locator('[data-admin-section]').count()) >= 1, 'embed: admin renders')

  // R.051 — Paket Golden Sale section: table with the seed bundles, contents column, derived remaining, staging form
  await go(p, '/admin?embed=1&actor=Satrio%20Wibowo&role=BoD&level=Full&caps=super_admin,manage_config&tab=paket')
  const pk = await p.evaluate(() => ({ rows: document.querySelectorAll('[data-admin-section="paket"] tbody tr').length, contents: [...document.querySelectorAll('[data-admin-section="paket"] [data-contents]')].map(e => e.textContent).filter(t => / x\d/.test(t)).length, left: [...document.querySelectorAll('[data-admin-section="paket"] [data-left]')].map(e => e.textContent) }))
  ok(pk.rows === 4 && pk.contents === 4 && pk.left.every(t => t === '∞' || /^\d+$/.test(t)), `paket section: 4 bundles with contents + derived remaining (${JSON.stringify(pk)})`)
  await p.locator('button:has-text("Tambah paket")').first().click(); await p.waitForTimeout(300)
  await p.locator('[data-paket-form] button:has-text("Tambah paket")').last().click(); await p.waitForTimeout(300)
  ok(/Kode dan nama wajib diisi/.test(await text(p)), 'paket form refuses an empty code/name with the staging message')
  await p.keyboard.press('Escape'); await p.waitForTimeout(200)
  ok(errs.length === 0, `no page errors (${errs.length})`)
  await finish(b, errs, 'admin-verify')
})().catch(e => { console.error(e); process.exit(1) })
