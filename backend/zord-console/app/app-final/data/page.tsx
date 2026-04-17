'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/fintech-dashboard'
import { ActionButton, InfoStrip, ModuleBadge, NeumoCard, SegmentedTabs, StatusChip, SummaryCard, UtilityPill, NEO_CREAM, NEO_MUTED, NEO_TEXT } from '../_components/neumo'


type DataTab = 'Reports & Exports' | 'Reconciliation Reports' | 'Settlement Reports'
const tabs: readonly DataTab[] = ['Reports & Exports', 'Reconciliation Reports', 'Settlement Reports']

const summary = [
  { label: 'Export Queue', value: '23', note: 'Reports generated or awaiting operator download' },
  { label: 'Recon Reports', value: '11', note: 'Prepared for finance and close workflows' },
  { label: 'Settlement Packs', value: '8', note: 'Bank-facing and PSP-facing settlement bundles' },
  { label: 'Freshness SLA', value: '98.6%', note: 'Reports delivered inside expected generation window' },
] as const

const exportRows = [
  { name: 'Daily payout summary', type: 'Finance pack', owner: 'Finance Ops', freshness: 'Generated 14m ago', state: 'Ready' as const },
  { name: 'Exception export', type: 'Support queue', owner: 'Ops Desk', freshness: 'Generating', state: 'Running' as const },
  { name: 'CFO board pack', type: 'Executive', owner: 'CFO Desk', freshness: 'Generated 42m ago', state: 'Ready' as const },
] as const

const reconRows = [
  { report: 'Recon closure report', value: '98.4%', note: 'Close-ready intents inside current cycle', status: 'Ready' as const },
  { report: 'Variance aging report', value: '₹3.2 L', note: 'Open amount variance pending human review', status: 'Watch' as const },
  { report: 'Evidence arrival report', value: '91.8%', note: 'Full 3-signal coverage in this reporting window', status: 'Ready' as const },
] as const

const settlementRows = [
  { batch: 'NEFT 14:30', gross: '₹4.8 Cr', net: '₹4.76 Cr', status: 'Confirmed' as const, note: 'Statement arrived cleanly' },
  { batch: 'IMPS rolling', gross: '₹8.1 Cr', net: '₹8.04 Cr', status: 'Processing' as const, note: 'Awaiting last confirmation sweep' },
  { batch: 'RTGS premium', gross: '₹2.6 Cr', net: '₹2.59 Cr', status: 'Confirmed' as const, note: 'Largest-value payouts settled' },
] as const

export default function DataPage() {
  const [activeTab, setActiveTab] = useState<DataTab>('Reports & Exports')

  return (
    <DashboardLayout>
      <div className="font-sans">
        <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <ModuleBadge>Data & Exports</ModuleBadge>
            <h1 className="mt-5 text-[42px] font-black leading-none tracking-[-0.05em]" style={{ color: NEO_TEXT }}>
              Reporting surfaces for finance, reconciliation, and settlement operations
            </h1>
            <p className="mt-4 max-w-[980px] text-[18px] leading-8" style={{ color: NEO_MUTED }}>
              Export operations should feel predictable and audit-safe. This page keeps generated reports, reconciliation summaries, and settlement packs in one organized surface.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <UtilityPill>Jan 01 - July 31</UtilityPill>
            <UtilityPill>compared to Aug 01 - Dec 31</UtilityPill>
            <UtilityPill>Daily</UtilityPill>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-4">
          {summary.map((item) => (
            <SummaryCard key={item.label} label={item.label} value={item.value} note={item.note} />
          ))}
        </section>

        <section className="mb-6 flex justify-start">
          <SegmentedTabs items={tabs} active={activeTab} onChange={setActiveTab} />
        </section>

        {activeTab === 'Reports & Exports' ? (
          <NeumoCard title="Reports & Exports" subtitle="Export queue, generated files, and operator-ready packs for finance, support, and compliance workflows.">
            <InfoStrip label="AI export note">
              The queue is healthy. The biggest user-facing quality win would be prioritizing exception exports ahead of executive packs when operators are working live incidents.
            </InfoStrip>
            <div className="space-y-4">
              {exportRows.map((row) => (
                <div key={row.name} className="rounded-[24px] p-5" style={{ background: NEO_CREAM, border: '1px solid rgba(255,255,255,0.82)', boxShadow: '6px 6px 14px rgba(118,84,111,0.10), -4px -4px 10px rgba(255,255,255,0.72), inset 1px 1px 0 rgba(255,255,255,0.44)' }}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[20px] font-black tracking-[-0.03em]" style={{ color: NEO_TEXT }}>{row.name}</div>
                      <div className="mt-2 text-[15px]" style={{ color: NEO_MUTED }}>{row.type} · {row.owner}</div>
                    </div>
                    <StatusChip tone={row.state === 'Ready' ? 'healthy' : 'watch'}>{row.state}</StatusChip>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="text-[14px] font-semibold" style={{ color: NEO_MUTED }}>{row.freshness}</div>
                    <ActionButton active={row.state === 'Ready'}>Open export</ActionButton>
                  </div>
                </div>
              ))}
            </div>
          </NeumoCard>
        ) : null}

        {activeTab === 'Reconciliation Reports' ? (
          <NeumoCard title="Reconciliation Reports" subtitle="Report layer for closure rate, variance, and evidence coverage so finance can close books faster and with less manual stitching.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {reconRows.map((row) => (
                <div key={row.report} className="rounded-[24px] p-5" style={{ background: NEO_CREAM, border: '1px solid rgba(255,255,255,0.82)', boxShadow: '6px 6px 14px rgba(118,84,111,0.10), -4px -4px 10px rgba(255,255,255,0.72), inset 1px 1px 0 rgba(255,255,255,0.44)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[20px] font-black tracking-[-0.03em]" style={{ color: NEO_TEXT }}>{row.report}</div>
                    <StatusChip tone={row.status === 'Ready' ? 'healthy' : 'watch'}>{row.status}</StatusChip>
                  </div>
                  <div className="mt-4 text-[34px] font-black leading-none tracking-[-0.04em]" style={{ color: NEO_TEXT }}>{row.value}</div>
                  <div className="mt-3 text-[15px] leading-7" style={{ color: NEO_MUTED }}>{row.note}</div>
                  <div className="mt-5"><ActionButton>Open report</ActionButton></div>
                </div>
              ))}
            </div>
          </NeumoCard>
        ) : null}

        {activeTab === 'Settlement Reports' ? (
          <NeumoCard title="Settlement Reports" subtitle="Settlement-facing reporting so the team can see gross vs net movement, batch status, and which bank windows are already defensible.">
            <InfoStrip label="AI settlement note">
              IMPS rolling settlement is healthy but still less final than RTGS. If support needs a proof-safe view, prioritize RTGS and completed NEFT batches first.
            </InfoStrip>
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    {['Batch', 'Gross', 'Net', 'Status', 'Note', 'Action'].map((head) => (
                      <th key={head} className="px-4 pb-2 text-left text-[13px] font-black uppercase tracking-[0.14em]" style={{ color: NEO_MUTED }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {settlementRows.map((row) => (
                    <tr key={row.batch}>
                      <td className="rounded-l-[22px] px-4 py-5" style={{ background: NEO_CREAM, color: NEO_TEXT }}>{row.batch}</td>
                      <td className="px-4 py-5 font-bold" style={{ background: NEO_CREAM, color: NEO_TEXT }}>{row.gross}</td>
                      <td className="px-4 py-5 font-bold" style={{ background: NEO_CREAM, color: NEO_TEXT }}>{row.net}</td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM }}><StatusChip tone={row.status === 'Confirmed' ? 'healthy' : 'watch'}>{row.status}</StatusChip></td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM, color: NEO_MUTED }}>{row.note}</td>
                      <td className="rounded-r-[22px] px-4 py-5" style={{ background: NEO_CREAM }}><ActionButton active={row.status === 'Confirmed'}>Export settlement pack</ActionButton></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NeumoCard>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
