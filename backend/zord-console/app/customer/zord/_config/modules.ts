export type ZordPersona = 'ECOMMERCE' | 'NBFC' | 'B2B_SAAS' | 'OPS_ENGINEERING'

export type NorthStarQuestion =
  | 'Is something broken right now that needs immediate action?'
  | 'What is my payout health trend and where is money at risk?'
  | 'Can I prove this payment happened, and can I defend it?'

export interface DashboardModule {
  key: string
  title: string
  path: string
  subtitle: string
  northStar: NorthStarQuestion
  mobileEssential?: boolean
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    key: 'command-center',
    title: 'Command Center',
    path: '/customer/zord/command-center',
    subtitle: 'Live ops and escalation surface',
    northStar: 'Is something broken right now that needs immediate action?',
    mobileEssential: true,
  },
  {
    key: 'payout-intelligence',
    title: 'Payout Intelligence',
    path: '/customer/zord/payout-intelligence',
    subtitle: 'Execution health, trends, and cost',
    northStar: 'What is my payout health trend and where is money at risk?',
  },
  {
    key: 'reconciliation-intelligence',
    title: 'Reconciliation Intelligence',
    path: '/customer/zord/reconciliation-intelligence',
    subtitle: 'Signal coverage and closure proof',
    northStar: 'Can I prove this payment happened, and can I defend it?',
  },
  {
    key: 'dispute-evidence-center',
    title: 'Dispute & Evidence Center',
    path: '/customer/zord/dispute-evidence-center',
    subtitle: 'Evidence readiness and export operations',
    northStar: 'Can I prove this payment happened, and can I defend it?',
  },
  {
    key: 'psp-health-monitor',
    title: 'PSP Health Monitor',
    path: '/customer/zord/psp-health-monitor',
    subtitle: 'Real-time connector and rail health',
    northStar: 'Is something broken right now that needs immediate action?',
  },
  {
    key: 'fraud-intelligence',
    title: 'Fraud Intelligence',
    path: '/customer/zord/fraud-intelligence',
    subtitle: 'Risk concentration and suspicious patterns',
    northStar: 'What is my payout health trend and where is money at risk?',
  },
  {
    key: 'compliance-pack',
    title: 'Compliance Pack',
    path: '/customer/zord/compliance-pack',
    subtitle: 'RBI, DPDP, MSME and audit readiness',
    northStar: 'Can I prove this payment happened, and can I defend it?',
  },
  {
    key: 'intent-journal',
    title: 'Intent Journal & LLM Explainability',
    path: '/customer/zord/intent-journal',
    subtitle: 'Deep payment-level evidence timeline',
    northStar: 'Can I prove this payment happened, and can I defend it?',
    mobileEssential: true,
  },
  {
    key: 'error-taxonomy-intelligence',
    title: 'Error Taxonomy Intelligence',
    path: '/customer/zord/error-taxonomy-intelligence',
    subtitle: 'Root cause mapping and retry behavior',
    northStar: 'Is something broken right now that needs immediate action?',
  },
]

interface PersonaConfig {
  label: string
  defaultModule: DashboardModule['path']
  pinned: DashboardModule['key'][]
  payoutModuleLabel?: string
}

export const PERSONA_CONFIG: Record<ZordPersona, PersonaConfig> = {
  ECOMMERCE: {
    label: 'E-commerce / Marketplace',
    defaultModule: '/customer/zord/payout-intelligence',
    pinned: ['payout-intelligence', 'reconciliation-intelligence', 'dispute-evidence-center'],
  },
  NBFC: {
    label: 'NBFC / Lending',
    defaultModule: '/customer/zord/command-center',
    pinned: ['compliance-pack', 'payout-intelligence', 'reconciliation-intelligence'],
    payoutModuleLabel: 'Disbursement Intelligence',
  },
  B2B_SAAS: {
    label: 'B2B SaaS Payments',
    defaultModule: '/customer/zord/psp-health-monitor',
    pinned: ['psp-health-monitor', 'payout-intelligence', 'dispute-evidence-center'],
  },
  OPS_ENGINEERING: {
    label: 'Ops / Engineering',
    defaultModule: '/customer/zord/command-center',
    pinned: ['psp-health-monitor', 'error-taxonomy-intelligence', 'intent-journal'],
  },
}

export const DEFAULT_PERSONA: ZordPersona = 'ECOMMERCE'

export const PERSONA_OPTIONS: Array<{ value: ZordPersona; label: string }> = [
  { value: 'ECOMMERCE', label: 'E-commerce / Marketplace' },
  { value: 'NBFC', label: 'NBFC / Lending' },
  { value: 'B2B_SAAS', label: 'B2B SaaS Payments' },
  { value: 'OPS_ENGINEERING', label: 'Ops / Engineering' },
]

export function getModuleByPath(pathname: string): DashboardModule | undefined {
  return DASHBOARD_MODULES.find((module) => pathname.startsWith(module.path))
}
