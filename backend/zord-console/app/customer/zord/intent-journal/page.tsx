'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchZordIntentDetail, searchZord } from '@/services/backend'
import { amountINR, pct } from '@/services/analytics'
import { Panel } from '../_components/Panel'
import { StatusBadge } from '../_components/StatusBadge'
import { CardSkeleton } from '../_components/Skeleton'
import { ExportMenu } from '../_components/ExportMenu'
import { useZordSession } from '../_components/useZordSession'

function IntentJournalPageContent() {
  const params = useSearchParams()
  const { tenantId } = useZordSession()

  const initialIntentId = params.get('intent_id') || ''
  const [query, setQuery] = useState(initialIntentId)
  const [results, setResults] = useState<Array<{ id: string; display: string; matched_on: string }>>([])
  const [selectedIntentId, setSelectedIntentId] = useState(initialIntentId)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await searchZord(tenantId, query, 10)
        setResults(response.items || [])
      } catch {
        setResults([])
      }
    }, 130)

    return () => clearTimeout(timeout)
  }, [query, tenantId])

  useEffect(() => {
    if (!selectedIntentId) {
      setDetail(null)
      return
    }

    let disposed = false
    async function loadDetail() {
      try {
        setLoading(true)
        setError(null)
        const payload = await fetchZordIntentDetail(tenantId, selectedIntentId)
        if (disposed) return
        setDetail(payload)
      } catch (err) {
        if (disposed) return
        setError(err instanceof Error ? err.message : 'Request failed')
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    void loadDetail()
    return () => {
      disposed = true
    }
  }, [selectedIntentId, tenantId])

  const timelineRows = useMemo(
    () => ((detail?.lifecycle_timeline as Array<Record<string, unknown>>) || []),
    [detail],
  )

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[var(--font-zord-heading)] text-2xl text-slate-100">Intent Journal & LLM Explainability</h1>
        <p className="text-sm text-slate-400">Search intent, UTR, envelope, or seller and inspect complete lifecycle evidence with explainability confidence.</p>
      </header>

      <Panel title="Intent Search" subtitle="Target: under 200ms for escalation workflows">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by intent_id, envelope_id, client_reference_id, UTR, seller_id"
              className="h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-blue-500"
            />
            {results.length > 0 ? (
              <div className="mt-2 max-h-56 overflow-auto rounded-md border border-slate-700 bg-slate-900 p-1">
                {results.map((item) => (
                  <button
                    type="button"
                    key={`${item.id}-${item.matched_on}`}
                    onClick={() => {
                      setSelectedIntentId(item.id)
                      setQuery(item.id)
                    }}
                    className="mb-1 w-full rounded-md border border-transparent px-3 py-2 text-left hover:border-slate-700 hover:bg-slate-800"
                  >
                    <p className="font-mono text-xs text-slate-200">{item.display}</p>
                    <p className="text-[11px] text-slate-400">Matched on {item.matched_on}</p>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setSelectedIntentId(query.trim())}
            className="h-10 rounded-md border border-blue-600 bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500"
          >
            Open Intent
          </button>
        </div>
      </Panel>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => <CardSkeleton key={idx} />)}
        </div>
      ) : null}

      {error ? <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">Unable to load intent detail: {error}</p> : null}

      {detail ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-4">
              <p className="text-xs text-slate-400">Intent ID</p>
              <p className="mt-2 font-mono text-xs text-slate-100">{String(detail.intent_id)}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-4">
              <p className="text-xs text-slate-400">Current State</p>
              <p className="mt-2 text-sm text-slate-100">{String(detail.current_state)}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-4">
              <p className="text-xs text-slate-400">Amount</p>
              <p className="mt-2 font-mono text-sm tabular-nums text-slate-100">INR {amountINR(Number(detail.amount || 0))}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-4">
              <p className="text-xs text-slate-400">Explanation Confidence</p>
              <div className="mt-2"><StatusBadge status="BLUE" text={String(detail.explanation_confidence_badge)} /></div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel title="Payment Lifecycle Timeline" subtitle="Intent → Governance → Dispatch → PSP → Recon">
              <div className="space-y-2">
                {timelineRows.map((row) => (
                  <div key={`${String(row.stage)}-${String(row.occurred_at)}`} className="rounded-md border border-slate-700 bg-slate-900/75 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-200">{String(row.stage)}</p>
                      <StatusBadge status={String(row.status) === 'FAILED' ? 'FAILED' : 'SUCCESS'} text={String(row.status)} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{String(row.occurred_at)} • delta {Number(row.delta_from_ms || 0)}ms • {String(row.source)}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="LLM Explanation" subtitle="Terminal-state explainability context">
              <p className="text-sm leading-relaxed text-slate-200">{String(detail.llm_explanation || '')}</p>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                <div className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                  <p className="text-xs text-slate-400">Reconciliation Confidence</p>
                  <p className="font-mono text-sm text-slate-100">{pct(Number(detail.reconciliation_confidence || 0))}</p>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                  <p className="text-xs text-slate-400">Routing Efficiency Score</p>
                  <p className="font-mono text-sm text-slate-100">{Number(detail.routing_efficiency_score || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                  <p className="text-xs text-slate-400">PSP Health Score</p>
                  <p className="font-mono text-sm text-slate-100">{Number(detail.psp_health_score || 0).toFixed(2)}</p>
                </div>
              </div>
            </Panel>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel
              title="Canonical Intent Inspector"
              subtitle="PII-masked canonical JSON"
              right={
                <ExportMenu
                  filename={`canonical-intent-${String(detail.intent_id || 'intent')}`}
                  title="Canonical Intent"
                  rows={[detail.canonical_intent_json as Record<string, unknown>]}
                />
              }
            >
              <pre className="max-h-72 overflow-auto rounded-md border border-slate-700 bg-slate-900/80 p-3 text-xs text-slate-200">
                {JSON.stringify(detail.canonical_intent_json || {}, null, 2)}
              </pre>
            </Panel>

            <Panel
              title="Governance Decision Log"
              subtitle="Rule and policy outcomes"
              right={<ExportMenu filename="governance-log" title="Governance Log" rows={(detail.governance_decision_log as Array<Record<string, unknown>>) || []} />}
            >
              <div className="space-y-2">
                {((detail.governance_decision_log as Array<Record<string, unknown>>) || []).map((row) => (
                  <div key={`${String(row.decision)}-${String(row.at)}`} className="rounded-md border border-slate-700 bg-slate-900/75 px-3 py-2">
                    <p className="text-sm text-slate-200">{String(row.decision)} • {String(row.reason_code)}</p>
                    <p className="mt-1 text-xs text-slate-400">{String(row.at)}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel
              title="Signal Detail Viewer"
              subtitle="Source, hashes, UTR correlation, signatures"
              right={<ExportMenu filename="signal-detail" title="Signal Detail Viewer" rows={(detail.signal_detail_viewer as Array<Record<string, unknown>>) || []} />}
            >
              <div className="space-y-2">
                {((detail.signal_detail_viewer as Array<Record<string, unknown>>) || []).map((signal) => (
                  <div key={`${String(signal.source)}-${String(signal.hash)}`} className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                    <p className="text-sm text-slate-200">{String(signal.source)}</p>
                    <p className="mt-1 font-mono text-xs text-slate-400">UTR: {String(signal.utr)}</p>
                    <p className="font-mono text-xs text-slate-400">Hash: {String(signal.hash)}</p>
                    <p className="text-xs text-slate-400">Confidence: {String(signal.confidence)}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="Dispatch Attempt Chain"
              subtitle="Multi-attempt PSP execution record"
              right={<ExportMenu filename="dispatch-attempt-chain" title="Dispatch Attempt Chain" rows={(detail.dispatch_attempt_chain as Array<Record<string, unknown>>) || []} />}
            >
              <div className="space-y-2">
                {((detail.dispatch_attempt_chain as Array<Record<string, unknown>>) || []).map((attempt) => (
                  <div key={`${String(attempt.attempt)}-${String(attempt.occurred_at)}`} className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
                    <p className="text-sm text-slate-200">Attempt {String(attempt.attempt)} • {String(attempt.psp)} • {String(attempt.rail)}</p>
                    <p className="mt-1 text-xs text-slate-400">{String(attempt.status)} • {Number(attempt.latency_ms || 0)}ms • {String(attempt.occurred_at)}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel
              title="Evidence Pack Status"
              subtitle="Export and defense readiness"
              right={<ExportMenu filename="evidence-status" title="Evidence Pack Status" rows={[{ evidence_pack_status: detail.evidence_pack_status }]} />}
            >
              <div className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-3">
                <p className="text-sm text-slate-200">Status: {String(detail.evidence_pack_status)}</p>
                <p className="mt-1 text-xs text-slate-400">Every evidence widget supports CSV/PDF/JSON export for compliance and legal handoffs.</p>
              </div>
            </Panel>

            <Panel title="Zord Internal Log" subtitle="Engineering-only raw trace">
              <pre className="max-h-56 overflow-auto rounded-md border border-slate-700 bg-slate-900/80 p-3 font-mono text-xs text-slate-300">
                {((detail.zord_internal_log as string[]) || []).join('\n')}
              </pre>
            </Panel>
          </section>
        </>
      ) : null}
    </div>
  )
}

export default function IntentJournalPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <header>
            <h1 className="font-[var(--font-zord-heading)] text-2xl text-slate-100">Intent Journal & LLM Explainability</h1>
            <p className="text-sm text-slate-400">Loading intent data...</p>
          </header>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            Preparing search parameters and evidence timeline...
          </div>
        </div>
      }
    >
      <IntentJournalPageContent />
    </Suspense>
  )
}
