'use client'

import { useMemo, useState } from 'react'

type EventStatus = 'success' | 'warning' | 'failed' | 'in_progress' | 'pending'
type LaneId = 'ingestion' | 'validation' | 'canonical' | 'outbox' | 'ops'

type WorkflowOption = {
  id: string
  label: string
  project: string
  status: string
}

type TimelineEvent = {
  id: string
  workflowId: string
  laneId: LaneId
  name: string
  status: EventStatus
  timestampMs: number
  timestampIso: string
  durationMs?: number
  details: Record<string, string | number | boolean>
}

const LANES: { id: LaneId; label: string; color: string }[] = [
  { id: 'ingestion', label: 'Ingress', color: '#3b82f6' },
  { id: 'validation', label: 'Validation', color: '#8b5cf6' },
  { id: 'canonical', label: 'Canonical', color: '#14b8a6' },
  { id: 'outbox', label: 'Outbox', color: '#f59e0b' },
  { id: 'ops', label: 'Ops / Alerts', color: '#ef4444' },
]

const STATUS_STYLE: Record<EventStatus, { label: string; color: string; bg: string }> = {
  success: { label: 'Success', color: '#059669', bg: 'rgba(16,185,129,0.16)' },
  warning: { label: 'Warning', color: '#d97706', bg: 'rgba(245,158,11,0.16)' },
  failed: { label: 'Failed', color: '#dc2626', bg: 'rgba(239,68,68,0.16)' },
  in_progress: { label: 'In Progress', color: '#2563eb', bg: 'rgba(59,130,246,0.16)' },
  pending: { label: 'Pending', color: '#64748b', bg: 'rgba(148,163,184,0.22)' },
}

const WORKFLOWS: WorkflowOption[] = [
  { id: 'wf_ingest_fx_001', label: 'FX Intent Ingestion', project: 'Zord Ingestion', status: 'active' },
  { id: 'wf_ingest_payout_002', label: 'Payout Intent Ingestion', project: 'Zord Ingestion', status: 'active' },
  { id: 'wf_ingest_retry_003', label: 'Retry / Replay Processing', project: 'Zord Reliability', status: 'degraded' },
]

const BASE_TS = new Date('2026-02-20T06:30:00Z').getTime()

const EVENTS: TimelineEvent[] = [
  {
    id: 'evt_1',
    workflowId: 'wf_ingest_fx_001',
    laneId: 'ingestion',
    name: 'Raw Envelope Stored',
    status: 'success',
    timestampMs: BASE_TS + 12_000,
    timestampIso: new Date(BASE_TS + 12_000).toISOString(),
    durationMs: 180,
    details: { tenant: 'AcmePay', source: 'UPI', envelope_id: '29e090b7-00b0-4a41-97f3-8aa5ece282a8' },
  },
  {
    id: 'evt_2',
    workflowId: 'wf_ingest_fx_001',
    laneId: 'validation',
    name: 'Schema Validation',
    status: 'success',
    timestampMs: BASE_TS + 38_000,
    timestampIso: new Date(BASE_TS + 38_000).toISOString(),
    durationMs: 420,
    details: { schema: 'intent.request.v1', result: 'PASSED' },
  },
  {
    id: 'evt_3',
    workflowId: 'wf_ingest_fx_001',
    laneId: 'canonical',
    name: 'Canonical Intent Created',
    status: 'success',
    timestampMs: BASE_TS + 70_000,
    timestampIso: new Date(BASE_TS + 70_000).toISOString(),
    durationMs: 640,
    details: { intent_id: '5ec7c23c-b254-4429-bccf-77e8a0b1345b', canonical_version: 'v1' },
  },
  {
    id: 'evt_4',
    workflowId: 'wf_ingest_fx_001',
    laneId: 'outbox',
    name: 'Outbox Event Queued',
    status: 'warning',
    timestampMs: BASE_TS + 95_000,
    timestampIso: new Date(BASE_TS + 95_000).toISOString(),
    durationMs: 1300,
    details: { topic: 'z.intent.ready.v1', lag_ms: 4100 },
  },
  {
    id: 'evt_5',
    workflowId: 'wf_ingest_fx_001',
    laneId: 'ops',
    name: 'Contract Issued',
    status: 'success',
    timestampMs: BASE_TS + 131_000,
    timestampIso: new Date(BASE_TS + 131_000).toISOString(),
    durationMs: 800,
    details: { contract_id: 'cf4ddc44-42d7-41a5-b02b-a6dcd213b67d', status: 'ISSUED' },
  },
  {
    id: 'evt_6',
    workflowId: 'wf_ingest_payout_002',
    laneId: 'ingestion',
    name: 'Raw Envelope Stored',
    status: 'success',
    timestampMs: BASE_TS + 8_000,
    timestampIso: new Date(BASE_TS + 8_000).toISOString(),
    durationMs: 150,
    details: { tenant: 'AcmePay', source: 'API' },
  },
  {
    id: 'evt_7',
    workflowId: 'wf_ingest_payout_002',
    laneId: 'validation',
    name: 'Semantic Validation',
    status: 'failed',
    timestampMs: BASE_TS + 30_000,
    timestampIso: new Date(BASE_TS + 30_000).toISOString(),
    durationMs: 520,
    details: { reason_code: 'INVALID_DEADLINE', dlq: true },
  },
  {
    id: 'evt_8',
    workflowId: 'wf_ingest_payout_002',
    laneId: 'ops',
    name: 'DLQ Raised',
    status: 'failed',
    timestampMs: BASE_TS + 39_000,
    timestampIso: new Date(BASE_TS + 39_000).toISOString(),
    durationMs: 390,
    details: { dlq_id: 'dlq_91f2d', action: 'manual_review' },
  },
  {
    id: 'evt_9',
    workflowId: 'wf_ingest_retry_003',
    laneId: 'ingestion',
    name: 'Replay Accepted',
    status: 'success',
    timestampMs: BASE_TS + 15_000,
    timestampIso: new Date(BASE_TS + 15_000).toISOString(),
    durationMs: 170,
    details: { replay_id: 'rep_3321', operator: 'ops_user' },
  },
  {
    id: 'evt_10',
    workflowId: 'wf_ingest_retry_003',
    laneId: 'canonical',
    name: 'Idempotency Check',
    status: 'warning',
    timestampMs: BASE_TS + 46_000,
    timestampIso: new Date(BASE_TS + 46_000).toISOString(),
    durationMs: 900,
    details: { key: 'test-idem-001', result: 'REPLAY_OF_EXISTING_INTENT' },
  },
  {
    id: 'evt_11',
    workflowId: 'wf_ingest_retry_003',
    laneId: 'outbox',
    name: 'Outbox Publish',
    status: 'in_progress',
    timestampMs: BASE_TS + 78_000,
    timestampIso: new Date(BASE_TS + 78_000).toISOString(),
    durationMs: 0,
    details: { worker: 'relay-3', state: 'publishing' },
  },
  {
    id: 'evt_12',
    workflowId: 'wf_ingest_retry_003',
    laneId: 'ops',
    name: 'Audit Marker',
    status: 'pending',
    timestampMs: BASE_TS + 124_000,
    timestampIso: new Date(BASE_TS + 124_000).toISOString(),
    details: { status: 'awaiting_terminal_state' },
  },
]

function formatHms(tsMs: number): string {
  const d = new Date(tsMs)
  return d.toISOString().slice(11, 19)
}

export default function CustomerWorkflowTimelinePage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(WORKFLOWS[0].id)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [visibleLanes, setVisibleLanes] = useState<Set<LaneId>>(new Set(LANES.map((l) => l.id)))

  const workflowEvents = useMemo(() => {
    return EVENTS
      .filter((e) => e.workflowId === selectedWorkflowId && visibleLanes.has(e.laneId))
      .sort((a, b) => a.timestampMs - b.timestampMs)
  }, [selectedWorkflowId, visibleLanes])

  const selectedEvent = useMemo(
    () => workflowEvents.find((e) => e.id === selectedEventId) || workflowEvents[0] || null,
    [selectedEventId, workflowEvents]
  )

  const [start, end] = useMemo(() => {
    if (!workflowEvents.length) return [BASE_TS, BASE_TS + 1]
    return [workflowEvents[0].timestampMs, workflowEvents[workflowEvents.length - 1].timestampMs]
  }, [workflowEvents])

  const range = Math.max(1, end - start)

  const laneY = (laneId: LaneId): number => {
    const i = LANES.findIndex((l) => l.id === laneId)
    return i < 0 ? 0 : i * 78 + 36
  }

  const xPos = (ts: number): number => ((ts - start) / range) * 100

  const toggleLane = (id: LaneId) => {
    setVisibleLanes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cx-text">Workflow Timeline</h1>
          <p className="text-sm text-cx-neutral mt-0.5">Customer-side deterministic timeline view (mock data)</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedWorkflowId}
            onChange={(e) => {
              setSelectedWorkflowId(e.target.value)
              setSelectedEventId(null)
            }}
            className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-cx-text focus:ring-1 focus:ring-cx-purple-500 focus:border-cx-purple-500 outline-none"
          >
            {WORKFLOWS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label} ({w.project})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {LANES.map((lane) => {
          const active = visibleLanes.has(lane.id)
          return (
            <button
              key={lane.id}
              onClick={() => toggleLane(lane.id)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${active ? 'bg-white text-cx-text border-gray-300' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: lane.color }} />
              {lane.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="relative rounded-lg border border-gray-100 bg-gray-50/50 overflow-hidden" style={{ minHeight: 430 }}>
            {LANES.filter((l) => visibleLanes.has(l.id)).map((lane) => (
              <div
                key={lane.id}
                className="absolute left-0 right-0 border-b border-dashed border-gray-200"
                style={{ top: laneY(lane.id), height: 1 }}
              >
                <span className="absolute -top-3 left-2 text-[10px] font-semibold text-cx-neutral bg-gray-50 px-1">
                  {lane.label}
                </span>
              </div>
            ))}

            {workflowEvents.slice(1).map((e, idx) => {
              const prev = workflowEvents[idx]
              return (
                <div
                  key={`${prev.id}-${e.id}`}
                  className="absolute h-[2px] bg-gray-300"
                  style={{
                    left: `${xPos(prev.timestampMs)}%`,
                    top: laneY(prev.laneId),
                    width: `${Math.max(0.5, xPos(e.timestampMs) - xPos(prev.timestampMs))}%`,
                  }}
                />
              )
            })}

            {workflowEvents.map((e) => {
              const st = STATUS_STYLE[e.status]
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedEventId(e.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-lg border text-[10px] font-semibold shadow-sm"
                  style={{
                    left: `${xPos(e.timestampMs)}%`,
                    top: laneY(e.laneId),
                    color: st.color,
                    background: st.bg,
                    borderColor: selectedEvent?.id === e.id ? st.color : 'rgba(0,0,0,0.08)',
                  }}
                >
                  {e.name}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] text-cx-neutral font-mono">
            <span>{formatHms(start)}</span>
            <span>{formatHms(start + Math.floor(range * 0.25))}</span>
            <span>{formatHms(start + Math.floor(range * 0.5))}</span>
            <span>{formatHms(start + Math.floor(range * 0.75))}</span>
            <span>{formatHms(end)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-cx-text">Event Details</h2>
          {selectedEvent ? (
            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-xs text-cx-neutral">Event</p>
                <p className="text-sm font-semibold text-cx-text mt-0.5">{selectedEvent.name}</p>
                <p className="text-[11px] font-mono text-cx-neutral mt-1">{selectedEvent.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-gray-100 p-2">
                  <p className="text-cx-neutral">Lane</p>
                  <p className="font-semibold text-cx-text mt-0.5">{LANES.find((l) => l.id === selectedEvent.laneId)?.label}</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-2">
                  <p className="text-cx-neutral">Status</p>
                  <p className="font-semibold mt-0.5" style={{ color: STATUS_STYLE[selectedEvent.status].color }}>
                    {STATUS_STYLE[selectedEvent.status].label}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 p-2">
                  <p className="text-cx-neutral">Timestamp</p>
                  <p className="font-mono text-cx-text mt-0.5">{selectedEvent.timestampIso}</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-2">
                  <p className="text-cx-neutral">Duration</p>
                  <p className="font-mono text-cx-text mt-0.5">
                    {selectedEvent.durationMs ? `${selectedEvent.durationMs} ms` : '-'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-xs text-cx-neutral mb-2">Context</p>
                <pre className="text-[11px] font-mono text-cx-text bg-gray-50 p-3 rounded overflow-x-auto">
{JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-cx-neutral">No event selected.</p>
          )}
        </div>
      </div>
    </div>
  )
}
