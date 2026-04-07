'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { DashboardLayout } from '@/components/fintech-dashboard'

const FONT_MONO = "'IBM Plex Mono', monospace"
const NEO_BASE = '#94A7AE'
const NEO_LIGHT = '#AABFC6'
const NEO_DARK = '#7E8E94'
const NEO_INSET_LIGHT = '#AABFC6'
const NEO_INSET_DARK = '#7E8E94'
const NEO_CREAM = '#F5F8FB'
const NEO_TEXT = '#23343A'
const NEO_MUTED = '#5B6E75'
const NEO_ACTIVE = '#3D5158'
const EXECUTION_PAGE_BG = 'linear-gradient(180deg, #FCFBFA 0%, #F4F7FB 100%)'
const EXECUTION_PAGE_SPOTS =
  'radial-gradient(circle at 18% 10%, rgba(255,105,180,0.08), transparent 24%), radial-gradient(circle at 78% 8%, rgba(99,102,241,0.10), transparent 28%), radial-gradient(circle at 82% 72%, rgba(56,189,248,0.08), transparent 24%)'

type ProviderView = 'Live status' | 'Latency' | 'Errors'
type RailView = 'Scoreboard' | 'Load curve'
type RoutingView = 'Recommendations' | 'Drift watch'
type ExecutionTab = 'PSP Health Monitor' | 'Rail Performance' | 'Routing Insights'

const providerTabs: readonly ProviderView[] = ['Live status', 'Latency', 'Errors']
const railTabs: readonly RailView[] = ['Scoreboard', 'Load curve']
const routingTabs: readonly RoutingView[] = ['Recommendations', 'Drift watch']
const executionTabs: readonly ExecutionTab[] = ['PSP Health Monitor', 'Rail Performance', 'Routing Insights']

const EXECUTION_SUMMARY = [
  { label: 'Provider Uptime', value: '99.42%', note: 'Across connected PSPs in this infra window' },
  { label: 'Rail Success', value: '98.71%', note: 'Weighted by live payout volume across rails' },
  { label: 'Auto Routing Gain', value: '+2.8%', note: 'Recovered by dynamic route switching and guardrails' },
  { label: 'Bank API Volatility', value: '3 hotspots', note: 'Active clusters needing infra watch or reroute' },
] as const

const PROVIDER_ROWS = [
  { name: 'Razorpay', status: 'Healthy', errorRate: '1.9%', p95: '210 ms', webhookAccuracy: '99.4%', route: 'Primary for IMPS', health: 94, latencyScore: 90, errorScore: 18, note: 'No routing intervention needed' },
  { name: 'Cashfree', status: 'Degraded', errorRate: '5.6%', p95: '340 ms', webhookAccuracy: '98.6%', route: 'Bias to NEFT / UPI', health: 72, latencyScore: 76, errorScore: 42, note: 'Error drift rising in seller clusters' },
  { name: 'PayU', status: 'Critical', errorRate: '12.4%', p95: '4.2 s', webhookAccuracy: '94.1%', route: 'Route away on weekends', health: 38, latencyScore: 28, errorScore: 82, note: 'Timeout concentration above safe threshold' },
  { name: 'Stripe', status: 'Healthy', errorRate: '1.1%', p95: '180 ms', webhookAccuracy: '99.8%', route: 'Primary for RTGS', health: 96, latencyScore: 94, errorScore: 12, note: 'Fastest provider in this cycle' },
  { name: 'Bank APIs', status: 'Watch', errorRate: '3.8%', p95: '1.1 s', webhookAccuracy: '—', route: 'Protect with polling', health: 61, latencyScore: 54, errorScore: 47, note: 'Statement and host signals uneven' },
] as const

const EXECUTION_ALERTS = [
  { title: 'PayU degradation crossing reroute threshold', detail: 'Timeouts rose 2.3x during the last 45 minutes on IMPS-heavy sellers.', severity: 'Critical' },
  { title: 'NEFT statement lag widening', detail: 'Batch close confirmation is trailing median by 18 minutes, affecting visibility.', severity: 'High' },
  { title: 'Cashfree callback retries building up', detail: 'Webhook ack is clean, but duplicate retries are increasing parser noise.', severity: 'Medium' },
] as const

const RAIL_ROWS = [
  { rail: 'IMPS', success: '99.1%', p95: '28s', throughput: '8.4K intents', nextWindow: 'Always on', pressure: 86, posture: 'Best for urgent payout release' },
  { rail: 'NEFT', success: '97.4%', p95: '3m 18s', throughput: '3.1K intents', nextWindow: '14:30 IST batch', pressure: 54, posture: 'Stable but statement-dependent' },
  { rail: 'RTGS', success: '98.2%', p95: '1m 42s', throughput: '1.3K intents', nextWindow: 'Continuous', pressure: 38, posture: 'Strong for high-ticket controlled flows' },
  { rail: 'UPI', success: '96.8%', p95: '41s', throughput: '2.7K intents', nextWindow: 'Always on', pressure: 68, posture: 'Good recovery option when bank APIs are uneven' },
] as const

const LOAD_CURVE = [
  { hour: '08:00', dispatched: 132, confirmed: 129, saturation: 'Low', drift: '3 gap' },
  { hour: '10:00', dispatched: 168, confirmed: 162, saturation: 'Normal', drift: '6 gap' },
  { hour: '12:00', dispatched: 242, confirmed: 231, saturation: 'Peak', drift: '11 gap' },
  { hour: '14:00', dispatched: 219, confirmed: 211, saturation: 'High', drift: '8 gap' },
  { hour: '16:00', dispatched: 198, confirmed: 193, saturation: 'Normal', drift: '5 gap' },
  { hour: '18:00', dispatched: 176, confirmed: 168, saturation: 'Watch', drift: '8 gap' },
] as const

const ROUTING_ROWS = [
  { lane: 'IMPS · Razorpay', currentMix: '42%', recommendation: 'Hold primary', successLift: '+0.4%', feeDelta: '-2 bps', reason: 'Best blend of latency, success, and webhook consistency', action: 'Keep traffic steady' },
  { lane: 'IMPS · PayU', currentMix: '18%', recommendation: 'Shift to Stripe / Razorpay', successLift: '+3.1%', feeDelta: '+4 bps', reason: 'Weekend timeout cluster is widening beyond retry-safe range', action: 'Route away now' },
  { lane: 'NEFT · Cashfree', currentMix: '24%', recommendation: 'Throttle by seller risk', successLift: '+1.2%', feeDelta: '-1 bps', reason: 'Good economics, but callback duplication adds reconciliation noise', action: 'Apply seller guardrail' },
  { lane: 'RTGS · Stripe', currentMix: '11%', recommendation: 'Expand for high-ticket', successLift: '+0.8%', feeDelta: '+2 bps', reason: 'Fastest confirmation path for large-value payouts', action: 'Increase weighted share' },
  { lane: 'UPI · Cashfree', currentMix: '5%', recommendation: 'Use as recovery lane', successLift: '+1.9%', feeDelta: '+1 bps', reason: 'Useful fallback when bank APIs or NEFT windows degrade', action: 'Keep as fallback route' },
] as const

const ROUTING_INSIGHTS = [
  { label: 'Best available lane', value: 'Stripe · RTGS', note: 'Highest confidence blend for high-value disbursements' },
  { label: 'Most expensive healthy lane', value: 'Razorpay · IMPS', note: 'Still justified where release speed outweighs fee drag' },
  { label: 'Biggest avoidable loss', value: '₹3.2 L', note: 'Would burn if PayU traffic is not stepped down before evening peak' },
] as const

function HeaderPill({ children }: { children: ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-[0.18em]"
      style={{
        color: NEO_TEXT,
        background: NEO_CREAM,
        border: '1px solid rgba(255,255,255,0.24)',
        boxShadow: `6px 6px 14px ${NEO_DARK}, -6px -6px 14px ${NEO_LIGHT}`,
      }}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: NEO_TEXT }} />
      {children}
    </div>
  )
}

function UtilityPill({ children }: { children: ReactNode }) {
  return (
    <div
      className="inline-flex min-h-[48px] items-center rounded-[18px] px-4 py-3 text-[14px] font-semibold"
      style={{
        color: NEO_TEXT,
        background: NEO_CREAM,
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: `6px 6px 16px ${NEO_DARK}, -5px -5px 14px rgba(255,255,255,0.8)`,
      }}
    >
      {children}
    </div>
  )
}

function SegmentedTabs<T extends string>({
  items,
  active,
  onChange,
}: {
  items: readonly T[]
  active: T
  onChange: (item: T) => void
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-[20px] p-1.5"
      style={{
        background: NEO_BASE,
        border: '2px solid rgba(255,255,255,0.2)',
        boxShadow: '4px 4px 10px rgba(126,142,148,0.28), -4px -4px 10px rgba(255,255,255,0.76), inset 6px 6px 12px rgba(109,124,131,0.48), inset -6px -6px 12px rgba(185,206,214,0.38)',
      }}
    >
      {items.map((item) => {
        const isActive = item === active
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className="rounded-[16px] px-4 py-2.5 text-[14px] font-bold transition-all"
            style={{
              background: isActive ? NEO_CREAM : 'transparent',
              color: isActive ? NEO_TEXT : '#61757C',
              boxShadow: isActive ? '6px 6px 14px rgba(126,142,148,0.22), -4px -4px 12px rgba(255,255,255,0.8)' : 'none',
              textShadow: isActive ? '1px 1px 0 rgba(255,255,255,0.24)' : '1px 1px 0 rgba(170,191,198,0.4)',
            }}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

function ShellCard({
  title,
  subtitle,
  right,
  children,
  className = '',
}: {
  title: string
  subtitle: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[30px] p-7 ${className}`}
      style={{
        background: NEO_BASE,
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '18px 18px 36px rgba(126,142,148,0.28), -14px -14px 30px rgba(170,191,198,0.74), inset 1px 1px 0 rgba(255,255,255,0.24)',
      }}
    >
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-[28px] font-black tracking-[-0.04em] text-[#0F172A]">{title}</div>
          <div className="mt-2 max-w-[780px] text-[17px] leading-7 text-[#64748B]">{subtitle}</div>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function SummaryCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div
      className="rounded-[28px] px-6 py-6"
      style={{
        background: NEO_BASE,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '16px 16px 34px rgba(126,142,148,0.26), -12px -12px 26px rgba(170,191,198,0.72), inset 0 1px 0 rgba(255,255,255,0.24)',
      }}
    >
      <div className="text-[12px] font-black uppercase tracking-[0.18em]" style={{ color: NEO_MUTED, textShadow: '1px 1px 0 rgba(170,191,198,0.48)' }}>{label}</div>
      <div className="mt-4 text-[42px] font-black leading-none tracking-[-0.05em]" style={{ color: NEO_TEXT }}>{value}</div>
      <div className="mt-3 text-[16px] leading-7" style={{ color: NEO_MUTED }}>{note}</div>
    </div>
  )
}

function StatusChip({ tone, children }: { tone: 'healthy' | 'watch' | 'critical'; children: ReactNode }) {
  const styles =
    tone === 'healthy'
      ? { background: '#E7EFF2', border: '1px solid rgba(148,167,174,0.52)', color: NEO_ACTIVE }
      : tone === 'watch'
      ? { background: '#DBCFAC', border: '1px solid rgba(188,177,147,0.9)', color: '#5C4A2D' }
      : { background: '#7E8E94', border: '1px solid rgba(126,142,148,0.9)', color: '#F8FAFC' }

  return (
    <span className="inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold" style={styles}>
      {children}
    </span>
  )
}

function MetricBar({ value, tone = 'blue' }: { value: number; tone?: 'blue' | 'slate' }) {
  return (
    <div
      className="h-3 w-full overflow-hidden rounded-full"
      style={{
        background: NEO_BASE,
        boxShadow: `inset 4px 4px 8px ${NEO_INSET_DARK}, inset -4px -4px 8px ${NEO_INSET_LIGHT}`,
      }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          background:
            tone === 'blue'
              ? 'linear-gradient(90deg, #AABFC6 0%, #7E8E94 100%)'
              : 'linear-gradient(90deg, #DDE7EB 0%, #94A7AE 100%)',
          boxShadow: '0 6px 14px rgba(126,142,148,0.22)',
        }}
      />
    </div>
  )
}

function AIStrip({ children }: { children: ReactNode }) {
  return (
    <div
      className="mb-6 rounded-[24px] px-5 py-4"
      style={{
        background: NEO_BASE,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: `inset 6px 6px 12px ${NEO_INSET_DARK}, inset -6px -6px 12px ${NEO_INSET_LIGHT}`,
      }}
    >
      <div className="text-[12px] font-black uppercase tracking-[0.18em]" style={{ color: NEO_TEXT }}>AI execution note</div>
      <div className="mt-2 text-[16px] leading-7" style={{ color: NEO_MUTED }}>{children}</div>
    </div>
  )
}

function PspHealthTable({ view }: { view: ProviderView }) {
  const rows = useMemo(() => {
    return PROVIDER_ROWS.map((row) => ({
      ...row,
      primaryBar: view === 'Latency' ? row.latencyScore : view === 'Errors' ? 100 - row.errorScore : row.health,
      tone: view === 'Errors' ? 'slate' : 'blue',
    }))
  }, [view])

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-3">
        <thead>
          <tr>
            {['Provider', 'Health', view === 'Latency' ? 'P95 latency' : view === 'Errors' ? 'Error rate' : 'Error rate', 'Webhook accuracy', 'Routing posture', 'Signal strength'].map((head) => (
              <th key={head} className="px-4 pb-2 text-left text-[13px] font-black uppercase tracking-[0.14em]" style={{ color: NEO_MUTED }}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="rounded-l-[22px] px-4 py-5" style={{ background: NEO_CREAM, borderTop: '1px solid rgba(255,255,255,0.34)', borderBottom: '1px solid rgba(255,255,255,0.34)', borderLeft: '1px solid rgba(255,255,255,0.34)', boxShadow: '8px 8px 18px rgba(126,142,148,0.12), -6px -6px 12px rgba(255,255,255,0.76)' }}>
                <div className="text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.name}</div>
                <div className="mt-2 text-[14px]" style={{ color: NEO_MUTED }}>{row.note}</div>
              </td>
              <td className="px-4 py-5" style={{ background: NEO_CREAM, borderTop: '1px solid rgba(255,255,255,0.34)', borderBottom: '1px solid rgba(255,255,255,0.34)' }}>
                <StatusChip tone={row.status === 'Healthy' ? 'healthy' : row.status === 'Critical' ? 'critical' : 'watch'}>{row.status}</StatusChip>
              </td>
              <td className="px-4 py-5" style={{ background: NEO_CREAM, borderTop: '1px solid rgba(255,255,255,0.34)', borderBottom: '1px solid rgba(255,255,255,0.34)' }}>
                <div className="text-[18px] font-bold" style={{ color: NEO_TEXT }}>{view === 'Latency' ? row.p95 : row.errorRate}</div>
              </td>
              <td className="px-4 py-5 text-[17px] font-bold" style={{ background: NEO_CREAM, borderTop: '1px solid rgba(255,255,255,0.34)', borderBottom: '1px solid rgba(255,255,255,0.34)', color: NEO_TEXT }}>{row.webhookAccuracy}</td>
              <td className="px-4 py-5 text-[16px]" style={{ background: NEO_CREAM, borderTop: '1px solid rgba(255,255,255,0.34)', borderBottom: '1px solid rgba(255,255,255,0.34)', color: NEO_MUTED }}>{row.route}</td>
              <td className="rounded-r-[22px] px-4 py-5" style={{ background: NEO_CREAM, borderTop: '1px solid rgba(255,255,255,0.34)', borderBottom: '1px solid rgba(255,255,255,0.34)', borderRight: '1px solid rgba(255,255,255,0.34)' }}>
                <MetricBar value={row.primaryBar} tone={row.tone as 'blue' | 'slate'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ExecutionPage() {
  const [activeTab, setActiveTab] = useState<ExecutionTab>('PSP Health Monitor')
  const [providerView, setProviderView] = useState<ProviderView>('Live status')
  const [railView, setRailView] = useState<RailView>('Scoreboard')
  const [routingView, setRoutingView] = useState<RoutingView>('Recommendations')

  return (
    <DashboardLayout>
      <div className="font-sans relative">
        <div className="fixed inset-0 -z-10" style={{ background: EXECUTION_PAGE_BG }} />
        <div className="fixed inset-0 -z-10" style={{ background: EXECUTION_PAGE_SPOTS }} />

          <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <HeaderPill>Execution & Infra</HeaderPill>
              <h1 className="mt-5 text-[42px] font-black leading-none tracking-[-0.05em] text-[#0F172A]">Provider health, rail reliability, and routing quality in one operator surface</h1>
              <p className="mt-4 max-w-[980px] text-[18px] leading-8 text-[#64748B]">
                This page is the live infrastructure layer for payout execution. It answers whether a provider is degrading, whether a rail is slowing down, and where routing logic should step in before money loss or support load spikes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <UtilityPill>Feb 24th, 2026 - Mar 15th, 2026</UtilityPill>
              <UtilityPill>compared to Aug 01 - Dec 31</UtilityPill>
              <UtilityPill>Daily</UtilityPill>
            </div>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-4">
            {EXECUTION_SUMMARY.map((item) => (
              <SummaryCard key={item.label} label={item.label} value={item.value} note={item.note} />
            ))}
          </section>

          <section className="mb-6 flex justify-start">
            <SegmentedTabs items={executionTabs} active={activeTab} onChange={setActiveTab} />
          </section>

          {activeTab === 'PSP Health Monitor' ? (
            <section className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-12">
              <ShellCard
                title="PSP Health Monitor"
                subtitle="Helps answer: which PSP is failing, degrading, or becoming unsafe for payout traffic right now."
                right={<SegmentedTabs items={providerTabs} active={providerView} onChange={setProviderView} />}
                className="xl:col-span-8"
              >
                <AIStrip>
                  AI routing readout: PayU degradation is still provider-localized, not rail-wide. The fastest safe move is to shift IMPS bursts toward Razorpay and Stripe while keeping Cashfree guarded for NEFT-heavy sellers.
                </AIStrip>
                <PspHealthTable view={providerView} />
              </ShellCard>

              <ShellCard
                title="Execution Alerts"
                subtitle="Infra incidents most likely to turn into payout loss or support escalation if left untouched."
                className="xl:col-span-4"
              >
                <div className="space-y-4">
                  {EXECUTION_ALERTS.map((alert) => (
                    <div
                      key={alert.title}
                      className="rounded-[24px] p-5"
                      style={{
                        background: NEO_CREAM,
                        border: '1px solid rgba(255,255,255,0.34)',
                        boxShadow: '8px 8px 18px rgba(126,142,148,0.12), -6px -6px 12px rgba(255,255,255,0.76)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-[18px] font-bold leading-7" style={{ color: NEO_TEXT }}>{alert.title}</div>
                        <StatusChip tone={alert.severity === 'Critical' ? 'critical' : alert.severity === 'High' ? 'watch' : 'healthy'}>{alert.severity}</StatusChip>
                      </div>
                      <div className="mt-3 text-[16px] leading-7" style={{ color: NEO_MUTED }}>{alert.detail}</div>
                    </div>
                  ))}
                </div>
              </ShellCard>
            </section>
          ) : null}

          {activeTab === 'Rail Performance' ? (
            <section className="mb-8">
              <ShellCard
                title="Rail Performance"
                subtitle="Helps answer: which rail is failing, slowing down, or creating visibility gaps under real payout load."
                right={<SegmentedTabs items={railTabs} active={railView} onChange={setRailView} />}
              >
                <AIStrip>
                  IMPS is still the cleanest release path, but NEFT visibility is weakening because statement timing is lagging the expected close rhythm.
                </AIStrip>
                {railView === 'Scoreboard' ? (
                  <div className="space-y-4">
                    {RAIL_ROWS.map((row) => (
                      <div
                        key={row.rail}
                        className="rounded-[24px] p-5"
                        style={{
                          background: NEO_CREAM,
                          border: '1px solid rgba(255,255,255,0.34)',
                          boxShadow: '8px 8px 18px rgba(126,142,148,0.12), -6px -6px 12px rgba(255,255,255,0.76)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-[22px] font-black tracking-[-0.03em]" style={{ color: NEO_TEXT }}>{row.rail}</div>
                            <div className="mt-2 text-[15px]" style={{ color: NEO_MUTED }}>{row.posture}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[24px] font-black tracking-[-0.03em]" style={{ color: NEO_TEXT }}>{row.success}</div>
                            <div className="mt-1 text-[13px] font-semibold" style={{ color: NEO_MUTED }}>success</div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>P95</div>
                            <div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.p95}</div>
                          </div>
                          <div>
                            <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Throughput</div>
                            <div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.throughput}</div>
                          </div>
                          <div>
                            <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Window</div>
                            <div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.nextWindow}</div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <MetricBar value={row.pressure} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {LOAD_CURVE.map((row) => (
                      <div
                        key={row.hour}
                        className="rounded-[24px] p-5"
                        style={{
                          background: NEO_CREAM,
                          border: '1px solid rgba(255,255,255,0.34)',
                          boxShadow: '8px 8px 18px rgba(126,142,148,0.12), -6px -6px 12px rgba(255,255,255,0.76)',
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-[20px] font-black tracking-[-0.03em]" style={{ color: NEO_TEXT }}>{row.hour}</div>
                          <StatusChip tone={row.saturation === 'Peak' ? 'critical' : row.saturation === 'Watch' ? 'watch' : 'healthy'}>{row.saturation}</StatusChip>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Dispatched</div>
                            <div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.dispatched}</div>
                          </div>
                          <div>
                            <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Confirmed</div>
                            <div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.confirmed}</div>
                          </div>
                          <div>
                            <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Drift</div>
                            <div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.drift}</div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <MetricBar value={Math.round((row.confirmed / row.dispatched) * 100)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ShellCard>
            </section>
          ) : null}

          {activeTab === 'Routing Insights' ? (
            <section className="mb-8">
              <ShellCard
                title="Routing Insights"
                subtitle="Helps answer: where should traffic move next so the system protects payout outcome, release speed, and provider cost efficiency."
                right={<SegmentedTabs items={routingTabs} active={routingView} onChange={setRoutingView} />}
              >
                <AIStrip>
                  AI recommendation: keep Stripe on high-value RTGS, reduce PayU on weekend IMPS bursts, and protect Cashfree with seller-level guardrails instead of global throttles.
                </AIStrip>
                {routingView === 'Recommendations' ? (
                  <div className="space-y-4">
                    {ROUTING_ROWS.map((row) => (
                      <div
                        key={row.lane}
                        className="rounded-[24px] p-5"
                        style={{
                          background: NEO_CREAM,
                          border: '1px solid rgba(255,255,255,0.34)',
                          boxShadow: '8px 8px 18px rgba(126,142,148,0.12), -6px -6px 12px rgba(255,255,255,0.76)',
                        }}
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <div className="text-[20px] font-black tracking-[-0.03em]" style={{ color: NEO_TEXT }}>{row.lane}</div>
                            <div className="mt-2 text-[15px] leading-7" style={{ color: NEO_MUTED }}>{row.reason}</div>
                          </div>
                          <StatusChip tone={row.action.includes('away') ? 'critical' : row.action.includes('fallback') ? 'watch' : 'healthy'}>{row.action}</StatusChip>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
                          <div>
                            <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Current mix</div>
                            <div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.currentMix}</div>
                          </div>
                          <div>
                            <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Recommendation</div>
                            <div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.recommendation}</div>
                          </div>
                          <div>
                            <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Success lift</div>
                            <div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.successLift}</div>
                          </div>
                          <div>
                            <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Fee delta</div>
                            <div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.feeDelta}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {ROUTING_INSIGHTS.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[24px] p-5"
                        style={{
                          background: NEO_CREAM,
                          border: '1px solid rgba(255,255,255,0.34)',
                          boxShadow: '8px 8px 18px rgba(126,142,148,0.12), -6px -6px 12px rgba(255,255,255,0.76)',
                        }}
                      >
                        <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>{item.label}</div>
                        <div className="mt-4 text-[30px] font-black leading-none tracking-[-0.04em]" style={{ color: NEO_TEXT }}>{item.value}</div>
                        <div className="mt-3 text-[15px] leading-7" style={{ color: NEO_MUTED }}>{item.note}</div>
                      </div>
                    ))}
                  </div>
                )}
              </ShellCard>
            </section>
          ) : null}
      </div>
    </DashboardLayout>
  )
}
