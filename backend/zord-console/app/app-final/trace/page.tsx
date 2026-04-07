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

const NEUMO_POP = '12px 12px 28px rgba(142,147,125,0.34), -10px -10px 24px rgba(202,209,185,0.88), inset 0 1px 0 rgba(213,220,191,0.58)'
const NEUMO_PRESS = 'inset 8px 8px 18px rgba(142,147,125,0.24), inset -8px -8px 18px rgba(213,220,191,0.72)'

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
      <path d="M4 6l4 4 4-4" stroke="#687361" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TraceSortGlyph({ active = false, direction = 'asc' }: { active?: boolean; direction?: SortDirection }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${active ? 'text-[#495441]' : 'text-[#73806B]'}`}>
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
              background: '#A8AE94',
              color: '#414B3B',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '4px 4px 10px rgba(107,115,96,0.24), -4px -4px 10px rgba(202,209,185,0.7), inset 6px 6px 12px rgba(88,93,77,0.52), inset -6px -6px 12px rgba(194,201,171,0.34)',
            }
          : {
              color: '#576152',
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
        background: 'linear-gradient(180deg, #FFFDF8 0%, #F6EEDC 100%)',
        borderColor: '#E0D4BB',
        color: '#283226',
        boxShadow: '0 12px 24px rgba(188,177,147,0.16), inset 0 1px 0 rgba(255,255,255,0.84)',
      }}
    >
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A7B5B]">{label}</span>
      <span className="flex w-full items-center gap-3">
        <span className="flex-1 truncate text-[15px] font-black tracking-[-0.02em] text-[#283226]">{value}</span>
        <span
          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border"
          style={{
            borderColor: '#E5D8C1',
            background: '#FBF7EE',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.82)',
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
    background: 'linear-gradient(180deg, #FFFDF8 0%, #F6EEDC 100%)',
    border: '1px solid #E0D4BB',
    borderRadius: 22,
    boxShadow: '18px 18px 32px rgba(188,177,147,0.18), -12px -12px 24px rgba(255,255,255,0.72)',
    padding: 8,
    zIndex: 30,
  }

  const optionStyle = (active: boolean) =>
    ({
      width: '100%',
      border: 'none',
      background: active ? '#EEF1E4' : 'transparent',
      borderRadius: 14,
      textAlign: 'left' as const,
      padding: '10px 12px',
      fontSize: 13,
      fontWeight: 700,
      color: '#374135',
      cursor: 'pointer',
      boxShadow: active ? 'inset 5px 5px 12px rgba(169,176,149,0.3), inset -5px -5px 12px rgba(255,255,255,0.84)' : 'none',
    })

  return (
    <div
      ref={toolbarRef}
      className="mb-6 rounded-[36px] border p-3.5"
      style={{
        background: 'linear-gradient(180deg, #FFFDF8 0%, #F6EFE1 100%)',
        borderColor: '#E4D9C3',
        boxShadow: '0 18px 34px rgba(188,177,147,0.14), inset 0 1px 0 rgba(255,255,255,0.88)',
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
          className="flex min-h-[70px] min-w-[88px] flex-col items-center justify-center rounded-[24px] border px-4 py-3 text-[#55614E]"
          style={{
            background: '#A8AE94',
            borderColor: 'rgba(255,255,255,0.24)',
            boxShadow: 'inset 7px 7px 14px rgba(142,147,130,0.48), inset -7px -7px 14px rgba(213,220,191,0.74)',
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
            className="inline-flex h-[70px] w-[70px] items-center justify-center rounded-[24px] border text-[30px] font-bold leading-none text-[#4A5D4E]"
            style={{
              background: 'linear-gradient(180deg, #FFF9ED 0%, #F2E6D2 100%)',
              borderColor: '#E0D4BB',
              boxShadow: '0 12px 24px rgba(188,177,147,0.16), inset 0 1px 0 rgba(255,255,255,0.86)',
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
        background: '#A8AE94',
        border: '2px solid rgba(255,255,255,0.2)',
        boxShadow: '4px 4px 10px rgba(107,115,96,0.3), -4px -4px 10px rgba(213,220,191,0.72), inset 6px 6px 12px rgba(88,93,77,0.6), inset -6px -6px 12px rgba(194,201,171,0.4)',
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
                    background: '#F7F1E3',
                    color: '#4B5345',
                    boxShadow: '6px 6px 16px rgba(107,115,96,0.24), -4px -4px 14px rgba(255,255,255,0.42)',
                    textShadow: '1px 1px 0 rgba(255,255,255,0.22)',
                  }
                : {
                    color: '#5C6455',
                    textShadow: '1px 1px 0 rgba(255,255,255,0.18)',
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
      className="inline-flex items-center gap-2 rounded-full border border-[#D6DCCA] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[#66705D]"
      style={{
        background: 'linear-gradient(180deg, #F9F2E4 0%, #F5E8D1 100%)',
        boxShadow: '8px 8px 18px rgba(181,139,98,0.16), -8px -8px 18px rgba(243,186,132,0.48), inset 0 1px 0 rgba(251,237,198,0.62)',
      }}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-[#7A8A76]" />
      {children}
    </div>
  )
}

function TraceMetricCard({ label, value, note }: { label: string; value: string; note: string; tone?: 'neutral' | 'accent' }) {
  const toneStyle = {
    background: '#A8AE94',
    borderColor: 'rgba(255,255,255,0.2)',
    boxShadow: '4px 4px 10px rgba(107,115,96,0.3), -4px -4px 10px rgba(213,220,191,0.72), inset 6px 6px 12px rgba(88,93,77,0.6), inset -6px -6px 12px rgba(194,201,171,0.4)',
  }
  return (
    <div className="rounded-[30px] border p-6" style={toneStyle}>
      <div
        className="inline-flex rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5A6452]"
        style={{
          background: '#A8AE94',
          borderColor: 'rgba(255,255,255,0.16)',
          boxShadow: 'inset 5px 5px 10px #8E9382, inset -5px -5px 10px #D5DCBF',
          textShadow: '1px 1px 1px rgba(213,220,191,0.65)',
        }}
      >
        {label}
      </div>
      <div className="mt-5 text-[38px] font-black leading-none tracking-[-0.05em] text-[#142015]">{value}</div>
      <div className="mt-3 text-[15px] leading-7 text-[#4E5749]">{note}</div>
    </div>
  )
}

function ToolbarShell({ title, subtitle, right, children }: { title: string; subtitle: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div
      className="rounded-[38px] border p-7"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFAF7 100%)',
        borderColor: '#E8E1D2',
        boxShadow: '0 18px 36px rgba(15,23,42,0.06), 0 3px 8px rgba(15,23,42,0.03), inset 0 1px 0 rgba(255,255,255,0.94)',
      }}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-[32px] font-black tracking-[-0.04em] text-[#101828]">{title}</div>
          <div className="mt-2 max-w-[780px] text-[16px] leading-8 text-[#667085]">{subtitle}</div>
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
        background: '#FFFFFF',
        borderColor: '#E7E2D6',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.92), 0 6px 18px rgba(15,23,42,0.04)',
      }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#ECE7DC] bg-[#FCFBF8] shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B7280]">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </div>
      <input
        readOnly
        value=""
        placeholder={placeholder}
        className="w-full bg-transparent text-[15px] font-semibold text-[#1F2937] outline-none placeholder:text-[#98A2B3]"
      />
    </div>
  )
}

function ActionPill({ children }: { children: ReactNode }) {
  return (
    <div
      className="inline-flex min-h-[52px] items-center rounded-[18px] border px-5 py-3.5 text-[15px] font-bold text-[#344054]"
      style={{
        background: '#FFFFFF',
        borderColor: '#E7E2D6',
        boxShadow: '0 8px 18px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.94)',
      }}
    >
      {children}
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
          background: '#A8AE94',
          borderColor: 'rgba(255,255,255,0.2)',
          color: '#30402F',
          boxShadow: '4px 4px 10px rgba(107,115,96,0.24), -4px -4px 10px rgba(202,209,185,0.66), inset 6px 6px 12px rgba(88,93,77,0.56), inset -6px -6px 12px rgba(194,201,171,0.32)',
        }
      : tone === 'slate'
      ? {
          background: '#A8AE94',
          borderColor: 'rgba(255,255,255,0.22)',
          color: '#32444B',
          boxShadow: '4px 4px 10px rgba(107,115,96,0.24), -4px -4px 10px rgba(202,209,185,0.66), inset 6px 6px 12px rgba(88,93,77,0.56), inset -6px -6px 12px rgba(194,201,171,0.32)',
        }
      : {
          background: '#A8AE94',
          borderColor: 'rgba(255,255,255,0.22)',
          color: '#5B4E37',
          boxShadow: '4px 4px 10px rgba(107,115,96,0.24), -4px -4px 10px rgba(202,209,185,0.66), inset 6px 6px 12px rgba(88,93,77,0.56), inset -6px -6px 12px rgba(194,201,171,0.32)',
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
  const toneClass =
    tone === 'olive'
      ? 'border-[#C8D4C1] bg-[#EEF5EA] text-[#4B6341]'
      : tone === 'slate'
      ? 'border-[#C5D2D7] bg-[#ECF3F5] text-[#42555D]'
      : 'border-[#E5DAC0] bg-[#F8F0DF] text-[#756243]'

  return <span className={`inline-flex rounded-full border px-3 py-1 text-[12px] font-semibold ${toneClass}`}>{children}</span>
}

function WideTableCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-[36px] border"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFAF7 100%)',
        borderColor: '#E8E1D2',
        boxShadow: '0 22px 44px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.03), inset 0 1px 0 rgba(255,255,255,0.96)',
      }}
    >
      {children}
    </div>
  )
}

function StatusTag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warn' | 'dark' }) {
  const toneClasses =
    tone === 'success'
      ? 'border-[#C7D4BE] bg-[#EAF2E5] text-[#4B6341]'
      : tone === 'warn'
      ? 'border-[#E7D3BC] bg-[#F5E6D7] text-[#8D5E34]'
      : tone === 'dark'
      ? 'border-[#B4C2C7] bg-[#E6EEF1] text-[#41535B]'
      : 'border-[#D9D0BF] bg-[#F5EEDA] text-[#6B6555]'
  return <span className={`inline-flex rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${toneClasses}`}>{children}</span>
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
        <div className="m-3 max-h-[720px] overflow-auto rounded-[30px] bg-[#FFFFFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
          <table className="min-w-[1400px] w-full">
            <thead className="sticky top-0 z-20 border-b border-[#EAE5DC] bg-[linear-gradient(180deg,#FBFAF7,#F3F0E8)]">
              <tr className="text-left text-[13px] font-bold uppercase tracking-[0.08em] text-[#667085]">
                <th className="sticky left-0 z-30 px-6 py-5 bg-[linear-gradient(180deg,#FBFAF7,#F3F0E8)]" style={{ boxShadow: '18px 0 24px rgba(15,23,42,0.08)' }}><TraceHeadLabel active={sortKey === 'intentId'} direction={sortDirection} onClick={() => onSort('intentId')}>Intent / Seller</TraceHeadLabel></th>
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

                return (
                  <Fragment key={row.intentId}>
                    <tr key={row.intentId} className={`border-b border-[#F0ECE4] ${index % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#FCFBF8]'} transition-colors hover:bg-[#F8F5EE]`}>
                      <td
                        className="sticky left-0 z-10 px-6 py-5"
                        style={{ background: index % 2 === 0 ? '#FFFFFF' : '#FCFBF8', boxShadow: '14px 0 22px rgba(15,23,42,0.08)' }}
                      >
                        <div className="text-[18px] font-bold text-[#111827]" style={{ fontFamily: FONT_MONO }}>{row.intentId}</div>
                        <div className="mt-2 text-[16px] font-semibold text-[#344054]">{row.seller}</div>
                        <div className="mt-1 text-[14px] text-[#7B8190]">{row.sellerId}</div>
                      </td>
                      <td className="px-6 py-5 text-[19px] font-black text-[#182230]">{row.amount}</td>
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
                        <div className="text-[15px] font-bold text-[#1D2939]" style={{ fontFamily: FONT_MONO }}>{row.traceId}</div>
                        <div className="mt-2 flex items-center gap-3">
                          {inferBankNameFromReference(row.bankRef) ? (
                            <EntityLogo name={inferBankNameFromReference(row.bankRef) ?? ''} kind="bank" size={42} className="rounded-[18px]" />
                          ) : null}
                          <div className="text-[14px] text-[#7B8190]">{row.bankRef}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[16px] font-semibold text-[#1D2939]">{row.lastEvent}</div>
                        <div className="mt-2 text-[14px] text-[#7B8190]">Updated {row.updated}</div>
                      </td>
                      <td className="px-6 py-5 text-[15px] text-[#5F6C80]">{row.explainability}</td>
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
                      <tr key={`${row.intentId}-drawer`} className="border-b border-[#EAE5DC] bg-[#F8F5EE]">
                        <td colSpan={9} className="px-6 py-5">
                          <div
                            className="grid gap-4 rounded-[24px] border border-[#D6CFBF] bg-[linear-gradient(145deg,#F7F1E4,#EFE4CF)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),8px_8px_18px_rgba(188,177,147,0.14)] md:grid-cols-4"
                            style={{ animation: 'traceDrawerIn 220ms ease-out' }}
                          >
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#7A735F]">Trace Path</div>
                              <div className="mt-2 text-[15px] font-semibold text-[#1D2939]">{row.psp} dispatch -&gt; {row.lastEvent}</div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <TraceSubChip tone="olive">Dispatch ack</TraceSubChip>
                                <TraceSubChip tone={row.status === 'SUCCESS' ? 'olive' : 'stone'}>{row.lastEvent}</TraceSubChip>
                                <TraceSubChip tone="slate">{row.updated}</TraceSubChip>
                              </div>
                            </div>
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#7A735F]">Operator Read</div>
                              <div className="mt-2 text-[15px] text-[#5E6557]">{row.explainability}. Bank ref: {row.bankRef}.</div>
                            </div>
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#7A735F]">Recommended Move</div>
                              <div className="mt-2 text-[15px] text-[#5E6557]">{row.action} for this intent. Escalate if it remains unchanged beyond the next polling window.</div>
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
        <div className="mx-3 mb-3 flex flex-col gap-4 rounded-[24px] border border-[#E8E1D2] bg-[#FFFFFF] px-6 py-5 md:flex-row md:items-center md:justify-between" style={{ boxShadow: '0 10px 20px rgba(15,23,42,0.04)' }}>
          <div className="text-[15px] text-[#667085]">Showing <span className="font-bold text-[#152218]">{rows.length}</span> of 124 intents in this trace window</div>
          <div className="flex items-center gap-2">
            {['1', '2', '3', '4'].map((page) => (
              <button
                key={page}
                className="h-10 w-10 rounded-[14px] border text-[14px] font-bold"
                style={
                  page === '1'
                    ? {
                        background: 'linear-gradient(145deg, #BDC9B8 0%, #AEB9A8 100%)',
                        borderColor: '#A1AC9D',
                        color: '#243225',
                        boxShadow: '6px 6px 14px rgba(161,172,157,0.24), -6px -6px 14px rgba(217,231,211,0.72), inset 0 1px 0 rgba(255,255,255,0.44)',
                      }
                    : {
                        background: 'linear-gradient(145deg, #F7F0DF 0%, #EFE4C9 100%)',
                        borderColor: '#E1D4B2',
                        color: '#6B6555',
                        boxShadow: '5px 5px 12px rgba(188,177,147,0.18), -5px -5px 12px rgba(251,237,198,0.68)',
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
        <div className="m-3 max-h-[720px] overflow-auto rounded-[30px] bg-[#FFFFFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
          <table className="min-w-[1380px] w-full">
            <thead className="sticky top-0 z-20 border-b border-[#EAE5DC] bg-[linear-gradient(180deg,#FBFAF7,#F3F0E8)]">
              <tr className="text-left text-[13px] font-bold uppercase tracking-[0.08em] text-[#667085]">
                <th className="sticky left-0 z-30 px-6 py-5 bg-[linear-gradient(180deg,#FBFAF7,#F3F0E8)]" style={{ boxShadow: '18px 0 24px rgba(15,23,42,0.08)' }}><TraceHeadLabel active={sortKey === 'family'} direction={sortDirection} onClick={() => onSort('family')}>Error Family</TraceHeadLabel></th>
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
              {rows.map((row, index) => (
                <tr key={row.code} className={`border-b border-[#F0ECE4] ${index % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#FCFBF8]'} hover:bg-[#F8F5EE] transition-colors`}>
                  <td
                    className="sticky left-0 z-10 px-6 py-5"
                    style={{ background: index % 2 === 0 ? '#FFFFFF' : '#FCFBF8', boxShadow: '14px 0 22px rgba(15,23,42,0.08)' }}
                  >
                    <div className="text-[17px] font-bold text-[#111827]">{row.family}</div>
                  </td>
                  <td className="px-6 py-5"><StatusTag tone={row.domain === 'Provider' ? 'neutral' : row.domain === 'Bank' ? 'warn' : 'dark'}>{row.domain}</StatusTag></td>
                  <td className="px-6 py-5 text-[15px] font-bold text-[#1D2939]" style={{ fontFamily: FONT_MONO }}>{row.code}</td>
                  <td className="px-6 py-5 text-[18px] font-black text-[#101828]">{row.intents}</td>
                  <td className="px-6 py-5 text-[16px] font-semibold text-[#4B6341]">{row.retrySuccess}</td>
                  <td className="px-6 py-5 text-[18px] font-black text-[#101828]">{row.money}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 text-[15px] text-[#475467]">
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
                  <td className="px-6 py-5 text-[15px] text-[#667085]">{row.cause}</td>
                  <td className="px-6 py-5 text-right">
                    <TraceActionButton tone={row.domain === 'Provider' ? 'slate' : row.domain === 'Bank' ? 'stone' : 'olive'}>
                      {row.action}
                    </TraceActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mx-3 mb-3 flex flex-col gap-4 rounded-[24px] border border-[#E8E1D2] bg-[#FFFFFF] px-6 py-5 md:flex-row md:items-center md:justify-between" style={{ boxShadow: '0 10px 20px rgba(15,23,42,0.04)' }}>
          <div className="text-[15px] text-[#667085]">Tracking <span className="font-bold text-[#152218]">{rows.length}</span> active error clusters with retry and value context</div>
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
        <div className="m-3 max-h-[720px] overflow-auto rounded-[30px] bg-[#FFFFFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
          <table className="min-w-[1440px] w-full">
            <thead className="sticky top-0 z-20 border-b border-[#EAE5DC] bg-[linear-gradient(180deg,#FBFAF7,#F3F0E8)]">
              <tr className="text-left text-[13px] font-bold uppercase tracking-[0.08em] text-[#667085]">
                <th className="sticky left-0 z-30 px-6 py-5 bg-[linear-gradient(180deg,#FBFAF7,#F3F0E8)]" style={{ boxShadow: '18px 0 24px rgba(15,23,42,0.08)' }}><TraceHeadLabel active={sortKey === 'eventId'} direction={sortDirection} onClick={() => onSort('eventId')}>Event ID</TraceHeadLabel></th>
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

                return (
                  <Fragment key={row.eventId}>
                    <tr key={row.eventId} className={`border-b border-[#F0ECE4] ${index % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#FCFBF8]'} transition-colors hover:bg-[#F8F5EE]`}>
                      <td
                        className="sticky left-0 z-10 px-6 py-5 text-[15px] font-bold text-[#1D2939]"
                        style={{ fontFamily: FONT_MONO, background: index % 2 === 0 ? '#FFFFFF' : '#FCFBF8', boxShadow: '14px 0 22px rgba(15,23,42,0.08)' }}
                      >
                        {row.eventId}
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[15px] font-bold text-[#1D2939]" style={{ fontFamily: FONT_MONO }}>{row.traceId}</div>
                        <div className="mt-2 text-[14px] text-[#7B8190]">{row.intentId}</div>
                      </td>
                      <td className="px-6 py-5"><StatusTag tone={row.source === 'Webhook' ? 'neutral' : row.source === 'Statement' ? 'warn' : 'dark'}>{row.source}</StatusTag></td>
                      <td className="px-6 py-5 text-[16px] font-semibold text-[#111827]">{row.stage}</td>
                      <td className="px-6 py-5 text-[15px] text-[#475467]">{row.receivedAt}</td>
                      <td className="px-6 py-5 text-[16px] font-bold text-[#111827]">{row.latency}</td>
                      <td className="px-6 py-5 text-[15px] text-[#475467]">{row.payload}</td>
                      <td className="px-6 py-5"><StatusTag tone={row.status === 'Healthy' ? 'success' : row.status === 'Delayed' ? 'warn' : 'dark'}>{row.status}</StatusTag></td>
                      <td className="px-6 py-5 text-[15px] text-[#667085]">{row.note}</td>
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
                      <tr key={`${row.eventId}-drawer`} className="border-b border-[#EAE5DC] bg-[#F8F5EE]">
                        <td colSpan={10} className="px-6 py-5">
                          <div
                            className="grid gap-4 rounded-[24px] border border-[#D6CFBF] bg-[linear-gradient(145deg,#F7F1E4,#EFE4CF)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),8px_8px_18px_rgba(188,177,147,0.14)] md:grid-cols-4"
                            style={{ animation: 'traceDrawerIn 220ms ease-out' }}
                          >
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#7A735F]">Trace Anchor</div>
                              <div className="mt-2 text-[15px] font-semibold text-[#1D2939]" style={{ fontFamily: FONT_MONO }}>{row.traceId}</div>
                            </div>
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#7A735F]">Payload Summary</div>
                              <div className="mt-2 text-[15px] text-[#5E6557]">{row.payload} captured from {row.source}. Stage: {row.stage}.</div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <TraceSubChip tone="slate">{row.source}</TraceSubChip>
                                <TraceSubChip tone={row.status === 'Healthy' ? 'olive' : row.status === 'Delayed' ? 'stone' : 'slate'}>{row.status}</TraceSubChip>
                                <TraceSubChip tone="stone">{row.latency}</TraceSubChip>
                              </div>
                            </div>
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#7A735F]">Explainability</div>
                              <div className="mt-2 text-[15px] text-[#5E6557]">{row.note}. Latency landed at {row.latency}.</div>
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
        <div className="mx-3 mb-3 flex flex-col gap-4 rounded-[24px] border border-[#E8E1D2] bg-[#FFFFFF] px-6 py-5 md:flex-row md:items-center md:justify-between" style={{ boxShadow: '0 10px 20px rgba(15,23,42,0.04)' }}>
          <div className="text-[15px] text-[#667085]">Showing <span className="font-bold text-[#152218]">{rows.length}</span> of 286 events inside this explorer window</div>
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
    <DashboardLayout>
      <div className="font-sans">
        <section className="mb-6 flex items-center justify-between gap-4">
          <div>
            <TraceHeaderPill>Trace & Debug</TraceHeaderPill>
            <h1 className="mt-4 text-[38px] font-black leading-none tracking-[-0.05em] text-[#0F172A]">Intent-level truth, system-level failure context, and raw event visibility</h1>
            <p className="mt-3 max-w-[980px] text-[18px] leading-8 text-[#667085]">
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
    </DashboardLayout>
  )
}
