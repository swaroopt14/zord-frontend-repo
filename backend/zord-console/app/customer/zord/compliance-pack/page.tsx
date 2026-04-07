'use client'

import { Panel } from '../_components/Panel'

export default function CompliancePackPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[var(--font-zord-heading)] text-2xl text-slate-100">Compliance Pack</h1>
        <p className="text-sm text-slate-400">RBI, DPDP, MSME audit readiness surfaces for payout operations.</p>
      </header>

      <Panel title="Compliance Exports" subtitle="V1 module scaffold">
        <p className="text-sm text-slate-300">Compliance export queue integration is live via top-bar evidence exports. Dedicated report templates and regulator-specific packs can be layered on this route.</p>
      </Panel>
    </div>
  )
}
