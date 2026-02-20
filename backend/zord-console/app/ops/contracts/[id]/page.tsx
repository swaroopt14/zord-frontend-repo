'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, getCurrentUser } from '@/services/auth'
import { RoleSwitcher } from '@/components/auth'
import { canAccessDLQ } from '@/utils/permissions'
import { format } from 'date-fns'

type PayoutContract = {
  contract_id: string
  tenant_id: string
  intent_id: string
  envelope_id: string
  contract_payload: string
  contract_hash: string
  status: string
  created_at: string
  trace_id?: string
}

function maskValue(value: string): string {
  const v = value.trim()
  if (v.length <= 6) return '***'
  return `${v.slice(0, 3)}***${v.slice(-2)}`
}

function redactPII(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(redactPII)
  if (!input || typeof input !== 'object') return input

  const obj: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const key = k.toLowerCase()
    if (typeof v === 'string' && (key.includes('account') || key.includes('pan') || key.includes('vpa'))) {
      obj[k] = maskValue(v)
      continue
    }
    obj[k] = redactPII(v)
  }
  return obj
}

function tryDecodeBase64Payload(b64: string): string | null {
  try {
    // Browser-safe decoding; if backend sends non-base64, this will throw.
    return atob(b64)
  } catch {
    return null
  }
}

export default function ContractDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contract, setContract] = useState<PayoutContract | null>(null)
  const [payloadExpanded, setPayloadExpanded] = useState(false)

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
    loadContract()
  }, [router])

  const loadContract = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/prod/payout-contracts/${encodeURIComponent(id)}`, { cache: 'no-store' })
      if (res.status === 404) {
        setContract(null)
        setError('Contract not found')
        return
      }
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      setContract(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contract')
      setContract(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RoleSwitcher />
        <div className="mb-4">
          <Link href="/ops/contracts" className="text-sm text-gray-500 hover:text-gray-700">
            Contracts
          </Link>
          <span className="mx-2 text-gray-400">▸</span>
          <span className="text-sm font-medium text-gray-900">{id}</span>
        </div>
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      </div>
    )
  }

  const decoded = contract?.contract_payload ? tryDecodeBase64Payload(contract.contract_payload) : null
  let prettyPayload = ''
  if (decoded) {
    try {
      const parsed = JSON.parse(decoded)
      const redacted = redactPII(parsed)
      prettyPayload = JSON.stringify(redacted, null, 2)
    } catch {
      // Non-JSON payload: display decoded but still avoid leaking obvious PII-like strings.
      prettyPayload = decoded
    }
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
            {contract?.intent_id ? (
              <Link href={`/ops/intents/${contract.intent_id}`} className="text-blue-600 hover:text-blue-800">
                {contract.intent_id}
              </Link>
            ) : (
              '-'
            )}
          </div>
          <div><span className="text-gray-500">Status:</span> {contract?.status || '-'}</div>
          <div>
            <span className="text-gray-500">Created At:</span>{' '}
            {contract?.created_at ? format(new Date(contract.created_at), 'yyyy-MM-dd HH:mm:ss') : '-'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Contract Hash:</span>
            <span className="font-mono">{contract?.contract_hash || '-'}</span>
            <button className="text-blue-600 hover:text-blue-800 text-xs">[Copy]</button>
          </div>
          <div><span className="text-gray-500">Tenant ID:</span> <span className="font-mono">{contract?.tenant_id || '-'}</span></div>
          <div><span className="text-gray-500">Envelope ID:</span> <span className="font-mono">{contract?.envelope_id || '-'}</span></div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Contract Payload (redacted)</h2>
            <button
              onClick={() => setPayloadExpanded((v) => !v)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {payloadExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          {decoded ? (
            <pre className={`text-sm font-mono bg-gray-50 p-4 rounded overflow-x-auto ${payloadExpanded ? '' : 'max-h-80 overflow-y-auto'}`}>
              {prettyPayload || '(empty)'}
            </pre>
          ) : (
            <div className="text-sm text-gray-600">
              Payload not available or not base64-encoded.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
