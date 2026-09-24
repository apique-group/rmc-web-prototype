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
    // R.054: staging sums ledger rows, each floored on its own → per month here (Lunas Golden Sale orders join their month)
    const m = { ...c.monthly }
    window.__rmcweb.orders().filter(o => o.status === 'PAID' && o.crmCustomerId === c.id).forEach(o => { const k = o.createdAt.slice(0, 7); m[k] = (m[k] || 0) + o.total })
    return Object.entries(m).filter(([k]) => k.startsWith('2026')).reduce((s, [, v]) => s + Math.floor(v / cfg.rules.earnPerRp), 0)
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
  ok(/^RDM-[0-9A-F]{8}$/.test(red[0].code || '') && red[0].balanceAfter === before - 5000, `redemption carries a staging code + balance (${red[0].code}, ${red[0].balanceAfter})`)
  t = await text(p)
  ok(/Kode penukaran RDM-[0-9A-F]{8}/.test(t) && new RegExp('Sisa poin ' + (before - 5000).toLocaleString('id-ID')).test(t), 'toast shows the redemption code + balance')
  const after = await p.locator('[data-points]').first().getAttribute('data-points')
  ok(after && parseInt(after, 10) === before - 5000, `points decremented (${after})`)
  // R.054 — ledger: newest row = the redeem, running balance, per-page 10 with prev/next
  const led = await p.evaluate(() => { const rows = window.__rmcweb.ledger(JSON.parse(localStorage.getItem('rmcweb_accounts_v1')).state.accounts[0].id); return { n: rows.length, top: rows[0], types: [...new Set(rows.map(r => r.type))], bal: rows[0].balanceAfter } })
  ok(led.top.type === 'redeem' && led.top.points === -5000 && led.bal === before - 5000 && led.types.includes('earn') && led.types.includes('bonus'), `ledger newest = redeem, balance ${led.bal}, types ${led.types.join('/')}`)
  const lv = await p.locator('[data-ledger]:visible').first()
  ok((await lv.locator('li[data-ledger-type="redeem"]').count()) === 1 && (await lv.locator('li').count()) === Math.min(10, led.n), `ledger card lists ${Math.min(10, led.n)} of ${led.n} rows, redeem on top`)
  if (led.n > 10) { await lv.locator('[data-ledger-next]').click(); await p.waitForTimeout(200); ok((await lv.getAttribute('data-ledger-page')) === '2', 'ledger pagination → page 2') }
  const prof = await p.evaluate(() => window.__rmcweb.profileRmc(JSON.parse(localStorage.getItem('rmcweb_accounts_v1')).state.accounts[0].id))
  ok(prof.linked === true && prof.points === before - 5000 && prof.monthly.length === 12 && prof.progress >= 0 && prof.progress <= 100 && typeof prof.rsl === 'string', `profile/rmc shape: tier ${prof.tier}, progress ${prof.progress}%, 12 months`)

  // PENDING lock
  await p.evaluate(() => window.__rmcweb.register({ isMitra: false, hasCard: false, laundry: 'Laundry Bunda Palembng', pic: 'Rina Marlina', phone: '085200003333', email: 'rina@test.id', kota: 'Palembang', password: 'Resique#2026' }))
  await go(p, '/login')
  await fill(p, '#phone', '085200003333')
  await fill(p, '#pw', 'Resique#2026')
  await p.locator('button[type="submit"]').first().click()
  await p.waitForTimeout(800)
  ok(/profile/.test(p.url()), 'PENDING account logs in directly')
  ok(/Menunggu verifikasi/i.test(await text(p)), 'PENDING profile shows lock overlay')
  ok(/Grafik & riwayat poin tampil di sini/.test(await text(p)) && /konfirmasi akun ini milikmu/.test(await text(p)), 'PENDING placeholder copy (staging)')
  // R.054 — NEW_CUSTOMER (path 4) and UNLINKED get their own cards
  await p.evaluate(() => window.__rmcweb.register({ isMitra: false, hasCard: false, laundry: 'Laundry Zeta Baru', pic: 'Zul Zeta', phone: '085200004444', email: 'zeta@test.id', kota: 'Jambi', password: 'Resique#2026' }))
  await go(p, '/login'); await fill(p, '#phone', '085200004444'); await fill(p, '#pw', 'Resique#2026'); await p.locator('button[type="submit"]').first().click(); await p.waitForTimeout(800)
  ok((await p.locator('[data-link-state="NEW_CUSTOMER"]').count()) === 1 && /Sudah terdaftar sebagai pelanggan Resique/.test(await text(p)) && /transaksi pertamamu/.test(await text(p)), 'NEW_CUSTOMER card (staging copy)')
  await p.evaluate(() => { const k = 'rmcweb_accounts_v1'; const s = JSON.parse(localStorage.getItem(k)); s.state.accounts = s.state.accounts.map(a => a.phone === '+6285200004444' ? { ...a, link: 'UNLINKED' } : a); localStorage.setItem(k, JSON.stringify(s)) })
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  ok((await p.locator('[data-link-state="UNLINKED"]').count()) === 1 && /Tautan akunmu telah dilepas/.test(await text(p)), 'UNLINKED card (staging copy)')

  ok(errs.length === 0, `no page errors (${errs.length})`)
  await finish(b, errs, 'auth-profile-verify')
})().catch(e => { console.error(e); process.exit(1) })
