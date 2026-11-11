# rmc-web — Resique Golden Privilege

**Repository:** `itstomsyhere/rmc-web` (Vercel source, private) with a synced duplicate at `apique-group/rmc-web-prototype` — every `git push` lands on both (personal first, then the org). The production RMC web is the separate `apique-group/apique-web-rmc`.


Consumer web prototype for the **Resique Golden Privilege** campaign (Apique Group): mobile-first landing
("Resique Turun Harga"), RMC member profile (points · tier · prizes), Golden Sale with QRIS checkout + proof
upload, spending Klasemen, and the admin config surface that the Apique CRM embeds (Member Card (RMC) → Golden Privilege).

- Live: https://rmc-web-beta.vercel.app (auto-deploys from `main`)
- Config surface: `/admin?embed=1&actor=<name>&role=<role>&level=Full|Edit|View&caps=manage_config,…` (the old `/#/admin?…` is forwarded) — opened only from crm-apique CRM → Member Card (RMC) → Golden Privilege; no passcode. Level comes from the Role Access Matrix sub-module, editing needs capability `manage_config` (View = read-only). Direct `/admin` shows an access-denied card.
- PRD: `Apique\prd\PRD-CRM-Resique-Golden-Privilege-v1.0.md` (Google Doc canonical)
- Design notes: `DESIGN-RMC.md`

## Stack
Next.js 15.5 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn ui (Radix) · zustand 5/persist (localStorage) · react-hook-form + zod · Recharts · SheetJS · sonner · lucide.
No backend — CRM data, accounts, orders, config are seeded + persisted in the browser (`rmcweb_*_v1` keys).

## Run
```
npm install
npm run dev            # http://localhost:5173
npm run build          # next build
npm start              # http://localhost:4173 (gates run against this)
```

## Gates (Playwright, plain node scripts)
```
npx playwright install chromium   # once
npm start &                        # keep running
npm test                           # test/run-all.cjs → model · landing · register · auth-profile · shop · admin
BASE=https://rmc-web-beta.vercel.app node test/landing-verify.cjs   # against live
```
Each gate prints `PASS:`/`FAIL:` lines and exits non-zero on any failure or page error.

## Structure
See [ARCHITECTURE.md](ARCHITECTURE.md): same layout as staging `apique-web-rmc` (app/ routes, features/<name>, components/{ui,common,layout,brand}, stores/, lib/api/mock).

## Commit convention
`R.NNN <type>(scope): message` — one phase per commit, `powershell -File tools\safe-commit.ps1 -m "..." -Files a,b,c`.
