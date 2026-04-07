'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchZordReconciliation } from '@/services/backend'
import { amountINR, pct } from '@/services/analytics'
import { CardSkeleton } from '../_components/Skeleton'
import { KpiCard } from '../_components/KpiCard'
import { Panel } from '../_components/Panel'
import { ExportMenu } from '../_components/ExportMenu'
import { HeatmapGrid } from '../_components/HeatmapGrid'
import { useZordApi } from '../_components/useZordApi'
import { useZordSession } from '../_components/useZordSession'

export default function ReconciliationIntelligencePage() {
  const { tenantId } = useZordSession()
  const { data, loading, error } = useZordApi(() => fetchZordReconciliation(tenantId, '24h'), [tenantId], { pollMs: 45_000 })

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => <CardSkeleton key={idx} />)}
      </div>
    )
  }

  if (!data || error) {
    return <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">Unable to load reconciliation intelligence: {error || 'unknown error'}</p>
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[var(--font-zord-heading)] text-2xl text-slate-100">Reconciliation Intelligence</h1>
        <p className="text-sm text-slate-400">Prove coverage, confidence, and closure timing across webhook, polling, and bank statement signals.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Recon Closure Rate" value={pct(Number(data.recon_closure_rate || 0))} href="/customer/zord/reconciliation-intelligence?focus=closure" tone="emerald" />
        <KpiCard title="Full 3-Signal Coverage" value={pct(Number(data.full_3_signal_coverage_pct || 0))} href="/customer/zord/reconciliation-intelligence?focus=coverage" tone="blue" />
        <KpiCard title="Avg Time to PROVISIONAL" value={`${Number(data.avg_time_to_provisional_minutes || 0).toFixed(2)}m`} href="/customer/zord/reconciliation-intelligence?focus=timeline" tone="amber" />
        <KpiCard title="Avg Time to CONFIRMED" value={`${Number(data.avg_time_to_confirmed_minutes || 0).toFixed(2)}m`} href="/customer/zord/reconciliation-intelligence?focus=timeline" tone="slate" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Signal Coverage Matrix" subtitle="Intent vs signal source heat grid">
          <HeatmapGrid
            titleX="Intent"
            titleY="Source"
            cells={(data.signal_coverage_matrix || []).slice(0, 90).map((cell: Record<string, unknown>) => ({
              x: String(cell.x).slice(-8),
              y: String(cell.y),
              value: Number(cell.value || 0),
            }))}
          />
        </Panel>

        <Panel title="Confidence Distribution" subtitle="Histogram of reconciliation confidence scores">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={(data.confidence_distribution || []).map((entry: Record<string, unknown>) => ({ label: entry.label, count: Number(entry.count || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Open Recon Items"
          subtitle="Prioritized by amount and time since dispatch"
          right={<ExportMenu filename="open-recon-items" title="Open Recon Items" rows={(data.open_recon_items || []) as Array<Record<string, unknown>>} />}
        >
          <div className="max-h-64 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2">Intent</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Missing</th>
                  <th className="px-2 py-2">Since Dispatch</th>
                </tr>
              </thead>
              <tbody>
                {(data.open_recon_items || []).map((row: Record<string, unknown>) => (
                  <tr key={String(row.intent_id)} className="border-b border-slate-800">
                    <td className="px-2 py-2 font-mono text-xs text-slate-300">{String(row.intent_id)}</td>
                    <td className="px-2 py-2 font-mono text-slate-100">INR {amountINR(Number(row.amount || 0))}</td>
                    <td className="px-2 py-2 text-slate-300">{String(row.missing_signals)}</td>
                    <td className="px-2 py-2 text-slate-300">{Number(row.time_since_dispatch_m || 0).toFixed(1)}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Recon Closure by Hour" subtitle="Auto-close plus manual interventions">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={(data.closure_by_hour || []).map((entry: Record<string, unknown>) => ({ bucket: String(entry.bucket).slice(11, 16), value: Number(entry.value || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b98133" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Amount Variance Report"
          subtitle="Intended vs settled and cross-period flags"
          right={<ExportMenu filename="amount-variance-report" title="Amount Variance Report" rows={(data.amount_variance_report || []) as Array<Record<string, unknown>>} />}
        >
          <div className="max-h-64 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2">Intent</th>
                  <th className="px-2 py-2">Intended</th>
                  <th className="px-2 py-2">Settled</th>
                  <th className="px-2 py-2">Variance</th>
                  <th className="px-2 py-2">Cross Period</th>
                </tr>
              </thead>
              <tbody>
                {(data.amount_variance_report || []).map((row: Record<string, unknown>) => (
                  <tr key={String(row.intent_id)} className="border-b border-slate-800">
                    <td className="px-2 py-2 font-mono text-xs text-slate-300">{String(row.intent_id)}</td>
                    <td className="px-2 py-2 font-mono text-slate-100">{amountINR(Number(row.intended || 0))}</td>
                    <td className="px-2 py-2 font-mono text-slate-100">{amountINR(Number(row.settled || 0))}</td>
                    <td className="px-2 py-2 font-mono text-red-200">{amountINR(Number(row.variance || 0))}</td>
                    <td className="px-2 py-2 text-slate-300">{Boolean(row.cross_period) ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Auto-Close vs Manual-Close" subtitle="Closure mode split and trend">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={(data.auto_vs_manual_closure || []).map((entry: Record<string, unknown>) => ({ name: entry.name, value: Number(entry.value || 0) }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={46}
                    outerRadius={74}
                    fill="#3b82f6"
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {(data.auto_vs_manual_closure || []).map((entry: Record<string, unknown>) => (
                <div key={String(entry.name)} className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                  <p className="text-xs text-slate-400">{String(entry.name)}</p>
                  <p className="font-mono text-base text-slate-100">{pct(Number(entry.value || 0))}</p>
                </div>
              ))}

              <div className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-300">
                Statement Parser Health: <span className="font-mono text-slate-100">{String(data.statement_parser_health || 'UNKNOWN')}</span>
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <Panel
        title="Cross-Period Transaction Flags"
        subtitle="Transactions settling outside intended period boundaries"
        right={<ExportMenu filename="cross-period-flags" title="Cross Period Flags" rows={(data.cross_period_flags || []) as Array<Record<string, unknown>>} />}
      >
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(data.cross_period_flags || []).length ? (
            (data.cross_period_flags || []).map((row: Record<string, unknown>) => (
              <div key={String(row.intent_id)} className="rounded-md border border-amber-700/60 bg-amber-950/20 px-3 py-2">
                <p className="font-mono text-xs text-amber-200">{String(row.intent_id)}</p>
                <p className="mt-1 text-xs text-amber-100">Variance INR {amountINR(Number(row.variance || 0))}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No cross-period flags in selected window.</p>
          )}
        </div>
      </Panel>
    </div>
  )
}
