'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchZordPayoutIntelligence } from '@/services/backend'
import { amountINR, pct } from '@/services/analytics'
import { CardSkeleton } from '../_components/Skeleton'
import { KpiCard } from '../_components/KpiCard'
import { Panel } from '../_components/Panel'
import { ExportMenu } from '../_components/ExportMenu'
import { useZordApi } from '../_components/useZordApi'
import { useZordSession } from '../_components/useZordSession'

export default function PayoutIntelligencePage() {
  const { tenantId, persona } = useZordSession()
  const { data, loading, error } = useZordApi(() => fetchZordPayoutIntelligence(tenantId, '7d'), [tenantId], { pollMs: 60_000 })

  const pageTitle = persona === 'NBFC' ? 'Disbursement Intelligence' : 'Payout Intelligence'

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 10 }).map((_, idx) => <CardSkeleton key={idx} />)}
      </div>
    )
  }

  if (!data || error) {
    return <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">Unable to load {pageTitle}: {error || 'unknown error'}</p>
  }

  const sellerRows = (data.seller_search_index || []) as Array<Record<string, unknown>>

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[var(--font-zord-heading)] text-2xl text-slate-100">{pageTitle}</h1>
        <p className="text-sm text-slate-400">Health trend, payout velocity, fee efficiency, and concentration risks across banks and IFSCs.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Success Rate This Cycle" value={pct(Number(data.cycle_success_rate || 0))} href="/customer/zord/payout-intelligence?focus=trend" tone="emerald" />
        <KpiCard title="Total Confirmed" value={`INR ${amountINR(Number(data.total_confirmed_amount || 0))}`} href="/customer/zord/payout-intelligence?focus=confirmed" tone="blue" />
        <KpiCard title="Pending Finality" value={`INR ${amountINR(Number(data.total_pending_finality || 0))}`} href="/customer/zord/reconciliation-intelligence?focus=open" tone="amber" />
        <KpiCard title="Failed + Reversed" value={`INR ${amountINR(Number(data.failed_or_reversed_amount || 0))}`} href="/customer/zord/error-taxonomy-intelligence" tone="red" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Settlement Success Trend" subtitle="7-day trend with execution markers">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={(data.settlement_success_trend || []).map((entry: Record<string, unknown>) => ({ bucket: String(entry.bucket).slice(5), value: Number(entry.value || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[80, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Payout Velocity" subtitle="Distribution of time-to-confirm (P50/P75/P95)">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={(data.payout_velocity_histogram || []).map((entry: Record<string, unknown>) => ({ label: entry.label, count: Number(entry.count || 0) }))}>
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
        <Panel title="Amount Bucket Distribution" subtitle="Value bands with success context">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={(data.amount_bucket_distribution || []).map((entry: Record<string, unknown>) => ({ label: entry.label, count: Number(entry.count || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} interval={0} angle={-14} textAnchor="end" height={56} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Payout Cost Monitor"
          subtitle="Provider fees and failed payout leakage"
          right={<ExportMenu filename="payout-cost-monitor" title="Payout Cost Monitor" rows={(data.payout_cost_monitor || []) as Array<Record<string, unknown>>} />}
        >
          <div className="space-y-2">
            {(data.payout_cost_monitor || []).map((entry: Record<string, unknown>) => (
              <div key={String(entry.name)} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                <p className="text-sm text-slate-300">{String(entry.name)}</p>
                <p className="font-mono text-sm text-slate-100">INR {amountINR(Number(entry.value || 0))}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Top Beneficiary Banks by Failure"
          subtitle="Prioritize outreach by failure concentration"
          right={<ExportMenu filename="top-beneficiary-banks" title="Top Beneficiary Banks" rows={(data.top_beneficiary_banks || []) as Array<Record<string, unknown>>} />}
        >
          <div className="space-y-2">
            {(data.top_beneficiary_banks || []).map((entry: Record<string, unknown>) => (
              <div key={String(entry.name)} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                <p className="font-mono text-xs text-slate-200">{String(entry.name)}</p>
                <p className="text-sm text-red-200">{Number(entry.value || 0)}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Top Failing IFSCs"
          subtitle="Data quality and bank/branch hotspots"
          right={<ExportMenu filename="top-failing-ifscs" title="Top Failing IFSCs" rows={(data.top_failing_ifscs || []) as Array<Record<string, unknown>>} />}
        >
          <div className="space-y-2">
            {(data.top_failing_ifscs || []).map((entry: Record<string, unknown>) => (
              <div key={String(entry.name)} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                <p className="font-mono text-xs text-slate-200">{String(entry.name)}</p>
                <p className="text-sm text-red-200">{Number(entry.value || 0)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel
        title="Multi-PSP Comparison"
        subtitle="Success, latency, fee, and webhook accuracy"
        right={<ExportMenu filename="multi-psp-comparison" title="Multi PSP Comparison" rows={(data.multi_psp_comparison || []) as Array<Record<string, unknown>>} />}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-2 py-2">PSP</th>
                <th className="px-2 py-2">Success</th>
                <th className="px-2 py-2">P95 Latency</th>
                <th className="px-2 py-2">Fee (bps)</th>
                <th className="px-2 py-2">Webhook Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {(data.multi_psp_comparison || []).map((row: Record<string, unknown>) => (
                <tr key={String(row.psp)} className="border-b border-slate-800">
                  <td className="px-2 py-2 text-slate-200">{String(row.psp)}</td>
                  <td className="px-2 py-2 font-mono tabular-nums text-slate-100">{pct(Number(row.success_rate || 0))}</td>
                  <td className="px-2 py-2 font-mono tabular-nums text-slate-100">{Math.round(Number(row.p95_latency_ms || 0))}ms</td>
                  <td className="px-2 py-2 font-mono tabular-nums text-slate-100">{Number(row.fee_bps || 0).toFixed(2)}</td>
                  <td className="px-2 py-2 font-mono tabular-nums text-slate-100">{pct(Number(row.webhook_accuracy || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Financial Recon State Breakdown" subtitle="EXACT_MATCH, DEDUCTED_SETTLEMENT and variants">
          <div className="space-y-2">
            {(data.recon_state_breakdown || []).map((entry: Record<string, unknown>) => (
              <div key={String(entry.name)} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                <p className="text-sm text-slate-300">{String(entry.name)}</p>
                <p className="font-mono text-sm text-slate-100">{Number(entry.value || 0)}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Seller / Vendor Payout Status Lookup"
          subtitle="Searchable execution index"
          right={<ExportMenu filename="seller-payout-status" title="Seller Payout Status" rows={sellerRows} />}
        >
          <div className="max-h-64 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2">Seller</th>
                  <th className="px-2 py-2">Intent</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sellerRows.map((row) => (
                  <tr key={String(row.intent_id)} className="border-b border-slate-800">
                    <td className="px-2 py-2 text-slate-200">{String(row.seller_id)}</td>
                    <td className="px-2 py-2 font-mono text-xs text-slate-300">{String(row.intent_id)}</td>
                    <td className="px-2 py-2 text-slate-200">{String(row.status)}</td>
                    <td className="px-2 py-2 font-mono text-slate-100">{String(row.amount_display)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </div>
  )
}
