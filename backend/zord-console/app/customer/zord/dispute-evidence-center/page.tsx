'use client'

import { Panel } from '../_components/Panel'

export default function DisputeEvidenceCenterPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[var(--font-zord-heading)] text-2xl text-slate-100">Dispute & Evidence Center</h1>
        <p className="text-sm text-slate-400">Evidence workflow and dispute triage for payout defense.</p>
      </header>

      <Panel title="Evidence Operations" subtitle="V1 module scaffold">
        <p className="text-sm text-slate-300">This module is wired into navigation and exports, and will be extended with dispute pipelines and evidence pack workflows in the next sprint.</p>
      </Panel>
    </div>
  )
}
