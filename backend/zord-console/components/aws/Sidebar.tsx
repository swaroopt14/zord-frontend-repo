'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarItem {
  label: string
  href: string
  icon?: React.ReactNode
  isNew?: boolean
}

interface SidebarSection {
  title?: string
  items: SidebarItem[]
  collapsible?: boolean
  icon?: React.ReactNode
}

interface SidebarProps {
  serviceName?: string
}

export function Sidebar({ serviceName = 'Ingestion' }: SidebarProps) {
  const pathname = usePathname()
  // Sections expanded by default
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navigation: SidebarSection[] = [
    {
      items: [
        { label: 'Service Home', href: '/console/ingestion' },
      ],
    },
    {
      title: 'Ingress',
      items: [
        { label: 'Intent Ledger', href: '/console/ingestion/intents' },
        { label: 'Raw Envelopes', href: '/console/ingestion/raw-envelopes' },
        { label: 'Batch Pipelines', href: '/console/ingestion/batch-pipelines' },
        { label: 'Stream Consumers', href: '/console/ingestion/stream-consumers', isNew: true },
      ],
      collapsible: true,
    },
    {
      title: 'Validation & Safety',
      items: [
        { label: 'Schema Registry', href: '/console/ingestion/schema' },
        { label: 'Idempotency Store', href: '/console/ingestion/idempotency' },
        { label: 'Pre-ACC Guards', href: '/console/ingestion/guards' },
      ],
      collapsible: true,
    },
    {
      title: 'Evidence Plane',
      items: [
        { label: 'Evidence Explorer', href: '/console/ingestion/evidence' },
        { label: 'Audit Timeline', href: '/console/ingestion/audit' },
        { label: 'Hash Chain Integrity', href: '/console/ingestion/hash-chain' },
      ],
      collapsible: true,
    },
    {
      title: 'Operations',
      items: [
        { label: 'Ingestion Health', href: '/console/ingestion/operations/health' },
        { label: 'Error Monitor', href: '/console/ingestion/operations/errors' },
        { label: 'Replay & DLQ', href: '/console/ingestion/operations/dlq' },
      ],
      collapsible: true,
    },
    {
      title: 'Integrations',
      items: [
        { label: 'API Gateways', href: '/console/ingestion/integrations/api' },
        { label: 'Webhook Receivers', href: '/console/ingestion/integrations/webhooks' },
        { label: 'Batch Endpoints', href: '/console/ingestion/integrations/batch' },
      ],
      collapsible: true,
    },
    {
      title: 'Governance',
      items: [
        { label: 'Tenant Controls', href: '/console/ingestion/governance/tenants' },
        { label: 'Access Control', href: '/console/ingestion/governance/access' },
        { label: 'Retention Policies', href: '/console/ingestion/governance/retention' },
      ],
      collapsible: true,
    },
  ]

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  const isActive = (href: string) => {
    if (href === '/console/ingestion') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  const isSectionCollapsed = (title?: string) => {
    if (!title) return false
    return collapsedSections.has(title)
  }

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] flex flex-col items-center py-3">
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] overflow-y-auto flex flex-col">
      {/* Service Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xs font-bold text-gray-900 tracking-wide">ZORD • INGESTION</h1>
            <div className="mt-1.5 h-px bg-gray-300 w-10"></div>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
            title="Collapse sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        {navigation.map((section, sectionIndex) => {
          const sectionCollapsed = isSectionCollapsed(section.title)
          
          return (
            <div key={sectionIndex} className="mb-1">
              {section.title ? (
                <>
                  <button
                    onClick={() => section.collapsible && toggleSection(section.title!)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center">
                      <svg
                        className={`w-3 h-3 mr-2 text-gray-600 transition-transform flex-shrink-0 ${
                          sectionCollapsed ? '' : 'rotate-90'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span>{section.title}</span>
                    </div>
                  </button>
                  {!sectionCollapsed && (
                    <div className="pl-4">
                      {section.items.map((item) => {
                        const active = isActive(item.href)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-4 py-2 text-sm transition-colors relative ${
                              active
                                ? 'bg-blue-600 text-white font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span className="truncate">{item.label}</span>
                            {item.isNew && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded flex-shrink-0">
                                New
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  {section.items.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors relative ${
                          active
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.isNew && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded flex-shrink-0">
                            New
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer - Internal Marker */}
      <div className="mt-auto px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          ZORD INTERNAL
        </div>
        <div className="text-xs text-gray-600 leading-tight">
          Production Control Plane
          <br />
          Restricted Access
        </div>
      </div>
    </div>
  )
}
