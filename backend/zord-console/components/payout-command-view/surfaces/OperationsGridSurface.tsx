'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EntityLogo, inferBankNameFromReference } from '@/app/app-final/_components/entity-logo'
import { chartTooltipStyle } from '../model'
import { Glyph, LightCard, SurfaceEyebrow } from '../shared'

type TraceTab = 'Intent Table' | 'DLQ Queue' | 'Heat Map' | 'Web Map' | 'Bar Analysis'
type AnalysisWindow = 'Week' | 'Month' | 'Quarter'

const TRACE_TABS: readonly TraceTab[] = ['Intent Table', 'DLQ Queue', 'Heat Map', 'Web Map', 'Bar Analysis']
const ANALYSIS_WINDOWS: readonly AnalysisWindow[] = ['Week', 'Month', 'Quarter']
const INTENT_ROWS_PER_PAGE = 5

const intentTraceRows = [
  {
    intentId: 'INT-TR-88214',
    beneficiary: 'Vendor Corridor A',
    amount: '₹4,82,450',
    company: 'GHCA Cohort 07',
    psp: 'Razorpay',
    rail: 'IMPS',
    status: 'Pending finality',
    traceId: 'ZRD-TRACE-3f8a9b2c',
    bankRef: 'ICICI26092024011958',
    updated: '11:33 AM',
    action: 'Open intent trail',
  },
  {
    intentId: 'INT-TR-88229',
    beneficiary: 'Collections Node B',
    amount: '₹1,44,200',
    company: 'GHCA Cohort 11',
    psp: 'Cashfree',
    rail: 'NEFT',
    status: 'Confirmed',
    traceId: 'ZRD-TRACE-1ab11ce1',
    bankRef: 'HDFC45092024099117',
    updated: '11:31 AM',
    action: 'Export evidence',
  },
  {
    intentId: 'INT-TR-88233',
    beneficiary: 'Marketplace Seller 09',
    amount: '₹88,900',
    company: 'GHCA Cohort 05',
    psp: 'PayU',
    rail: 'IMPS',
    status: 'In recovery',
    traceId: 'ZRD-TRACE-8dc67af2',
    bankRef: 'Awaited',
    updated: '11:29 AM',
    action: 'Check reroute lane',
  },
  {
    intentId: 'INT-TR-88244',
    beneficiary: 'Vendor Corridor C',
    amount: '₹2,16,700',
    company: 'GHCA Cohort 13',
    psp: 'Stripe',
    rail: 'RTGS',
    status: 'Confirmed',
    traceId: 'ZRD-TRACE-e6170cc1',
    bankRef: 'SBI66292024044188',
    updated: '11:24 AM',
    action: 'Close packet',
  },
  {
    intentId: 'INT-TR-88257',
    beneficiary: 'Settlement Partner M',
    amount: '₹3,08,510',
    company: 'GHCA Cohort 04',
    psp: 'Razorpay',
    rail: 'NEFT',
    status: 'Pending finality',
    traceId: 'ZRD-TRACE-f2ae5be8',
    bankRef: 'AXIS10892024188761',
    updated: '11:20 AM',
    action: 'Await statement lock',
  },
  {
    intentId: 'INT-TR-88263',
    beneficiary: 'Collections Lane D',
    amount: '₹1,97,860',
    company: 'GHCA Cohort 06',
    psp: 'Cashfree',
    rail: 'IMPS',
    status: 'Pending finality',
    traceId: 'ZRD-TRACE-a92b87f1',
    bankRef: 'HDFC99242024077662',
    updated: '11:17 AM',
    action: 'Open intent trail',
  },
  {
    intentId: 'INT-TR-88271',
    beneficiary: 'Marketplace Seller 14',
    amount: '₹74,600',
    company: 'GHCA Cohort 03',
    psp: 'PayU',
    rail: 'NEFT',
    status: 'In recovery',
    traceId: 'ZRD-TRACE-92dcf8b6',
    bankRef: 'Awaited',
    updated: '11:15 AM',
    action: 'Check reroute lane',
  },
  {
    intentId: 'INT-TR-88278',
    beneficiary: 'Vendor Corridor E',
    amount: '₹5,12,330',
    company: 'GHCA Cohort 15',
    psp: 'Stripe',
    rail: 'RTGS',
    status: 'Confirmed',
    traceId: 'ZRD-TRACE-6ac4f702',
    bankRef: 'SBI66292024111008',
    updated: '11:11 AM',
    action: 'Close packet',
  },
  {
    intentId: 'INT-TR-88284',
    beneficiary: 'Settlement Node Q',
    amount: '₹2,49,990',
    company: 'GHCA Cohort 10',
    psp: 'Razorpay',
    rail: 'NEFT',
    status: 'Pending finality',
    traceId: 'ZRD-TRACE-18ea95d3',
    bankRef: 'AXIS10892024210241',
    updated: '11:07 AM',
    action: 'Await statement lock',
  },
  {
    intentId: 'INT-TR-88295',
    beneficiary: 'Collections Partner X',
    amount: '₹1,06,450',
    company: 'GHCA Cohort 08',
    psp: 'Cashfree',
    rail: 'IMPS',
    status: 'Confirmed',
    traceId: 'ZRD-TRACE-c8f72ab0',
    bankRef: 'ICICI26092024133221',
    updated: '11:01 AM',
    action: 'Export evidence',
  },
  {
    intentId: 'INT-TR-88302',
    beneficiary: 'Vendor Corridor H',
    amount: '₹3,64,220',
    company: 'GHCA Cohort 14',
    psp: 'Stripe',
    rail: 'RTGS',
    status: 'In recovery',
    traceId: 'ZRD-TRACE-1dbe88ca',
    bankRef: 'Awaited',
    updated: '10:56 AM',
    action: 'Check reroute lane',
  },
] as const

const dlqQueueRows = [
  {
    dlqId: 'DLQ-1042',
    intentId: 'INT-TR-88217',
    company: 'GHCA Cohort 05',
    psp: 'Razorpay',
    reason: 'Missing IFSC in payload',
    family: 'Data quality',
    retries: '2 / 5',
    moneyAtRisk: '₹52,800',
    owner: 'Ops',
    age: '7m',
    nextMove: 'Patch + replay',
  },
  {
    dlqId: 'DLQ-1049',
    intentId: 'INT-TR-88261',
    company: 'GHCA Cohort 09',
    psp: 'Cashfree',
    reason: 'Callback hash mismatch',
    family: 'Provider callback',
    retries: '1 / 5',
    moneyAtRisk: '₹1,18,200',
    owner: 'Engineering',
    age: '12m',
    nextMove: 'Signature trace',
  },
  {
    dlqId: 'DLQ-1053',
    intentId: 'INT-TR-88264',
    company: 'GHCA Cohort 02',
    psp: 'PayU',
    reason: 'Bank statement lag > SLA',
    family: 'Bank latency',
    retries: '0 / 5',
    moneyAtRisk: '₹3,04,100',
    owner: 'Bank Ops',
    age: '16m',
    nextMove: 'Escalate bank desk',
  },
  {
    dlqId: 'DLQ-1056',
    intentId: 'INT-TR-88270',
    company: 'GHCA Cohort 12',
    psp: 'Stripe',
    reason: 'Beneficiary branch mismatch',
    family: 'Data quality',
    retries: '3 / 5',
    moneyAtRisk: '₹84,440',
    owner: 'Ops',
    age: '21m',
    nextMove: 'Validate account map',
  },
] as const

const heatMapHours = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'] as const
const heatMapRows = [
  { label: 'PSP issues', values: [4, 6, 8, 7, 5, 3] },
  { label: 'Bank lag', values: [3, 5, 9, 8, 6, 4] },
  { label: 'Data quality', values: [2, 4, 6, 5, 4, 3] },
  { label: 'Governance rules', values: [1, 2, 4, 5, 4, 2] },
] as const

const webMapData = [
  { subject: 'Routing Quality', value: 86 },
  { subject: 'Callback Trust', value: 74 },
  { subject: 'Bank Finality', value: 68 },
  { subject: 'Evidence Completeness', value: 92 },
  { subject: 'SLA Discipline', value: 81 },
  { subject: 'Exception Closure', value: 78 },
] as const

const barAnalysisDataByWindow: Record<AnalysisWindow, ReadonlyArray<{ lane: string; atRisk: number; recovered: number }>> = {
  Week: [
    { lane: 'IMPS', atRisk: 28, recovered: 22 },
    { lane: 'NEFT', atRisk: 24, recovered: 20 },
    { lane: 'RTGS', atRisk: 12, recovered: 10 },
    { lane: 'UPI', atRisk: 18, recovered: 15 },
  ],
  Month: [
    { lane: 'IMPS', atRisk: 92, recovered: 74 },
    { lane: 'NEFT', atRisk: 81, recovered: 66 },
    { lane: 'RTGS', atRisk: 44, recovered: 37 },
    { lane: 'UPI', atRisk: 63, recovered: 52 },
  ],
  Quarter: [
    { lane: 'IMPS', atRisk: 242, recovered: 204 },
    { lane: 'NEFT', atRisk: 214, recovered: 178 },
    { lane: 'RTGS', atRisk: 122, recovered: 101 },
    { lane: 'UPI', atRisk: 188, recovered: 156 },
  ],
}

const timelineSteps = [
  { step: 'Intent received', time: '11:32:01 AM', status: 'Complete' },
  { step: 'Sent to PSP', time: '11:32:05 AM', status: 'Complete' },
  { step: 'PSP processed', time: '11:32:24 AM', status: 'Complete' },
  { step: 'Bank check', time: '11:33:11 AM', status: 'In watch' },
  { step: 'Final outcome', time: '11:38:42 AM', status: 'Pending finality' },
] as const

function getHeatColor(value: number) {
  if (value >= 8) return '#111111'
  if (value >= 6) return 'rgba(17,17,17,0.76)'
  if (value >= 4) return 'rgba(17,17,17,0.52)'
  if (value >= 2) return 'rgba(17,17,17,0.28)'
  return 'rgba(17,17,17,0.12)'
}

function statusPill(status: string) {
  if (status === 'Confirmed') return 'border-[#4ADE80]/35 bg-[#effcf3] text-[#166534]'
  if (status === 'In recovery') return 'border-black/15 bg-[#f5f5f3] text-[#5f5f5a]'
  if (status === 'Pending finality') return 'border-black/15 bg-[#f5f5f3] text-[#111111]'
  return 'border-black/15 bg-white text-[#111111]'
}

function dlqFamilyPill(family: string) {
  if (family === 'Bank latency') return 'border-[#111111]/15 bg-[#f2f2ef] text-[#111111]'
  if (family === 'Provider callback') return 'border-[#4ADE80]/35 bg-[#effcf3] text-[#166534]'
  return 'border-black/15 bg-white text-[#5f5f5a]'
}

export function OperationsGridSurface() {
  const [activeTab, setActiveTab] = useState<TraceTab>('Intent Table')
  const [analysisWindow, setAnalysisWindow] = useState<AnalysisWindow>('Month')
  const [intentPage, setIntentPage] = useState(1)

  const analysisRows = useMemo(() => barAnalysisDataByWindow[analysisWindow], [analysisWindow])
  const intentTotalPages = useMemo(
    () => Math.max(1, Math.ceil(intentTraceRows.length / INTENT_ROWS_PER_PAGE)),
    [],
  )
  const paginatedIntentRows = useMemo(() => {
    const start = (intentPage - 1) * INTENT_ROWS_PER_PAGE
    return intentTraceRows.slice(start, start + INTENT_ROWS_PER_PAGE)
  }, [intentPage])

  useEffect(() => {
    setIntentPage(1)
  }, [activeTab])

  const renderTabContent = () => {
    if (activeTab === 'Heat Map') {
      return (
        <div className="mt-4 rounded-[1.25rem] border border-black/10 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-[15px] font-medium text-[#111111]">Money-at-risk heat map by cause and hour</div>
            <div className="flex items-center gap-2 text-[12px] text-[#6f716d]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#111111]" />
              Higher concentration
            </div>
          </div>
          <div className="grid gap-2.5" style={{ gridTemplateColumns: `170px repeat(${heatMapHours.length}, minmax(0, 1fr))` }}>
            <div />
            {heatMapHours.map((hour) => (
              <div key={hour} className="text-center text-[11px] font-medium text-[#8a8a86]">
                {hour}
              </div>
            ))}
            {heatMapRows.map((row) => (
              <div
                key={row.label}
                className="contents"
              >
                <div className="flex items-center text-[12px] font-medium text-[#6f716d]">
                  {row.label}
                </div>
                {row.values.map((value, index) => (
                  <div
                    key={`${row.label}-${index}`}
                    className="aspect-square rounded-[0.8rem] border border-black/8"
                    style={{ background: getHeatColor(value) }}
                    title={`${row.label} at ${heatMapHours[index]}: ${value}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (activeTab === 'Web Map') {
      return (
        <div className="mt-4 rounded-[1.25rem] border border-black/10 bg-white p-4">
          <div className="mb-2 text-[15px] font-medium text-[#111111]">Operational web map</div>
          <div className="text-[12px] text-[#6f716d]">
            Composite health across routing quality, callback trust, finality, and evidence discipline.
          </div>
          <div className="mt-4 h-[19rem]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={webMapData}>
                <PolarGrid stroke="rgba(17,17,17,0.15)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6f716d', fontSize: 11 }} />
                <PolarRadiusAxis axisLine={false} tick={false} domain={[0, 100]} />
                <Radar dataKey="value" stroke="#111111" fill="#4ADE80" fillOpacity={0.2} strokeWidth={2.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    }

    if (activeTab === 'Bar Analysis') {
      return (
        <div className="mt-4 rounded-[1.25rem] border border-black/10 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[15px] font-medium text-[#111111]">At-risk vs recovered payout value by lane</div>
            <div className="flex items-center gap-2 rounded-full bg-[#f5f5f3] p-1">
              {ANALYSIS_WINDOWS.map((window) => (
                <button
                  key={window}
                  type="button"
                  onClick={() => setAnalysisWindow(window)}
                  className={`rounded-full px-3 py-1.5 text-[12px] transition ${
                    analysisWindow === window ? 'bg-[#111111] text-white' : 'text-[#6f716d]'
                  }`}
                >
                  {window}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisRows} barGap={9}>
                <XAxis dataKey="lane" axisLine={false} tickLine={false} tick={{ fill: '#6f716d', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a8a86', fontSize: 12 }} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={false} />
                <Bar dataKey="atRisk" fill="#c6cbd4" radius={[7, 7, 0, 0]} />
                <Bar dataKey="recovered" fill="#111111" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 rounded-[0.95rem] bg-[#f7f7f5] p-3 text-[12px] leading-5 text-[#6f716d]">
            Analysis: recovered value is catching up fastest on IMPS and NEFT lanes; RTGS remains lower volume but stable, while UPI
            still needs tighter confirmation discipline in the active window.
          </div>
        </div>
      )
    }

    if (activeTab === 'DLQ Queue') {
      return (
        <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-black/10 bg-white">
          <div className="border-b border-black/8 bg-[#f7f7f8] px-4 py-3">
            <div className="text-[13px] font-medium text-[#111111]">DLQ queue and failure taxonomy</div>
            <div className="mt-1 text-[12px] text-[#6f716d]">Live view of intents waiting on replay, escalation, or payload repair.</div>
          </div>
          <div className="max-h-[24rem] overflow-auto">
            <table className="min-w-[1080px] w-full text-left">
              <thead className="sticky top-0 z-10 border-b border-black/10 bg-[#f7f7f8]">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a8a86]">
                  <th className="px-4 py-3">DLQ / Intent</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">PSP</th>
                  <th className="px-4 py-3">Cause</th>
                  <th className="px-4 py-3">Retries</th>
                  <th className="px-4 py-3">Money at risk</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3 text-right">Next move</th>
                </tr>
              </thead>
              <tbody>
                {dlqQueueRows.map((row, index) => (
                  <tr key={row.dlqId} className="border-b border-black/8" style={{ background: index % 2 === 0 ? '#ffffff' : '#fbfbf9' }}>
                    <td className="px-4 py-4">
                      <div className="text-[13px] font-semibold text-[#111111]">{row.dlqId}</div>
                      <div className="mt-1 text-[12px] text-[#6f716d]">{row.intentId}</div>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[#111111]">{row.company}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <EntityLogo name={row.psp} kind="psp" size={30} className="rounded-[10px]" />
                        <span className="sr-only">{row.psp}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[13px] text-[#111111]">{row.reason}</div>
                      <span className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${dlqFamilyPill(row.family)}`}>
                        {row.family}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[#6f716d]">{row.retries}</td>
                    <td className="px-4 py-4 text-[13px] font-semibold text-[#111111]">{row.moneyAtRisk}</td>
                    <td className="px-4 py-4 text-[12px] text-[#8a8a86]">{row.age}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => document.getElementById('trace-evidence-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="rounded-[0.75rem] border border-black/15 bg-white px-3 py-1.5 text-[12px] text-[#111111]"
                      >
                        {row.nextMove}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-black/8 bg-white px-4 py-3 text-[12px] text-[#6f716d]">
            {dlqQueueRows.length} DLQ records in focus • owners: Ops, Engineering, Bank Ops • ready for trace-level evidence drilldown.
          </div>
        </div>
      )
    }

    return (
      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-black/10 bg-white">
        <div className="border-b border-black/8 bg-[#f7f7f8] px-4 py-3">
          <div className="text-[13px] font-medium text-[#111111]">Intent trace journal</div>
          <div className="mt-1 text-[12px] text-[#6f716d]">Payment-level operating truth with PSP and bank references for fast incident response.</div>
        </div>
        <div className="max-h-[34rem] overflow-auto">
          <table className="min-w-[1320px] w-full text-left">
            <thead className="sticky top-0 z-10 border-b border-black/10 bg-[#f7f7f8]">
              <tr className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a8a86]">
                <th className="px-4 py-3">Intent / Beneficiary</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">PSP</th>
                <th className="px-4 py-3">Rail</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Trace / Bank ref</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIntentRows.map((row, index) => {
                const bankName = inferBankNameFromReference(row.bankRef)
                return (
                  <tr key={row.intentId} className="border-b border-black/8" style={{ background: index % 2 === 0 ? '#ffffff' : '#fbfbf9' }}>
                    <td className="px-4 py-5">
                      <div className="text-[15px] font-semibold text-[#111111]">{row.intentId}</div>
                      <div className="mt-1 text-[13px] text-[#6f716d]">{row.beneficiary}</div>
                    </td>
                    <td className="px-4 py-5 text-[15px] font-semibold text-[#111111]">{row.amount}</td>
                    <td className="px-4 py-5 text-[13px] text-[#6f716d]">{row.company}</td>
                    <td className="px-4 py-5">
                      <div className="flex items-center">
                        <EntityLogo name={row.psp} kind="psp" size={34} className="rounded-[10px]" />
                        <span className="sr-only">{row.psp}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-[13px] text-[#111111]">{row.rail}</td>
                    <td className="px-4 py-5">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusPill(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="text-[13px] font-medium text-[#111111]">{row.traceId}</div>
                      <div className="mt-1 flex items-center gap-2">
                        {bankName ? <EntityLogo name={bankName} kind="bank" size={26} className="rounded-[8px]" /> : null}
                        <span className="sr-only">{bankName ?? 'No bank yet'}</span>
                        <span className="text-[12px] text-[#6f716d]">{row.bankRef}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-[12px] text-[#8a8a86]">{row.updated}</td>
                    <td className="px-4 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => document.getElementById('trace-evidence-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="rounded-[0.75rem] border border-black/15 bg-white px-3 py-1.5 text-[12px] text-[#111111]"
                      >
                        {row.action}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-black/8 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[12px] text-[#6f716d]">
            Showing {(intentPage - 1) * INTENT_ROWS_PER_PAGE + 1}-{Math.min(intentPage * INTENT_ROWS_PER_PAGE, intentTraceRows.length)} of {intentTraceRows.length} intents • sorted by recency.
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIntentPage((current) => Math.max(1, current - 1))}
              disabled={intentPage === 1}
              className="rounded-[0.65rem] border border-black/15 bg-white px-2.5 py-1.5 text-[12px] text-[#111111] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: intentTotalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setIntentPage(page)}
                className={`h-8 min-w-8 rounded-[0.65rem] border px-2 text-[12px] transition ${
                  page === intentPage
                    ? 'border-[#111111] bg-[#111111] text-white'
                    : 'border-black/15 bg-white text-[#111111]'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIntentPage((current) => Math.min(intentTotalPages, current + 1))}
              disabled={intentPage === intentTotalPages}
              className="rounded-[0.65rem] border border-black/15 bg-white px-2.5 py-1.5 text-[12px] text-[#111111] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
      <LightCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <SurfaceEyebrow>Trace &amp; Evidence</SurfaceEyebrow>
            <div className="mt-2 text-[1.12rem] font-medium text-[#111111]">
              One screen to explain exactly what happened to this payment, end-to-end.
            </div>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById('trace-evidence-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="inline-flex items-center gap-2 rounded-[0.85rem] border border-black/15 bg-white px-3 py-2 text-[12px] font-medium text-[#111111]"
          >
            <Glyph name="document" className="h-4 w-4" />
            Open evidence pack
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-black/10 bg-[#f7f7f8]">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 px-4 py-4 text-[12px] text-[#6f716d] sm:grid-cols-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a8a86]">Amount</div>
              <div className="mt-1 text-[1.05rem] font-medium text-[#111111]">₹4,82,450</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a8a86]">Beneficiary</div>
              <div className="mt-1 text-[1.05rem] font-medium text-[#111111]">Vendor Corridor A</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a8a86]">Client</div>
              <div className="mt-1 text-[1.05rem] font-medium text-[#111111]">GHCA Cohort 07</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a8a86]">Status</div>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-black/12 bg-white px-2.5 py-1 text-[11px] font-medium text-[#111111]">
                <span className="h-2 w-2 rounded-full bg-[#4ADE80]" />
                Pending finality
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 rounded-[0.95rem] bg-[#f5f5f3] p-1.5">
          {TRACE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-[0.7rem] px-3 py-2 text-[12px] transition ${
                activeTab === tab ? 'bg-[#111111] text-white' : 'text-[#6f716d] hover:bg-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {renderTabContent()}

        <div className="mt-4 rounded-[1.2rem] border border-black/10 bg-white p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a8a86]">Timeline</div>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {timelineSteps.map((item) => (
              <div key={item.step} className="rounded-[0.8rem] border border-black/10 bg-[#f7f7f5] px-3 py-2">
                <div className="text-[12px] font-medium text-[#111111]">{item.step}</div>
                <div className="mt-0.5 text-[11px] text-[#6f716d]">
                  {item.time} • {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </LightCard>

      <div className="grid gap-4">
        <div id="trace-evidence-panel">
          <LightCard>
            <div className="flex items-center justify-between gap-3">
              <div>
                <SurfaceEyebrow>Evidence pack</SurfaceEyebrow>
                <div className="mt-2 text-[1.05rem] font-medium text-[#111111]">Evidence pack: 100% complete</div>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#4ADE80]/30 bg-[#4ADE80]/14 px-2.5 py-1 text-[11px] font-medium text-[#166534]">
                <span className="h-2 w-2 rounded-full bg-[#4ADE80]" />
                Complete
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {[
                'Payment request snapshot',
                'Provider processing proof',
                'Bank confirmation record',
                'Final outcome certificate',
                'Governance review note',
              ].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-[0.9rem] border border-black/8 bg-[#f8f8f5] px-3 py-2.5">
                  <span className="text-[13px] text-[#111111]">{item}</span>
                  <span className="text-[12px] text-[#6f716d]">Included</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="rounded-[0.9rem] bg-[#111111] px-3.5 py-2 text-[12px] font-medium text-white">
                Download pack (PDF)
              </button>
              <button type="button" className="rounded-[0.9rem] border border-black/15 bg-white px-3.5 py-2 text-[12px] font-medium text-[#111111]">
                Download pack (ZIP)
              </button>
            </div>
          </LightCard>
        </div>

        <LightCard className="bg-[#fcfcfa]">
          <SurfaceEyebrow>Safe exposure</SurfaceEyebrow>
          <div className="mt-2 text-[1rem] font-medium text-[#111111]">Business-safe drilldown output</div>
          <div className="mt-3 text-[13px] leading-6 text-[#6f716d]">
            This screen intentionally hides raw envelope IDs, event IDs, dispatch IDs, trace IDs, and cryptographic internals.
            Operators see a defensible payout story, while exported evidence can carry generic metadata labels when needed.
          </div>
          <div className="mt-4 rounded-[1rem] border border-black/8 bg-white p-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8a86]">External narrative</div>
            <div className="mt-2 text-[13px] leading-6 text-[#6f716d]">
              Request received -> Provider processed -> Bank confirmation pending -> Finality expected in the same close window.
            </div>
          </div>
        </LightCard>
      </div>
    </div>
  )
}
