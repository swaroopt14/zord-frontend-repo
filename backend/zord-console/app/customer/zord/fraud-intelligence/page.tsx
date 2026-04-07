'use client'

import { Panel } from '../_components/Panel'

export default function FraudIntelligencePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[var(--font-zord-heading)] text-2xl text-slate-100">Fraud Intelligence</h1>
        <p className="text-sm text-slate-400">Risk concentration and suspicious payout behavior indicators.</p>
      </header>

      <Panel title="Fraud Signals" subtitle="V1 module scaffold">
        <p className="text-sm text-slate-300">Core payout dashboard KPIs already track money-at-risk and governance failures. This page is reserved for dedicated fraud cohorts and adaptive anomaly models.</p>
      </Panel>
    </div>
  )
}
