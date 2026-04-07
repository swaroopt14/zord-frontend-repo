'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/fintech-dashboard'
import { ActionButton, InfoStrip, ModuleBadge, NeumoCard, SegmentedTabs, StatusChip, SummaryCard, UtilityPill, NEO_CREAM, NEO_MUTED, NEO_TEXT } from '../_components/neumo'


type ProofTab = 'Dispute & Evidence Center' | 'Audit Logs' | 'Compliance Pack'
const tabs: readonly ProofTab[] = ['Dispute & Evidence Center', 'Audit Logs', 'Compliance Pack']

const summary = [
  { label: 'Evidence Ready', value: '92.4%', note: 'Cases with a defendable pack already assembled' },
  { label: 'Open Audit Requests', value: '8', note: 'CFO, finance, or compliance asks waiting in this window' },
  { label: 'Regulatory Packs', value: '14', note: 'Generated and ready for RBI / audit review' },
  { label: 'Proof Confidence', value: '96.2%', note: 'Cases where signals and documents align cleanly' },
] as const

const evidenceRows = [
  { caseId: 'DSP-2204', intent: 'INT-PR-22014', pack: 'Full evidence pack', owner: 'Finance Ops', sla: '2h left', state: 'Ready' as const },
  { caseId: 'DSP-2207', intent: 'INT-PR-22022', pack: 'Bank trail + webhook proof', owner: 'Compliance Desk', sla: '6h left', state: 'Building' as const },
  { caseId: 'DSP-2210', intent: 'INT-PR-22029', pack: 'Seller dispute response', owner: 'CFO Review', sla: '12h left', state: 'Review' as const },
] as const

const auditRows = [
  { actor: 'John D.', event: 'Exported RBI evidence bundle', target: 'Pack-8821', time: '09:14', state: 'Recorded' as const },
  { actor: 'Finance Ops', event: 'Viewed payout variance register', target: 'Recon-W12', time: '09:22', state: 'Recorded' as const },
  { actor: 'Compliance Desk', event: 'Downloaded policy override log', target: 'Gov-Log-14', time: '09:36', state: 'Sensitive' as const },
]

const complianceRows = [
  { pack: 'RBI audit pack', status: 'Ready' as const, freshness: 'Updated 18m ago', coverage: 'Closure, variance, exports' },
  { pack: 'DPDP access trail', status: 'Review' as const, freshness: 'Updated 41m ago', coverage: 'User access and export logs' },
  { pack: 'MSME payout proof', status: 'Ready' as const, freshness: 'Updated 12m ago', coverage: 'Release speed and settlement evidence' },
]

export default function ProofPage() {
  const [activeTab, setActiveTab] = useState<ProofTab>('Dispute & Evidence Center')

  return (
    <DashboardLayout>
      <div className="font-sans">
        <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <ModuleBadge>Proof & Compliance</ModuleBadge>
            <h1 className="mt-5 text-[42px] font-black leading-none tracking-[-0.05em]" style={{ color: NEO_TEXT }}>
              Evidence, audit trails, and compliance packs for payout defense
            </h1>
            <p className="mt-4 max-w-[980px] text-[18px] leading-8" style={{ color: NEO_MUTED }}>
              Built for CFO and compliance users. This page answers whether the outcome is defendable, whether audit evidence is complete, and whether exports are ready without spreadsheet assembly.
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

        {activeTab === 'Dispute & Evidence Center' ? (
          <NeumoCard title="Dispute & Evidence Center" subtitle="Operational queue for assembling, reviewing, and exporting payout proof packs before disputes escalate.">
            <InfoStrip label="AI evidence note">
              The fastest wins are already assembled packs — the slowest cases are waiting for bank trail enrichment, not for internal review. That means improving bank proof ingestion will unlock more readiness than adding manual reviewers.
            </InfoStrip>
            <div className="space-y-4">
              {evidenceRows.map((row) => (
                <div key={row.caseId} className="rounded-[24px] p-5" style={{ background: NEO_CREAM, border: '1px solid rgba(255,255,255,0.34)', boxShadow: '8px 8px 18px rgba(154,159,141,0.14), -6px -6px 12px rgba(255,255,255,0.62)' }}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <div><div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Case</div><div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.caseId}</div></div>
                    <div><div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Intent</div><div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.intent}</div></div>
                    <div><div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Pack</div><div className="mt-2 text-[15px]" style={{ color: NEO_MUTED }}>{row.pack}</div></div>
                    <div><div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Owner</div><div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.owner}</div></div>
                    <div className="flex items-center justify-between gap-3"><StatusChip tone={row.state === 'Ready' ? 'healthy' : row.state === 'Review' ? 'watch' : 'critical'}>{row.state}</StatusChip><ActionButton active={row.state === 'Ready'}>Export pack</ActionButton></div>
                  </div>
                  <div className="mt-4 text-[15px]" style={{ color: NEO_MUTED }}>SLA: {row.sla}</div>
                </div>
              ))}
            </div>
          </NeumoCard>
        ) : null}

        {activeTab === 'Audit Logs' ? (
          <NeumoCard title="Audit Logs" subtitle="Immutable access and export events so finance, compliance, and auditors can see who touched proof surfaces and when.">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    {['Actor', 'Event', 'Target', 'Time', 'State', 'Action'].map((head) => (
                      <th key={head} className="px-4 pb-2 text-left text-[13px] font-black uppercase tracking-[0.14em]" style={{ color: NEO_MUTED }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditRows.map((row) => (
                    <tr key={`${row.actor}-${row.time}`}>
                      <td className="rounded-l-[22px] px-4 py-5" style={{ background: NEO_CREAM, color: NEO_TEXT }}>{row.actor}</td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM, color: NEO_MUTED }}>{row.event}</td>
                      <td className="px-4 py-5 font-bold" style={{ background: NEO_CREAM, color: NEO_TEXT }}>{row.target}</td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM, color: NEO_TEXT }}>{row.time}</td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM }}><StatusChip tone={row.state === 'Recorded' ? 'healthy' : 'watch'}>{row.state}</StatusChip></td>
                      <td className="rounded-r-[22px] px-4 py-5" style={{ background: NEO_CREAM }}><ActionButton>Open log</ActionButton></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NeumoCard>
        ) : null}

        {activeTab === 'Compliance Pack' ? (
          <NeumoCard title="Compliance Pack" subtitle="Regulator and audit-ready bundles for payout operations, organized by surface and freshness so the team always knows what is defensible.">
            <InfoStrip label="AI compliance note">
              RBI packs are in strong shape. The next control win is improving access-trail freshness so DPDP-style reviews do not depend on cross-team manual pulls.
            </InfoStrip>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {complianceRows.map((row) => (
                <div key={row.pack} className="rounded-[24px] p-5" style={{ background: NEO_CREAM, border: '1px solid rgba(255,255,255,0.34)', boxShadow: '8px 8px 18px rgba(154,159,141,0.14), -6px -6px 12px rgba(255,255,255,0.62)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[20px] font-black tracking-[-0.03em]" style={{ color: NEO_TEXT }}>{row.pack}</div>
                    <StatusChip tone={row.status === 'Ready' ? 'healthy' : 'watch'}>{row.status}</StatusChip>
                  </div>
                  <div className="mt-3 text-[15px]" style={{ color: NEO_MUTED }}>{row.coverage}</div>
                  <div className="mt-4 text-[14px] font-semibold" style={{ color: NEO_MUTED }}>{row.freshness}</div>
                  <div className="mt-5"><ActionButton active={row.status === 'Ready'}>Export compliance pack</ActionButton></div>
                </div>
              ))}
            </div>
          </NeumoCard>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
