'use client'

import { ReactNode, useState, useEffect } from 'react'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { getCurrentUser } from '@/services/auth'
import { EnvironmentProvider, useEnvironment } from './EnvironmentContext'

interface LayoutProps {
  children: ReactNode
  serviceName?: string
  breadcrumbs?: string[]
  tenant?: string
}

function LayoutContent({ children, serviceName = '', breadcrumbs, tenant }: LayoutProps) {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null)
  const envContext = useEnvironment()

  useEffect(() => {
    setMounted(true)
    setUser(getCurrentUser())
  }, [])

  const currentTenant = tenant || user?.tenant
  
  // Sidebar only appears when inside a service (serviceName is provided and not empty)
  const showSidebar = serviceName && serviceName !== ''

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar 
        tenant={currentTenant}
        serviceName={serviceName}
        breadcrumbs={breadcrumbs}
        environment={envContext.environment}
        onEnvironmentChange={envContext.setEnvironment}
      />
      <div className="flex" style={{ height: 'calc(100vh - 4rem)' }}>
        {showSidebar && <Sidebar serviceName={serviceName} />}
        <main className={`${showSidebar ? 'flex-1' : 'w-full'} overflow-y-auto bg-gray-50`}>
          {children}
        </main>
      </div>
    </div>
  )
}

export function Layout(props: LayoutProps) {
  return (
    <EnvironmentProvider>
      <LayoutContent {...props} />
    </EnvironmentProvider>
  )
}
