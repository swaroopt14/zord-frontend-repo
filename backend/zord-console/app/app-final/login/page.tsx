import { ZordLoginExperience } from '@/components/auth'

export default function AppFinalLoginPage() {
  return (
    <ZordLoginExperience
      audience="App Final Access"
      pageTitle="Sign in to App Final"
      pageDescription="Open the App Final workspace with the same tenant-scoped credentials you use for customer operations."
      heroEyebrow="Fintech command center access"
      heroTitle="Enter App Final with your workspace login."
      heroDescription="Use your workspace, email, and password to open the dashboard without switching to a different auth flow."
      accessBadges={['Workspace-scoped access', 'Customer role login', 'Dashboard ready']}
      trustBadges={['Session protected', 'Tenant safe', 'Audit friendly']}
      stats={[
        { value: '1 login', label: 'for workspace access' },
        { value: 'Live', label: 'dashboard visibility' },
        { value: 'Fast', label: 'local review flow' },
      ]}
      highlights={[
        {
          title: 'Shared customer auth',
          description: 'App Final uses the same customer-scoped identity model as the console so access stays consistent.',
        },
        {
          title: 'Protected dashboard',
          description: 'Only customer roles attached to the workspace can open the App Final routes.',
        },
        {
          title: 'Direct entry',
          description: 'Sign in here and land straight on the App Final overview instead of bouncing through another surface.',
        },
      ]}
      redirectTo="/app-final"
      role="CUSTOMER_USER"
    />
  )
}
