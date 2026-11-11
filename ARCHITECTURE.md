# Architecture

rmc-web is the clickable prototype of the Resique Golden Privilege web. Since R.058 it uses the same stack and
folder layout as the staging app `apique-group/apique-web-rmc` (Next.js 15.5, React 19, Tailwind 4, shadcn on
base-ui, TanStack Query + axios, zustand), so screens can move to staging with little rework. The look did not change in the move: 26 screens at
390 and 1280 px were compared pixel by pixel and by on-screen text with the R.056 build.

```
src/
  app/                    routes only, like apique-web-rmc
    layout.tsx            fonts (next/font), metadata, Providers
    providers.tsx         QueryClient + toaster; renders after mount (data lives in this browser); forwards old /#/… links
    (main)/               /, /checkout, /order/[id], /profile    (site header + footer)
    (auth)/               /login, /register, /change-password     (site header + footer)
    admin/                /admin, the config surface the CRM embeds
  features/<name>/        landing · auth · checkout · order · profile · admin
    api/*.api.ts          the feature's endpoints, called with the shared axios client (auth, checkout, profile, admin)
    components/           the feature's screens, one component per file
    hooks/                TanStack Query hooks over api/ (use-auth, use-checkout, use-profile, use-admin, use-draft)
    lib/ types.ts         feature-only rules and types
    index.ts              public face: app/ pages import "@/features/<name>" only
  components/
    ui/                   shadcn primitives on base-ui (button, dialog, sheet, select, checkbox, radio, tabs, …)
    common/               shared pieces built on ui/: empty-state, section-head, reveal, qty-stepper, qris-sheet
    layout/               site shell, header, footer, narrow page
    brand/                Resique look (doodle)
  hooks/                  use-member-data (shared reads: config, orders, me, customers), use-in-view, use-count-up, …
  stores/                 browser-only stores, like staging: auth.store (session), cart.store
  types/member.ts         domain types
  lib/
    api/client.ts         axios rmcClient (as in staging); member.api.ts (shared member reads)
    api/mock/             stand-in for crm-rsq-service: server.ts answers /member/… and /admin/… in the browser,
                          backed by accounts, crm, orders, config, inbox (zustand + localStorage), seed/, test-bridge
    rules/                RMC tier/points, registration matching, similarity
    klasemen, invite, format, phone, password, image, contacts, logo, xlsx, utils
```

## Rules

- One component per file, kebab-case names, named exports. Aim for files under ~250 lines
  (checkout-view is still one 400-line component).
- A feature does not import another feature's components; shared UI goes in `components/common/`.
- `components/ui/` holds shadcn primitives; restyle through the tokens in `app/globals.css`.
- Data: screens never touch the stores in `lib/api/mock`; they call `features/<x>/api` (or `lib/api/member.api`)
  through TanStack Query hooks. With no `NEXT_PUBLIC_RMC_API_URL` the axios client answers from
  `lib/api/mock/server.ts`; setting it sends the same calls to crm-rsq-service. Any change to the mock data
  refreshes the queries, and GET /member/me is updated instantly so sign-in / sign-out never shows a stale page.
- Link-buttons follow staging: `<Button nativeButton={false} render={<Link href="/x" />}>`.

## Kept on purpose so the look did not move (Tailwind 3 → 4)

- `stack-y-*` (globals.css) is Tailwind 3's `space-y-*` (margin on following siblings). Tailwind 4's `space-y`
  puts margin-bottom on earlier siblings, which inline children such as `<label>` ignore.
- `--shadow-gold` is a solid gold glow (Tailwind 3 also applied the gold colour to that shadow).
- `td, th { padding: 1px }` (Tailwind 4's reset removes the browser's 1px).
- `sm:leading-6` after `sm:text-base` where a paragraph also has `leading-relaxed`.

## Links

The old hash links still work: `/#/admin?embed=1&…` is forwarded to `/admin?embed=1&…` (providers.tsx), so a CRM
build that still uses the old address keeps opening the config surface.

## Checks

`npm run build && npm start` (port 4173), then `npm test` runs the Playwright gates in `test/` against it.
