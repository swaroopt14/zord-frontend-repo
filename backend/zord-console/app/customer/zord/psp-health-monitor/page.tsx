'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchZordPSPHealth } from '@/services/backend'
import { pct } from '@/services/analytics'
import { CardSkeleton } from '../_components/Skeleton'
import { Panel } from '../_components/Panel'
import { StatusBadge } from '../_components/StatusBadge'
import { ExportMenu } from '../_components/ExportMenu'
import { HeatmapGrid } from '../_components/HeatmapGrid'
import { useZordApi } from '../_components/useZordApi'
import { useZordSession } from '../_components/useZordSession'

const SERIES_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7']

export default function PSPHealthMonitorPage() {
  const { tenantId } = useZordSession()
  const { data, loading, error } = useZordApi(() => fetchZordPSPHealth(tenantId, '60m'), [tenantId], { pollMs: 30_000 })

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => <CardSkeleton key={idx} />)}
      </div>
    )
  }

  if (!data || error) {
    return <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">Unable to load PSP health monitor: {error || 'unknown error'}</p>
  }

  const seriesMap = (data.error_rate_series || {}) as Record<string, Array<{ bucket: string; value: number }>>
  const pspNames = Object.keys(seriesMap)
  const mergedBuckets = new Map<string, Record<string, unknown>>()

  pspNames.forEach((psp) => {
    seriesMap[psp].forEach((point) => {
      const bucket = String(point.bucket).slice(11, 16)
      const existing = mergedBuckets.get(bucket) || { bucket }
      existing[psp] = point.value
      mergedBuckets.set(bucket, existing)
    })
  })

  const lineData = Array.from(mergedBuckets.values())

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[var(--font-zord-heading)] text-2xl text-slate-100">PSP Health Monitor</h1>
        <p className="text-sm text-slate-400">Real-time provider degradation, rail exposure, routing guidance, and reversal risk management.</p>
      </header>

      <Panel title="PSP Status Pills" subtitle="Auto-refresh every 30 seconds">
        <div className="flex flex-wrap gap-2">
          {(data.psp_status_pills || []).map((pill: Record<string, string>) => (
            <div key={pill.name} className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
              <p className="text-sm text-slate-200">{pill.name}</p>
              <div className="mt-1">
                <StatusBadge status={pill.status} text={pill.status_text} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Error Rate by PSP" subtitle="60-minute trend window">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                {pspNames.map((psp, idx) => (
                  <Line key={psp} type="monotone" dataKey={psp} stroke={SERIES_COLORS[idx % SERIES_COLORS.length]} dot={false} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="PSP Latency Heatmap" subtitle="Hour x day grid">
          <HeatmapGrid titleX="Day" titleY="Hour" cells={(data.latency_heatmap || []).map((cell: Record<string, unknown>) => ({
            x: String(cell.x),
            y: String(cell.y),
            value: Number(cell.value || 0),
          }))} />
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Webhook Delivery Rate"
          subtitle="By provider"
          right={<ExportMenu filename="webhook-delivery-rate" title="Webhook Delivery Rate" rows={(data.webhook_delivery_rate || []) as Array<Record<string, unknown>>} />}
        >
          <div className="space-y-2">
            {(data.webhook_delivery_rate || []).map((row: Record<string, unknown>) => (
              <div key={String(row.name)} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/75 px-3 py-2">
                <p className="text-sm text-slate-200">{String(row.name)}</p>
                <p className="font-mono text-sm text-slate-100">{pct(Number(row.value || 0))}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Rail Operational Status" subtitle="Operational plus next NEFT window">
          <div className="grid gap-2 md:grid-cols-2">
            {(data.rail_operational_status || []).map((rail: Record<string, string>) => (
              <div key={rail.name} className="rounded-md border border-slate-700 bg-slate-900/75 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-200">{rail.name}</p>
                  <StatusBadge status={rail.status} text={rail.status_text} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{rail.last_seen}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel
        title="PSP Performance Comparison"
        subtitle="Success, latency, fee, webhook accuracy"
        right={<ExportMenu filename="psp-performance-comparison" title="PSP Performance Comparison" rows={(data.performance_comparison || []) as Array<Record<string, unknown>>} />}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-2 py-2">PSP</th>
                <th className="px-2 py-2">Success</th>
                <th className="px-2 py-2">P95 Latency</th>
                <th className="px-2 py-2">Fee bps</th>
                <th className="px-2 py-2">Webhook Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {(data.performance_comparison || []).map((row: Record<string, unknown>) => (
                <tr key={String(row.psp)} className="border-b border-slate-800">
                  <td className="px-2 py-2 text-slate-200">{String(row.psp)}</td>
                  <td className="px-2 py-2 font-mono text-slate-100">{pct(Number(row.success_rate || 0))}</td>
                  <td className="px-2 py-2 font-mono text-slate-100">{Number(row.p95_latency_ms || 0).toFixed(0)}ms</td>
                  <td className="px-2 py-2 font-mono text-slate-100">{Number(row.fee_bps || 0).toFixed(2)}</td>
                  <td className="px-2 py-2 font-mono text-slate-100">{pct(Number(row.webhook_accuracy || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Failure Rate by Error Code per PSP"
          subtitle="Stacked failure concentration"
          right={<ExportMenu filename="failure-rate-by-code" title="Failure Rate by Error Code" rows={Object.entries((data.failure_rate_by_code_per_psp || {}) as Record<string, Array<Record<string, unknown>>>).flatMap(([psp, rows]) => rows.map((row) => ({ psp, ...row })))} />}
        >
          <div className="space-y-3">
            {Object.entries((data.failure_rate_by_code_per_psp || {}) as Record<string, Array<Record<string, unknown>>>).map(([psp, rows]) => (
              <div key={psp} className="rounded-md border border-slate-700 bg-slate-900/75 px-3 py-2">
                <p className="text-sm text-slate-200">{psp}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {rows.map((row, idx) => (
                    <span key={`${psp}-${idx}`} className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300">
                      {String(row.name)}: {Number(row.value || 0)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Routing Recommendation Engine"
          subtitle="Abstraction: Routing Efficiency Score + PSP Health Score"
          right={<ExportMenu filename="routing-recommendations" title="Routing Recommendations" rows={(data.routing_recommendations || []) as Array<Record<string, unknown>>} />}
        >
          <div className="space-y-2">
            {(data.routing_recommendations || []).map((row: Record<string, unknown>) => (
              <div key={String(row.rail)} className="rounded-md border border-slate-700 bg-slate-900/75 px-3 py-2">
                <p className="text-sm text-slate-200">{String(row.rail)} → <span className="font-semibold text-blue-300">{String(row.recommended_psp)}</span></p>
                <p className="text-xs text-slate-400">{String(row.reason)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="PSP Outage Log"
          subtitle="Timeline events"
          right={<ExportMenu filename="psp-outage-log" title="PSP Outage Log" rows={(data.outage_log || []) as Array<Record<string, unknown>>} />}
        >
          <div className="space-y-2">
            {(data.outage_log || []).length ? (
              (data.outage_log || []).map((row: Record<string, string>) => (
                <div key={row.alert_id} className="rounded-md border border-slate-700 bg-slate-900/75 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-200">{row.title}</p>
                    <StatusBadge status={row.severity === 'CRITICAL' ? 'RED' : row.severity === 'HIGH' ? 'AMBER' : 'BLUE'} text={row.severity} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{row.description}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No outages in selected window.</p>
            )}
          </div>
        </Panel>

        <Panel title="Connector Health Score" subtitle="Zord Score (0-100)">
          <div className="space-y-2">
            {(data.psp_connector_health_score || []).map((row: Record<string, unknown>) => (
              <div key={String(row.name)} className="rounded-md border border-slate-700 bg-slate-900/75 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-200">{String(row.name)}</p>
                  <p className="font-mono text-sm text-slate-100">{Number(row.value || 0).toFixed(2)}</p>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-700">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, Number(row.value || 0)))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel
        title="IMPS Reversal Risk Monitor"
        subtitle="Alerts close to near-30-minute IMPS threshold"
        right={<ExportMenu filename="imps-reversal-risk" title="IMPS Reversal Risk" rows={(data.imps_reversal_risk_monitor || []) as Array<Record<string, unknown>>} />}
      >
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(data.imps_reversal_risk_monitor || []).length ? (
            (data.imps_reversal_risk_monitor || []).map((row: Record<string, string>) => (
              <div key={row.alert_id} className="rounded-md border border-red-700/70 bg-red-950/25 px-3 py-2">
                <p className="text-sm text-red-200">{row.title}</p>
                <p className="mt-1 text-xs text-red-100">{row.description}</p>
                <p className="mt-1 text-[11px] text-red-300">{row.relative_time}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No active reversal risk alerts.</p>
          )}
        </div>
      </Panel>
    </div>
  )
}
