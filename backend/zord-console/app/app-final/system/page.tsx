'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/fintech-dashboard'
import { ActionButton, InfoStrip, ModuleBadge, NeumoCard, SegmentedTabs, StatusChip, SummaryCard, UtilityPill, NEO_CREAM, NEO_MUTED, NEO_TEXT } from '../_components/neumo'
import { EntityLogo } from '../_components/entity-logo'


type SystemTab = 'API & Integrations' | 'Webhooks' | 'Connectors (PSPs)'
const tabs: readonly SystemTab[] = ['API & Integrations', 'Webhooks', 'Connectors (PSPs)']

const summary = [
  { label: 'API Uptime', value: '99.93%', note: 'Tenant-facing API and connector availability' },
  { label: 'Webhook Health', value: '97.8%', note: 'Delivery success across configured endpoints' },
  { label: 'Connector State', value: '11 live', note: 'PSP / bank connectors active in this org' },
  { label: 'Retry Queue', value: '37', note: 'System events waiting for automatic replay' },
] as const

const apiRows = [
  { service: 'Intent API', latency: '182 ms', state: 'Healthy' as const, note: 'Core create / search path is stable' },
  { service: 'Metrics API', latency: '244 ms', state: 'Healthy' as const, note: 'Dashboard reads within target range' },
  { service: 'Exports API', latency: '812 ms', state: 'Watch' as const, note: 'Heavy bundles pushing queue time up' },
] as const

const webhookRows = [
  { endpoint: 'payment-status', success: '94.2%', deliveries: '4,821', state: 'Watch' as const, note: 'Callback retries are rising' },
  { endpoint: 'settlement-confirm', success: '78.1%', deliveries: '1,203', state: 'Critical' as const, note: 'Downstream receiver is unstable' },
  { endpoint: 'evidence-ready', success: '100%', deliveries: '4,102', state: 'Healthy' as const, note: 'Fastest endpoint in the fleet' },
] as const

const connectorRows = [
  { connector: 'Razorpay', role: 'Primary IMPS', state: 'Healthy' as const, note: 'Best latency + success blend' },
  { connector: 'Cashfree', role: 'NEFT / UPI support', state: 'Watch' as const, note: 'Needs tighter seller guardrails' },
  { connector: 'PayU', role: 'Weekend overflow', state: 'Critical' as const, note: 'Timeout volatility is too high' },
  { connector: 'Stripe', role: 'High-value RTGS', state: 'Healthy' as const, note: 'Most reliable premium rail partner' },
] as const

const bankConnectorRows = [
  { bank: 'ICICI Bank', role: 'Primary statement host', state: 'Healthy' as const, note: 'Fastest evidence and reconciliation feedback' },
  { bank: 'HDFC Bank', role: 'Settlement file partner', state: 'Watch' as const, note: 'Lag pockets still create proof delay' },
  { bank: 'SBI', role: 'Coverage bank', state: 'Healthy' as const, note: 'Consistent low-error confirmation path' },
  { bank: 'Axis Bank', role: 'RTGS banking lane', state: 'Watch' as const, note: 'Host volatility needs active monitoring' },
  { bank: 'Kotak', role: 'Secondary beneficiary rail', state: 'Healthy' as const, note: 'Low failure concentration in this window' },
] as const

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState<SystemTab>('API & Integrations')

  return (
    <DashboardLayout>
      <div className="font-sans">
        <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <ModuleBadge>System</ModuleBadge>
            <h1 className="mt-5 text-[42px] font-black leading-none tracking-[-0.05em]" style={{ color: NEO_TEXT }}>
              Integrations, delivery surfaces, and PSP connector health
            </h1>
            <p className="mt-4 max-w-[980px] text-[18px] leading-8" style={{ color: NEO_MUTED }}>
              This page is the technical operating layer for the product. It keeps APIs, webhooks, and PSP connectors visible so ops and engineering can see what is healthy before downstream modules feel the impact.
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

        {activeTab === 'API & Integrations' ? (
          <NeumoCard title="API & Integrations" subtitle="Health view for the platform endpoints and internal surfaces that power search, exports, metrics, and payout operations.">
            <InfoStrip label="AI system note">
              The system surface is stable overall. The first engineering win would be reducing export bundle latency, because it is the only API layer moving outside the normal performance envelope.
            </InfoStrip>
            <div className="space-y-4">
              {apiRows.map((row) => (
                <div key={row.service} className="rounded-[24px] p-5" style={{ background: NEO_CREAM, border: '1px solid rgba(255,255,255,0.34)', boxShadow: '8px 8px 18px rgba(154,159,141,0.14), -6px -6px 12px rgba(255,255,255,0.62)' }}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[20px] font-black tracking-[-0.03em]" style={{ color: NEO_TEXT }}>{row.service}</div>
                      <div className="mt-2 text-[15px]" style={{ color: NEO_MUTED }}>{row.note}</div>
                    </div>
                    <StatusChip tone={row.state === 'Healthy' ? 'healthy' : 'watch'}>{row.state}</StatusChip>
                  </div>
                  <div className="mt-4 text-[18px] font-bold" style={{ color: NEO_TEXT }}>{row.latency}</div>
                </div>
              ))}
            </div>
          </NeumoCard>
        ) : null}

        {activeTab === 'Webhooks' ? (
          <NeumoCard title="Webhooks" subtitle="Delivery health for outbound event endpoints so product teams can see what downstream systems are missing or failing to accept.">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    {['Endpoint', 'Success', 'Deliveries', 'State', 'Note', 'Action'].map((head) => (
                      <th key={head} className="px-4 pb-2 text-left text-[13px] font-black uppercase tracking-[0.14em]" style={{ color: NEO_MUTED }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {webhookRows.map((row) => (
                    <tr key={row.endpoint}>
                      <td className="rounded-l-[22px] px-4 py-5" style={{ background: NEO_CREAM, color: NEO_TEXT }}>{row.endpoint}</td>
                      <td className="px-4 py-5 font-bold" style={{ background: NEO_CREAM, color: NEO_TEXT }}>{row.success}</td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM, color: NEO_TEXT }}>{row.deliveries}</td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM }}><StatusChip tone={row.state === 'Healthy' ? 'healthy' : row.state === 'Critical' ? 'critical' : 'watch'}>{row.state}</StatusChip></td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM, color: NEO_MUTED }}>{row.note}</td>
                      <td className="rounded-r-[22px] px-4 py-5" style={{ background: NEO_CREAM }}><ActionButton>Open endpoint</ActionButton></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NeumoCard>
        ) : null}

        {activeTab === 'Connectors (PSPs)' ? (
          <NeumoCard title="Connectors (PSPs)" subtitle="Provider connector posture so ops can see which partners are safest for traffic and which need guarding before they affect payout outcome.">
            <InfoStrip label="AI connector note">
              The right connector move is to keep Stripe and Razorpay leaned in, while reducing PayU to controlled overflow. Cashfree is usable, but only when seller-level governance absorbs the callback noise.
            </InfoStrip>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {connectorRows.map((row) => (
                <div key={row.connector} className="rounded-[24px] p-5" style={{ background: NEO_CREAM, border: '1px solid rgba(255,255,255,0.34)', boxShadow: '8px 8px 18px rgba(154,159,141,0.14), -6px -6px 12px rgba(255,255,255,0.62)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <EntityLogo name={row.connector} kind="psp" size={72} className="rounded-[24px]" />
                    <StatusChip tone={row.state === 'Healthy' ? 'healthy' : row.state === 'Critical' ? 'critical' : 'watch'}>{row.state}</StatusChip>
                  </div>
                  <div className="mt-5 text-[15px] font-semibold leading-7" style={{ color: NEO_TEXT }}>{row.role}</div>
                  <div className="mt-3 text-[15px] leading-7" style={{ color: NEO_MUTED }}>{row.note}</div>
                  <div className="mt-5"><ActionButton active={row.state === 'Healthy'}>Open connector</ActionButton></div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <div className="mb-4 text-[12px] font-black uppercase tracking-[0.18em]" style={{ color: NEO_MUTED }}>
                Bank Connector Surfaces
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {bankConnectorRows.map((row) => (
                  <div
                    key={row.bank}
                    className="rounded-[24px] p-5"
                    style={{
                      background: NEO_CREAM,
                      border: '1px solid rgba(255,255,255,0.34)',
                      boxShadow: '8px 8px 18px rgba(154,159,141,0.14), -6px -6px 12px rgba(255,255,255,0.62)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <EntityLogo name={row.bank} kind="bank" size={72} className="rounded-[24px]" />
                      <StatusChip tone={row.state === 'Healthy' ? 'healthy' : 'watch'}>{row.state}</StatusChip>
                    </div>
                    <div className="mt-5 text-[15px] font-semibold leading-7" style={{ color: NEO_TEXT }}>
                      {row.role}
                    </div>
                    <div className="mt-3 text-[15px] leading-7" style={{ color: NEO_MUTED }}>
                      {row.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </NeumoCard>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
