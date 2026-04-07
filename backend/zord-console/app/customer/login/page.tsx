import { ZordLoginExperience } from '@/components/auth'

export default function CustomerLoginPage() {
  return (
    <ZordLoginExperience
      audience="Customer Workspace"
      pageTitle="Sign in to your tenant workspace"
      pageDescription="Review payment operations, evidence exports, exceptions, and settlement intelligence in a workspace scoped to your team."
      heroEyebrow="Customer operations without blind spots"
      heroTitle="Bring reconciliation, evidence, and exception handling into one tenant-ready workspace."
      heroDescription="Zord helps customer teams inspect intent flow, export proof, and respond to payout issues without waiting for a platform operator to pull the records."
      accessBadges={['Tenant-isolated access', 'Evidence explorer', 'Exceptions ready']}
      trustBadges={['Workspace logging', 'MFA on production', 'Tenant-safe sessions']}
      stats={[
        { value: '1 workspace', label: 'for ops and evidence' },
        { value: 'Minutes', label: 'to assemble proof packs' },
        { value: 'Live', label: 'intent and exception status' },
      ]}
      highlights={[
        {
          title: 'Evidence on demand',
          description: 'Open proof packs, supporting files, and trace metadata without waiting on a manual backend pull.',
        },
        {
          title: 'Exception triage',
          description: 'Move from alerts to root cause with tenant-aware context for retries, settlement, and payout delays.',
        },
        {
          title: 'Flexible environment access',
          description: 'Choose sandbox for rehearsal or production for live operations without switching products.',
        },
      ]}
      redirectTo="/customer/overview"
      role="CUSTOMER_USER"
      sandboxRedirectTo="/customer/sandbox/overview"
    />
  )
}
