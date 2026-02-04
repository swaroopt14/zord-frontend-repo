'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, getCurrentUser } from '@/services/auth'
import { RoleSwitcher } from '@/components/auth'
import { canAccessDLQ } from '@/utils/permissions'
import { format } from 'date-fns'

export default function IngressEnvelopesPage() {
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

  const envelopes = [
    { envelope_id: 'env_9f3a...', source: 'api', source_system: 'erp', parse_status: 'OK', signature_status: 'VERIFIED', received_at: '2026-02-04T10:05:33Z' },
    { envelope_id: 'env_28bd...', source: 'webhook', source_system: 'razorpay', parse_status: 'FAILED', signature_status: 'VERIFIED', received_at: '2026-02-04T10:06:00Z' },
    { envelope_id: 'env_7a10...', source: 'webhook', source_system: 'hdfc', parse_status: 'OK', signature_status: 'FAILED', received_at: '2026-02-04T10:06:15Z' },
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
      <div className="mb-4">
        <Link href="/ops/tenants" className="text-sm text-gray-500 hover:text-gray-700">Ingress</Link>
        <span className="mx-2 text-gray-400">▸</span>
        <span className="text-sm font-medium text-gray-900">Envelopes</span>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ingress ▸ Envelopes</h1>
        <p className="mt-2 text-sm text-gray-600">
          First stop when something broke at ingestion. Did we receive it? How? What did we ACK?
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option>Time range ▾</option>
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option>Source ▾</option>
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option>Source System ▾</option>
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option>Parse Status ▾</option>
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option>Signature ▾</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Envelope ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source System</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parse Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signature</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received At</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {envelopes.map((e) => (
              <tr key={e.envelope_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">{e.envelope_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{e.source}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{e.source_system}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${e.parse_status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {e.parse_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${e.signature_status === 'VERIFIED' ? 'bg-green-100 text-green-800' : e.signature_status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {e.signature_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(e.received_at), 'yyyy-MM-dd HH:mm')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link href={`/ops/ingress/envelopes/${e.envelope_id.replace('...', '')}`} className="text-blue-600 hover:text-blue-800">
                    View →
                  </Link>
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
