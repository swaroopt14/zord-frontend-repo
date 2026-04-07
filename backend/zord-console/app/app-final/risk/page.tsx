'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/fintech-dashboard'
import { ActionButton, InfoStrip, ModuleBadge, NeumoCard, SegmentedTabs, StatusChip, SummaryCard, UtilityPill, NEO_CREAM, NEO_MUTED, NEO_TEXT } from '../_components/neumo'


type RiskTab = 'Fraud Intelligence' | 'Governance & Policies' | 'Duplicate / Risk Signals'

const tabs: readonly RiskTab[] = ['Fraud Intelligence', 'Governance & Policies', 'Duplicate / Risk Signals']

const summary = [
  { label: 'High-Risk Value', value: '₹42.6 L', note: 'Payout value under fraud, duplicate, or policy watch' },
  { label: 'Governance Breaches', value: '17', note: 'Intents blocked or challenged by policy guardrails today' },
  { label: 'Duplicate Candidates', value: '29', note: 'Potential repeat payout attempts across seller and bank references' },
  { label: 'Model Confidence', value: '93.1%', note: 'Signals with enough context for AI-supported operator action' },
] as const

const fraudRows = [
  { cluster: 'Weekend PayU anomaly', seller: 'ElectroHub West', intents: '11', money: '₹9.4 L', signal: 'Velocity spike + issuer mismatch', severity: 'Critical' as const },
  { cluster: 'High-value UPI fan-out', seller: 'Nexa Seller Ops', intents: '7', money: '₹6.2 L', signal: 'Rapid beneficiary spread within 14m', severity: 'Watch' as const },
  { cluster: 'Odd-hour RTGS release', seller: 'UrbanKart Capital', intents: '3', money: '₹12.8 L', signal: 'Out-of-window approval chain', severity: 'Watch' as const },
]

const policyRows = [
  { rule: 'High-risk seller cool-off', state: 'Active', hits: '9', owner: 'Risk Ops', impact: 'Prevents replay inside 30m window' },
  { rule: 'Weekend provider reroute', state: 'Active', hits: '24', owner: 'Infra Control', impact: 'Protects against PayU timeout clusters' },
  { rule: 'Statement lag holdback', state: 'Warning', hits: '6', owner: 'Finance Ops', impact: 'Stops release where finality confidence is weak' },
  { rule: 'High-ticket maker-checker', state: 'Healthy', hits: '14', owner: 'Governance', impact: 'Adds human approval before dispatch' },
] as const

const duplicateRows = [
  { intent: 'INT-RK-22014', seller: 'Seller-7741', amount: '₹1.8 L', match: 'Same UTR + account pair', confidence: '98%', next: 'Freeze replay' },
  { intent: 'INT-RK-22019', seller: 'Seller-3921', amount: '₹84 K', match: 'Idempotency drift + same invoice', confidence: '91%', next: 'Review idempotency' },
  { intent: 'INT-RK-22021', seller: 'Seller-1192', amount: '₹2.2 L', match: 'Beneficiary reused in < 5m', confidence: '88%', next: 'Manual check' },
] as const

export default function RiskPage() {
  const [activeTab, setActiveTab] = useState<RiskTab>('Fraud Intelligence')

  return (
    <DashboardLayout>
      <div className="font-sans">
        <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <ModuleBadge>Risk & Control</ModuleBadge>
            <h1 className="mt-5 text-[42px] font-black leading-none tracking-[-0.05em]" style={{ color: NEO_TEXT }}>
              Fraud, governance, and duplicate controls in one operator layer
            </h1>
            <p className="mt-4 max-w-[980px] text-[18px] leading-8" style={{ color: NEO_MUTED }}>
              Helps answer: where is money at risk, which rules are firing, and what suspicious payout behavior needs intervention before it settles.
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

        {activeTab === 'Fraud Intelligence' ? (
          <NeumoCard title="Fraud Intelligence" subtitle="Behavioral and payout-pattern anomalies that need operator judgment before money leaves the system.">
            <InfoStrip label="AI fraud note">
              Two active clusters are driven by velocity and beneficiary-pattern drift, not by broad provider outages. That means governance holds and seller-level controls will outperform infra reroutes here.
            </InfoStrip>
            <div className="space-y-4">
              {fraudRows.map((row) => (
                <div key={row.cluster} className="rounded-[24px] p-5" style={{ background: NEO_CREAM, border: '1px solid rgba(255,255,255,0.34)', boxShadow: '8px 8px 18px rgba(154,159,141,0.14), -6px -6px 12px rgba(255,255,255,0.62)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[22px] font-black tracking-[-0.03em]" style={{ color: NEO_TEXT }}>{row.cluster}</div>
                      <div className="mt-2 text-[15px]" style={{ color: NEO_MUTED }}>{row.signal}</div>
                    </div>
                    <StatusChip tone={row.severity === 'Critical' ? 'critical' : 'watch'}>{row.severity}</StatusChip>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div><div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Seller</div><div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.seller}</div></div>
                    <div><div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Intents</div><div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.intents}</div></div>
                    <div><div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Money</div><div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.money}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </NeumoCard>
        ) : null}

        {activeTab === 'Governance & Policies' ? (
          <NeumoCard title="Governance & Policies" subtitle="Policies that approve, delay, challenge, or block payout release before they become audit or loss events.">
            <InfoStrip label="AI policy note">
              Weekend provider reroute and statement-lag holdback are doing the most real work right now. The next useful policy layer is duplicate-aware holdback for repeat beneficiary attempts.
            </InfoStrip>
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    {['Rule', 'State', 'Hits', 'Owner', 'Impact', 'Action'].map((head) => (
                      <th key={head} className="px-4 pb-2 text-left text-[13px] font-black uppercase tracking-[0.14em]" style={{ color: NEO_MUTED }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {policyRows.map((row) => (
                    <tr key={row.rule}>
                      <td className="rounded-l-[22px] px-4 py-5" style={{ background: NEO_CREAM }}>{row.rule}</td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM }}><StatusChip tone={row.state === 'Active' ? 'healthy' : row.state === 'Warning' ? 'watch' : 'critical'}>{row.state}</StatusChip></td>
                      <td className="px-4 py-5 font-bold" style={{ background: NEO_CREAM, color: NEO_TEXT }}>{row.hits}</td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM, color: NEO_MUTED }}>{row.owner}</td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM, color: NEO_MUTED }}>{row.impact}</td>
                      <td className="rounded-r-[22px] px-4 py-5" style={{ background: NEO_CREAM }}><ActionButton active={row.state === 'Warning'}>Open policy</ActionButton></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NeumoCard>
        ) : null}

        {activeTab === 'Duplicate / Risk Signals' ? (
          <NeumoCard title="Duplicate / Risk Signals" subtitle="Early warning surface for repeat intents, reused references, and suspicious payout collisions that should never settle twice.">
            <InfoStrip label="AI duplicate note">
              Most high-confidence duplicates are reference collisions, not pure user retries. That means improving idempotency discipline and beneficiary lock windows will save more money than manual queue review alone.
            </InfoStrip>
            <div className="space-y-4">
              {duplicateRows.map((row) => (
                <div key={row.intent} className="rounded-[24px] p-5" style={{ background: NEO_CREAM, border: '1px solid rgba(255,255,255,0.34)', boxShadow: '8px 8px 18px rgba(154,159,141,0.14), -6px -6px 12px rgba(255,255,255,0.62)' }}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <div><div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Intent</div><div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.intent}</div></div>
                    <div><div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Seller</div><div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.seller}</div></div>
                    <div><div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Amount</div><div className="mt-2 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.amount}</div></div>
                    <div><div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Match</div><div className="mt-2 text-[15px]" style={{ color: NEO_MUTED }}>{row.match}</div></div>
                    <div><div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>Confidence</div><div className="mt-2 flex items-center gap-3"><div className="text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.confidence}</div><ActionButton>{row.next}</ActionButton></div></div>
                  </div>
                </div>
              ))}
            </div>
          </NeumoCard>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
