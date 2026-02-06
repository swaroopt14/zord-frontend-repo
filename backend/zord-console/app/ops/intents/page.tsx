'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, getCurrentUser } from '@/services/auth'
import { RoleSwitcher } from '@/components/auth'
import { canAccessDLQ } from '@/utils/permissions'
import { format } from 'date-fns'

export default function IntentsPage() {
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

  const intents = [
    { intent_id: 'intent_abc123', intent_type: 'PAYOUT', amount: 5000, currency: 'INR', status: 'DONE', confidence_score: 0.98, created_at: '2026-02-04T10:00:01Z' },
    { intent_id: 'intent_def456', intent_type: 'PAYOUT', amount: 50000, currency: 'INR', status: 'REJECTED', confidence_score: 1.0, created_at: '2026-02-04T10:05:00Z' },
    { intent_id: 'intent_ghi789', intent_type: 'REFUND', amount: 1000, currency: 'INR', status: 'PROCESSING', confidence_score: 1.0, created_at: '2026-02-04T10:06:00Z' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    DONE: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PROCESSING: 'bg-amber-100 text-amber-800',
    RECEIVED: 'bg-blue-100 text-blue-800',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RoleSwitcher />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Intents ▸ Canonical Intents</h1>
        <p className="mt-2 text-sm text-gray-600">
          Primary Intent Journal for ops, backed by payment_intents.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">Time range</select>
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">Type ▾</select>
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">Status ▾</select>
        <input type="text" placeholder="Min amount" className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm" />
        <input type="text" placeholder="Max amount" className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm" />
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">Provider ▾</select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intent ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {intents.map((i) => (
              <tr key={i.intent_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">{i.intent_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{i.intent_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{i.amount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{i.currency}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[i.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {i.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{i.confidence_score}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(i.created_at), 'yyyy-MM-dd HH:mm')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link href={`/ops/intents/${i.intent_id}`} className="text-blue-600 hover:text-blue-800">View →</Link>
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
