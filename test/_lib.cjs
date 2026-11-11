/* Shared Playwright gate helpers — plain node scripts, no test runner (same idiom as crm-apique test/*.cjs).
 * Usage: BASE=http://localhost:4173 node test/<gate>.cjs   (default BASE = http://localhost:4173) */
const { chromium } = require('playwright')

const BASE = process.env.BASE || 'http://localhost:4173'
const fails = []
const ok = (c, l) => { console.log(`${c ? 'PASS' : 'FAIL'}: ${l}`); if (!c) fails.push(l) }

async function launch(viewport = { width: 390, height: 844 }) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport, acceptDownloads: true, deviceScaleFactor: 1, locale: 'id-ID' })
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', e => errs.push(String(e.message).split('\n')[0].slice(0, 200)))
  p.on('console', m => { if (m.type() === 'error') errs.push('C:' + String(m.text()).slice(0, 200)) })
  return { b, ctx, p, errs }
}

/** Navigate to a route and wait for React to settle. */
async function go(p, route = '/', wait = 600) {
  await p.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" })
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('#root > *', { timeout: 20000 })
  await p.waitForTimeout(wait)
}

/** Clear every rmcweb_* key so each gate starts from seed data. */
async function resetStores(p) {
  await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(() => { Object.keys(localStorage).filter(k => k.startsWith('rmcweb_')).forEach(k => localStorage.removeItem(k)); sessionStorage.clear() })
}

/** Patch the persisted config (zustand persist envelope) before a page load. */
async function patchConfig(p, patchFn) {
  await p.evaluate((src) => {
    const key = 'rmcweb_config_v1'
    const raw = localStorage.getItem(key)
    const env = raw ? JSON.parse(raw) : { state: { config: null }, version: 1 }
    // eslint-disable-next-line no-new-func
    const fn = new Function('cfg', src)
    env.state = env.state || {}
    const base = env.state.config || (window.__rmcweb && window.__rmcweb.config()) || {}
    env.state.config = fn(base) || base
    localStorage.setItem(key, JSON.stringify(env))
  }, patchFn)
}

async function readStore(p, name) {
  return await p.evaluate((n) => { const r = localStorage.getItem(`rmcweb_${n}_v1`); return r ? JSON.parse(r).state : null }, name)
}

const text = async (p, sel = 'body') => (await p.locator(sel).first().innerText().catch(() => '')) || ''
const fill = async (p, sel, v) => { const l = p.locator(sel).first(); await l.click({ timeout: 5000 }); await l.fill(v) }
const clickText = async (p, rx, tag = 'button') => await p.evaluate(({ src, tag }) => {
  const re = new RegExp(src, 'i'); const b = [...document.querySelectorAll(tag)].find(x => re.test((x.textContent || '').trim())); if (b) { b.click(); return true } return false
}, { src: rx.source, tag })
const minTapHeight = async (p, sel) => await p.evaluate((s) => Math.min(...[...document.querySelectorAll(s)].filter(e => e.offsetParent !== null).map(e => e.getBoundingClientRect().height), 999), sel)

async function finish(b, errs, name) {
  await b.close()
  console.log(`\n${name}: ${fails.length ? 'FAIL ' + fails.length : 'ALL PASS'}${errs.length ? ' · page errors: ' + errs.length + ' → ' + errs.slice(0, 3).join(' | ') : ''}`)
  process.exit(fails.length || errs.length ? 1 : 0)
}

module.exports = { BASE, ok, fails, launch, go, resetStores, patchConfig, readStore, text, fill, clickText, minTapHeight, finish }
