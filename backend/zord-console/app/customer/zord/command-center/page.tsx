'use client'

import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sankey,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchZordOverview } from '@/services/backend'
import { amountINR } from '@/services/analytics'
import { CardSkeleton } from '../_components/Skeleton'
import { KpiCard } from '../_components/KpiCard'
import { Panel } from '../_components/Panel'
import { StatusBadge } from '../_components/StatusBadge'
import { useZordApi } from '../_components/useZordApi'
import { useZordSession } from '../_components/useZordSession'

const DONUT_COLORS = ['#059669', '#f59e0b', '#2563eb', '#dc2626']

export default function CommandCenterPage() {
  const { tenantId } = useZordSession()
  const { data, loading, error } = useZordApi(() => fetchZordOverview(tenantId, '24h'), [tenantId], { pollMs: 30_000 })

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => <CardSkeleton key={idx} />)}
      </div>
    )
  }

  if (!data || error) {
    return <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">Unable to load command center: {error || 'unknown error'}</p>
  }

  const hero = (data.hero || []) as Array<{ label: string; display: string; drilldown_to: string; key: string }>
  const quickCounts = (data.quick_counts || {}) as Record<string, number>
  const flowData = {
    nodes: [
      { name: 'Intent' },
      { name: 'Dispatch' },
      { name: 'Confirmed' },
      { name: 'Pending' },
      { name: 'Failed' },
      { name: 'Recon Confirmed' },
      { name: 'Recon Variant' },
    ],
    links: [
      { source: 0, target: 1, value: Number(quickCounts.pending || 0) + Number(quickCounts.failures || 0) + 100 },
      { source: 1, target: 2, value: 72 },
      { source: 1, target: 3, value: Number(quickCounts.pending || 0) + 18 },
      { source: 1, target: 4, value: Number(quickCounts.failures || 0) + 10 },
      { source: 2, target: 5, value: 66 },
      { source: 2, target: 6, value: 6 },
    ],
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[var(--font-zord-heading)] text-2xl text-slate-100">Command Center</h1>
        <p className="text-sm text-slate-400">In under five seconds, identify what is broken, what is degrading, and where money is at risk.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {hero.map((item) => (
          <KpiCard
            key={item.key}
            title={item.label}
            value={item.display}
            href={item.drilldown_to}
            tone={item.key === 'success_rate' ? 'emerald' : item.key === 'sla_breach_rate' ? 'red' : item.key === 'amount_in_flight' ? 'amber' : 'blue'}
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel title="Live Payment Stream" subtitle="Last intent state changes" className="lg:col-span-1">
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {(data.live_payment_stream || []).map((row: Record<string, string>) => (
              <Link
                key={`${row.intent_id}-${row.ago}`}
                href={`/customer/zord/intent-journal?intent_id=${encodeURIComponent(row.intent_id)}`}
                className="block rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 hover:border-slate-500"
                title={row.occurred_at ? new Date(row.occurred_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-slate-200">{row.intent_id}</p>
                  <StatusBadge status={row.status === 'CONFIRMED' ? 'SUCCESS' : row.status === 'FAILED' ? 'FAILED' : 'PENDING'} text={row.status} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{row.psp} • {row.rail} • {row.amount_display} • {row.ago}</p>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="PSP Status Pills" subtitle="Auto-refresh every 30 seconds" className="lg:col-span-1">
          <div className="flex flex-wrap gap-2">
            {(data.psp_status_pills || []).map((pill: Record<string, string>) => (
              <div key={pill.name} className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-2">
                <p className="text-xs text-slate-300">{pill.name}</p>
                <div className="mt-1"><StatusBadge status={pill.status} text={pill.status_text} /></div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(data.rail_status || []).map((rail: Record<string, string>) => (
              <div key={rail.name} className="rounded-md border border-slate-700 px-2 py-1 text-xs">
                <p className="text-slate-200">{rail.name}</p>
                <p className="text-slate-400">{rail.status_text}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Alert Feed" subtitle="Top active alerts" className="lg:col-span-1">
          <div className="space-y-2">
            {(data.alert_feed || []).map((alert: Record<string, string>) => (
              <div
                key={alert.alert_id}
                className="rounded-md border border-slate-700 bg-slate-900/75 px-3 py-2"
                title={alert.occurred_at ? new Date(alert.occurred_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : undefined}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-200">{alert.title}</p>
                  <StatusBadge status={alert.severity === 'CRITICAL' ? 'RED' : alert.severity === 'HIGH' ? 'AMBER' : 'BLUE'} text={alert.severity} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{alert.description}</p>
                <p className="mt-1 text-[11px] text-slate-500">{alert.relative_time}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="24h Volume Trend" subtitle="Dispatched vs confirmed">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={(data.volume_trend_24h || []).map((point: Record<string, unknown>) => ({
                bucket: String(point.bucket).slice(11, 16),
                dispatched: Number(point.value || 0),
                confirmed: Number(point.secondary || 0),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="dispatched" stroke="#3b82f6" fill="#3b82f633" />
                <Area type="monotone" dataKey="confirmed" stroke="#10b981" fill="#10b98133" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Confirmation by Rail" subtitle="Share of confirmed payouts">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={(data.confirmation_by_rail || []).map((entry: Record<string, unknown>) => ({ name: entry.name, value: Number(entry.value || 0) }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {(data.confirmation_by_rail || []).map((_: unknown, idx: number) => <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Money at Risk Summary" subtitle="SLA breach, correlation ambiguity, and reversals">
          <div className="space-y-2">
            {(data.money_at_risk_summary || []).map((entry: Record<string, unknown>) => (
              <div key={String(entry.name)} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2">
                <p className="text-sm text-slate-300">{String(entry.name)}</p>
                <p className="font-mono text-sm tabular-nums text-amber-200">INR {amountINR(Number(entry.value || 0))}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top Failure Reasons (Today)" subtitle="Horizontal rank by count">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart layout="vertical" data={(data.top_failure_reasons || []).map((entry: Record<string, unknown>) => ({ name: entry.name, value: Number(entry.value || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis type="category" dataKey="name" width={160} stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <Panel title="Recent Evidence Exports" subtitle="Evidence export queue and completion status">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(data.recent_evidence_exports || []).map((item: Record<string, string>) => (
            <div
              key={item.alert_id}
              className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2"
              title={item.occurred_at ? new Date(item.occurred_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : undefined}
            >
              <p className="text-sm text-slate-200">{item.title}</p>
              <p className="mt-1 text-xs text-slate-400">{item.description}</p>
              <p className="mt-1 text-[11px] text-slate-500">{item.relative_time}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Payout Flow Sankey" subtitle="Intent → Dispatch → Outcome → Recon closure">
        <div className="h-72">
          <ResponsiveContainer>
            <Sankey data={flowData} nodePadding={28} nodeWidth={12} linkCurvature={0.5} iterations={32} />
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  )
}
