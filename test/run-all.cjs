/* Runs every gate sequentially against BASE (default next start :4173). Exit 1 if any fails. */
const { spawnSync } = require('node:child_process')
const path = require('node:path')
const gates = ['model-verify', 'landing-verify', 'register-verify', 'auth-profile-verify', 'shop-verify', 'admin-verify']
let failed = 0
for (const g of gates) {
  console.log(`\n══════ ${g} ══════`)
  const r = spawnSync(process.execPath, [path.join(__dirname, g + '.cjs')], { stdio: 'inherit', env: process.env })
  if (r.status !== 0) failed++
}
console.log(`\n${gates.length - failed}/${gates.length} gates green`)
process.exit(failed ? 1 : 0)
