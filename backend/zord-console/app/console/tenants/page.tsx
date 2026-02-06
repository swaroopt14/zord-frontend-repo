'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated } from '@/services/auth'
import { Layout } from '@/components/aws/Layout'

type TenantStatus = 'HEALTHY' | 'AT_RISK' | 'IMPACTED'
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
type TenantTier = 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'

interface TenantSummary {
  tenant_id: string
  tenant_name: string
  display_name: string
  tier: TenantTier
  risk_level: RiskLevel
  status: TenantStatus
  success_rate: number
  dlq_count: number
  last_activity: string
}

// Mock data
const mockTenants: TenantSummary[] = [
  { tenant_id: 't_91af', tenant_name: 'acme_fintech', display_name: 'Acme_Fintech', tier: 'ENTERPRISE', risk_level: 'HIGH', status: 'IMPACTED', success_rate: 82.1, dlq_count: 47, last_activity: '2m ago' },
  { tenant_id: 't_77bd', tenant_name: 'zenpay', display_name: 'ZenPay', tier: 'PREMIUM', risk_level: 'MEDIUM', status: 'AT_RISK', success_rate: 95.4, dlq_count: 8, last_activity: '5m ago' },
  { tenant_id: 't_12ac', tenant_name: 'novabank', display_name: 'NovaBank', tier: 'ENTERPRISE', risk_level: 'LOW', status: 'HEALTHY', success_rate: 99.2, dlq_count: 2, last_activity: '1m ago' },
  { tenant_id: 't_99dd', tenant_name: 'alpharetail', display_name: 'AlphaRetail', tier: 'STANDARD', risk_level: 'LOW', status: 'HEALTHY', success_rate: 99.1, dlq_count: 1, last_activity: '8m ago' },
  { tenant_id: 't_34ef', tenant_name: 'paycore', display_name: 'PayCore', tier: 'PREMIUM', risk_level: 'LOW', status: 'HEALTHY', success_rate: 99.8, dlq_count: 0, last_activity: '3m ago' },
  { tenant_id: 't_56gh', tenant_name: 'finserve', display_name: 'FinServe', tier: 'STANDARD', risk_level: 'LOW', status: 'HEALTHY', success_rate: 100, dlq_count: 0, last_activity: '12m ago' },
]

function StatusBadge({ status }: { status: TenantStatus }) {
  const config = {
    HEALTHY: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    AT_RISK: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    IMPACTED: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  }
  const c = config[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} mr-1.5`} />
      {status === 'AT_RISK' ? 'At Risk' : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const config = {
    LOW: { bg: 'bg-green-50', text: 'text-green-700' },
    MEDIUM: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
    HIGH: { bg: 'bg-red-50', text: 'text-red-700' },
  }
  const c = config[level]
  return <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${c.bg} ${c.text}`}>{level}</span>
}

function TierBadge({ tier }: { tier: TenantTier }) {
  const config = {
    STANDARD: { bg: 'bg-gray-100', text: 'text-gray-600' },
    PREMIUM: { bg: 'bg-blue-50', text: 'text-blue-700' },
    ENTERPRISE: { bg: 'bg-purple-50', text: 'text-purple-700' },
  }
  const c = config[tier]
  return <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${c.bg} ${c.text}`}>{tier}</span>
}

function TenantDirectoryContent() {
  const router = useRouter()
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'impacted' | 'at_risk' | 'healthy'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/console/login')
      return
    }
    // Simulate loading
    setTimeout(() => {
      setTenants(mockTenants)
      setLoading(false)
    }, 300)
  }, [router])

  const filteredTenants = tenants.filter(t => {
    const matchesFilter = filter === 'all' || 
      (filter === 'impacted' && t.status === 'IMPACTED') ||
      (filter === 'at_risk' && t.status === 'AT_RISK') ||
      (filter === 'healthy' && t.status === 'HEALTHY')
    const matchesSearch = t.display_name.toLowerCase().includes(search.toLowerCase()) ||
      t.tenant_id.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: tenants.length,
    healthy: tenants.filter(t => t.status === 'HEALTHY').length,
    atRisk: tenants.filter(t => t.status === 'AT_RISK').length,
    impacted: tenants.filter(t => t.status === 'IMPACTED').length,
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600" />
            <p className="mt-3 text-sm text-gray-500">Loading tenants...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="zord-page">
      {/* Header */}
      <div className="zord-page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="zord-page-title text-xl">Tenant Directory</h1>
            <p className="zord-page-subtitle">Overview of all tenants and their health status</p>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="zord-input w-64"
            />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`bg-white border rounded-lg p-4 text-left transition-all ${filter === 'all' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-sm text-gray-500">Total Tenants</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </button>
          <button
            onClick={() => setFilter('healthy')}
            className={`bg-white border rounded-lg p-4 text-left transition-all ${filter === 'healthy' ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-sm text-gray-500">Healthy</div>
            <div className="text-3xl font-bold text-green-600">{stats.healthy}</div>
          </button>
          <button
            onClick={() => setFilter('at_risk')}
            className={`bg-white border rounded-lg p-4 text-left transition-all ${filter === 'at_risk' ? 'border-yellow-500 ring-2 ring-yellow-100' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-sm text-gray-500">At Risk</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.atRisk}</div>
          </button>
          <button
            onClick={() => setFilter('impacted')}
            className={`bg-white border rounded-lg p-4 text-left transition-all ${filter === 'impacted' ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-sm text-gray-500">Impacted</div>
            <div className="text-3xl font-bold text-red-600">{stats.impacted}</div>
          </button>
        </div>

        {/* Tenant Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Tier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Risk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Success Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">DLQ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Activity</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTenants.map((tenant) => (
                <tr 
                  key={tenant.tenant_id} 
                  className={`hover:bg-gray-50 cursor-pointer ${tenant.status === 'IMPACTED' ? 'bg-red-50/30' : ''}`}
                  onClick={() => router.push(`/console/tenants/${tenant.tenant_id}`)}
                >
                  <td className="px-4 py-3">
                    <StatusBadge status={tenant.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{tenant.display_name}</div>
                    <div className="text-xs text-gray-500 font-mono">{tenant.tenant_id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={tenant.tier} />
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={tenant.risk_level} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold tabular-nums ${
                      tenant.success_rate < 90 ? 'text-red-600' : 
                      tenant.success_rate < 95 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {tenant.success_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold tabular-nums ${
                      tenant.dlq_count > 20 ? 'text-red-600' : 
                      tenant.dlq_count > 5 ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {tenant.dlq_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {tenant.last_activity}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link 
                      href={`/console/tenants/${tenant.tenant_id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTenants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No tenants found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TenantDirectoryPage() {
  return (
    <Layout serviceName="Ops Ingestion" breadcrumbs={['Tenants', 'Directory']}>
      <TenantDirectoryContent />
    </Layout>
  )
}
