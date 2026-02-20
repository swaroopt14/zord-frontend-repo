'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type ContractDetail = {
  contract_id: string
  tenant_id?: string
  intent_id?: string
  envelope_id?: string
  contract_payload?: unknown
  contract_hash?: string
  status?: string
  created_at?: string
}

type EnvelopeDetail = {
  envelope_id: string
  tenant_id?: string
  source?: string
  source_system?: string
  idempotency_key?: string
  sha256?: string
  object_ref?: string
  parse_status?: string
  signature_status?: string
  received_at?: string
}

function decodePayload(payload: unknown): unknown {
  if (payload == null) return null
  if (typeof payload === 'object') return payload
  if (typeof payload !== 'string') return payload
  try {
    return JSON.parse(atob(payload))
  } catch {
    try {
      return JSON.parse(payload)
    } catch {
      return payload
    }
  }
}

function EvidenceExplorerContent() {
  const params = useSearchParams()
  const contractId = params.get('contract_id') || ''
  const envelopeId = params.get('envelope_id') || ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [envelope, setEnvelope] = useState<EnvelopeDetail | null>(null)
  const [showContractJson, setShowContractJson] = useState(true)
  const [showEnvelopeJson, setShowEnvelopeJson] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!contractId && !envelopeId) return

      setLoading(true)
      setError(null)
      try {
        const calls: Promise<Response>[] = []
        if (contractId) calls.push(fetch(`/api/prod/payout-contracts/${encodeURIComponent(contractId)}`, { cache: 'no-store' }))
        if (envelopeId) calls.push(fetch(`/api/prod/raw-envelopes/${encodeURIComponent(envelopeId)}`, { cache: 'no-store' }))

        const responses = await Promise.all(calls)
        let i = 0
        if (contractId) {
          const res = responses[i++]
          if (res.ok) setContract((await res.json()) as ContractDetail)
          else if (res.status !== 404) throw new Error(`Contract API failed: ${res.status}`)
        }
        if (envelopeId) {
          const res = responses[i++]
          if (res.ok) setEnvelope((await res.json()) as EnvelopeDetail)
          else if (res.status !== 404) throw new Error(`Envelope API failed: ${res.status}`)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load evidence')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contractId, envelopeId])

  const decodedContractPayload = useMemo(
    () => decodePayload(contract?.contract_payload),
    [contract?.contract_payload]
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2 text-xs text-cx-neutral">
        <Link href="/customer/evidence" className="hover:text-cx-purple-600 transition-colors">
          Evidence Packs
        </Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-cx-text font-medium">Evidence Explorer</span>
      </div>

      <div>
        <h1 className="text-xl font-bold text-cx-text">Evidence Explorer</h1>
        <p className="text-sm text-cx-neutral mt-0.5">
          Live contract and raw envelope records
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {!contractId && !envelopeId ? (
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm text-cx-neutral">
          Open this page from Evidence Packs list to inspect linked `contract_id` and `envelope_id`.
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm text-cx-neutral">
          Loading...
        </div>
      ) : null}

      {contract ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-cx-text">Contract</h2>
              <p className="text-xs font-mono text-cx-neutral">{contract.contract_id}</p>
            </div>
            <button
              onClick={() => setShowContractJson((v) => !v)}
              className="text-xs font-semibold text-cx-purple-600 hover:text-cx-purple-700"
            >
              {showContractJson ? 'Collapse' : 'Expand'}
            </button>
          </div>
          {showContractJson ? (
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>Intent: <span className="font-mono">{contract.intent_id || '-'}</span></div>
                <div>Envelope: <span className="font-mono">{contract.envelope_id || '-'}</span></div>
                <div>Status: <span className="font-medium">{contract.status || '-'}</span></div>
                <div>Hash: <span className="font-mono">{contract.contract_hash || '-'}</span></div>
              </div>
              <pre className="text-xs font-mono text-cx-neutral bg-gray-50 p-4 rounded-lg overflow-x-auto">
{JSON.stringify({
  ...contract,
  contract_payload: decodedContractPayload,
}, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}

      {envelope ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-cx-text">Raw Envelope</h2>
              <p className="text-xs font-mono text-cx-neutral">{envelope.envelope_id}</p>
            </div>
            <button
              onClick={() => setShowEnvelopeJson((v) => !v)}
              className="text-xs font-semibold text-cx-purple-600 hover:text-cx-purple-700"
            >
              {showEnvelopeJson ? 'Collapse' : 'Expand'}
            </button>
          </div>
          {showEnvelopeJson ? (
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>Source: <span className="font-medium">{envelope.source || '-'}</span></div>
                <div>Parse: <span className="font-medium">{envelope.parse_status || '-'}</span></div>
                <div>Signature: <span className="font-medium">{envelope.signature_status || '-'}</span></div>
                <div>Hash: <span className="font-mono">{envelope.sha256 || '-'}</span></div>
              </div>
              <pre className="text-xs font-mono text-cx-neutral bg-gray-50 p-4 rounded-lg overflow-x-auto">
{JSON.stringify(envelope, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function EvidenceExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm text-cx-neutral">
            Loading evidence explorer...
          </div>
        </div>
      }
    >
      <EvidenceExplorerContent />
    </Suspense>
  )
}
