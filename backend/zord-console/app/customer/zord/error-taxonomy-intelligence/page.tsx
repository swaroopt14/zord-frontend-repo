'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchZordErrors } from '@/services/backend'
import { pct } from '@/services/analytics'
import { CardSkeleton } from '../_components/Skeleton'
import { KpiCard } from '../_components/KpiCard'
import { Panel } from '../_components/Panel'
import { ExportMenu } from '../_components/ExportMenu'
import { HeatmapGrid } from '../_components/HeatmapGrid'
import { useZordApi } from '../_components/useZordApi'
import { useZordSession } from '../_components/useZordSession'

const CODE_COLORS = ['#f97316', '#ef4444', '#10b981', '#3b82f6', '#a855f7', '#06b6d4']

export default function ErrorTaxonomyIntelligencePage() {
  const { tenantId } = useZordSession()
  const { data, loading, error } = useZordApi(() => fetchZordErrors(tenantId, '7d'), [tenantId], { pollMs: 60_000 })

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 10 }).map((_, idx) => <CardSkeleton key={idx} />)}
      </div>
    )
  }

  if (!data || error) {
    return <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">Unable to load error intelligence: {error || 'unknown error'}</p>
  }

  const queueDepth = Number((data.exception_queue_depth || []).at(-1)?.value || 0)
  const retrySuccessAvg = (data.retry_success_rate_by_code || []).length
    ? (data.retry_success_rate_by_code || []).reduce((sum: number, entry: Record<string, unknown>) => sum + Number(entry.value || 0), 0) / (data.retry_success_rate_by_code || []).length
    : 0

  const trendSeries = (data.failure_trend_by_code || {}) as Record<string, Array<Record<string, unknown>>>
  const codeNames = Object.keys(trendSeries)
  const mergedTrend = new Map<string, Record<string, unknown>>()
  codeNames.forEach((code) => {
    trendSeries[code].forEach((point) => {
      const bucket = String(point.bucket).slice(5, 16)
      const existing = mergedTrend.get(bucket) || { bucket }
      existing[code] = Number(point.value || 0)
      mergedTrend.set(bucket, existing)
    })
  })

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[var(--font-zord-heading)] text-2xl text-slate-100">Error Taxonomy Intelligence</h1>
        <p className="text-sm text-slate-400">System-level failure analysis with taxonomy clusters, retry outcomes, and queue depth pressure.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Exception Queue Depth" value={queueDepth.toFixed(0)} href="/customer/zord/error-taxonomy-intelligence?focus=queue" tone="red" />
        <KpiCard title="Retry Success (Avg)" value={pct(retrySuccessAvg)} href="/customer/zord/error-taxonomy-intelligence?focus=retry" tone="amber" />
        <KpiCard title="Distinct Error Codes" value={codeNames.length.toString()} href="/customer/zord/error-taxonomy-intelligence?focus=codes" tone="blue" />
        <KpiCard title="Data Quality Trackers" value={`${(data.data_quality_issue_tracker || []).length}`} href="/customer/zord/error-taxonomy-intelligence?focus=data-quality" tone="slate" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Error Code Treemap"
          subtitle="Category and specific code density"
          right={<ExportMenu filename="error-code-treemap" title="Error Code Treemap" rows={(data.error_code_treemap || []) as Array<Record<string, unknown>>} />}
        >
          <div className="h-72">
            <ResponsiveContainer>
              <Treemap data={data.error_code_treemap || []} dataKey="value" stroke="#0f172a" fill="#2563eb" />
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Failure Trend by Code" subtitle="7-day multi-line pattern">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={Array.from(mergedTrend.values())}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                {codeNames.slice(0, 6).map((code, idx) => (
                  <Line key={code} type="monotone" dataKey={code} stroke={CODE_COLORS[idx % CODE_COLORS.length]} dot={false} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Failure Time Heatmap" subtitle="Hour/day concentration">
          <HeatmapGrid
            titleX="Day"
            titleY="Hour"
            cells={(data.failure_time_heatmap || []).map((cell: Record<string, unknown>) => ({
              x: String(cell.x),
              y: String(cell.y),
              value: Number(cell.value || 0),
            }))}
          />
        </Panel>

        <Panel
          title="Failure by PSP Matrix"
          subtitle="Error-code concentration by provider"
          right={<ExportMenu filename="failure-by-psp-matrix" title="Failure by PSP Matrix" rows={(data.failure_by_psp_matrix || []) as Array<Record<string, unknown>>} />}
        >
          <div className="max-h-72 overflow-auto space-y-2">
            {(data.failure_by_psp_matrix || []).map((row: Record<string, unknown>) => (
              <div key={String(row.psp)} className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                <p className="text-sm text-slate-200">{String(row.psp)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries((row.codes || {}) as Record<string, number>).map(([code, value]) => (
                    <span key={code} className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300">
                      {code}: {value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Failure by Beneficiary Bank"
          subtitle="Ranking hotspots"
          right={<ExportMenu filename="failure-by-bank" title="Failure by Beneficiary Bank" rows={(data.failure_by_bank_ranking || []) as Array<Record<string, unknown>>} />}
        >
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={(data.failure_by_bank_ranking || []).map((entry: Record<string, unknown>) => ({ name: entry.name, value: Number(entry.value || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} angle={-12} textAnchor="end" height={64} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Data Quality Issue Tracker"
          subtitle="Root cause grouped"
          right={<ExportMenu filename="data-quality-tracker" title="Data Quality Issue Tracker" rows={(data.data_quality_issue_tracker || []) as Array<Record<string, unknown>>} />}
        >
          <div className="space-y-2">
            {(data.data_quality_issue_tracker || []).map((entry: Record<string, unknown>) => (
              <div key={String(entry.root_cause)} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                <p className="text-sm text-slate-200">{String(entry.root_cause)}</p>
                <p className="font-mono text-sm text-amber-200">{Number(entry.count || 0)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Resolution Time by Error Type"
          subtitle="Mean time to resolution (minutes)"
          right={<ExportMenu filename="resolution-time-by-error" title="Resolution Time by Error Type" rows={(data.resolution_time_by_type || []) as Array<Record<string, unknown>>} />}
        >
          <div className="space-y-2">
            {(data.resolution_time_by_type || []).map((entry: Record<string, unknown>) => (
              <div key={String(entry.name)} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                <p className="text-sm text-slate-200">{String(entry.name)}</p>
                <p className="font-mono text-sm text-slate-100">{Number(entry.value || 0).toFixed(2)}m</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Retry Success Rate by Error Code"
          subtitle="Observed success after retries"
          right={<ExportMenu filename="retry-success-rate" title="Retry Success Rate" rows={(data.retry_success_rate_by_code || []) as Array<Record<string, unknown>>} />}
        >
          <div className="space-y-2">
            {(data.retry_success_rate_by_code || []).map((entry: Record<string, unknown>) => (
              <div key={String(entry.name)} className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-200">{String(entry.name)}</p>
                  <p className="font-mono text-sm text-slate-100">{pct(Number(entry.value || 0))}</p>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-700">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, Number(entry.value || 0)))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Exception Queue Depth Trend" subtitle="Backlog pressure over time">
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={(data.exception_queue_depth || []).map((entry: Record<string, unknown>) => ({ bucket: String(entry.bucket).slice(11, 16), value: Number(entry.value || 0) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  )
}
