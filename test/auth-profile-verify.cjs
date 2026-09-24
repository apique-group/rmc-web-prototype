/* Auth + profile gate — temp password → forced change → profile; points/tier; redeem; PENDING lock. */
const { ok, launch, go, resetStores, readStore, fill, text, finish } = require('./_lib.cjs')

;(async () => {
  const { b, p, errs } = await launch()
  await resetStores(p)

  // register path 1 through the store directly (faster than the form; form is covered by register-verify)
  await go(p, '/')
  const temp = await p.evaluate(() => new Promise(res => {
    const iv = setInterval(() => { if (window.__rmcweb) { clearInterval(iv); res(window.__rmcweb.register({ isMitra: false, hasCard: true, laundry: 'Fresh Laundry', pic: 'Maya', phone: '081233458891', email: 'maya@test.id', kota: 'Jakarta' }).tempPassword) } }, 50)
  }))
  ok(typeof temp === 'string' && /^Rsq-/.test(temp), `temp password generated (${temp})`)

  await go(p, '/login')
  await fill(p, '#phone', '+62 812-3345-8891')
  await fill(p, '#pw', temp)
  await p.locator('button[type="submit"]').first().click()
  await p.waitForTimeout(800)
  ok(/change-password/.test(p.url()), 'temp password → forced to /change-password')
  await go(p, '/profile')
  ok(/change-password/.test(p.url()), 'profile blocked until password changed')

  await p.locator('#pw').fill('Abcdefgh'); await p.waitForTimeout(200)
  ok(/simbol/i.test(await text(p)), 'checklist mentions simbol rule')
  await p.locator('#pw').fill('Resique#2026'); await p.locator('#pw2').fill('Resique#2026'); await p.waitForTimeout(150)
  await p.locator('button[type="submit"]').first().click()
  await p.waitForTimeout(800)
  ok(/profile/.test(p.url()), 'after change → /profile')

  let t = await text(p)
  ok(/Poin RMC/i.test(t) && /Fresh Laundry Kemang/.test(t), 'profile shows points hero + laundry')
  const acc = (await readStore(p, 'accounts')).accounts[0]
  ok(acc.mustChangePassword === false, 'mustChangePassword cleared')
  ok((await p.locator('svg.recharts-surface').count()) >= 1, 'Recharts chart rendered')

  // points number equals model: seeded Fresh Laundry monthly Jan–Sep 2026 → yearly spend /1000
  const expected = await p.evaluate(() => {
    const c = window.__rmcweb.crm().customers.find(x => x.id === 'C-2026-0028')
    const cfg = window.__rmcweb.config()
    const lunas = window.__rmcweb.orders().filter(o => o.status === 'PAID' && o.crmCustomerId === c.id && o.createdAt.startsWith('2026')).reduce((s, o) => s + o.total, 0)
    const year = Object.entries(c.monthly).filter(([k]) => k.startsWith('2026')).reduce((s, [, v]) => s + v, 0) + lunas
    return Math.floor(year / cfg.rules.earnPerRp)
  })
  const shown = await p.locator('[data-points]').first().getAttribute('data-points')
  ok(shown && parseInt(shown, 10) === expected, `points hero = model (${shown} vs ${expected})`)

  // redeem the cheapest prize
  const before = expected
  await p.locator('button:has-text("Tukar")').first().click()
  await p.waitForTimeout(400)
  await p.locator('[role="dialog"] button:has-text("Tukar")').first().click()
  await p.waitForTimeout(600)
  const red = (await readStore(p, 'accounts')).redemptions
  ok(red.length === 1 && red[0].points === 5000, 'redemption recorded (5000 pts)')
  t = await text(p)
  const after = await p.locator('[data-points]').first().getAttribute('data-points')
  ok(after && parseInt(after, 10) === before - 5000, `points decremented (${after})`)

  // PENDING lock
  await p.evaluate(() => window.__rmcweb.register({ isMitra: false, hasCard: false, laundry: 'Laundry Bunda Palembng', pic: 'Rina Marlina', phone: '085200003333', email: 'rina@test.id', kota: 'Palembang', password: 'Resique#2026' }))
  await go(p, '/login')
  await fill(p, '#phone', '085200003333')
  await fill(p, '#pw', 'Resique#2026')
  await p.locator('button[type="submit"]').first().click()
  await p.waitForTimeout(800)
  ok(/profile/.test(p.url()), 'PENDING account logs in directly')
  ok(/Menunggu verifikasi/i.test(await text(p)), 'PENDING profile shows lock overlay')

  ok(errs.length === 0, `no page errors (${errs.length})`)
  await finish(b, errs, 'auth-profile-verify')
})().catch(e => { console.error(e); process.exit(1) })
