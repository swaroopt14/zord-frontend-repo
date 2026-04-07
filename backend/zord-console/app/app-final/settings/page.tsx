'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/fintech-dashboard'
import { ActionButton, InfoStrip, ModuleBadge, NeumoCard, SegmentedTabs, StatusChip, SummaryCard, UtilityPill, NEO_CREAM, NEO_MUTED, NEO_TEXT } from '../_components/neumo'


type SettingsTab = 'Organization Settings' | 'User & Access Control' | 'Security & 2FA' | 'Billing & Usage'
const tabs: readonly SettingsTab[] = ['Organization Settings', 'User & Access Control', 'Security & 2FA', 'Billing & Usage']

const summary = [
  { label: 'Active Users', value: '28', note: 'Operators, finance users, and admins in this workspace' },
  { label: '2FA Coverage', value: '91%', note: 'Users already protected with second-factor auth' },
  { label: 'Monthly Usage', value: '14.2M', note: 'Events processed in the current billing cycle' },
  { label: 'Access Reviews', value: '3 due', note: 'Role and permission reviews waiting this month' },
] as const

const orgRows = [
  { key: 'Primary entity', value: 'Arealis Fintech Private Limited' },
  { key: 'Default timezone', value: 'Asia/Kolkata' },
  { key: 'Operational currency', value: 'INR' },
  { key: 'Evidence retention', value: '13 months' },
] as const

const userRows = [
  { user: 'John D.', role: 'Admin', scope: 'Full tenant access', state: 'Healthy' as const },
  { user: 'Finance Ops', role: 'Finance', scope: 'Proof, recon, exports', state: 'Healthy' as const },
  { user: 'Risk Desk', role: 'Risk', scope: 'Risk, policy, fraud surfaces', state: 'Watch' as const },
  { user: 'Support Lead', role: 'Support', scope: 'Trace and evidence-only', state: 'Healthy' as const },
] as const

const securityRows = [
  { control: 'MFA required for admins', status: 'Enabled' as const, note: 'All admin accounts have enforced second factor' },
  { control: 'Session timeout', status: 'Enabled' as const, note: 'Idle sessions expire after 30 minutes' },
  { control: 'Export approval guard', status: 'Review' as const, note: 'Large evidence bundles still allow manual bypass' },
] as const

const billingRows = [
  { item: 'Event processing', usage: '14.2M', plan: 'Enterprise tier', note: 'Under contracted monthly ceiling' },
  { item: 'Evidence exports', usage: '812', plan: 'Included', note: 'Heavy CFO pack generation this month' },
  { item: 'Webhook deliveries', usage: '2.1M', plan: 'Metered', note: 'Growth is following payout volume increase' },
] as const

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Organization Settings')

  return (
    <DashboardLayout>
      <div className="font-sans">
        <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <ModuleBadge>Settings</ModuleBadge>
            <h1 className="mt-5 text-[42px] font-black leading-none tracking-[-0.05em]" style={{ color: NEO_TEXT }}>
              Tenant controls for org setup, access, security, and billing
            </h1>
            <p className="mt-4 max-w-[980px] text-[18px] leading-8" style={{ color: NEO_MUTED }}>
              This page keeps the operating model safe and maintainable — who can do what, which controls are enforced, and how platform usage is trending against plan.
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

        {activeTab === 'Organization Settings' ? (
          <NeumoCard title="Organization Settings" subtitle="Tenant-level identity, defaults, and retention settings that define how the product behaves for this business.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {orgRows.map((row) => (
                <div key={row.key} className="rounded-[24px] p-5" style={{ background: NEO_CREAM, border: '1px solid rgba(255,255,255,0.34)', boxShadow: '8px 8px 18px rgba(154,159,141,0.14), -6px -6px 12px rgba(255,255,255,0.62)' }}>
                  <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>{row.key}</div>
                  <div className="mt-3 text-[24px] font-black tracking-[-0.03em]" style={{ color: NEO_TEXT }}>{row.value}</div>
                </div>
              ))}
            </div>
          </NeumoCard>
        ) : null}

        {activeTab === 'User & Access Control' ? (
          <NeumoCard title="User & Access Control" subtitle="Role, access scope, and review posture for the teams operating payouts, reconciliations, and evidence exports.">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    {['User', 'Role', 'Scope', 'State', 'Action'].map((head) => (
                      <th key={head} className="px-4 pb-2 text-left text-[13px] font-black uppercase tracking-[0.14em]" style={{ color: NEO_MUTED }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userRows.map((row) => (
                    <tr key={row.user}>
                      <td className="rounded-l-[22px] px-4 py-5" style={{ background: NEO_CREAM, color: NEO_TEXT }}>{row.user}</td>
                      <td className="px-4 py-5 font-bold" style={{ background: NEO_CREAM, color: NEO_TEXT }}>{row.role}</td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM, color: NEO_MUTED }}>{row.scope}</td>
                      <td className="px-4 py-5" style={{ background: NEO_CREAM }}><StatusChip tone={row.state === 'Healthy' ? 'healthy' : 'watch'}>{row.state}</StatusChip></td>
                      <td className="rounded-r-[22px] px-4 py-5" style={{ background: NEO_CREAM }}><ActionButton>Review access</ActionButton></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NeumoCard>
        ) : null}

        {activeTab === 'Security & 2FA' ? (
          <NeumoCard title="Security & 2FA" subtitle="Authentication, session, and approval controls that protect operator actions and evidence movement.">
            <InfoStrip label="AI security note">
              The only soft spot in the current configuration is export approval bypass on large bundles. Tightening that will improve both audit posture and sensitive-data control with low operator friction.
            </InfoStrip>
            <div className="space-y-4">
              {securityRows.map((row) => (
                <div key={row.control} className="rounded-[24px] p-5" style={{ background: NEO_CREAM, border: '1px solid rgba(255,255,255,0.34)', boxShadow: '8px 8px 18px rgba(154,159,141,0.14), -6px -6px 12px rgba(255,255,255,0.62)' }}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[20px] font-black tracking-[-0.03em]" style={{ color: NEO_TEXT }}>{row.control}</div>
                    <StatusChip tone={row.status === 'Enabled' ? 'healthy' : 'watch'}>{row.status}</StatusChip>
                  </div>
                  <div className="mt-3 text-[15px] leading-7" style={{ color: NEO_MUTED }}>{row.note}</div>
                </div>
              ))}
            </div>
          </NeumoCard>
        ) : null}

        {activeTab === 'Billing & Usage' ? (
          <NeumoCard title="Billing & Usage" subtitle="Usage and plan visibility so the team can see cost drivers across events, webhook deliveries, and export-heavy activity.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {billingRows.map((row) => (
                <div key={row.item} className="rounded-[24px] p-5" style={{ background: NEO_CREAM, border: '1px solid rgba(255,255,255,0.34)', boxShadow: '8px 8px 18px rgba(154,159,141,0.14), -6px -6px 12px rgba(255,255,255,0.62)' }}>
                  <div className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: NEO_MUTED }}>{row.item}</div>
                  <div className="mt-4 text-[34px] font-black leading-none tracking-[-0.04em]" style={{ color: NEO_TEXT }}>{row.usage}</div>
                  <div className="mt-3 text-[15px]" style={{ color: NEO_MUTED }}>{row.plan}</div>
                  <div className="mt-3 text-[14px] leading-7" style={{ color: NEO_MUTED }}>{row.note}</div>
                </div>
              ))}
            </div>
          </NeumoCard>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
