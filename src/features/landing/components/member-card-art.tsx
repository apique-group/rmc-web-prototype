'use client'


/* The member card, drawn from the photo Lurd sent (11 Sep): royal-blue card, one green crescent sweeping up the right
   edge, white text — RMC / RESIQUE MEMBER CARD / MEMBER ID RMC 2025 0321 0839 / "Lebih Rutin, Lebih Untung" — a soft
   white glow. Rests slightly turned, floats; on hover it swirls once and zooms in (card-swirl keyframes). */
export function MemberCardArt() {
  return (
    <div className="card3d-wrap relative mx-auto max-w-[420px] py-6">
      <div className="hook-float">
        <div className="card3d relative aspect-[1.586] overflow-hidden rounded-xl p-5 text-white sm:p-6" data-member-card style={{ background: '#1D4FB8' }}>
          {/* right-edge dark field + the green crescent */}
          <svg aria-hidden className="swoosh absolute inset-0 h-full w-full" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
            <path d="M310 252C365 200 400 130 400 40V252Z" fill="#153C8F" />
            <path d="M225 252C300 215 360 150 400 60V118C355 190 300 236 250 252Z" fill="#71BD41" />
            <path d="M232 252C305 216 362 150 400 66" stroke="#B7E094" strokeWidth="2" strokeOpacity=".8" />
          </svg>
          <div className="relative flex h-full flex-col">
            <div>
              <p className="t-fig text-[34px] leading-none text-white sm:text-[42px]">RMC</p>
              <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.02em] text-white sm:text-[13px]">Resique Member Card</p>
            </div>
            <div className="mt-auto">
              <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-white/85 sm:text-[10px]">Member ID</p>
              <p className="t-fig text-[14px] leading-none sm:text-[16px]">RMC 2025 0321 0839</p>
              <p className="mt-3 text-[11px] leading-tight text-white/90 sm:text-[12px]">Lebih Rutin,<br /><strong className="text-[13px] font-extrabold text-white sm:text-[14px]">Lebih Untung</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
