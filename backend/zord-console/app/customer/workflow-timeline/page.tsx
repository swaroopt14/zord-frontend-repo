'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type EventNodeStatus = 'success' | 'delayed' | 'failed' | 'retry' | 'skipped' | 'warning' | 'in_progress' | 'pending'
type EventLaneId = 'ingestion' | 'validation' | 'canonical' | 'outbox' | 'ops'
type TimeRangePreset = '5m' | '15m' | '1h' | '6h' | '24h'

type WorkflowOption = {
  id: string
  label: string
  projectId: string
  projectName: string
  environment: 'production' | 'sandbox'
  contextTag: string
  inputOrigin: 'Client' | 'GitHub' | 'System' | 'Server'
  issueType: 'client error' | 'deployment' | 'compliance/data' | 'infra/server' | 'workflow anomaly'
  status: 'active' | 'running' | 'delayed' | 'degraded'
}

type EventNode = {
  id: string
  workflowId: string
  laneId: EventLaneId
  name: string
  status: EventNodeStatus
  timestampMs: number
  durationMs?: number
  details: Record<string, unknown>
  dependsOn?: string[]
  error?: { code: string; message: string; recovery?: string }
}

const STATUS_CONFIG: Record<
  EventNodeStatus,
  { label: string; color: string; bg: string; confidence: number; icon: 'check' | 'warn' | 'x' | 'clock' | 'retry' | 'minus' }
> = {
  success: { label: 'Success', color: '#10b981', bg: 'rgba(16,185,129,0.14)', confidence: 96, icon: 'check' },
  delayed: { label: 'Delayed', color: '#f59e0b', bg: 'rgba(245,158,11,0.14)', confidence: 62, icon: 'clock' },
  failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.14)', confidence: 10, icon: 'x' },
  retry: { label: 'Retry', color: '#06b6d4', bg: 'rgba(6,182,212,0.14)', confidence: 55, icon: 'retry' },
  skipped: { label: 'Skipped', color: '#94a3b8', bg: 'rgba(148,163,184,0.22)', confidence: 0, icon: 'minus' },
  warning: { label: 'Warning', color: '#f97316', bg: 'rgba(249,115,22,0.14)', confidence: 72, icon: 'warn' },
  in_progress: { label: 'In Progress', color: '#3b82f6', bg: 'rgba(59,130,246,0.14)', confidence: 50, icon: 'clock' },
  pending: { label: 'Pending', color: '#94a3b8', bg: 'rgba(148,163,184,0.22)', confidence: 40, icon: 'clock' },
}

const LANE_CONFIG: Record<EventLaneId, { label: string; color: string }> = {
  ingestion: { label: 'Ingress', color: '#3b82f6' },
  validation: { label: 'Validation', color: '#8b5cf6' },
  canonical: { label: 'Canonical', color: '#14b8a6' },
  outbox: { label: 'Outbox', color: '#f59e0b' },
  ops: { label: 'Ops / Alerts', color: '#ef4444' },
}

const TIME_PRESETS: { value: TimeRangePreset; label: string; ms: number }[] = [
  { value: '5m', label: '5m', ms: 5 * 60 * 1000 },
  { value: '15m', label: '15m', ms: 15 * 60 * 1000 },
  { value: '1h', label: '1h', ms: 60 * 60 * 1000 },
  { value: '6h', label: '6h', ms: 6 * 60 * 60 * 1000 },
  { value: '24h', label: '24h', ms: 24 * 60 * 60 * 1000 },
]

const WORKFLOWS: WorkflowOption[] = [
  {
    id: 'wf_onboarding_17',
    label: 'User Onboarding',
    projectId: 'proj_customer_onboarding',
    projectName: 'Customer Onboarding Platform',
    environment: 'production',
    contextTag: 'new update',
    inputOrigin: 'Client',
    issueType: 'client error',
    status: 'running',
  },
  {
    id: 'wf_deployment_03',
    label: 'Service Deployment',
    projectId: 'proj_platform_release',
    projectName: 'Platform Release Engineering',
    environment: 'production',
    contextTag: 'deployment workflow',
    inputOrigin: 'GitHub',
    issueType: 'deployment',
    status: 'delayed',
  },
  {
    id: 'wf_policy_compliance_monitoring',
    label: 'Policy Compliance Monitoring',
    projectId: 'proj_compliance',
    projectName: 'Governance & Compliance',
    environment: 'production',
    contextTag: 'compliance governance',
    inputOrigin: 'System',
    issueType: 'compliance/data',
    status: 'active',
  },
  {
    id: 'wf_security_posture_assessment',
    label: 'Security Posture Assessment',
    projectId: 'proj_secops',
    projectName: 'Security Operations',
    environment: 'production',
    contextTag: 'security posture',
    inputOrigin: 'System',
    issueType: 'compliance/data',
    status: 'active',
  },
  {
    id: 'wf_resource_utilization_cost_optimization',
    label: 'Resource Utilization & Cost Optimization',
    projectId: 'proj_infra_efficiency',
    projectName: 'Infrastructure Efficiency',
    environment: 'production',
    contextTag: 'resource cost',
    inputOrigin: 'Server',
    issueType: 'infra/server',
    status: 'active',
  },
  {
    id: 'wf_change_risk_analysis',
    label: 'Change Risk Analysis',
    projectId: 'proj_release_risk',
    projectName: 'Release Engineering',
    environment: 'production',
    contextTag: 'change risk',
    inputOrigin: 'GitHub',
    issueType: 'deployment',
    status: 'active',
  },
  {
    id: 'wf_incident_response_alert_correlation',
    label: 'Incident Response & Alert Correlation',
    projectId: 'proj_incident_ops',
    projectName: 'SRE Incident Management',
    environment: 'production',
    contextTag: 'incident management',
    inputOrigin: 'Server',
    issueType: 'infra/server',
    status: 'active',
  },
  {
    id: 'wf_api_service_performance_monitoring',
    label: 'API & Service Performance Monitoring',
    projectId: 'proj_api_perf',
    projectName: 'Service Reliability',
    environment: 'production',
    contextTag: 'api performance',
    inputOrigin: 'Client',
    issueType: 'client error',
    status: 'active',
  },
]

// Mock timeline events. Keep deterministic for replayable UI screenshots.
const BASE_TS = new Date('2026-02-20T15:04:50Z').getTime()
const EVENTS: EventNode[] = [
  { id: 'wf_onboarding_17_n1', workflowId: 'wf_onboarding_17', laneId: 'ingestion', name: 'INIT', status: 'success', timestampMs: BASE_TS, durationMs: 500, details: { step: 'INIT' } },
  { id: 'wf_onboarding_17_n2', workflowId: 'wf_onboarding_17', laneId: 'validation', name: 'VALIDATE', status: 'success', timestampMs: BASE_TS + 90_000, durationMs: 3200, details: { step: 'VALIDATE', validations: 12, passed: 12 } },
  { id: 'wf_onboarding_17_n3', workflowId: 'wf_onboarding_17', laneId: 'canonical', name: 'CANONICALIZE', status: 'warning', timestampMs: BASE_TS + 155_000, durationMs: 8500, details: { step: 'CANONICALIZE', pii: 'tokenized', warnings: 1 }, dependsOn: ['wf_onboarding_17_n2'] },
  { id: 'wf_onboarding_17_n4', workflowId: 'wf_onboarding_17', laneId: 'outbox', name: 'OUTBOX', status: 'delayed', timestampMs: BASE_TS + 360_000, durationMs: 25_000, details: { step: 'OUTBOX', expected_duration_s: 12, actual_duration_s: 25 }, dependsOn: ['wf_onboarding_17_n3'], error: { code: 'SLA_BREACH_RISK', message: 'Step exceeded expected duration by 108%', recovery: 'Awaiting completion' } },
  { id: 'wf_onboarding_17_n5', workflowId: 'wf_onboarding_17', laneId: 'ops', name: 'VERIFY', status: 'in_progress', timestampMs: BASE_TS + 510_000, durationMs: 0, details: { step: 'VERIFY', checks_pending: 4 }, dependsOn: ['wf_onboarding_17_n4'] },
  { id: 'wf_onboarding_17_n6', workflowId: 'wf_onboarding_17', laneId: 'ops', name: 'NOTIFY', status: 'pending', timestampMs: BASE_TS + 600_000, durationMs: 0, details: { step: 'NOTIFY' }, dependsOn: ['wf_onboarding_17_n5'] },

  { id: 'wf_deployment_03_n1', workflowId: 'wf_deployment_03', laneId: 'ingestion', name: 'INIT', status: 'success', timestampMs: BASE_TS + 10_000, durationMs: 1200, details: { step: 'INIT' } },
  { id: 'wf_deployment_03_n2', workflowId: 'wf_deployment_03', laneId: 'validation', name: 'POLICY', status: 'success', timestampMs: BASE_TS + 55_000, durationMs: 900, details: { policy: 'DEPLOY_APPROVAL', result: 'PASSED' } },
  { id: 'wf_deployment_03_n3', workflowId: 'wf_deployment_03', laneId: 'outbox', name: 'DEPLOY', status: 'delayed', timestampMs: BASE_TS + 180_000, durationMs: 250_000, details: { step: 'DEPLOY' }, error: { code: 'SLA_BREACH_RISK', message: 'Deploy running longer than expected' }, dependsOn: ['wf_deployment_03_n2'] },
  { id: 'wf_deployment_03_n4', workflowId: 'wf_deployment_03', laneId: 'ops', name: 'ROLLBACK', status: 'retry', timestampMs: BASE_TS + 520_000, durationMs: 45_000, details: { attempt: 2, max_attempts: 3 }, dependsOn: ['wf_deployment_03_n3'] },
]

function formatTimeLabel(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

function getConfidence(n: EventNode): number {
  return STATUS_CONFIG[n.status]?.confidence ?? 50
}

function statusDotClass(status: WorkflowOption['status']): string {
  if (status === 'delayed' || status === 'degraded') return 'bg-amber-500'
  if (status === 'running' || status === 'active') return 'bg-emerald-500'
  return 'bg-slate-400'
}

function chipBg(kind: 'env' | 'ctx' | 'origin' | 'issue' | 'status'): string {
  if (kind === 'env') return 'bg-indigo-50 text-indigo-700 border-indigo-100'
  if (kind === 'ctx') return 'bg-amber-50 text-amber-800 border-amber-100'
  if (kind === 'origin') return 'bg-slate-50 text-slate-700 border-slate-200'
  if (kind === 'issue') return 'bg-rose-50 text-rose-800 border-rose-100'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function MiniIcon({ kind }: { kind: 'check' | 'warn' | 'x' | 'clock' | 'retry' | 'minus' }) {
  const common = { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 }
  if (kind === 'check') {
    return (
      <svg {...common} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
      </svg>
    )
  }
  if (kind === 'warn') {
    return (
      <svg {...common} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.1 14.04A2 2 0 004 21h16a2 2 0 001.81-3.1l-8.1-14.04a2 2 0 00-3.42 0z" />
      </svg>
    )
  }
  if (kind === 'x') {
    return (
      <svg {...common} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }
  if (kind === 'retry') {
    return (
      <svg {...common} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M20 8a8 8 0 10-2.34 5.66" />
      </svg>
    )
  }
  if (kind === 'minus') {
    return (
      <svg {...common} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      </svg>
    )
  }
  return (
    <svg {...common} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  )
}

function Donut({ value, color }: { value: number; color: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center"
      style={{
        background: `conic-gradient(${color} ${v}%, rgba(148,163,184,0.25) 0)`,
      }}
    >
      <div className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center">
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {v}
        </span>
      </div>
    </div>
  )
}

function TimelineCanvas({
  nodes,
  visibleLanes,
  zoom,
  selectedNodeId,
  onSelect,
  startTime,
  endTime,
}: {
  nodes: EventNode[]
  visibleLanes: Set<EventLaneId>
  zoom: number
  selectedNodeId: string | null
  onSelect: (n: EventNode | null) => void
  startTime: number
  endTime: number
}) {
  const visibleNodes = useMemo(() => nodes.filter((n) => visibleLanes.has(n.laneId)), [nodes, visibleLanes])
  const sorted = useMemo(() => [...visibleNodes].sort((a, b) => a.timestampMs - b.timestampMs), [visibleNodes])
  const totalMs = Math.max(1, endTime - startTime)

  const PAD_X = 2
  const PAD_TOP = 6
  const PAD_BOTTOM = 6

  const toX = (ts: number) => PAD_X + ((ts - startTime) / totalMs) * (100 - PAD_X * 2)
  const toY = (conf: number) => PAD_TOP + ((100 - conf) / 100) * (100 - PAD_TOP - PAD_BOTTOM)

  const GRID_COLS = 8

  const linePoints = useMemo(() => {
    if (sorted.length < 2) return ''
    return sorted.map((n) => `${toX(n.timestampMs)},${toY(getConfidence(n))}`).join(' ')
  }, [sorted, startTime, endTime])

  const fillPoints = useMemo(() => {
    if (sorted.length < 2) return ''
    const first = toX(sorted[0].timestampMs)
    const last = toX(sorted[sorted.length - 1].timestampMs)
    const bottom = PAD_TOP + (100 - PAD_TOP - PAD_BOTTOM)
    return `${first},${bottom} ${linePoints} ${last},${bottom}`
  }, [sorted, linePoints])

  return (
    <div className="h-full flex flex-col" style={{ minWidth: `${zoom}%` }}>
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white px-5 py-3">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm font-semibold text-cx-purple-700">Confidence</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-cx-neutral">UTC</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-cx-neutral">
          <span className="font-mono tabular-nums">{formatTimeLabel(startTime)}</span>
          <span className="text-slate-400">→</span>
          <span className="font-mono tabular-nums">{formatTimeLabel(endTime)}</span>
          <span className="ml-2 text-cx-neutral">({Math.round((endTime - startTime) / 60000)}m)</span>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="w-14 flex flex-col justify-between py-4 pr-2 text-right border-r border-gray-100 bg-slate-50/50">
          {[100, 75, 50, 25, 0].map((val) => (
            <span key={val} className="text-[10px] font-mono tabular-nums text-cx-neutral">
              {val}%
            </span>
          ))}
        </div>

        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-[30] bg-gradient-to-b from-emerald-50/40 to-transparent" />
            <div className="flex-[20] bg-gradient-to-b from-transparent to-amber-50/30" />
            <div className="flex-[20] bg-gradient-to-b from-amber-50/30 to-orange-50/30" />
            <div className="flex-[30] bg-gradient-to-b from-orange-50/30 to-red-50/40" />
          </div>

          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1="0"
                y1={`${(i / 5) * 100}%`}
                x2="100%"
                y2={`${(i / 5) * 100}%`}
                stroke="#e2e8f0"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
                strokeDasharray={i === 0 || i === 5 ? '0' : '4 4'}
              />
            ))}
            {Array.from({ length: GRID_COLS + 1 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={`${(i / GRID_COLS) * 100}%`}
                y1="0"
                x2={`${(i / GRID_COLS) * 100}%`}
                y2="100%"
                stroke="#e2e8f0"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="4 4"
              />
            ))}
          </svg>

          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="confidence-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(124, 58, 237, 0.22)" />
                <stop offset="100%" stopColor="rgba(124, 58, 237, 0)" />
              </linearGradient>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            {fillPoints ? <polygon fill="url(#confidence-gradient)" points={fillPoints} /> : null}
            {linePoints ? (
              <polyline
                fill="none"
                stroke="url(#line-gradient)"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={linePoints}
              />
            ) : null}
          </svg>

          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {visibleNodes
              .filter((n) => (n.dependsOn || []).length > 0)
              .flatMap((node) =>
                (node.dependsOn || []).map((depId) => {
                  const dep = visibleNodes.find((n) => n.id === depId)
                  if (!dep) return null
                  const x1 = toX(dep.timestampMs)
                  const y1 = toY(getConfidence(dep))
                  const x2 = toX(node.timestampMs)
                  const y2 = toY(getConfidence(node))
                  return (
                    <line
                      key={`${depId}-${node.id}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#cbd5e1"
                      strokeWidth="0.3"
                      strokeDasharray="2 2"
                      vectorEffect="non-scaling-stroke"
                    />
                  )
                })
              )}
          </svg>

          {visibleNodes.map((node) => {
            const leftPercent = toX(node.timestampMs)
            const conf = getConfidence(node)
            const topPercent = toY(conf)
            const isSelected = selectedNodeId === node.id
            const cfg = STATUS_CONFIG[node.status]
            const laneCfg = LANE_CONFIG[node.laneId]
            return (
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
              >
                <button
                  onClick={() => onSelect(isSelected ? null : node)}
                  className={`flex flex-col items-center gap-1 transition-all duration-200 group focus:outline-none ${
                    isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                  }`}
                  title={`${node.name} — ${cfg.label} (${conf}%)`}
                >
                  <div
                    className={`relative flex items-center justify-center text-white shadow-lg transition-transform ${
                      isSelected ? 'w-8 h-8 rounded-xl' : 'w-6 h-6 rounded-lg'
                    }`}
                    style={{
                      backgroundColor: cfg.color,
                      boxShadow: isSelected ? `0 0 16px ${cfg.color}60` : undefined,
                    }}
                  >
                    <MiniIcon kind={cfg.icon} />
                    <div
                      className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: laneCfg.color }}
                    />
                  </div>
                  <span
                    className={`text-[9px] font-semibold max-w-[70px] truncate text-center transition-opacity ${
                      isSelected ? 'opacity-100 text-cx-text' : 'opacity-0 group-hover:opacity-100 text-cx-neutral'
                    }`}
                  >
                    {node.name}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex border-t border-gray-100 bg-slate-50/50">
        <div className="w-14" />
        <div className="flex-1 flex justify-between px-2 py-2">
          {Array.from({ length: GRID_COLS + 1 }).map((_, i) => {
            const ms = startTime + (totalMs / GRID_COLS) * i
            return (
              <span key={i} className="text-[10px] font-mono tabular-nums text-cx-neutral">
                {formatTimeLabel(ms)}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EventDetailsPanel({ node }: { node: EventNode | null }) {
  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <div className="h-8 w-8 rounded-full border-2 border-dashed border-slate-300" />
        </div>
        <p className="text-sm text-cx-neutral max-w-[240px]">No event selected. Click a node on the timeline to view details.</p>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[node.status]
  const laneCfg = LANE_CONFIG[node.laneId]
  const conf = getConfidence(node)
  const confColor = conf >= 80 ? '#10b981' : conf >= 50 ? '#f59e0b' : '#ef4444'

  const what = `${laneCfg.label}: ${node.name} is ${cfg.label.toLowerCase()}.${node.durationMs ? ` Duration ${(node.durationMs / 1000).toFixed(1)}s.` : ''}`
  const how = node.error?.message ? `Error: ${node.error.message}` : 'Source/actor context not available for this event.'

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5 space-y-4">
        <div className="p-4 rounded-xl border border-gray-100 bg-white">
          <div className="text-[10px] font-semibold text-cx-neutral uppercase tracking-wider mb-2">What Happened</div>
          <p className="text-sm text-cx-text">{what}</p>
          <div className="mt-3 text-[10px] font-semibold text-cx-neutral uppercase tracking-wider mb-2">How It Happened</div>
          <p className="text-xs text-slate-600">{how}</p>
        </div>

        <div className="p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-slate-50 to-white space-y-4">
          <div>
            <div className="text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Event</div>
            <div className="mt-0.5 text-base font-semibold text-cx-text">{node.name}</div>
            <code className="text-[10px] text-cx-neutral">{node.id}</code>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Status</div>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                <MiniIcon kind={cfg.icon} />
                {cfg.label}
              </span>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Lane</div>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: `${laneCfg.color}15`, color: laneCfg.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: laneCfg.color }} />
                {laneCfg.label}
              </span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold text-cx-neutral uppercase tracking-wider mb-2">Confidence</div>
            <div className="flex items-center gap-3">
              <Donut value={conf} color={confColor} />
              <div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: confColor }}>
                  {conf}%
                </div>
                <div className="text-[11px] text-cx-neutral">Derived from deterministic status mapping</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-cx-neutral">Timestamp (UTC)</div>
              <div className="text-xs font-mono font-semibold text-cx-text mt-0.5">{formatTimeLabel(node.timestampMs)}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-cx-neutral">Duration</div>
              <div className="text-xs font-mono font-semibold text-cx-text mt-0.5">{node.durationMs ? `${node.durationMs}ms` : '-'}</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-gray-100">
          <div className="text-[10px] font-semibold text-cx-neutral uppercase tracking-wider mb-3">Context</div>
          <pre className="text-[11px] overflow-auto max-h-72 bg-slate-50 rounded-lg p-3 border border-gray-100 font-mono text-cx-text">
{safeJson(node.details)}
          </pre>
        </div>

        {node.error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 mb-2">Error — {node.error.code}</div>
            <p className="text-xs text-rose-700">{node.error.message}</p>
            {node.error.recovery ? <p className="mt-2 text-xs text-rose-600">Recovery: {node.error.recovery}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function EventGraphLegend() {
  return (
    <div className="flex items-center justify-center gap-5 flex-wrap">
      <span className="text-xs font-semibold text-cx-neutral uppercase tracking-wider mr-2">Status</span>
      {(['success', 'delayed', 'failed', 'retry', 'warning', 'in_progress', 'pending'] as EventNodeStatus[]).map((k) => {
        const cfg = STATUS_CONFIG[k]
        return (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: cfg.color }}>
              <MiniIcon kind={cfg.icon} />
            </div>
            <span className="text-[11px] text-cx-neutral">{cfg.label}</span>
          </div>
        )
      })}
      <div className="h-4 w-px bg-gray-200 mx-2" />
      <span className="text-xs font-semibold text-cx-neutral uppercase tracking-wider mr-2">Lanes</span>
      {Object.entries(LANE_CONFIG).map(([id, cfg]) => (
        <div key={id} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
          <span className="text-[11px] text-cx-neutral">{cfg.label}</span>
        </div>
      ))}
    </div>
  )
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([safeJson(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function CustomerWorkflowTimelinePage() {
  const ALL_LANES: Set<EventLaneId> = useMemo(() => new Set(Object.keys(LANE_CONFIG) as EventLaneId[]), [])
  const [query, setQuery] = useState('')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('15m')
  const [zoom, setZoom] = useState(100)
  const [visibleLanes, setVisibleLanes] = useState<Set<EventLaneId>>(ALL_LANES)
  const [selectedNode, setSelectedNode] = useState<EventNode | null>(null)
  const [showLaneDropdown, setShowLaneDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close lane dropdown on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowLaneDropdown(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const selectedWorkflow = useMemo(() => WORKFLOWS.find((w) => w.id === selectedWorkflowId) || null, [selectedWorkflowId])

  const filteredWorkflows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return WORKFLOWS
    return WORKFLOWS.filter((w) => {
      const hay = [w.id, w.label, w.projectName, w.projectId, w.environment, w.contextTag, w.inputOrigin, w.issueType, w.status].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  const workflowNodesAll = useMemo(() => {
    if (!selectedWorkflowId) return []
    return EVENTS.filter((e) => e.workflowId === selectedWorkflowId).sort((a, b) => a.timestampMs - b.timestampMs)
  }, [selectedWorkflowId])

  const [startTime, endTime] = useMemo(() => {
    if (!workflowNodesAll.length) return [BASE_TS, BASE_TS + 1]
    return [workflowNodesAll[0].timestampMs, workflowNodesAll[workflowNodesAll.length - 1].timestampMs]
  }, [workflowNodesAll])

  const windowMs = useMemo(() => TIME_PRESETS.find((p) => p.value === timeRange)?.ms ?? TIME_PRESETS[1].ms, [timeRange])
  const rangeStart = Math.max(startTime, endTime - windowMs)

  const workflowNodes = useMemo(() => {
    return workflowNodesAll.filter((n) => n.timestampMs >= rangeStart)
  }, [workflowNodesAll, rangeStart])

  const overallConfidence = useMemo(() => {
    if (!workflowNodes.length) return 0
    const avg = Math.round(workflowNodes.reduce((acc, n) => acc + getConfidence(n), 0) / workflowNodes.length)
    return Math.max(0, Math.min(100, avg))
  }, [workflowNodes])

  const isDegraded = overallConfidence < 80
  const visibleNodeCount = useMemo(() => workflowNodes.filter((n) => visibleLanes.has(n.laneId)).length, [workflowNodes, visibleLanes])

  const toggleLane = (laneId: EventLaneId) => {
    setVisibleLanes((prev) => {
      const next = new Set(prev)
      if (next.has(laneId)) next.delete(laneId)
      else next.add(laneId)
      return next
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cx-purple-500 to-cx-purple-700 shadow-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 17h.01M17 7h.01M17 17h.01M7 7c2 1 4 3 5 5s3 3 5 5" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cx-text">Workflow Event Timeline</h1>
            <p className="text-sm text-cx-neutral mt-0.5">Visualize workflow execution, dependencies, and risk over time</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedWorkflowId ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live from backend
            </span>
          ) : null}
          <select
            value={selectedWorkflowId || ''}
            onChange={(e) => {
              const v = e.target.value || null
              setSelectedWorkflowId(v)
              setSelectedNode(null)
            }}
            className="w-[520px] max-w-[60vw] px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-cx-text focus:ring-2 focus:ring-cx-purple-500 focus:border-cx-purple-500 outline-none"
          >
            <option value="">Select Workflow...</option>
            {WORKFLOWS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id} — {w.label} [{w.contextTag}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedWorkflowId ? (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 to-white min-h-0 rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-white/70 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 3h4M12 3v6m6 6h-6m6 0a6 6 0 10-6 6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-cx-text">Workflows</h2>
                  <p className="text-sm text-slate-600">Enterprise context is modeled at ingestion: project, environment, ownership, and input origin.</p>
                  <p className="text-xs text-cx-neutral mt-1">Input origin examples: GitHub deploy triggers, client-side errors, server failures.</p>
                </div>
              </div>
              <div className="w-full max-w-sm">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-cx-text placeholder-gray-400 focus:ring-2 focus:ring-cx-purple-500 focus:border-cx-purple-500 outline-none"
                  placeholder="Search workflow, project, env, source, issue..."
                />
                <div className="mt-2 flex items-center gap-2 text-[11px] text-cx-neutral">
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {filteredWorkflows.length} shown
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {WORKFLOWS.length} total
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <div className="min-w-[980px] px-6 py-5">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white border-b border-gray-100">
                    <tr className="text-[11px] uppercase tracking-wider text-cx-neutral">
                      <th className="text-left font-semibold px-4 py-3">Workflow</th>
                      <th className="text-left font-semibold px-4 py-3">Project</th>
                      <th className="text-left font-semibold px-4 py-3">Env</th>
                      <th className="text-left font-semibold px-4 py-3">Context</th>
                      <th className="text-left font-semibold px-4 py-3">Input Origin</th>
                      <th className="text-left font-semibold px-4 py-3">Issue Type</th>
                      <th className="text-left font-semibold px-4 py-3">Status</th>
                      <th className="text-right font-semibold px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkflows.map((wf) => (
                      <tr key={wf.id} className="border-b border-gray-100 last:border-0 hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${statusDotClass(wf.status)}`} />
                            <div className="min-w-0">
                              <div className="font-semibold text-cx-text truncate">{wf.label}</div>
                              <div className="text-[11px] font-mono text-cx-neutral truncate">{wf.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-cx-text font-medium">{wf.projectName}</div>
                          <div className="text-[11px] font-mono text-cx-neutral">{wf.projectId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-1 rounded-md border ${chipBg('env')}`}>{wf.environment}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-1 rounded-md border ${chipBg('ctx')}`}>{wf.contextTag}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-1 rounded-md border ${chipBg('origin')}`}>{wf.inputOrigin}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-1 rounded-md border ${chipBg('issue')}`}>{wf.issueType}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-1 rounded-md border ${chipBg('status')}`}>{wf.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedWorkflowId(wf.id)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-cx-purple-600 text-white hover:bg-cx-purple-700 transition-colors"
                          >
                            View Timeline <span aria-hidden>→</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredWorkflows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-cx-neutral">
                          No workflows match this search.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-cx-neutral flex items-start gap-2">
                <span className="text-cx-purple-600 font-bold mt-0.5">⚡</span>
                <p>
                  Selecting a row opens the timeline graph and evidence panel. The selected workflow view is designed for deterministic replay visibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-5 p-3 bg-white rounded-xl border border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Time</span>
              <div className="flex rounded-lg border border-gray-200 bg-slate-50 p-0.5">
                {TIME_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setTimeRange(p.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      timeRange === p.value ? 'bg-white text-cx-text shadow-sm border border-gray-200' : 'text-cx-neutral hover:text-cx-text'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Zoom</span>
              <input
                type="range"
                min={50}
                max={200}
                step={10}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-28 accent-cx-purple-600"
              />
              <span className="text-xs font-mono tabular-nums text-cx-neutral w-10 text-right">{zoom}%</span>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowLaneDropdown((s) => !s)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-cx-text border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Lanes <span aria-hidden>▾</span>
              </button>
              {showLaneDropdown ? (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50 p-2">
                  {Object.entries(LANE_CONFIG).map(([id, cfg]) => (
                    <label key={id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={visibleLanes.has(id as EventLaneId)}
                        onChange={() => toggleLane(id as EventLaneId)}
                        className="accent-cx-purple-600"
                      />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <span className="text-cx-text">{cfg.label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {visibleNodeCount} events
              </span>
              <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                {visibleLanes.size} / {Object.keys(LANE_CONFIG).length} lanes
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-cx-text border border-gray-200 hover:bg-gray-50 transition-colors"
                onClick={() => downloadJson(`${selectedWorkflowId}-timeline.json`, { workflow: selectedWorkflow, nodes: workflowNodes })}
              >
                Export
              </button>
            </div>
          </div>

          <div className="flex-1 flex rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm min-h-0">
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-cx-purple-700">{selectedWorkflow?.label || selectedWorkflowId}</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-cx-neutral">Confidence</span>
                  <span
                    className="font-mono text-sm font-bold tabular-nums"
                    style={{ color: overallConfidence >= 80 ? '#10b981' : overallConfidence >= 50 ? '#f59e0b' : '#ef4444' }}
                  >
                    {overallConfidence}%
                  </span>
                  {isDegraded ? (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <MiniIcon kind="warn" />
                      Degraded
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-cx-neutral font-mono">
                  {formatTimeLabel(rangeStart)} → {formatTimeLabel(endTime)}
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <TimelineCanvas
                  nodes={workflowNodes}
                  visibleLanes={visibleLanes}
                  zoom={zoom}
                  selectedNodeId={selectedNode?.id || null}
                  onSelect={setSelectedNode}
                  startTime={rangeStart}
                  endTime={endTime}
                />
              </div>

              <div className="border-t border-gray-100 bg-slate-50/50 px-5 py-3">
                <EventGraphLegend />
              </div>
            </div>

            <aside className="hidden lg:block w-[380px] shrink-0 border-l border-gray-100 bg-white">
              <div className="sticky top-0 z-10 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-cx-text">Event Details</h3>
                  <p className="text-[11px] text-cx-neutral">Click a node on the timeline</p>
                </div>
                {selectedNode ? (
                  <button onClick={() => setSelectedNode(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <span className="text-cx-neutral">✕</span>
                  </button>
                ) : null}
              </div>
              <div style={{ height: 'calc(100% - 72px)' }}>
                <EventDetailsPanel node={selectedNode} />
              </div>
            </aside>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-700 font-bold">i</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-800 mb-0.5">Outcome Summary</div>
                <p className="text-sm text-amber-700">
                  Workflow experiencing delays due to cascading resource issues. Approval step was skipped under SLA pressure.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
