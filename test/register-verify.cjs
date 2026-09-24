/* Registration cascade gate — paths 1..4 + duplicate + password policy + phone normalization. */
const { ok, launch, go, resetStores, readStore, fill, clickText, text, finish } = require('./_lib.cjs')

async function fillBase(p, { laundry, pic, phone, email, kota = 'Jakarta', card = 'Tidak', rsl }) {
  // R.052: no "Status Mitra" question any more (staging) — the first radio group is "Sudah punya Resique Member Card"
  const cards = p.locator('[role="radiogroup"]').nth(0)
  await cards.locator(`label:has-text("${card}")`).first().click()
  await fill(p, 'input[name="laundry"]', laundry)
  await fill(p, 'input[name="pic"]', pic)
  await fill(p, 'input[name="phone"]', phone)
  await fill(p, 'input[name="email"]', email)
  await p.locator('button[role="combobox"]').first().click()
  await p.locator(`[role="option"]:has-text("${kota}")`).first().click()
  if (rsl) await fill(p, 'input[name="rsl"]', rsl)
  await p.locator('button[role="checkbox"]').first().click()
}
const submit = async (p) => { await p.locator('button[type="submit"]').first().click(); await p.waitForTimeout(700) }
async function setPassword(p, pw, expectEnabled = true) {
  await p.locator('#pw').fill(pw); await p.locator('#pw2').fill(pw); await p.waitForTimeout(150)
  const btn = p.locator('button[type="submit"]').first()
  const enabled = !(await btn.isDisabled())
  if (expectEnabled && enabled) await submit(p)
  return enabled
}

;(async () => {
  const { b, p, errs } = await launch()
  await resetStores(p)

  // path 1 — phone exact (Fresh Laundry Kemang 0812-3345-8891)
  await go(p, '/register')
  await fillBase(p, { laundry: 'Fresh Laundry', pic: 'Maya', phone: '081233458891', email: 'maya@test.id', card: 'Ya' })
  ok(/\+62812/.test(await text(p)), 'phone normalization preview shows +62812…')
  await submit(p)
  let t = await text(p)
  ok(/terhubung/i.test(t) && /Fresh Laundry Kemang/.test(t), 'path 1 → LINKED to Fresh Laundry Kemang')
  let inbox = await readStore(p, 'inbox')
  ok(inbox && inbox.mails.length === 1 && /Rsq-/.test(inbox.mails[0].body), 'temp password email in mock inbox')
  let acc = await readStore(p, 'accounts')
  ok(acc.accounts[0].link === 'LINKED' && acc.accounts[0].matchPath === 1 && acc.accounts[0].mustChangePassword === true, 'account LINKED, path 1, mustChangePassword')

  // duplicate phone
  await go(p, '/register')
  await fillBase(p, { laundry: 'Xy', pic: 'Yz', phone: '0812 3345 8891', email: 'dup@test.id' })
  await submit(p)
  ok(/sudah terdaftar/i.test(await text(p)), 'duplicate phone rejected with "sudah terdaftar"')

  // path 2 — RSL card + name, CRM customer without phone (Karpet Bersih Bandung RSL40018 Tono Prabowo)
  await go(p, '/register')
  await fillBase(p, { laundry: 'Karpet Bersih', pic: 'Tono Prabowo', phone: '089900001111', email: 'tono@test.id', kota: 'Bandung', card: 'Ya', rsl: 'rsl40018' })
  await submit(p)
  t = await text(p)
  // R.052 (staging autoLinkPath2 = false): card + name is a look-alike, not an auto-link — step 2 asks for a password, then PENDING
  ok((await p.locator('#pw').count()) === 1, 'path 2 asks for a user password (no auto-link)')
  await setPassword(p, 'Resique#2026')
  t = await text(p)
  ok(/mirip|verifikasi/i.test(t) && !/Karpet Bersih Bandung/.test(t), 'path 2 → PENDING result screen, candidate name not revealed')
  const crm = await readStore(p, 'crm')
  const tono = crm.customers.find(c => c.id === 'C-2026-0015')
  const acc2 = await readStore(p, 'accounts')
  ok(!tono.hp && crm.claims.length === 1 && acc2.accounts[0].link === 'PENDING' && acc2.accounts[0].matchPath === 2, `path 2: claim row created, phone NOT backfilled until sales approves (${tono.hp || 'kosong'})`)

  // path 3 — fuzzy (Laundry Bunda Palembang / Rina Marlina, no phone) with a typo
  await go(p, '/register')
  await fillBase(p, { laundry: 'Laundry Bunda Palembng', pic: 'Rina Marlina', phone: '085200003333', email: 'rina@test.id', kota: 'Palembang' })
  await submit(p)
  ok((await p.locator('#pw').count()) === 1 && (await p.locator('#pw2').count()) === 1, 'path 3 asks for a user password')
  ok((await setPassword(p, 'Abcd1234', false)) === false, 'weak password (no symbol) keeps submit disabled')
  await setPassword(p, 'Resique#2026')
  t = await text(p)
  ok(/mirip|verifikasi/i.test(t), 'path 3 → PENDING result screen')
  acc = await readStore(p, 'accounts')
  ok(acc.accounts[0].link === 'PENDING' && acc.accounts[0].matchPath === 3, 'account PENDING path 3')
  ok((await readStore(p, 'crm')).claims.length === 2, 'claim row created (second claim: path 2 + path 3)')

  // path 4 — lead
  await go(p, '/register')
  await fillBase(p, { laundry: 'Laundry Mentari Baru', pic: 'Dina Kartika', phone: '087700004444', email: 'dina@test.id', kota: 'Jambi' })
  await submit(p)
  await setPassword(p, 'Resique#2026')
  t = await text(p)
  ok(/tercatat sebagai pelanggan Resique/i.test(t), 'path 4 → NEW_CUSTOMER result screen (staging copy)')
  const crm2 = await readStore(p, 'crm')
  ok(crm2.leads.length === 0 && crm2.customers.some(c => c.outlet === 'Laundry Mentari Baru' && c.id.startsWith('CUS-GP-')), 'path 4 creates a NEW CRM customer (no lead), like staging')
  acc = await readStore(p, 'accounts')
  ok(acc.accounts[0].link === 'NEW_CUSTOMER' && acc.accounts[0].matchPath === 4 && !!acc.accounts[0].crmCustomerId, 'account NEW_CUSTOMER path 4, linked to the new customer')

  // R.052 — login: generic error, lockout after 5 wrong passwords (15 min), forgot never reveals the number
  await go(p, '/login')
  await fill(p, '#phone', '087700004444')
  for (let i = 0; i < 5; i++) { await fill(p, '#pw', 'salah' + i); await p.locator('button[type="submit"]').first().click(); await p.waitForTimeout(250) }
  const lt = await text(p)
  ok(/Akun terkunci sementara, coba lagi nanti/.test(lt), 'login: 5th wrong password locks the account with the staging message')
  const locked = (await readStore(p, 'accounts')).accounts.find(a => a.phone === '+6287700004444')
  ok(locked.failedLoginCount === 5 && locked.lockedUntil && Date.parse(locked.lockedUntil) > Date.now(), 'login: failedLoginCount 5 + lockedUntil set')
  await go(p, '/login')
  await fill(p, '#phone', '081199990000'); await fill(p, '#pw', 'apa saja'); await p.locator('button[type="submit"]').first().click(); await p.waitForTimeout(300)
  ok(/Nomor atau kata sandi salah/.test(await text(p)), 'login: unknown number gets the same generic message')
  await p.locator('button:has-text("Lupa kata sandi")').first().click(); await p.waitForTimeout(200)
  await fill(p, '#reset-phone', '081199990000'); await p.locator('button[type="submit"]').first().click(); await p.waitForTimeout(300)
  ok((await p.locator('[data-forgot-sent]').count()) === 1 && !/belum terdaftar/i.test(await text(p)), 'forgot: unknown number gets the neutral "kalau nomor ini terdaftar" answer')

  // R.052 — invite registration: sales link → one-step form → LINKED, straight to profile
  await go(p, '/')
  const token = await p.evaluate(() => new Promise(res => { const iv = setInterval(() => { if (window.__rmcweb) { clearInterval(iv); res(window.__rmcweb.invite('C-2026-0045')) } }, 50) }))
  ok(typeof token === 'string' && token.length === 48, `invite token generated (${String(token).slice(0, 8)}…)`)
  await go(p, '/register?invite=' + token)
  ok((await p.locator('[data-invite-card]').count()) === 1 && (await p.locator('input[name="laundry"]').count()) === 0, 'invite mode: outlet card shown, no laundry / kota fields')
  await fill(p, '#pic', 'Sari Undangan'); await fill(p, '#phone', '081277778888'); await fill(p, '#email', 'sari@undangan.id')
  await p.locator('#pw').fill('Undangan#2026'); await p.locator('#pw2').fill('Undangan#2026')
  await p.locator('button[role="checkbox"]').first().click()
  await p.locator('button[type="submit"]').first().click(); await p.waitForTimeout(900)
  ok(/profile/.test(p.url()), 'invite: lands on /profile signed in')
  const inv = (await readStore(p, 'accounts')).accounts.find(a => a.phone === '+6281277778888')
  ok(inv && inv.link === 'LINKED' && inv.matchPath === 0 && inv.crmCustomerId === 'C-2026-0045' && inv.mustChangePassword === false, 'invite: account LINKED to the invited customer, path 0, no temp password')
  const mitraWangi = (await readStore(p, 'crm')).customers.find(c => c.id === 'C-2026-0045')
  ok(mitraWangi.hp === '+6281277778888', 'invite: customer without a phone gets it backfilled from the invited account')
  const used = (await readStore(p, 'crm')).invites.find(i => i.token === token)
  ok(used && !!used.usedAt, 'invite: token marked used')
  await go(p, '/register?invite=' + token)
  ok(/tidak valid atau sudah digunakan/i.test(await text(p)), 'invite: reused link shows the generic invalid message')

  ok(errs.length === 0, `no page errors (${errs.length})`)
  await finish(b, errs, 'register-verify')
})().catch(e => { console.error(e); process.exit(1) })
