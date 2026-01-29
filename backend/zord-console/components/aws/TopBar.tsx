'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getCurrentUser, getCurrentRole } from '@/services/auth'
import { UserRole } from '@/types/auth'
import { ZordLogo } from '@/components/ZordLogo'

type Environment = 'sandbox' | 'production'
type Region = 'IN' | 'EU' | 'US'
type RoleBadge = 'Read' | 'Operator' | 'Admin'

interface TopBarProps {
  tenant?: string
  onTenantChange?: (tenant: string) => void
  environment?: Environment
  onEnvironmentChange?: (env: Environment) => void
  region?: Region
  onRegionChange?: (region: Region) => void
  serviceName?: string
  breadcrumbs?: string[]
}

// Map UserRole to RoleBadge
function getRoleBadge(role: UserRole): RoleBadge {
  switch (role) {
    case 'CUSTOMER_USER':
      return 'Read'
    case 'CUSTOMER_ADMIN':
    case 'OPS':
      return 'Operator'
    case 'ADMIN':
      return 'Admin'
    default:
      return 'Read'
  }
}

export function TopBar({
  tenant,
  onTenantChange,
  environment,
  onEnvironmentChange,
  region,
  onRegionChange,
  serviceName = '',
  breadcrumbs = [],
}: TopBarProps) {
  const [currentTenant, setCurrentTenant] = useState(tenant || 'acme-corp')
  const [currentEnv, setCurrentEnv] = useState<Environment>(environment || 'production')
  const [currentRegion, setCurrentRegion] = useState<Region>(region || 'IN')
  const [showTenantDropdown, setShowTenantDropdown] = useState(false)
  const [showHelpDropdown, setShowHelpDropdown] = useState(false)
  const [showServicesMenu, setShowServicesMenu] = useState(false)
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const tenantDropdownRef = useRef<HTMLDivElement>(null)
  const helpDropdownRef = useRef<HTMLDivElement>(null)
  const servicesMenuRef = useRef<HTMLDivElement>(null)
  const regionDropdownRef = useRef<HTMLDivElement>(null)
  const accountDropdownRef = useRef<HTMLDivElement>(null)

  // Mock tenants - in production, this would come from API
  const tenants = [
    { id: 'acme-corp', name: 'Acme Corp' },
    { id: 'tech-startup', name: 'Tech Startup' },
    { id: 'finance-ltd', name: 'Finance Ltd' },
  ]

  const regions = [
    { code: 'IN', name: 'Asia Pacific (Mumbai)' },
    { code: 'EU', name: 'Europe (Ireland)' },
    { code: 'US', name: 'US East (N. Virginia)' },
  ]

  useEffect(() => {
    setMounted(true)
    setUser(getCurrentUser())
    setRole(getCurrentRole())
  }, [])

  useEffect(() => {
    if (environment) {
      setCurrentEnv(environment)
    }
  }, [environment])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tenantDropdownRef.current && !tenantDropdownRef.current.contains(event.target as Node)) {
        setShowTenantDropdown(false)
      }
      if (helpDropdownRef.current && !helpDropdownRef.current.contains(event.target as Node)) {
        setShowHelpDropdown(false)
      }
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(event.target as Node)) {
        setShowServicesMenu(false)
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setShowRegionDropdown(false)
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTenantSelect = (tenantId: string) => {
    setCurrentTenant(tenantId)
    setShowTenantDropdown(false)
    onTenantChange?.(tenantId)
  }

  const handleEnvironmentChange = (env: Environment) => {
    setCurrentEnv(env)
    onEnvironmentChange?.(env)
  }

  const handleRegionChange = (reg: Region) => {
    setCurrentRegion(reg)
    setShowRegionDropdown(false)
    onRegionChange?.(reg)
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="bg-[#232f3e] text-white h-10">
        <div className="flex items-center justify-between h-10 px-3">
          <div className="flex items-center space-x-1">
            <button className="px-2 py-1.5 rounded hover:bg-[#1a2332]">
              <ZordLogo size="sm" variant="dark" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !role) return null

  const roleBadge = getRoleBadge(role)
  const breadcrumbPath = breadcrumbs.length > 0 ? ` > ${breadcrumbs.join(' > ')}` : ''
  const currentRegionName = regions.find(r => r.code === currentRegion)?.name || currentRegion

  return (
    <div className="bg-[#232f3e] text-white shadow-sm border-b border-gray-700">
      {/* Main Top Bar - AWS Style */}
      <div className="flex items-center justify-between h-10 px-0">
        {/* Left: Logo and Services */}
        <div className="flex items-center h-full">
          {/* Logo */}
          <Link
            href="/console"
            className="px-3 h-full hover:bg-[#1a2332] flex items-center transition-colors"
            title="Zord Console Home"
          >
            <ZordLogo size="sm" variant="dark" />
          </Link>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-gray-600"></div>

          {/* Services Menu - Always visible */}
          <div className="relative h-full" ref={servicesMenuRef}>
            <button
              onClick={() => setShowServicesMenu(!showServicesMenu)}
              className={`px-3 h-full flex items-center space-x-2 text-sm font-medium text-white transition-colors ${
                showServicesMenu ? 'bg-[#1a2332]' : 'hover:bg-[#1a2332]'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Services</span>
            </button>
            {showServicesMenu && (
              <div className="absolute left-0 top-full mt-0.5 w-64 bg-white border border-gray-300 rounded shadow-2xl z-50">
                <div className="py-1.5">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    All Services
                  </div>
                  <Link
                    href="/console"
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    onClick={() => setShowServicesMenu(false)}
                  >
                    <div className="font-medium">Console Home</div>
                    <div className="text-xs text-gray-500 mt-0.5">Financial Control Plane</div>
                  </Link>
                  <Link
                    href="/console/ingestion"
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    onClick={() => setShowServicesMenu(false)}
                  >
                    <div className="font-medium">Ingestion</div>
                    <div className="text-xs text-gray-500 mt-0.5">Accept, normalize, and persist financial intents</div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Service Name & Breadcrumbs - Only show when inside a service */}
          {serviceName && serviceName !== '' && (
            <>
              <div className="h-6 w-px bg-gray-600 ml-2"></div>
              <div className="ml-3 flex items-center">
                <span className="text-sm font-medium text-white">{serviceName}</span>
                {breadcrumbPath && (
                  <span className="ml-2 text-xs text-gray-300 font-normal">{breadcrumbPath}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center max-w-2xl mx-8">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full h-8 px-3 pl-9 pr-20 bg-[#1a2332] border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono pointer-events-none">
              [Option+S]
            </span>
          </div>
        </div>

        {/* Right: Utility Icons, Region, Account */}
        <div className="flex items-center h-full space-x-0">
          {/* Terminal/CloudShell Icon */}
          <button
            className="px-3 h-full text-gray-300 hover:text-white hover:bg-[#1a2332] transition-colors"
            title="CloudShell"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>

          <div className="h-6 w-px bg-gray-600"></div>

          {/* Notifications/Bell Icon */}
          <button
            className="px-3 h-full text-gray-300 hover:text-white hover:bg-[#1a2332] transition-colors relative"
            title="Notifications"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>

          <div className="h-6 w-px bg-gray-600"></div>

          {/* Help/Question Mark Icon */}
          <div className="relative h-full" ref={helpDropdownRef}>
            <button
              onClick={() => setShowHelpDropdown(!showHelpDropdown)}
              className={`px-3 h-full text-gray-300 hover:text-white transition-colors ${
                showHelpDropdown ? 'bg-[#1a2332] text-white' : 'hover:bg-[#1a2332]'
              }`}
              title="Help"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            {showHelpDropdown && (
              <div className="absolute right-0 top-full mt-0.5 w-64 bg-white border border-gray-300 rounded shadow-2xl z-50">
                <div className="py-1.5">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Documentation
                  </div>
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault()
                      setShowHelpDropdown(false)
                    }}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">Getting Started</div>
                    <div className="text-xs text-gray-500 mt-0.5">Learn the fundamentals</div>
                  </a>
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault()
                      setShowHelpDropdown(false)
                    }}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">API Reference</div>
                    <div className="text-xs text-gray-500 mt-0.5">Complete API documentation</div>
                  </a>
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault()
                      setShowHelpDropdown(false)
                    }}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">Support</div>
                    <div className="text-xs text-gray-500 mt-0.5">Contact support team</div>
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-600"></div>

          {/* Settings/Gear Icon */}
          <button
            className="px-3 h-full text-gray-300 hover:text-white hover:bg-[#1a2332] transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <div className="h-6 w-px bg-gray-600"></div>

          {/* Region Dropdown */}
          <div className="relative h-full" ref={regionDropdownRef}>
            <button
              onClick={() => setShowRegionDropdown(!showRegionDropdown)}
              className={`px-3 h-full flex items-center space-x-1.5 text-sm text-white transition-colors ${
                showRegionDropdown ? 'bg-[#1a2332]' : 'hover:bg-[#1a2332]'
              }`}
            >
              <span>{currentRegionName}</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showRegionDropdown && (
              <div className="absolute right-0 top-full mt-0.5 w-64 bg-white border border-gray-300 rounded shadow-2xl z-50">
                <div className="py-1.5">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Select Region
                  </div>
                  {regions.map(r => (
                    <button
                      key={r.code}
                      onClick={() => handleRegionChange(r.code as Region)}
                      className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        currentRegion === r.code
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{r.code}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-600"></div>

          {/* Account Dropdown */}
          <div className="relative h-full" ref={accountDropdownRef}>
            <button
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className={`px-3 h-full flex items-center space-x-1.5 text-sm text-white transition-colors ${
                showAccountDropdown ? 'bg-[#1a2332]' : 'hover:bg-[#1a2332]'
              }`}
            >
              <span>
                {roleBadge}/{user.email || 'user@example.com'} @ {user.tenant || 'default'}
              </span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAccountDropdown && (
              <div className="absolute right-0 top-full mt-0.5 w-80 bg-white border border-gray-300 rounded shadow-2xl z-50">
                <div className="py-1.5">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="text-sm font-semibold text-gray-900">{user.email || 'user@example.com'}</div>
                    <div className="text-xs text-gray-500 mt-1">Role: {roleBadge}</div>
                    <div className="text-xs text-gray-500">Tenant: {user.tenant || 'default'}</div>
                  </div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Account
                  </div>
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false)
                      // Handle sign out
                    }}
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
