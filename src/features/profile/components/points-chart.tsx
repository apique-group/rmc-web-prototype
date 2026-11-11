'use client'

import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, type TooltipProps, XAxis, YAxis } from 'recharts'
import { fmtMonth, poin, rupiah } from '@/lib/format'
import type { RmcSummary } from '@/lib/rules/rmc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const TEAL = '#3E8A1E'

const GOLD = '#D4A04E'

/* --------------------------------- Chart --------------------------------- */
function PointsTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value ?? 0
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 shadow-2">
      <p className="text-[12px] font-semibold text-ink-3">{String(label)}</p>
      <p className="t-fig text-[15px] text-navy-700">{poin(v)} <span className="text-[11px] font-semibold text-ink-3">poin</span></p>
    </div>
  )
}

export function PointsChart({ rmc, earnPerRp }: { rmc: RmcSummary; earnPerRp: number }) {
  const data = rmc.monthly.map(m => ({ label: fmtMonth(m.ym), points: m.points }))
  const last = data[data.length - 1]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Poin per bulan</CardTitle>
        <CardDescription>12 bulan terakhir · <span className="t-code">{poin(rmc.pointsEarned)}</span> poin terkumpul tahun ini</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="rmcPoints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TEAL} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#EEF0F2" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}rb` : String(v))} />
              <Tooltip content={<PointsTooltip />} cursor={{ stroke: '#B7E094', strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="points" stroke={TEAL} strokeWidth={2.25} fill="url(#rmcPoints)" dot={false} activeDot={{ r: 5, fill: TEAL, stroke: '#fff', strokeWidth: 2 }} isAnimationActive />
              {last && <ReferenceDot x={last.label} y={last.points} r={5.5} fill={GOLD} stroke="#fff" strokeWidth={2} isFront />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 text-[12px] text-ink-4">Poin dihitung dari belanja Lunas ({rupiah(earnPerRp)} = 1 poin).</p>
      </CardContent>
    </Card>
  )
}
