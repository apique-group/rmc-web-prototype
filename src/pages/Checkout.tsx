import * as React from 'react'
import { Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, QrCode, Store, Truck, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { rupiah } from '@/lib/format'
import { Reveal } from '@/lib/reveal'
import { normalizePhone, displayPhone } from '@/model/phone'
import { matchCheckoutIdentity, type CheckoutCandidate } from '@/model/match'
import { useCrm } from '@/store/crm'
import { loadGuestBuyer, saveGuestBuyer } from '@/lib/guest-buyer'
import type { Kota, Order } from '@/model/types'
import { useConfig } from '@/store/config'
import { useOrders } from '@/store/orders'
import { useCart, cartLines, cartTotal, cartCount, cartSavings, cartPackageLines, itemLeft, packageRemaining, lineKey } from '@/store/cart'
import { useCurrentAccount } from '@/store/session'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioCard } from '@/components/ui/radio-group'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator, EmptyState } from '@/components/ui/misc'
import { QtyStepper } from '@/components/shop/QtyStepper'
import { QrisSheet } from '@/components/shop/QrisSheet'

const schema = z
  .object({
    name: z.string().trim().min(2, 'Nama wajib diisi'),
    laundry: z.string().trim().min(2, 'Nama laundry wajib diisi'),
    phone: z.string().refine(v => normalizePhone(v) !== null, 'Nomor HP tidak valid. Contoh: 0812 3456 7890'),
    email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid. Contoh: nama@laundrykamu.co.id'),
    mode: z.enum(['PICKUP', 'DELIVERY']),
    outlet: z.string().optional(),
    address: z.string().optional(),
    note: z.string().optional(),
    method: z.enum(['QRIS', 'VA', 'EWALLET']),
    ewallet: z.string().optional(),
    /* Also in the schema, not only on the button: pressing Enter inside a text field submits
       the form without the button ever being clicked. */
    consent: z.boolean().refine(v => v === true, 'Centang persetujuan dihubungi dulu.'),
  })
  .superRefine((v, ctx) => {
    if (v.mode === 'PICKUP' && !v.outlet) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['outlet'], message: 'Pilih outlet pengambilan' })
    if (v.mode === 'DELIVERY' && (v.address || '').trim().length < 10) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address'], message: 'Alamat pengiriman minimal 10 karakter' })
    if (v.method === 'EWALLET' && !v.ewallet) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ewallet'], message: 'Pilih e-wallet' })
  })
type FormValues = z.infer<typeof schema>

export function CheckoutPage() {
  const cfg = useConfig(s => s.config)
  const orders = useOrders(s => s.orders)
  const qty = useCart(s => s.qty)
  const pkgQty = useCart(s => s.pkgQty)
  const inc = useCart(s => s.inc)
  const dec = useCart(s => s.dec)
  const incPkg = useCart(s => s.incPkg)
  const decPkg = useCart(s => s.decPkg)
  const acc = useCurrentAccount()

  const lines = [...cartLines(qty, cfg.items), ...cartPackageLines(pkgQty, cfg.packages)]
  const total = cartTotal(lines), count = cartCount(lines), savings = cartSavings(lines)

  const [placed, setPlaced] = React.useState<Order | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [pendingMatch, setPendingMatch] = React.useState<{ candidate: CheckoutCandidate; values: FormValues } | null>(null)
  const customers = useCrm(s => s.customers)
  const guest = React.useMemo(() => (acc ? null : loadGuestBuyer()), [acc])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      name: acc?.pic || guest?.name || '',
      laundry: acc?.laundry || guest?.laundry || '',
      phone: acc?.phone || guest?.phone || '',
      email: acc?.email || guest?.email || '',
      mode: guest?.mode || 'PICKUP',
      outlet: guest?.outlet || (cfg.outlets.length === 1 ? cfg.outlets[0] : undefined),
      address: guest?.address || '',
      note: '',
      method: 'QRIS',
      ewallet: undefined,
      consent: false,
    },
  })
  const { register, handleSubmit, control, watch, formState: { errors, isDirty, isSubmitting }, reset, getValues } = form

  // Prefill from the signed-in account once it hydrates (only while the form is still untouched).
  React.useEffect(() => {
    if (acc && !isDirty) reset({ ...getValues(), name: acc.pic, laundry: acc.laundry, phone: acc.phone, email: acc.email }, { keepDefaultValues: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acc?.id])

  const mode = watch('mode')
  const method = watch('method')
  const phoneRaw = watch('phone')
  const phoneNorm = normalizePhone(phoneRaw)
  const consent = watch('consent')
  const consentRef = React.useRef<HTMLDivElement>(null)

  /* The pay button is aria-disabled rather than disabled: a disabled button receives no click,
     so it could never explain itself. This is what it says when it refuses. */
  const warnNoConsent = () => {
    toast.warning('Centang persetujuan dihubungi dulu ya — tim Resique perlu izin ini untuk menindaklanjuti transaksi kamu.')
    consentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    consentRef.current?.querySelector<HTMLElement>('button,input')?.focus()
  }

  const placeOrder = (v: FormValues, matchDecision?: { customerId: string; confirmed: boolean }) => {
    try {
      const order = useOrders.getState().create({
        name: v.name, laundry: v.laundry, phone: v.phone, email: v.email, consent: v.consent,
        mode: v.mode, outlet: v.mode === 'PICKUP' ? (v.outlet as Kota) : undefined, address: v.mode === 'DELIVERY' ? v.address : undefined,
        lines, method: v.method, note: v.note?.trim() || undefined, matchDecision,
      })
      if (!acc) saveGuestBuyer({ name: v.name, laundry: v.laundry, phone: v.phone, email: v.email, mode: v.mode, outlet: v.outlet as Kota | undefined, address: v.address })
      useCart.getState().clear()
      setPendingMatch(null)
      setPlaced(order)
      setSheetOpen(true)
      toast.success(`Pesanan ${order.id} dibuat, selesaikan pembayaran QRIS`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Pesanan gagal dibuat')
    }
  }
  const onSubmit = (v: FormValues) => {
    if (lines.length === 0) return toast.error('Keranjang kosong')
    if (v.method !== 'QRIS') return toast.warning('Metode ini belum tersedia. Pakai QRIS')
    // staging identity match (guests only): a same-phone customer links silently; a similar laundry name must be confirmed first
    if (!acc) {
      const m = matchCheckoutIdentity({ laundry: v.laundry, phone: v.phone }, customers, cfg.matching.fuzzyThreshold)
      if (m && 'candidate' in m) { setPendingMatch({ candidate: m.candidate, values: v }); return }
    }
    placeOrder(v)
  }

  /* Post-submit: cart is empty by design, so show the order handoff instead of the empty state. */
  if (placed) {
    return (
      <div className="container max-w-xl pb-16 pt-24 sm:pt-32">
        <Reveal>
          <p className="t-eyebrow">Pesanan dibuat</p>
          <h1 className="t-h1 mt-3 text-ink">Selesaikan pembayaran</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-3">Pesanan <span className="t-code text-ink-2">{placed.id}</span> menunggu pembayaran QRIS sebesar <strong className="t-code text-ink">{rupiah(placed.total)}</strong>. QR berlaku {Math.round(cfg.payment.qrTimeoutSec / 60)} menit sejak pesanan dibuat.</p>
        </Reveal>
        <Reveal delay={80}>
          <Card className="mt-8">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-700"><QrCode className="h-5 w-5" strokeWidth={1.6} /></span>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-ink">QRIS · {cfg.payment.qrisMerchant}</p>
                  <p className="text-[13px] text-ink-3">Scan, bayar, lalu unggah bukti pembayaran.</p>
                </div>
              </div>
              <Button size="lg" variant="gold" className="" onClick={() => setSheetOpen(true)}>Buka QR</Button>
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={140} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" size="lg" className=""><Link to={'/order/' + placed.id + (acc ? '' : '?phone=' + encodeURIComponent(placed.buyer.phone))}>Lihat status pesanan</Link></Button>
          <Button asChild variant="ghost" size="lg" className=""><Link to="/">Kembali ke beranda</Link></Button>
        </Reveal>
        <QrisSheet order={placed} open={sheetOpen} onOpenChange={setSheetOpen} />
      </div>
    )
  }

  const matchDialog = pendingMatch && (
    <Dialog open onOpenChange={o => { if (!o) setPendingMatch(null) }}>
      <DialogContent data-match-dialog className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apakah benar Anda terdaftar sebagai outlet berikut?</DialogTitle>
          <DialogDescription>Nomor HP yang kamu isi belum tercatat, tapi nama laundry mirip dengan data pelanggan Resique berikut. Konfirmasi kalau ini outletmu supaya transaksi tercatat dengan benar.</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 rounded-xl border border-line bg-surface-2 p-4 text-[13px]">
          <dt className="text-ink-3">Nama outlet</dt><dd className="font-semibold text-ink">{pendingMatch.candidate.outlet}</dd>
          <dt className="text-ink-3">PIC</dt><dd className="text-ink">{pendingMatch.candidate.pic}</dd>
          <dt className="text-ink-3">Kota</dt><dd className="text-ink">{pendingMatch.candidate.kota}</dd>
          {pendingMatch.candidate.rsl && <><dt className="text-ink-3">Nomor kartu</dt><dd className="t-code text-ink">{pendingMatch.candidate.rsl}</dd></>}
        </dl>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => placeOrder(pendingMatch.values, { customerId: pendingMatch.candidate.id, confirmed: false })}>Bukan, lanjutkan sebagai tamu</Button>
          <Button type="button" onClick={() => placeOrder(pendingMatch.values, { customerId: pendingMatch.candidate.id, confirmed: true })}>Ya, ini outlet saya</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (lines.length === 0) {
    return (
      <div className="container max-w-xl pb-16 pt-24 sm:pt-32">
        <Reveal>
          <p className="t-eyebrow">Checkout</p>
          <h1 className="t-h1 mt-3 text-ink">Keranjang masih kosong</h1>
        </Reveal>
        <Reveal delay={80}>
          <EmptyState className="mt-8" title="Belum ada item di keranjang" desc="Pilih item Golden Sale dulu, lalu bayar di sini."
            action={<Button asChild size="lg" variant="gold" className=""><Link to="/#golden-sale">Lihat Golden Sale</Link></Button>} />
        </Reveal>
      </div>
    )
  }

  // staging PAYMENT_NOT_CONFIGURED: no order may be created while the admin has not uploaded a QRIS image
  if (!cfg.assets.qrisImage) {
    return (
      <div className="container max-w-xl pb-16 pt-24 sm:pt-32">
        <Reveal>
          <p className="t-eyebrow">Checkout</p>
          <h1 className="t-h1 mt-3 text-ink">QRIS belum disiapkan</h1>
        </Reveal>
        <Reveal delay={80}>
          <EmptyState data-qris-missing className="mt-8" title="Pembayaran belum bisa dibuka" desc="Admin Resique belum mengunggah QRIS pembayaran. Coba lagi nanti atau hubungi sales Resique."
            action={<Button asChild size="lg" variant="outline" className=""><Link to="/#golden-sale">Kembali ke Golden Sale</Link></Button>} />
        </Reveal>
      </div>
    )
  }

  return (
    <div className="container pb-32 pt-24 sm:pt-32 lg:pb-16">
      {matchDialog}
      <Reveal>
        <Link to="/#golden-sale" className="inline-flex h-11 items-center gap-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Kembali ke Golden Sale</Link>
        <p className="t-eyebrow mt-2">Checkout</p>
        <h1 className="t-h1 mt-3 text-ink">Selesaikan pesanan</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-3">Isi data pemesan, pilih ambil atau kirim, lalu bayar lewat QRIS. Setelah Lunas, belanja masuk klasemen.</p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Form, left column */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="lg:col-span-7">
          <div className="max-w-xl space-y-10">
            <Reveal delay={60} as="section">
              <h2 className="t-h2 text-ink">Data pemesan</h2>
              <div className="mt-5 space-y-5">
                <Field label="Nama" required htmlFor="co-name" error={errors.name?.message}>
                  <Input id="co-name" autoComplete="name" placeholder="Nama lengkap" readOnly={!!acc} aria-invalid={!!errors.name} {...register('name')} />
                </Field>
                <Field label="Nama laundry" required htmlFor="co-laundry" error={errors.laundry?.message}>
                  <Input id="co-laundry" autoComplete="organization" placeholder="Contoh: Laundry Bersih Jaya" readOnly={!!acc} aria-invalid={!!errors.laundry} {...register('laundry')} />
                </Field>
                <Field label="No. HP (WhatsApp)" required htmlFor="co-phone" error={errors.phone?.message}
                  hint={acc ? 'Terisi otomatis dari akunmu.' : phoneNorm ? `Tersimpan sebagai ${phoneNorm} · ${displayPhone(phoneNorm)}` : 'Sales Resique menghubungi lewat nomor ini.'}>
                  <Input id="co-phone" type="tel" spellCheck={false} inputMode="tel" autoComplete="tel" placeholder="0812 3456 7890" readOnly={!!acc} aria-invalid={!!errors.phone} {...register('phone')} />
                </Field>
                <Field label="Email" required htmlFor="co-email" error={errors.email?.message}
                  hint={acc ? 'Terisi otomatis dari akunmu.' : 'Untuk menerima konfirmasi pembayaran via email.'}>
                  <Input id="co-email" type="email" spellCheck={false} inputMode="email" autoComplete="email" placeholder="nama@email.com" readOnly={!!acc} aria-invalid={!!errors.email} {...register('email')} />
                </Field>
              </div>
            </Reveal>

            <Reveal delay={100} as="section">
              <h2 className="t-h2 text-ink">Pengambilan</h2>
              <Controller control={control} name="mode" render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} className="mt-5" aria-label="Cara pengambilan">
                  <RadioCard value="PICKUP" title="Ambil di outlet Resique" desc="Gratis. Ambil setelah pembayaran diverifikasi." badge={<Store className="h-4 w-4 text-ink-4" strokeWidth={1.6} />} />
                  <RadioCard value="DELIVERY" title="Kirim ke alamat" desc="Ongkir dihitung sales via WhatsApp, di luar QR." badge={<Truck className="h-4 w-4 text-ink-4" strokeWidth={1.6} />} />
                </RadioGroup>
              )} />
              {mode === 'PICKUP' && (
                <Field className="mt-4" label="Outlet pengambilan" required htmlFor="co-outlet" error={errors.outlet?.message}>
                  <Controller control={control} name="outlet" render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger id="co-outlet" aria-invalid={!!errors.outlet}><SelectValue placeholder="Pilih outlet" /></SelectTrigger>
                      <SelectContent>{cfg.outlets.map(o => <SelectItem key={o} value={o}>Resique {o}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
              )}
              {mode === 'DELIVERY' && (
                <Field className="mt-4" label="Alamat pengiriman" required htmlFor="co-address" error={errors.address?.message}
                  hint="Ongkir dihitung sales via WhatsApp setelah pesanan dibuat. Tidak termasuk dalam QR.">
                  <Textarea id="co-address" autoComplete="street-address" placeholder="Nama jalan, nomor, kelurahan, kota, kode pos" aria-invalid={!!errors.address} {...register('address')} />
                </Field>
              )}
              <Field className="mt-4" label="Catatan" htmlFor="co-note" hint="Opsional. Misal jam ambil atau patokan alamat.">
                <Textarea id="co-note" className="min-h-[64px]" placeholder="Catatan untuk sales Resique" {...register('note')} />
              </Field>
            </Reveal>

            <Reveal delay={140} as="section">
              <h2 className="t-h2 text-ink">Pembayaran</h2>
              {!(cfg.payment.vaEnabled || cfg.payment.ewalletEnabled) && (
                <div data-payment-fixed className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-white p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-700"><QrCode className="h-5 w-5" strokeWidth={1.6} /></span>
                  <div className="min-w-0"><p className="text-[14px] font-bold text-ink">QRIS · {cfg.payment.qrisMerchant}</p><p className="text-[13px] text-ink-3">Scan dengan aplikasi bank / e-wallet apa pun, lalu unggah bukti bayar.</p></div>
                  <Badge variant="gold" className="ml-auto">Aktif</Badge>
                </div>
              )}
              {(cfg.payment.vaEnabled || cfg.payment.ewalletEnabled) && <Controller control={control} name="method" render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} className="mt-5" aria-label="Metode pembayaran">
                  <RadioCard value="QRIS" title="QRIS" desc="Scan dengan aplikasi bank / e-wallet apa pun" badge={<Badge variant="gold">Aktif</Badge>} />
                  <RadioCard value="VA" title="Virtual Account" disabled={!cfg.payment.vaEnabled}
                    desc={cfg.payment.vaBanks.length ? `Transfer ke VA ${cfg.payment.vaBanks.join(', ')}` : 'Transfer ke Virtual Account bank'}
                    badge={!cfg.payment.vaEnabled ? <Badge variant="muted">Segera</Badge> : undefined} />
                  <RadioCard value="EWALLET" title="E-wallet" disabled={!cfg.payment.ewalletEnabled}
                    desc={cfg.payment.ewallets.length ? cfg.payment.ewallets.join(', ') : 'Bayar lewat dompet digital'}
                    badge={!cfg.payment.ewalletEnabled ? <Badge variant="muted">Segera</Badge> : undefined} />
                </RadioGroup>
              )} />}
              {method === 'EWALLET' && cfg.payment.ewalletEnabled && (
                <Field className="mt-4" label="E-wallet" required htmlFor="co-ewallet" error={errors.ewallet?.message}>
                  <Controller control={control} name="ewallet" render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger id="co-ewallet" aria-invalid={!!errors.ewallet}><SelectValue placeholder="Pilih e-wallet" /></SelectTrigger>
                      <SelectContent>{cfg.payment.ewallets.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
              )}
              <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-ink-3"><ShieldCheck className="h-3.5 w-3.5 text-navy-600" strokeWidth={1.6} /> Pembayaran diverifikasi admin Resique setelah bukti diunggah.</p>

              {/* Consent sits last, so it is on screen at the moment the button refuses. */}
              <div ref={consentRef} data-consent className="mt-5 rounded-xl border border-line bg-white p-4">
                <Controller control={control} name="consent" render={({ field }) => (
                  <label htmlFor="co-consent" className="flex cursor-pointer items-start gap-3">
                    <Checkbox id="co-consent" checked={field.value} onCheckedChange={v => field.onChange(v === true)}
                      aria-describedby="co-consent-hint" aria-invalid={!!errors.consent} className="mt-0.5 shrink-0" />
                    <span className="text-[13px] leading-relaxed text-ink-2">
                      Saya bersedia untuk dihubungi tim Resique lebih lanjut terkait transaksi ini
                    </span>
                  </label>
                )} />
                <p id="co-consent-hint" className={cn('mt-2 pl-8 text-[12px]', errors.consent ? 'text-danger' : 'text-ink-3')} role={errors.consent ? 'alert' : undefined}>
                  {errors.consent?.message || 'Wajib dicentang sebelum membayar — tanpa ini sales Resique tidak bisa menindaklanjuti pesanan kamu.'}
                </p>
              </div>
            </Reveal>
          </div>

          {/* Submit: fixed bottom bar on mobile (safe-area aware), sticky at the bottom of the form column on desktop (Lurd, 7 Sep) */}
          <div data-pay-bar className="bar-in fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/90 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:sticky lg:inset-x-auto lg:bottom-4 lg:mt-10 lg:rounded-xl lg:border lg:bg-white/95 lg:p-4 lg:shadow-3">
            <div className="mx-auto flex max-w-xl items-center gap-3">
              <div className="min-w-0 flex-1 lg:hidden">
                <p className="text-[11px] font-semibold text-ink-3"><span className="t-code">{count}</span> item · hemat <span className="t-code gold-text font-bold">{rupiah(savings)}</span></p>
                <p className="t-code truncate text-[17px] font-extrabold leading-tight text-ink">{rupiah(total)}</p>
              </div>
              {/* Looks inactive until consent is ticked, but stays genuinely operable: neither
                  `disabled` nor `aria-disabled`, because both swallow the click and the whole point
                  is that clicking explains WHY it will not pay. aria-describedby carries the reason
                  for anyone who cannot see the dimming. */}
              <Button type="submit" size="xl" variant="gold" disabled={isSubmitting}
                data-inactive={!consent || undefined}
                aria-describedby={!consent ? 'co-consent-hint' : undefined}
                onClick={e => { if (!consent) { e.preventDefault(); warnNoConsent() } }}
                className={cn('bar-pop shrink-0 lg:w-full', !consent && 'opacity-45 saturate-50')}>Bayar {rupiah(total)}</Button>
            </div>
          </div>
        </form>

        {/* Order summary, right column, sticky on desktop */}
        <aside className="lg:col-span-5">
          <Reveal delay={120} className="lg:sticky lg:top-28">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Ringkasan pesanan</CardTitle>
                <CardDescription><span className="t-code">{count}</span> item · {cfg.campaign.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-line-2">
                  {lines.map(l => {
                    const pkg = l.packageId ? cfg.packages.find(p => p.id === l.packageId) : undefined
                    const it = l.itemId ? cfg.items.find(i => i.id === l.itemId) : undefined
                    const left = pkg ? packageRemaining(pkg, cfg.items, orders, cfg.packages) : it ? itemLeft(it, orders, cfg.packages) : Infinity
                    const cap = (pkg ? pkg.maxPerCustomer : it ? it.maxPerCustomer : 0) > 0 ? (pkg ? pkg.maxPerCustomer : it!.maxPerCustomer) : Infinity
                    const max = Math.min(cap, left)
                    const bump = () => { if (Number.isFinite(max) && l.qty >= max) return toast.warning(cap <= left ? `Maksimal ${cap} per pelanggan` : `Stok tersisa ${left}`); if (pkg) incPkg(pkg.id, Number.isFinite(max) ? max : undefined); else inc(l.itemId!, Number.isFinite(max) ? max : undefined) }
                    const drop = () => (pkg ? decPkg(pkg.id) : dec(l.itemId!))
                    return (
                      <li key={lineKey(l)} className="py-3">
                        {/* name on its own line at 390px; stepper + subtotal share the second row */}
                        <p className="text-[14px] font-semibold leading-snug text-ink">{l.name}{pkg && <span className="ml-2 rounded-md bg-gold-100 px-1.5 py-px text-[11px] font-bold text-gold-ink">Paket</span>}</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <QtyStepper qty={l.qty} label={l.name} max={Number.isFinite(max) ? max : undefined} onInc={bump} onDec={drop} />
                          <div className="text-right">
                            <p className="t-code text-[14px] font-bold text-ink">{rupiah(l.qty * l.promoPrice)}</p>
                            <p className="t-code text-[11px] text-ink-3">{l.qty} × {rupiah(l.promoPrice)}</p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <Separator className="my-4" />
                <div className="space-y-2 text-[14px]">
                  <div className="flex items-center justify-between text-ink-3"><span>Harga normal</span><span className="t-code strike">{rupiah(total + savings)}</span></div>
                  <div className="flex items-center justify-between font-bold"><span className="gold-text">Hemat</span><span className="t-code gold-text">{rupiah(savings)}</span></div>
                  <div className={cn('flex items-baseline justify-between pt-2 text-ink')}><span className="text-[15px] font-bold">Total</span><span className="t-code text-[24px] font-extrabold tracking-tight">{rupiah(total)}</span></div>
                </div>
                <p className="mt-4 text-[12px] leading-relaxed text-ink-4">Total belum termasuk ongkir untuk pengiriman ke alamat. Harga promo berlaku selama periode {cfg.campaign.label}.</p>
              </CardContent>
            </Card>
          </Reveal>
        </aside>
      </div>
    </div>
  )
}
