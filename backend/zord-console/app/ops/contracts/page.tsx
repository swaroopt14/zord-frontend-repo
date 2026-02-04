'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, getCurrentUser } from '@/services/auth'
import { RoleSwitcher } from '@/components/auth'
import { canAccessDLQ } from '@/utils/permissions'

export default function ContractsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/ops/login')
      return
    }
    const user = getCurrentUser()
    if (user && !canAccessDLQ(user.role)) {
      router.push('/ops/login')
      return
    }
    setLoading(false)
  }, [router])

  const contracts = [
    { contract_id: 'ctr_777', intent_id: 'intent_abc123', status: 'ISSUED', created_at: '2026-02-04T10:00:03Z' },
    { contract_id: 'ctr_778', intent_id: 'intent_def456', status: 'FAILED', created_at: '2026-02-04T11:00:00Z' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RoleSwitcher />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contracts ▸ Payout Contracts</h1>
        <p className="mt-2 text-sm text-gray-600">
          Read-only view of contracts derived from intents. Immutable artifacts.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">Time</select>
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">Status ▾</select>
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">Type ▾</select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intent ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contracts.map((c) => (
              <tr key={c.contract_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">{c.contract_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{c.intent_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${c.status === 'ISSUED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.created_at}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link href={`/ops/contracts/${c.contract_id}`} className="text-blue-600 hover:text-blue-800">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-gray-200 text-sm text-gray-500">Pagination</div>
      </div>
    </div>
  )
}
