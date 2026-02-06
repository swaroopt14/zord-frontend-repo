'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, getCurrentUser } from '@/services/auth'
import { RoleSwitcher } from '@/components/auth'
import { canAccessDLQ } from '@/utils/permissions'

export default function ContractDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
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
        <Link href="/ops/contracts" className="text-sm text-gray-500 hover:text-gray-700">Contracts</Link>
        <span className="mx-2 text-gray-400">▸</span>
        <span className="text-sm font-medium text-gray-900">{id}</span>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contracts ▸ {id}</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Summary</h2>
        </div>
        <div className="px-6 py-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Contract ID:</span>
            <span className="font-mono">{id}</span>
            <button className="text-blue-600 hover:text-blue-800 text-xs">[Copy]</button>
          </div>
          <div>
            <span className="text-gray-500">Intent ID:</span>{' '}
            <Link href="/ops/intents/intent_abc123" className="text-blue-600 hover:text-blue-800">intent_abc123</Link>{' '}
            [Open Intent]
          </div>
          <div><span className="text-gray-500">Status:</span> ISSUED → SUCCEEDED</div>
          <div><span className="text-gray-500">Created At:</span> 2026-02-04T10:00:03Z</div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Contract Hash:</span>
            <span className="font-mono">8ac9…</span>
            <button className="text-blue-600 hover:text-blue-800 text-xs">[Copy]</button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
        </div>
        <div className="px-6 py-4 space-y-2 text-sm">
          <div className="flex items-center gap-2"><span className="text-green-600">✓</span> CREATED 10:00:03Z</div>
          <div className="flex items-center gap-2"><span className="text-green-600">✓</span> SENT_TO_PROVIDER 10:00:04Z</div>
          <div className="flex items-center gap-2"><span className="text-green-600">✓</span> SETTLEMENT_CONF 10:05:10Z</div>
          <div className="flex items-center gap-2"><span className="text-green-600">✓</span> COMPLETED 10:05:10Z</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Contract Payload</h2>
        </div>
        <div className="px-6 py-4">
          <pre className="text-sm font-mono bg-gray-50 p-4 rounded overflow-x-auto">
{`{
  "intent_id": "intent_abc123",
  "amount": 500000,
  ...
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}
