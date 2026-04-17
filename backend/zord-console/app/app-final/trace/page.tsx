'use client'

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DashboardLayout } from '@/components/fintech-dashboard'
import { EntityLogo, inferBankNameFromReference } from '../_components/entity-logo'

const FONT_MONO = "'IBM Plex Mono', monospace"

type TraceTab = 'Intent Journal' | 'Error Taxonomy' | 'Event Explorer'
type IntentFilter = 'All' | 'Failed' | 'Replay' | 'DLQ'
type TaxonomyFilter = 'All' | 'Bank' | 'Provider' | 'Data'
type EventFilter = 'All' | 'Webhook' | 'Poll' | 'Statement' | 'Parser'
type TraceMenuKey = 'primaryRange' | 'compareRange' | 'period' | null
type SortDirection = 'asc' | 'desc'
type IntentSortKey = 'intentId' | 'amount' | 'psp' | 'rail' | 'status' | 'traceId' | 'lastEvent' | 'explainability'
type TaxonomySortKey = 'family' | 'domain' | 'code' | 'intents' | 'retrySuccess' | 'money' | 'hotspot' | 'cause'
type EventSortKey = 'eventId' | 'traceId' | 'source' | 'stage' | 'receivedAt' | 'latency' | 'payload' | 'status' | 'note'

type IntentStatus = 'SUCCESS' | 'PROCESSING' | 'FAILED' | 'DLQ' | 'REPLAY'
type EventStatus = 'Healthy' | 'Delayed' | 'Mismatch' | 'Queued'

const TRACE_TABS: readonly TraceTab[] = ['Intent Journal', 'Error Taxonomy', 'Event Explorer']
const INTENT_FILTERS: readonly IntentFilter[] = ['All', 'Failed', 'Replay', 'DLQ']
const TAXONOMY_FILTERS: readonly TaxonomyFilter[] = ['All', 'Bank', 'Provider', 'Data']
const EVENT_FILTERS: readonly EventFilter[] = ['All', 'Webhook', 'Poll', 'Statement', 'Parser']
const TRACE_PRIMARY_RANGE_OPTIONS = ['Jan 01 - July 31', 'Jan 01 - Mar 31', 'Apr 01 - Jun 30', 'Jul 01 - Sep 30']
const TRACE_COMPARE_RANGE_OPTIONS = ['Aug 01 - Dec 31', 'Aug 01 - Oct 31', 'Nov 01 - Dec 31']
const TRACE_PERIOD_OPTIONS = ['Daily', 'Weekly', 'Monthly']

const INTENT_SUMMARY = [
  { label: 'Intent Search SLA', value: '< 200ms', note: 'Trace lookup target for escalations', tone: 'accent' },
  { label: 'Open Exceptions', value: '41', note: 'Need operator attention inside this window', tone: 'neutral' },
  { label: 'Replay Scheduled', value: '18', note: 'Queued for retry after recoverable failure', tone: 'neutral' },
  { label: 'Explainability Ready', value: '92.4%', note: 'Intents with AI-readable trace context', tone: 'accent' },
] as const

const TAXONOMY_SUMMARY = [
  { label: 'Queue Depth', value: '184', note: 'Events still unresolved in exception queue', tone: 'neutral' },
  { label: 'Recoverable via Retry', value: '63%', note: 'Worth automating before ops touch', tone: 'accent' },
  { label: 'Systemic Clusters', value: '7', note: 'Repeated error families across providers', tone: 'neutral' },
  { label: 'Money Exposed', value: '₹26.8 L', note: 'Payout value sitting behind recurring errors', tone: 'accent' },
] as const

const EVENT_SUMMARY = [
  { label: 'Events / Min', value: '2.8K', note: 'Current ingest pace across all sources', tone: 'accent' },
  { label: 'Late Webhooks', value: '14', note: 'Crossed expected delivery window', tone: 'neutral' },
  { label: 'Parser Skew', value: '18m', note: 'Statement file lag vs rolling median', tone: 'neutral' },
  { label: 'Payload Mismatch', value: '3', note: 'Hash or field mismatch needing review', tone: 'accent' },
] as const

const INTENT_ROWS = [
  {
    intentId: 'INT-TR-88210', seller: 'Rajesh Sharma', sellerId: 'SELL-7741', amount: '₹2.40 L', psp: 'Razorpay', rail: 'IMPS',
    status: 'SUCCESS' as IntentStatus, traceId: 'ZRD-TRACE-3f8a9b2c', bankRef: 'ICICI26092024011958', lastEvent: 'Statement matched', updated: '42s ago',
    explainability: 'AI summary ready', action: 'Open intent trail'
  },
  {
    intentId: 'INT-TR-88211', seller: 'Aman Verma', sellerId: 'SELL-4421', amount: '₹88.4 K', psp: 'PayU', rail: 'IMPS',
    status: 'FAILED' as IntentStatus, traceId: 'ZRD-TRACE-0ab22fd1', bankRef: '—', lastEvent: 'Gateway timeout', updated: '3m ago',
    explainability: 'Root cause isolated', action: 'Open replay review'
  },
  {
    intentId: 'INT-TR-88214', seller: 'Kavita Singh', sellerId: 'SELL-3921', amount: '₹4.10 L', psp: 'Cashfree', rail: 'NEFT',
    status: 'PROCESSING' as IntentStatus, traceId: 'ZRD-TRACE-27f6be22', bankRef: 'Awaited', lastEvent: 'Poll still clean', updated: '5m ago',
    explainability: 'Awaiting statement', action: 'Inspect payout evidence'
  },
  {
    intentId: 'INT-TR-88217', seller: 'Ravi Kumar', sellerId: 'SELL-9982', amount: '₹52.8 K', psp: 'Razorpay', rail: 'IMPS',
    status: 'DLQ' as IntentStatus, traceId: 'ZRD-TRACE-fbb14ce9', bankRef: '—', lastEvent: 'Missing IFSC', updated: '7m ago',
    explainability: 'Data quality issue', action: 'Open payload defect'
  },
  {
    intentId: 'INT-TR-88219', seller: 'Priya Nair', sellerId: 'SELL-1192', amount: '₹1.20 L', psp: 'Stripe', rail: 'RTGS',
    status: 'SUCCESS' as IntentStatus, traceId: 'ZRD-TRACE-c28bb0d5', bankRef: 'HDFC45092024099117', lastEvent: 'Finality confirmed', updated: '9m ago',
    explainability: 'Evidence pack ready', action: 'Export payout evidence'
  },
  {
    intentId: 'INT-TR-88221', seller: 'Anjali Patil', sellerId: 'SELL-7344', amount: '₹64.0 K', psp: 'Cashfree', rail: 'UPI',
    status: 'REPLAY' as IntentStatus, traceId: 'ZRD-TRACE-bf62ad33', bankRef: '—', lastEvent: 'Webhook mismatch', updated: '14m ago',
    explainability: 'Replay safe', action: 'Queue replay action'
  },
] as const

const TAXONOMY_ROWS = [
  {
    family: 'Gateway Timeout', domain: 'Provider', code: 'PSP_TIMEOUT_CLUSTER', intents: 84, retrySuccess: '71%', money: '₹8.6 L',
    hotspot: 'PayU · IMPS', cause: 'Weekend provider latency spike', action: 'Route away + lower retry window'
  },
  {
    family: 'Invalid Beneficiary', domain: 'Data', code: 'BENEFICIARY_VALIDATION', intents: 63, retrySuccess: '9%', money: '₹4.9 L',
    hotspot: 'ICICI branches', cause: 'Bad account / IFSC master', action: 'Block replay and patch seller master'
  },
  {
    family: 'Statement Delay', domain: 'Bank', code: 'STATEMENT_LAG', intents: 51, retrySuccess: '0%', money: '₹18.6 L',
    hotspot: 'HDFC settlement file', cause: 'Delayed SFTP drop', action: 'Escalate bank ops immediately'
  },
  {
    family: 'Webhook Drift', domain: 'Provider', code: 'WEBHOOK_HASH_MISMATCH', intents: 28, retrySuccess: '64%', money: '₹2.1 L',
    hotspot: 'Cashfree · UPI', cause: 'Payload field mismatch on callback', action: 'Trace callback signature changes'
  },
  {
    family: 'Parser Failure', domain: 'Data', code: 'CSV_PARSE_BREAK', intents: 16, retrySuccess: '18%', money: '₹1.4 L',
    hotspot: 'Statement parser', cause: 'Unexpected delimiter in file', action: 'Patch parser and re-run batch'
  },
  {
    family: 'Host Unavailable', domain: 'Bank', code: 'BANK_HOST_UNAVAILABLE', intents: 19, retrySuccess: '42%', money: '₹1.2 L',
    hotspot: 'Axis · RTGS', cause: 'Bank host instability', action: 'Throttle and retry on alternate rail'
  },
] as const

const EVENT_ROWS = [
  {
    eventId: 'evt_01JTRN8QW3', traceId: 'ZRD-TRACE-3f8a9b2c', intentId: 'INT-TR-88210', source: 'Webhook', stage: 'Dispatch Ack',
    status: 'Healthy' as EventStatus, receivedAt: '14:02:11', latency: '210ms', payload: '12.8 KB', note: 'Matched idempotency hash'
  },
  {
    eventId: 'evt_01JTRN8QW4', traceId: 'ZRD-TRACE-0ab22fd1', intentId: 'INT-TR-88211', source: 'Poll', stage: 'Status Poll',
    status: 'Delayed' as EventStatus, receivedAt: '14:03:08', latency: '4.2s', payload: '9.1 KB', note: 'Provider returned timeout'
  },
  {
    eventId: 'evt_01JTRN8QW5', traceId: 'ZRD-TRACE-27f6be22', intentId: 'INT-TR-88214', source: 'Statement', stage: 'Settlement Evidence',
    status: 'Queued' as EventStatus, receivedAt: '14:18:41', latency: '18m', payload: '44.3 KB', note: 'File awaited from SFTP'
  },
  {
    eventId: 'evt_01JTRN8QW6', traceId: 'ZRD-TRACE-fbb14ce9', intentId: 'INT-TR-88217', source: 'Parser', stage: 'Payload Validation',
    status: 'Mismatch' as EventStatus, receivedAt: '14:21:03', latency: '88ms', payload: '4.7 KB', note: 'IFSC field missing in body'
  },
  {
    eventId: 'evt_01JTRN8QW7', traceId: 'ZRD-TRACE-c28bb0d5', intentId: 'INT-TR-88219', source: 'Webhook', stage: 'Finality Update',
    status: 'Healthy' as EventStatus, receivedAt: '14:24:55', latency: '180ms', payload: '13.5 KB', note: 'All three signals aligned'
  },
  {
    eventId: 'evt_01JTRN8QW8', traceId: 'ZRD-TRACE-bf62ad33', intentId: 'INT-TR-88221', source: 'Webhook', stage: 'Retry Schedule',
    status: 'Mismatch' as EventStatus, receivedAt: '14:26:14', latency: '620ms', payload: '10.2 KB', note: 'Signature changed after replay'
  },
] as const

function inferEntityFromHotspot(hotspot: string) {
  if (hotspot.includes('Razorpay')) return { kind: 'psp' as const, name: 'Razorpay' }
  if (hotspot.includes('Cashfree')) return { kind: 'psp' as const, name: 'Cashfree' }
  if (hotspot.includes('PayU')) return { kind: 'psp' as const, name: 'PayU' }
  if (hotspot.includes('Stripe')) return { kind: 'psp' as const, name: 'Stripe' }
  if (hotspot.includes('ICICI')) return { kind: 'bank' as const, name: 'ICICI Bank' }
  if (hotspot.includes('HDFC')) return { kind: 'bank' as const, name: 'HDFC Bank' }
  if (hotspot.includes('SBI')) return { kind: 'bank' as const, name: 'SBI' }
  if (hotspot.includes('Axis')) return { kind: 'bank' as const, name: 'Axis Bank' }
  if (hotspot.includes('Kotak')) return { kind: 'bank' as const, name: 'Kotak' }

  return null
}

const TRACE_BASE = '#FFFFFF'
const TRACE_DARK = '#F8FAFC'
const TRACE_CREAM = '#FFFFFF'
const TRACE_TEXT = '#0F172A'
const TRACE_MUTED = '#64748B'
const TRACE_ACCENT = '#4F46E5'
const TRACE_ALT = '#F8FAFC'
const TRACE_HOVER = '#F1F5F9'
const TRACE_PANEL = '#FFFFFF'
const TRACE_TABLE_HEAD = 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)'
const TRACE_DRAWER = 'linear-gradient(145deg, #F8FAFC, #FFFFFF)'
const TRACE_BORDER = 'rgba(0, 0, 0, 0.06)'
const TRACE_BORDER_SOFT = 'rgba(0, 0, 0, 0.04)'
const NEUMO_POP =
  '0 8px 24px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
const NEUMO_PRESS =
  'inset 4px 4px 8px rgba(15, 23, 42, 0.04), inset -4px -4px 8px rgba(255, 255, 255, 0.8)'
const TRACE_PAGE_SPOTS =
  'radial-gradient(circle at 18% 10%, rgba(255,255,255,0.80), transparent 28%), radial-gradient(circle at 78% 8%, rgba(206,211,222,0.34), transparent 32%), radial-gradient(circle at 82% 72%, rgba(227,230,236,0.42), transparent 28%)'

function parseCompactAmount(value: string) {
  const cleaned = value.replace(/[₹,\s]/g, '')
  const match = cleaned.match(/([\d.]+)([LKCr]*)/)
  if (!match) return 0
  const amount = Number(match[1])
  const unit = match[2]
  if (unit === 'Cr') return amount * 10000000
  if (unit === 'L') return amount * 100000
  if (unit === 'K') return amount * 1000
  return amount
}

function parsePercent(value: string) {
  return Number(value.replace('%', ''))
}

function parseAgo(value: string) {
  const match = value.match(/([\d.]+)([smh])/)
  if (!match) return 0
  const amount = Number(match[1])
  const unit = match[2]
  if (unit === 'h') return amount * 3600
  if (unit === 'm') return amount * 60
  return amount
}

function parseLatency(value: string) {
  const match = value.match(/([\d.]+)(ms|s|m)/)
  if (!match) return 0
  const amount = Number(match[1])
  const unit = match[2]
  if (unit === 'm') return amount * 60000
  if (unit === 's') return amount * 1000
  return amount
}

function parseClock(value: string) {
  const [h, m, s] = value.split(':').map(Number)
  return h * 3600 + m * 60 + s
}

function parsePayloadSize(value: string) {
  return Number(value.replace(/[^\d.]/g, ''))
}

function comparePrimitive(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

function TraceCaretIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 6l4 4 4-4" stroke={TRACE_MUTED} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TraceSortGlyph({ active = false, direction = 'asc' }: { active?: boolean; direction?: SortDirection }) {
  return (
    <span className="inline-flex items-center gap-0.5" style={{ color: active ? TRACE_ACCENT : TRACE_MUTED }}>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M6 2v8M6 2 3.8 4.2M6 2l2.2 2.2" stroke="currentColor" strokeWidth={active && direction === 'asc' ? '1.6' : '1.2'} strokeLinecap="round" strokeLinejoin="round" opacity={active && direction === 'asc' ? '1' : '0.58'} />
      </svg>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M6 10V2M6 10 3.8 7.8M6 10l2.2-2.2" stroke="currentColor" strokeWidth={active && direction === 'desc' ? '1.6' : '1.2'} strokeLinecap="round" strokeLinejoin="round" opacity={active && direction === 'desc' ? '1' : '0.58'} />
      </svg>
    </span>
  )
}

function TraceHeadLabel({
  children,
  active = false,
  direction = 'asc',
  onClick,
}: {
  children: ReactNode
  active?: boolean
  direction?: SortDirection
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-2"
      style={
        active
          ? {
              background: TRACE_CREAM,
              color: TRACE_TEXT,
              border: '1px solid rgba(255,255,255,0.78)',
              boxShadow: NEUMO_POP,
            }
          : {
              color: TRACE_MUTED,
            }
      }
    >
      <span>{children}</span>
      <TraceSortGlyph active={active} direction={direction} />
    </button>
  )
}

function TraceRangePill({
  label,
  value,
  onClick,
}: {
  label: string
  value: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[70px] w-full min-w-[220px] flex-col items-start justify-center gap-2 rounded-[28px] border px-5 py-4 text-left transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: TRACE_BASE,
        borderColor: TRACE_BORDER,
        color: TRACE_TEXT,
        boxShadow: NEUMO_POP,
      }}
    >
      <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: TRACE_MUTED }}>{label}</span>
      <span className="flex w-full items-center gap-3">
        <span className="flex-1 truncate text-[15px] font-black tracking-[-0.02em]" style={{ color: TRACE_TEXT }}>{value}</span>
        <span
          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border"
          style={{
            borderColor: TRACE_BORDER,
            background: TRACE_BASE,
            boxShadow: NEUMO_PRESS,
          }}
        >
          <TraceCaretIcon />
        </span>
      </span>
    </button>
  )
}

function TraceRangeToolbar() {
  const [primaryRange, setPrimaryRange] = useState(TRACE_PRIMARY_RANGE_OPTIONS[0])
  const [compareRange, setCompareRange] = useState(TRACE_COMPARE_RANGE_OPTIONS[0])
  const [period, setPeriod] = useState(TRACE_PERIOD_OPTIONS[0])
  const [openMenu, setOpenMenu] = useState<TraceMenuKey>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (toolbarRef.current && !toolbarRef.current.contains(target)) setOpenMenu(null)
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onEscape)
    }
  }, [])

  const menuStyle = {
    position: 'absolute' as const,
    top: 'calc(100% + 10px)',
    left: 0,
    minWidth: 220,
    background: TRACE_BASE,
    border: `1px solid ${TRACE_BORDER}`,
    borderRadius: 22,
    boxShadow: NEUMO_POP,
    padding: 8,
    zIndex: 30,
  }

  const optionStyle = (active: boolean) =>
    ({
      width: '100%',
      border: 'none',
      background: active ? TRACE_CREAM : 'transparent',
      borderRadius: 14,
      textAlign: 'left' as const,
      padding: '10px 12px',
      fontSize: 13,
      fontWeight: 700,
      color: TRACE_TEXT,
      cursor: 'pointer',
      boxShadow: active ? NEUMO_POP : 'none',
    })

  return (
    <div
      ref={toolbarRef}
      className="mb-6 rounded-[36px] border p-3.5"
      style={{
        background: TRACE_BASE,
        borderColor: TRACE_BORDER,
        boxShadow: NEUMO_POP,
      }}
    >
      <div className="flex w-full flex-wrap items-stretch gap-3">
        <div className="relative min-w-[250px] flex-1">
          <TraceRangePill
            label="Primary Window"
            value={primaryRange}
            onClick={() => setOpenMenu((menu) => (menu === 'primaryRange' ? null : 'primaryRange'))}
          />
          {openMenu === 'primaryRange' && (
            <div style={menuStyle}>
              {TRACE_PRIMARY_RANGE_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => {
                    setPrimaryRange(option)
                    setOpenMenu(null)
                  }}
                  style={optionStyle(option === primaryRange)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className="flex min-h-[70px] min-w-[88px] flex-col items-center justify-center rounded-[24px] border px-4 py-3"
          style={{
            background: TRACE_BASE,
            borderColor: TRACE_BORDER,
            color: TRACE_MUTED,
            boxShadow: NEUMO_PRESS,
          }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.16em]">Compare</span>
          <span className="mt-1 text-[18px] font-black tracking-[-0.04em]">vs</span>
        </div>

        <div className="relative min-w-[250px] flex-1">
          <TraceRangePill
            label="Comparison Window"
            value={compareRange}
            onClick={() => setOpenMenu((menu) => (menu === 'compareRange' ? null : 'compareRange'))}
          />
          {openMenu === 'compareRange' && (
            <div style={menuStyle}>
              {TRACE_COMPARE_RANGE_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => {
                    setCompareRange(option)
                    setOpenMenu(null)
                  }}
                  style={optionStyle(option === compareRange)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-stretch gap-3 sm:ml-auto">
          <div className="relative min-w-[150px]">
            <TraceRangePill
              label="Granularity"
              value={period}
              onClick={() => setOpenMenu((menu) => (menu === 'period' ? null : 'period'))}
            />
            {openMenu === 'period' && (
              <div style={{ ...menuStyle, minWidth: 150 }}>
                {TRACE_PERIOD_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => {
                      setPeriod(option)
                      setOpenMenu(null)
                    }}
                    style={optionStyle(option === period)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Add"
            className="inline-flex h-[70px] w-[70px] items-center justify-center rounded-[24px] border text-[30px] font-bold leading-none"
            style={{
              background: TRACE_CREAM,
              borderColor: TRACE_BORDER,
              color: TRACE_ACCENT,
              boxShadow: NEUMO_POP,
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

function NeumoTabs<T extends string>({
  items,
  active,
  onChange,
}: {
  items: readonly T[]
  active: T
  onChange: (value: T) => void
}) {
  return (
    <div
      className="trace-switch-track inline-flex flex-wrap items-center gap-2 rounded-[34px] border px-2.5 py-2.5"
      style={{
        background: TRACE_BASE,
        border: '1px solid rgba(255,255,255,0.78)',
        boxShadow: NEUMO_PRESS,
      }}
    >
      {items.map((item) => {
        const activeItem = item === active
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className="rounded-[28px] px-7 py-3.5 text-[15px] font-bold tracking-[0.01em] transition-all duration-200"
            style={
              activeItem
                ? {
                    background: TRACE_CREAM,
                    color: TRACE_TEXT,
                    boxShadow: NEUMO_POP,
                    textShadow: '1px 1px 0 rgba(255,255,255,0.28)',
                  }
                : {
                    color: TRACE_MUTED,
                    textShadow: '1px 1px 0 rgba(255,255,255,0.28)',
                  }
            }
          >
            <span className="relative z-[1]">{item}</span>
          </button>
        )
      })}
    </div>
  )
}

function TraceHeaderPill({ children }: { children: ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-bold uppercase tracking-[0.12em]"
      style={{
        background: TRACE_CREAM,
        color: TRACE_MUTED,
        borderColor: TRACE_BORDER,
        boxShadow: NEUMO_POP,
      }}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: TRACE_ACCENT }} />
      {children}
    </div>
  )
}

function TraceMetricCard({ label, value, note, tone = 'neutral' }: { label: string; value: string; note: string; tone?: 'neutral' | 'accent' }) {
  const toneStyle =
    tone === 'accent'
      ? {
          background: 'linear-gradient(180deg, rgba(33,37,58,0.98) 0%, rgba(28,31,46,0.98) 100%)',
          borderColor: 'rgba(255,255,255,0.07)',
          boxShadow: '0 22px 52px rgba(20,22,38,0.30), 0 2px 8px rgba(20,22,38,0.22), inset 0 0.5px 0 rgba(255,255,255,0.10)',
        }
      : {
          background: 'linear-gradient(180deg, rgba(33,37,58,0.98) 0%, rgba(28,31,46,0.98) 100%)',
          borderColor: 'rgba(255,255,255,0.07)',
          boxShadow: '0 22px 52px rgba(20,22,38,0.30), 0 2px 8px rgba(20,22,38,0.22), inset 0 0.5px 0 rgba(255,255,255,0.10)',
        }
  return (
    <div className="rounded-[30px] border p-6 transition-all duration-300 hover:-translate-y-1" style={toneStyle}>
      <div
        className="inline-flex rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]"
        style={{
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.65)',
          borderColor: 'rgba(255,255,255,0.12)',
          boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {label}
      </div>
      <div className="mt-5 text-[38px] font-black leading-none tracking-[-0.05em]" style={{ color: '#ffffff' }}>{value}</div>
      <div className="mt-3 text-[15px] leading-7" style={{ color: 'rgba(255,255,255,0.65)' }}>{note}</div>
    </div>
  )
}

function ToolbarShell({ title, subtitle, right, children }: { title: string; subtitle: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div
      className="rounded-[38px] border p-7"
      style={{
        background: '#FFFFFF',
        borderColor: TRACE_BORDER,
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.02)',
      }}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-[32px] font-black tracking-[-0.04em]" style={{ color: TRACE_TEXT }}>{title}</div>
          <div className="mt-2 max-w-[780px] text-[16px] leading-8" style={{ color: TRACE_MUTED }}>{subtitle}</div>
        </div>
        {right}
      </div>
      <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">{children}</div>
    </div>
  )
}

function SearchField({ placeholder }: { placeholder: string }) {
  return (
    <div
      className="flex min-w-[320px] flex-1 items-center gap-3 rounded-[24px] border px-4 py-4"
      style={{
        background: TRACE_ALT,
        borderColor: TRACE_BORDER,
        boxShadow: NEUMO_PRESS,
      }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border shadow-sm" style={{ borderColor: TRACE_BORDER, background: '#FFFFFF' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: TRACE_MUTED }}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </div>
      <input
        readOnly
        value=""
        placeholder={placeholder}
        className="w-full bg-transparent text-[15px] font-semibold outline-none"
        style={{ color: TRACE_TEXT }}
      />
    </div>
  )
}

function ActionPill({ children }: { children: ReactNode }) {
  return (
    <div
      className="inline-flex min-h-[52px] items-center rounded-[18px] border px-5 py-3.5 text-[15px] font-bold"
      style={{
        background: '#FFFFFF',
        borderColor: TRACE_BORDER,
        color: TRACE_TEXT,
        boxShadow: NEUMO_POP,
      }}
    >
      {children}
    </div>
  )
}

function AIStrip({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative mb-6 overflow-hidden rounded-[24px] p-[2px] transition-all duration-300 hover:shadow-lg"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(236,72,153,0.4) 50%, rgba(99,102,241,0.2) 100%)',
        boxShadow: '0 12px 28px rgba(99,102,241,0.22), inset 1px 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      <div className="relative flex w-full flex-col gap-1 rounded-[22px] px-6 py-5 sm:flex-row sm:items-start" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f4f6f9 100%)' }}>
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-[0_4px_12px_rgba(99,102,241,0.35)]" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#fff' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"/></svg>
        </div>
        <div className="ml-1 sm:ml-3">
          <div className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: '#4f46e5' }}>Zord AI Readout</div>
          <div className="mt-1 text-[16px] font-semibold leading-7" style={{ color: '#334155' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function TraceActionButton({
  children,
  tone = 'stone',
  onClick,
}: {
  children: ReactNode
  tone?: 'olive' | 'slate' | 'stone'
  onClick?: () => void
}) {
  const toneStyle =
    tone === 'olive'
      ? {
          background: '#F4EAF0',
          borderColor: 'rgba(123,108,135,0.22)',
          color: TRACE_ACCENT,
          boxShadow: NEUMO_POP,
        }
      : tone === 'slate'
      ? {
          background: TRACE_CREAM,
          borderColor: TRACE_BORDER,
          color: TRACE_TEXT,
          boxShadow: NEUMO_POP,
        }
      : {
          background: TRACE_ALT,
          borderColor: TRACE_BORDER_SOFT,
          color: TRACE_MUTED,
          boxShadow: NEUMO_POP,
        }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[18px] border px-4 py-2.5 text-[14px] font-bold tracking-[0.01em]"
      style={toneStyle}
    >
      {children}
    </button>
  )
}

function TraceSubChip({
  children,
  tone = 'stone',
}: {
  children: ReactNode
  tone?: 'olive' | 'slate' | 'stone'
}) {
  const toneStyle =
    tone === 'olive'
      ? { border: '1px solid rgba(123,108,135,0.18)', background: '#F4EAF0', color: TRACE_ACCENT }
      : tone === 'slate'
      ? { border: `1px solid ${TRACE_BORDER}`, background: TRACE_CREAM, color: TRACE_TEXT }
      : { border: `1px solid ${TRACE_BORDER_SOFT}`, background: TRACE_ALT, color: TRACE_MUTED }

  return <span className="inline-flex rounded-full px-3 py-1 text-[12px] font-semibold" style={toneStyle}>{children}</span>
}

function WideTableCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-[36px] border p-[8px]"
      style={{
        background: '#F8FAFC',
        borderColor: TRACE_BORDER,
        boxShadow: '0 24px 48px rgba(15, 23, 42, 0.05), 0 12px 24px rgba(15, 23, 42, 0.03)',
      }}
    >
      <div className="rounded-[28px] overflow-hidden border" style={{ borderColor: 'rgba(0,0,0,0.02)', background: TRACE_PANEL, boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)' }}>
        {children}
      </div>
    </div>
  )
}

function StatusTag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warn' | 'dark' }) {
  const toneStyle =
    tone === 'success'
      ? { border: '1px solid rgba(165,193,171,0.54)', background: '#EEF3EC', color: '#4F6558' }
      : tone === 'warn'
      ? { border: '1px solid rgba(224,197,138,0.52)', background: '#FFF4DB', color: '#8D5E34' }
      : tone === 'dark'
      ? { border: '1px solid rgba(123,108,135,0.22)', background: '#F4EAF0', color: TRACE_ACCENT }
      : { border: `1px solid ${TRACE_BORDER_SOFT}`, background: TRACE_ALT, color: TRACE_MUTED }
  return <span className="inline-flex rounded-full px-3.5 py-1.5 text-[12px] font-semibold" style={toneStyle}>{children}</span>
}

function IntentJournalView() {
  const [filter, setFilter] = useState<IntentFilter>('All')
  const [expandedIntent, setExpandedIntent] = useState<string | null>(INTENT_ROWS[0].intentId)
  const [sortKey, setSortKey] = useState<IntentSortKey>('intentId')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const rows = useMemo(() => {
    const filtered = filter === 'All' ? [...INTENT_ROWS] : INTENT_ROWS.filter((row) => row.status === filter.toUpperCase())
    return filtered.sort((left, right) => {
      const leftValue =
        sortKey === 'amount'
          ? parseCompactAmount(left.amount)
          : sortKey === 'status'
          ? ['SUCCESS', 'PROCESSING', 'REPLAY', 'FAILED', 'DLQ'].indexOf(left.status)
          : sortKey === 'traceId'
          ? left.traceId
          : sortKey === 'lastEvent'
          ? left.lastEvent
          : sortKey === 'explainability'
          ? left.explainability
          : sortKey === 'psp'
          ? left.psp
          : sortKey === 'rail'
          ? left.rail
          : left.intentId
      const rightValue =
        sortKey === 'amount'
          ? parseCompactAmount(right.amount)
          : sortKey === 'status'
          ? ['SUCCESS', 'PROCESSING', 'REPLAY', 'FAILED', 'DLQ'].indexOf(right.status)
          : sortKey === 'traceId'
          ? right.traceId
          : sortKey === 'lastEvent'
          ? right.lastEvent
          : sortKey === 'explainability'
          ? right.explainability
          : sortKey === 'psp'
          ? right.psp
          : sortKey === 'rail'
          ? right.rail
          : right.intentId
      const result = comparePrimitive(leftValue, rightValue)
      return sortDirection === 'asc' ? result : -result
    })
  }, [filter, sortDirection, sortKey])

  const onSort = (key: IntentSortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection('asc')
  }

  return (
    <>
      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
        {INTENT_SUMMARY.map((item) => (
          <TraceMetricCard key={item.label} label={item.label} value={item.value} note={item.note} tone={item.tone} />
        ))}
      </section>

      <section className="mb-5">
        <AIStrip>
          The highest volume of intent failures (84 intents) is concentrated around ICICI Bank timeouts in the W15 cohort. The confidence interval for auto-resolving these is 92% based on previous batch cycles.
        </AIStrip>
        <ToolbarShell
          title="Intent Journal"
          subtitle="Primary debug surface for payment-level truth — search any payout and inspect the exact operational trail."
          right={<ActionPill>Feb 24th, 2026 - Mar 15th, 2026</ActionPill>}
        >
          <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-center">
            <SearchField placeholder="Search intent, seller, UTR, trace ID" />
            <NeumoTabs items={INTENT_FILTERS} active={filter} onChange={setFilter} />
          </div>
          <div className="flex items-center gap-3">
            <ActionPill>Show 6 Rows</ActionPill>
            <ActionPill>Manage Columns</ActionPill>
            <ActionPill>Filters</ActionPill>
          </div>
        </ToolbarShell>
      </section>

      <WideTableCard>
        <div className="m-3 max-h-[720px] overflow-auto rounded-[30px]" style={{ background: TRACE_CREAM, boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.92), inset 5px 5px 12px rgba(118,84,111,0.08)' }}>
          <table className="min-w-[1400px] w-full">
            <thead className="sticky top-0 z-20 border-b" style={{ borderColor: TRACE_BORDER_SOFT, background: TRACE_TABLE_HEAD }}>
              <tr className="text-left text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: TRACE_MUTED }}>
                <th className="sticky left-0 z-30 px-6 py-5" style={{ background: TRACE_TABLE_HEAD, boxShadow: '18px 0 24px rgba(118,84,111,0.08)' }}><TraceHeadLabel active={sortKey === 'intentId'} direction={sortDirection} onClick={() => onSort('intentId')}>Intent / Seller</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'amount'} direction={sortDirection} onClick={() => onSort('amount')}>Amount</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'psp'} direction={sortDirection} onClick={() => onSort('psp')}>PSP</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'rail'} direction={sortDirection} onClick={() => onSort('rail')}>Rail</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'status'} direction={sortDirection} onClick={() => onSort('status')}>Current State</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'traceId'} direction={sortDirection} onClick={() => onSort('traceId')}>Trace / Bank Ref</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'lastEvent'} direction={sortDirection} onClick={() => onSort('lastEvent')}>Last Event</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'explainability'} direction={sortDirection} onClick={() => onSort('explainability')}>Explainability</TraceHeadLabel></th>
                <th className="px-6 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const expanded = expandedIntent === row.intentId
                const rowBg = index % 2 === 0 ? TRACE_CREAM : TRACE_ALT

                return (
                  <Fragment key={row.intentId}>
                    <tr key={row.intentId} className="border-b transition-colors" style={{ borderColor: TRACE_BORDER_SOFT, background: rowBg }}>
                      <td
                        className="sticky left-0 z-10 px-6 py-5"
                        style={{ background: rowBg, boxShadow: '14px 0 22px rgba(118,84,111,0.08)' }}
                      >
                        <div className="text-[18px] font-bold" style={{ fontFamily: FONT_MONO, color: TRACE_TEXT }}>{row.intentId}</div>
                        <div className="mt-2 text-[16px] font-semibold" style={{ color: TRACE_TEXT }}>{row.seller}</div>
                        <div className="mt-1 text-[14px]" style={{ color: TRACE_MUTED }}>{row.sellerId}</div>
                      </td>
                      <td className="px-6 py-5 text-[19px] font-black" style={{ color: TRACE_TEXT }}>{row.amount}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <EntityLogo name={row.psp} kind="psp" size={48} className="rounded-[20px]" />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <TraceSubChip tone={row.rail === 'IMPS' ? 'olive' : row.rail === 'NEFT' ? 'stone' : 'slate'}>{row.rail}</TraceSubChip>
                      </td>
                      <td className="px-6 py-5">
                        <StatusTag tone={row.status === 'SUCCESS' ? 'success' : row.status === 'FAILED' || row.status === 'DLQ' ? 'dark' : 'warn'}>
                          {row.status}
                        </StatusTag>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[15px] font-bold" style={{ fontFamily: FONT_MONO, color: TRACE_TEXT }}>{row.traceId}</div>
                        <div className="mt-2 flex items-center gap-3">
                          {inferBankNameFromReference(row.bankRef) ? (
                            <EntityLogo name={inferBankNameFromReference(row.bankRef) ?? ''} kind="bank" size={42} className="rounded-[18px]" />
                          ) : null}
                          <div className="text-[14px]" style={{ color: TRACE_MUTED }}>{row.bankRef}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[16px] font-semibold" style={{ color: TRACE_TEXT }}>{row.lastEvent}</div>
                        <div className="mt-2 text-[14px]" style={{ color: TRACE_MUTED }}>Updated {row.updated}</div>
                      </td>
                      <td className="px-6 py-5 text-[15px]" style={{ color: TRACE_MUTED }}>{row.explainability}</td>
                      <td className="px-6 py-5 text-right">
                        <TraceActionButton
                          tone={row.status === 'SUCCESS' ? 'olive' : row.status === 'FAILED' || row.status === 'DLQ' ? 'slate' : 'stone'}
                          onClick={() => setExpandedIntent(expanded ? null : row.intentId)}
                        >
                          {expanded ? 'Hide trace' : row.action}
                        </TraceActionButton>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr key={`${row.intentId}-drawer`} className="border-b" style={{ borderColor: TRACE_BORDER_SOFT, background: TRACE_HOVER }}>
                        <td colSpan={9} className="px-6 py-5">
                          <div
                            className="grid gap-4 rounded-[24px] border p-5 md:grid-cols-4"
                            style={{
                              borderColor: TRACE_BORDER,
                              background: TRACE_DRAWER,
                              boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.85), 8px 8px 18px rgba(118,84,111,0.10)',
                              animation: 'traceDrawerIn 220ms ease-out',
                            }}
                          >
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: TRACE_MUTED }}>Trace Path</div>
                              <div className="mt-2 text-[15px] font-semibold" style={{ color: TRACE_TEXT }}>{row.psp} dispatch -&gt; {row.lastEvent}</div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <TraceSubChip tone="olive">Dispatch ack</TraceSubChip>
                                <TraceSubChip tone={row.status === 'SUCCESS' ? 'olive' : 'stone'}>{row.lastEvent}</TraceSubChip>
                                <TraceSubChip tone="slate">{row.updated}</TraceSubChip>
                              </div>
                            </div>
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: TRACE_MUTED }}>Operator Read</div>
                              <div className="mt-2 text-[15px]" style={{ color: TRACE_MUTED }}>{row.explainability}. Bank ref: {row.bankRef}.</div>
                            </div>
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: TRACE_MUTED }}>Recommended Move</div>
                              <div className="mt-2 text-[15px]" style={{ color: TRACE_MUTED }}>{row.action} for this intent. Escalate if it remains unchanged beyond the next polling window.</div>
                            </div>
                            <div className="flex items-start justify-end gap-2 md:justify-start">
                              <TraceActionButton tone="olive">Open intent trail</TraceActionButton>
                              <TraceActionButton tone="slate">Export intent evidence</TraceActionButton>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mx-3 mb-3 flex flex-col gap-4 rounded-[24px] border px-6 py-5 md:flex-row md:items-center md:justify-between" style={{ borderColor: TRACE_BORDER, background: TRACE_CREAM, boxShadow: '8px 8px 18px rgba(118,84,111,0.08), inset 1px 1px 0 rgba(255,255,255,0.92)' }}>
          <div className="text-[15px]" style={{ color: TRACE_MUTED }}>Showing <span className="font-bold" style={{ color: TRACE_TEXT }}>{rows.length}</span> of 124 intents in this trace window</div>
          <div className="flex items-center gap-2">
            {['1', '2', '3', '4'].map((page) => (
              <button
                key={page}
                className="h-10 w-10 rounded-[14px] border text-[14px] font-bold"
                style={
                  page === '1'
                    ? {
                        background: '#F4EAF0',
                        borderColor: 'rgba(123,108,135,0.22)',
                        color: TRACE_ACCENT,
                        boxShadow: NEUMO_POP,
                      }
                    : {
                        background: TRACE_CREAM,
                        borderColor: TRACE_BORDER,
                        color: TRACE_MUTED,
                        boxShadow: NEUMO_POP,
                      }
                }
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </WideTableCard>
    </>
  )
}

function ErrorTaxonomyView() {
  const [filter, setFilter] = useState<TaxonomyFilter>('All')
  const [sortKey, setSortKey] = useState<TaxonomySortKey>('money')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const rows = useMemo(() => {
    const filtered = filter === 'All' ? [...TAXONOMY_ROWS] : TAXONOMY_ROWS.filter((row) => row.domain === filter)
    return filtered.sort((left, right) => {
      const leftValue =
        sortKey === 'intents'
          ? left.intents
          : sortKey === 'retrySuccess'
          ? parsePercent(left.retrySuccess)
          : sortKey === 'money'
          ? parseCompactAmount(left.money)
          : sortKey === 'domain'
          ? left.domain
          : sortKey === 'code'
          ? left.code
          : sortKey === 'hotspot'
          ? left.hotspot
          : sortKey === 'cause'
          ? left.cause
          : left.family
      const rightValue =
        sortKey === 'intents'
          ? right.intents
          : sortKey === 'retrySuccess'
          ? parsePercent(right.retrySuccess)
          : sortKey === 'money'
          ? parseCompactAmount(right.money)
          : sortKey === 'domain'
          ? right.domain
          : sortKey === 'code'
          ? right.code
          : sortKey === 'hotspot'
          ? right.hotspot
          : sortKey === 'cause'
          ? right.cause
          : right.family
      const result = comparePrimitive(leftValue, rightValue)
      return sortDirection === 'asc' ? result : -result
    })
  }, [filter, sortDirection, sortKey])

  const onSort = (key: TaxonomySortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection(key === 'money' || key === 'intents' ? 'desc' : 'asc')
  }

  return (
    <>
      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
        {TAXONOMY_SUMMARY.map((item) => (
          <TraceMetricCard key={item.label} label={item.label} value={item.value} note={item.note} tone={item.tone} />
        ))}
      </section>

      <section className="mb-5">
        <AIStrip>
          Recommend shifting volume from PayU due to an emerging error cluster. Detected a 2.3x spike in GATEWAY_TIMEOUTs over the last 45 minutes targeting urgent traffic.
        </AIStrip>
        <ToolbarShell
          title="Error Taxonomy"
          subtitle="Root-cause table for clustered payout failures, retry behavior, and financial blast radius."
          right={<ActionPill>Last 7 days</ActionPill>}
        >
          <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-center">
            <SearchField placeholder="Search family, code cluster, bank, PSP" />
            <NeumoTabs items={TAXONOMY_FILTERS} active={filter} onChange={setFilter} />
          </div>
          <div className="flex items-center gap-3">
            <ActionPill>Severity Order</ActionPill>
            <ActionPill>Export CSV</ActionPill>
          </div>
        </ToolbarShell>
      </section>

      <WideTableCard>
        <div className="m-3 max-h-[720px] overflow-auto rounded-[30px]" style={{ background: TRACE_CREAM, boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.92), inset 5px 5px 12px rgba(118,84,111,0.08)' }}>
          <table className="min-w-[1380px] w-full">
            <thead className="sticky top-0 z-20 border-b" style={{ borderColor: TRACE_BORDER_SOFT, background: TRACE_TABLE_HEAD }}>
              <tr className="text-left text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: TRACE_MUTED }}>
                <th className="sticky left-0 z-30 px-6 py-5" style={{ background: TRACE_TABLE_HEAD, boxShadow: '18px 0 24px rgba(118,84,111,0.08)' }}><TraceHeadLabel active={sortKey === 'family'} direction={sortDirection} onClick={() => onSort('family')}>Error Family</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'domain'} direction={sortDirection} onClick={() => onSort('domain')}>Domain</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'code'} direction={sortDirection} onClick={() => onSort('code')}>Code Cluster</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'intents'} direction={sortDirection} onClick={() => onSort('intents')}>Failed Intents</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'retrySuccess'} direction={sortDirection} onClick={() => onSort('retrySuccess')}>Retry Recovery</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'money'} direction={sortDirection} onClick={() => onSort('money')}>Money Exposed</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'hotspot'} direction={sortDirection} onClick={() => onSort('hotspot')}>Hotspot</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'cause'} direction={sortDirection} onClick={() => onSort('cause')}>Probable Cause</TraceHeadLabel></th>
                <th className="px-6 py-5 text-right">Suggested Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const rowBg = index % 2 === 0 ? TRACE_CREAM : TRACE_ALT
                return (
                <tr key={row.code} className="border-b transition-colors" style={{ borderColor: TRACE_BORDER_SOFT, background: rowBg }}>
                  <td
                    className="sticky left-0 z-10 px-6 py-5"
                    style={{ background: rowBg, boxShadow: '14px 0 22px rgba(118,84,111,0.08)' }}
                  >
                    <div className="text-[17px] font-bold" style={{ color: TRACE_TEXT }}>{row.family}</div>
                  </td>
                  <td className="px-6 py-5"><StatusTag tone={row.domain === 'Provider' ? 'neutral' : row.domain === 'Bank' ? 'warn' : 'dark'}>{row.domain}</StatusTag></td>
                  <td className="px-6 py-5 text-[15px] font-bold" style={{ fontFamily: FONT_MONO, color: TRACE_TEXT }}>{row.code}</td>
                  <td className="px-6 py-5 text-[18px] font-black" style={{ color: TRACE_TEXT }}>{row.intents}</td>
                  <td className="px-6 py-5 text-[16px] font-semibold" style={{ color: '#4F6558' }}>{row.retrySuccess}</td>
                  <td className="px-6 py-5 text-[18px] font-black" style={{ color: TRACE_TEXT }}>{row.money}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 text-[15px]" style={{ color: TRACE_MUTED }}>
                      {inferEntityFromHotspot(row.hotspot) ? (
                        <EntityLogo
                          name={inferEntityFromHotspot(row.hotspot)?.name ?? ''}
                          kind={inferEntityFromHotspot(row.hotspot)?.kind ?? 'psp'}
                          size={42}
                          className="rounded-[18px]"
                        />
                      ) : null}
                      <span>{row.hotspot}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[15px]" style={{ color: TRACE_MUTED }}>{row.cause}</td>
                  <td className="px-6 py-5 text-right">
                    <TraceActionButton tone={row.domain === 'Provider' ? 'slate' : row.domain === 'Bank' ? 'stone' : 'olive'}>
                      {row.action}
                    </TraceActionButton>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        <div className="mx-3 mb-3 flex flex-col gap-4 rounded-[24px] border px-6 py-5 md:flex-row md:items-center md:justify-between" style={{ borderColor: TRACE_BORDER, background: TRACE_CREAM, boxShadow: '8px 8px 18px rgba(118,84,111,0.08), inset 1px 1px 0 rgba(255,255,255,0.92)' }}>
          <div className="text-[15px]" style={{ color: TRACE_MUTED }}>Tracking <span className="font-bold" style={{ color: TRACE_TEXT }}>{rows.length}</span> active error clusters with retry and value context</div>
          <div className="flex items-center gap-2">
            <TraceActionButton tone="stone">Export taxonomy evidence</TraceActionButton>
            <TraceActionButton tone="olive">Open Queue</TraceActionButton>
          </div>
        </div>
      </WideTableCard>
    </>
  )
}

function EventExplorerView() {
  const [filter, setFilter] = useState<EventFilter>('All')
  const [expandedEvent, setExpandedEvent] = useState<string | null>(EVENT_ROWS[0].eventId)
  const [sortKey, setSortKey] = useState<EventSortKey>('receivedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const rows = useMemo(() => {
    const filtered = filter === 'All' ? [...EVENT_ROWS] : EVENT_ROWS.filter((row) => row.source === filter)
    return filtered.sort((left, right) => {
      const leftValue =
        sortKey === 'traceId'
          ? left.traceId
          : sortKey === 'source'
          ? left.source
          : sortKey === 'stage'
          ? left.stage
          : sortKey === 'receivedAt'
          ? parseClock(left.receivedAt)
          : sortKey === 'latency'
          ? parseLatency(left.latency)
          : sortKey === 'payload'
          ? parsePayloadSize(left.payload)
          : sortKey === 'status'
          ? left.status
          : sortKey === 'note'
          ? left.note
          : left.eventId
      const rightValue =
        sortKey === 'traceId'
          ? right.traceId
          : sortKey === 'source'
          ? right.source
          : sortKey === 'stage'
          ? right.stage
          : sortKey === 'receivedAt'
          ? parseClock(right.receivedAt)
          : sortKey === 'latency'
          ? parseLatency(right.latency)
          : sortKey === 'payload'
          ? parsePayloadSize(right.payload)
          : sortKey === 'status'
          ? right.status
          : sortKey === 'note'
          ? right.note
          : right.eventId
      const result = comparePrimitive(leftValue, rightValue)
      return sortDirection === 'asc' ? result : -result
    })
  }, [filter, sortDirection, sortKey])

  const onSort = (key: EventSortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection(key === 'receivedAt' || key === 'latency' ? 'desc' : 'asc')
  }

  return (
    <>
      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
        {EVENT_SUMMARY.map((item) => (
          <TraceMetricCard key={item.label} label={item.label} value={item.value} note={item.note} tone={item.tone} />
        ))}
      </section>

      <section className="mb-5">
        <AIStrip>
          Detected 41 polling events misaligned with statement confirmation records. Auto-reconciliation paused. Recommend verifying the raw SFTP file integrity from HDFC endpoints.
        </AIStrip>
        <ToolbarShell
          title="Event Explorer (Advanced)"
          subtitle="Raw event visibility across webhook, poll, statement, and parser layers with trace-level drilldowns."
          right={<ActionPill>Raw payloads ON</ActionPill>}
        >
          <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-center">
            <SearchField placeholder="Search trace, event, intent, payload hash" />
            <NeumoTabs items={EVENT_FILTERS} active={filter} onChange={setFilter} />
          </div>
          <div className="flex items-center gap-3">
            <ActionPill>Latency Sort</ActionPill>
            <ActionPill>Manage Columns</ActionPill>
          </div>
        </ToolbarShell>
      </section>

      <WideTableCard>
        <div className="m-3 max-h-[720px] overflow-auto rounded-[30px]" style={{ background: TRACE_CREAM, boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.92), inset 5px 5px 12px rgba(118,84,111,0.08)' }}>
          <table className="min-w-[1440px] w-full">
            <thead className="sticky top-0 z-20 border-b" style={{ borderColor: TRACE_BORDER_SOFT, background: TRACE_TABLE_HEAD }}>
              <tr className="text-left text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: TRACE_MUTED }}>
                <th className="sticky left-0 z-30 px-6 py-5" style={{ background: TRACE_TABLE_HEAD, boxShadow: '18px 0 24px rgba(118,84,111,0.08)' }}><TraceHeadLabel active={sortKey === 'eventId'} direction={sortDirection} onClick={() => onSort('eventId')}>Event ID</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'traceId'} direction={sortDirection} onClick={() => onSort('traceId')}>Trace / Intent</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'source'} direction={sortDirection} onClick={() => onSort('source')}>Source</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'stage'} direction={sortDirection} onClick={() => onSort('stage')}>Stage</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'receivedAt'} direction={sortDirection} onClick={() => onSort('receivedAt')}>Received At</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'latency'} direction={sortDirection} onClick={() => onSort('latency')}>Latency</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'payload'} direction={sortDirection} onClick={() => onSort('payload')}>Payload</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'status'} direction={sortDirection} onClick={() => onSort('status')}>Result</TraceHeadLabel></th>
                <th className="px-6 py-5"><TraceHeadLabel active={sortKey === 'note'} direction={sortDirection} onClick={() => onSort('note')}>Operator Note</TraceHeadLabel></th>
                <th className="px-6 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const expanded = expandedEvent === row.eventId
                const rowBg = index % 2 === 0 ? TRACE_CREAM : TRACE_ALT

                return (
                  <Fragment key={row.eventId}>
                    <tr key={row.eventId} className="border-b transition-colors" style={{ borderColor: TRACE_BORDER_SOFT, background: rowBg }}>
                      <td
                        className="sticky left-0 z-10 px-6 py-5 text-[15px] font-bold"
                        style={{ fontFamily: FONT_MONO, color: TRACE_TEXT, background: rowBg, boxShadow: '14px 0 22px rgba(118,84,111,0.08)' }}
                      >
                        {row.eventId}
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[15px] font-bold" style={{ fontFamily: FONT_MONO, color: TRACE_TEXT }}>{row.traceId}</div>
                        <div className="mt-2 text-[14px]" style={{ color: TRACE_MUTED }}>{row.intentId}</div>
                      </td>
                      <td className="px-6 py-5"><StatusTag tone={row.source === 'Webhook' ? 'neutral' : row.source === 'Statement' ? 'warn' : 'dark'}>{row.source}</StatusTag></td>
                      <td className="px-6 py-5 text-[16px] font-semibold" style={{ color: TRACE_TEXT }}>{row.stage}</td>
                      <td className="px-6 py-5 text-[15px]" style={{ color: TRACE_MUTED }}>{row.receivedAt}</td>
                      <td className="px-6 py-5 text-[16px] font-bold" style={{ color: TRACE_TEXT }}>{row.latency}</td>
                      <td className="px-6 py-5 text-[15px]" style={{ color: TRACE_MUTED }}>{row.payload}</td>
                      <td className="px-6 py-5"><StatusTag tone={row.status === 'Healthy' ? 'success' : row.status === 'Delayed' ? 'warn' : 'dark'}>{row.status}</StatusTag></td>
                      <td className="px-6 py-5 text-[15px]" style={{ color: TRACE_MUTED }}>{row.note}</td>
                      <td className="px-6 py-5 text-right">
                        <TraceActionButton
                          tone={row.status === 'Healthy' ? 'olive' : row.status === 'Delayed' ? 'stone' : 'slate'}
                          onClick={() => setExpandedEvent(expanded ? null : row.eventId)}
                        >
                          {expanded ? 'Collapse' : 'Inspect event'}
                        </TraceActionButton>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr key={`${row.eventId}-drawer`} className="border-b" style={{ borderColor: TRACE_BORDER_SOFT, background: TRACE_HOVER }}>
                        <td colSpan={10} className="px-6 py-5">
                          <div
                            className="grid gap-4 rounded-[24px] border p-5 md:grid-cols-4"
                            style={{
                              borderColor: TRACE_BORDER,
                              background: TRACE_DRAWER,
                              boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.85), 8px 8px 18px rgba(118,84,111,0.10)',
                              animation: 'traceDrawerIn 220ms ease-out',
                            }}
                          >
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: TRACE_MUTED }}>Trace Anchor</div>
                              <div className="mt-2 text-[15px] font-semibold" style={{ fontFamily: FONT_MONO, color: TRACE_TEXT }}>{row.traceId}</div>
                            </div>
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: TRACE_MUTED }}>Payload Summary</div>
                              <div className="mt-2 text-[15px]" style={{ color: TRACE_MUTED }}>{row.payload} captured from {row.source}. Stage: {row.stage}.</div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <TraceSubChip tone="slate">{row.source}</TraceSubChip>
                                <TraceSubChip tone={row.status === 'Healthy' ? 'olive' : row.status === 'Delayed' ? 'stone' : 'slate'}>{row.status}</TraceSubChip>
                                <TraceSubChip tone="stone">{row.latency}</TraceSubChip>
                              </div>
                            </div>
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: TRACE_MUTED }}>Explainability</div>
                              <div className="mt-2 text-[15px]" style={{ color: TRACE_MUTED }}>{row.note}. Latency landed at {row.latency}.</div>
                            </div>
                            <div className="flex items-start justify-end gap-2 md:justify-start">
                              <TraceActionButton tone="slate">Open raw payload</TraceActionButton>
                              <TraceActionButton tone="stone">Export event evidence</TraceActionButton>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mx-3 mb-3 flex flex-col gap-4 rounded-[24px] border px-6 py-5 md:flex-row md:items-center md:justify-between" style={{ borderColor: TRACE_BORDER, background: TRACE_CREAM, boxShadow: '8px 8px 18px rgba(118,84,111,0.08), inset 1px 1px 0 rgba(255,255,255,0.92)' }}>
          <div className="text-[15px]" style={{ color: TRACE_MUTED }}>Showing <span className="font-bold" style={{ color: TRACE_TEXT }}>{rows.length}</span> of 286 events inside this explorer window</div>
          <div className="flex items-center gap-2">
            <TraceActionButton tone="stone">Prev</TraceActionButton>
            <TraceActionButton tone="olive">1</TraceActionButton>
            <TraceActionButton tone="stone">2</TraceActionButton>
            <TraceActionButton tone="stone">Next</TraceActionButton>
          </div>
        </div>
      </WideTableCard>
    </>
  )
}

export default function TracePage() {
  const [activeTab, setActiveTab] = useState<TraceTab>('Intent Journal')

  return (
    <DashboardLayout mainClassName="relative z-10 !px-2 md:!px-2">
      <div className="font-sans relative">
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" style={{ background: '#F0F2F5' }}>
          <div className="absolute inset-0 bg-noise opacity-30" />
          <div className="absolute inset-0" style={{ background: TRACE_PAGE_SPOTS }} />
          <div className="absolute -left-20 top-24 h-72 w-72 rounded-full opacity-60" style={{ background: 'rgba(255,255,255,0.5)', filter: 'blur(120px)' }} />
        </div>

        <div className="relative z-10">
        <section className="mb-6 flex items-center justify-between gap-4">
          <div>
            <TraceHeaderPill>Trace & Debug</TraceHeaderPill>
            <h1 className="mt-4 text-[38px] font-black leading-none tracking-[-0.05em]" style={{ color: TRACE_TEXT }}>Intent-level truth, system-level failure context, and raw event visibility</h1>
            <p className="mt-3 max-w-[980px] text-[18px] leading-8" style={{ color: TRACE_MUTED }}>
              TRACE is the operator workspace for proving what happened, why it happened, and where the payout system is breaking before support and finance lose time.
            </p>
          </div>
          <TraceActionButton tone="stone">Export trace evidence</TraceActionButton>
        </section>

        <section className="mb-4 flex justify-start">
          <NeumoTabs items={TRACE_TABS} active={activeTab} onChange={setActiveTab} />
        </section>

        <TraceRangeToolbar />

        {activeTab === 'Intent Journal' ? <IntentJournalView /> : activeTab === 'Error Taxonomy' ? <ErrorTaxonomyView /> : <EventExplorerView />}

        <style jsx global>{`
          @keyframes traceDrawerIn {
            0% {
              opacity: 0;
              transform: translateY(8px) scale(0.985);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
        </div>
      </div>
    </DashboardLayout>
  )
}
