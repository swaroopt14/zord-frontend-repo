'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, getCurrentUser, getCurrentRole } from '@/services/auth'
import { Layout } from '@/components/aws'
import { format } from 'date-fns'
import { UserRole } from '@/types/auth'

interface RawEnvelope {
  envelope_id: string
  source: string
  content_type: string
  size_bytes: number
  sha256: string
  received_at: string
  tenant?: string
  linked_intent_ids?: string[]
  linked_batch_id?: string
  transport_metadata?: {
    ip_address?: string
    mtls_subject?: string
    headers?: Record<string, string>
  }
  raw_payload?: string
}

// Generate realistic dummy data
function generateDummyEnvelopes(): RawEnvelope[] {
  const sources = ['API', 'Webhook', 'SFTP']
  const contentTypes = ['application/json', 'application/xml', 'text/csv', 'application/x-ndjson']
  const envelopes: RawEnvelope[] = []
  const now = new Date()
  
  for (let i = 0; i < 189; i++) {
    const hoursAgo = Math.floor(Math.random() * 72)
    const receivedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)
    const source = sources[Math.floor(Math.random() * sources.length)]
    const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)]
    const size = Math.floor(Math.random() * 50000 + 100)
    
    const timestamp = receivedAt.toISOString().replace(/[-:T]/g, '').split('.')[0] + 'Z'
    const envelopeId = `env_${timestamp}_${Math.random().toString(36).substring(2, 6)}`
    
    // Generate mock payload based on content type
    let rawPayload = ''
    if (contentType === 'application/json') {
      rawPayload = JSON.stringify({
        intent_type: 'PAYOUT',
        amount: { value: '125000.00', currency: 'INR' },
        instrument: { kind: 'BANK', account_token: 'tok_acct_f3a2' },
        purpose_code: 'SALA',
      }, null, 2)
    } else if (contentType === 'application/xml') {
      rawPayload = `<?xml version="1.0"?><intent><type>PAYOUT</type><amount value="125000.00" currency="INR"/></intent>`
    } else {
      rawPayload = 'intent_type,amount,currency\nPAYOUT,125000.00,INR'
    }
    
    envelopes.push({
      envelope_id: envelopeId,
      source,
      content_type: contentType,
      size_bytes: size,
      sha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      received_at: receivedAt.toISOString(),
      tenant: ['acme-finance-prod', 'techcorp-sandbox', 'fintech-ai-prod'][Math.floor(Math.random() * 3)],
      linked_intent_ids: Math.random() > 0.3 ? [`pi_${Date.now()}_${i}`] : [],
      linked_batch_id: Math.random() > 0.7 ? `batch_${Date.now()}` : undefined,
      transport_metadata: {
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        mtls_subject: source === 'API' ? `CN=client-${i},O=Acme Finance` : undefined,
        headers: {
          'Content-Type': contentType,
          'User-Agent': 'Zord-Client/1.0',
          'X-Request-ID': `req_${Date.now()}`,
        },
      },
      raw_payload: rawPayload,
    })
  }
  
  return envelopes.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
}

// Format file size
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Check if user can download (RBAC gated)
function canDownload(role: UserRole | null): boolean {
  return role === 'ADMIN' || role === 'OPS'
}

export default function RawEnvelopesPage() {
  const router = useRouter()
  const [envelopes, setEnvelopes] = useState<RawEnvelope[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEnvelope, setSelectedEnvelope] = useState<RawEnvelope | null>(null)
  const [showDetailView, setShowDetailView] = useState(false)
  
  // Filters
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('')
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | 'all'>('24h')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)
  const [sortColumn, setSortColumn] = useState<string>('received_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const user = getCurrentUser()
  const role = getCurrentRole()
  const canDownloadEnvelopes = canDownload(role)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/console/login')
      return
    }
    loadEnvelopes()
  }, [router])

  const loadEnvelopes = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const dummyData = generateDummyEnvelopes()
      setEnvelopes(dummyData)
    } catch (error) {
      console.error('Failed to load envelopes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtering
  const filteredEnvelopes = envelopes.filter(envelope => {
    // Source filter
    if (sourceFilter && envelope.source !== sourceFilter) {
      return false
    }
    
    // Content type filter
    if (contentTypeFilter && envelope.content_type !== contentTypeFilter) {
      return false
    }
    
    // Time range filter
    const now = new Date()
    const envelopeDate = new Date(envelope.received_at)
    if (timeRange !== 'all') {
      const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720
      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000)
      if (envelopeDate < cutoff) return false
    }
    
    return true
  })

  // Sorting
  const sortedEnvelopes = [...filteredEnvelopes].sort((a, b) => {
    let aVal: any = a[sortColumn as keyof RawEnvelope]
    let bVal: any = b[sortColumn as keyof RawEnvelope]
    
    if (sortColumn === 'received_at') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    } else if (sortColumn === 'size_bytes') {
      aVal = a.size_bytes
      bVal = b.size_bytes
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedEnvelopes.length / pageSize)
  const paginatedEnvelopes = sortedEnvelopes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleDownload = (envelope: RawEnvelope) => {
    if (!canDownloadEnvelopes || !envelope.raw_payload) return
    
    const blob = new Blob([envelope.raw_payload], { type: envelope.content_type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${envelope.envelope_id}.${envelope.content_type.includes('json') ? 'json' : envelope.content_type.includes('xml') ? 'xml' : 'csv'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // Audit log (would be sent to backend in production)
    console.log(`[AUDIT] Download accessed: ${envelope.envelope_id} by ${user?.email} at ${new Date().toISOString()}`)
  }

  // Get unique values for filters
  const uniqueSources = Array.from(new Set(envelopes.map(e => e.source))).sort()
  const uniqueContentTypes = Array.from(new Set(envelopes.map(e => e.content_type))).sort()

  if (loading) {
    return (
      <Layout 
        serviceName="Ingestion"
        breadcrumbs={['Raw Envelopes']}
        tenant={user?.tenant}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
              <p className="mt-4 text-sm text-gray-600">Loading raw envelopes...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout 
      serviceName="Ingestion"
      breadcrumbs={['Raw Envelopes']}
      tenant={user?.tenant}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header - AWS Style */}
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-normal text-gray-900">
              Raw Envelopes
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Expose the exact bytes received at ingress — before any parsing or mutation
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadEnvelopes}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Refresh"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Panel - AWS Style */}
        <div className="mb-4 bg-white border border-gray-200 rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-medium text-gray-900">Filters</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Source Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All sources</option>
                  {uniqueSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              {/* Content Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content-Type</label>
                <select
                  value={contentTypeFilter}
                  onChange={(e) => {
                    setContentTypeFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All content types</option>
                  {uniqueContentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Time Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                <select
                  value={timeRange}
                  onChange={(e) => {
                    setTimeRange(e.target.value as any)
                    setCurrentPage(1)
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="1h">Last 1 hour</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table - AWS Style */}
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('envelope_id')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Envelope ID</span>
                      {sortColumn === 'envelope_id' && (
                        <svg className={`w-4 h-4 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('source')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Source</span>
                      {sortColumn === 'source' && (
                        <svg className={`w-4 h-4 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('content_type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Content-Type</span>
                      {sortColumn === 'content_type' && (
                        <svg className={`w-4 h-4 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('size_bytes')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Size</span>
                      {sortColumn === 'size_bytes' && (
                        <svg className={`w-4 h-4 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SHA-256
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('received_at')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Received At</span>
                      {sortColumn === 'received_at' && (
                        <svg className={`w-4 h-4 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEnvelopes.length > 0 ? (
                  paginatedEnvelopes.map((envelope) => (
                    <tr
                      key={envelope.envelope_id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        router.push(`/console/ingestion/raw-envelopes/${envelope.envelope_id}`)
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/console/ingestion/raw-envelopes/${envelope.envelope_id}`)
                          }}
                          className="text-blue-600 hover:text-blue-800 font-mono text-sm underline"
                          title="Click to view details"
                        >
                          {envelope.envelope_id}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {envelope.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {envelope.content_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatSize(envelope.size_bytes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono text-gray-600">
                          {envelope.sha256.substring(0, 16)}...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {format(new Date(envelope.received_at), 'yyyy-MM-dd HH:mm:ss')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-sm text-gray-500">
                        <p className="font-medium">No envelopes found</p>
                        <p className="mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - AWS Style */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * pageSize, sortedEnvelopes.length)}</span> of{' '}
                    <span className="font-medium">{sortedEnvelopes.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Envelope Detail View Modal */}
      {showDetailView && selectedEnvelope && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailView(false)}>
          <div className="bg-white rounded shadow-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Envelope: {selectedEnvelope.envelope_id}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Admin Forensics View</p>
              </div>
              <button
                onClick={() => setShowDetailView(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Transport Metadata */}
              {selectedEnvelope.transport_metadata && (
                <div className="bg-white border border-gray-200 rounded shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-900">Transport Metadata</h3>
                  </div>
                  <div className="p-4">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedEnvelope.transport_metadata.ip_address && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">IP Address</dt>
                          <dd className="text-sm font-mono text-gray-900">{selectedEnvelope.transport_metadata.ip_address}</dd>
                        </div>
                      )}
                      {selectedEnvelope.transport_metadata.mtls_subject && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">mTLS Subject</dt>
                          <dd className="text-sm font-mono text-gray-900">{selectedEnvelope.transport_metadata.mtls_subject}</dd>
                        </div>
                      )}
                      {selectedEnvelope.transport_metadata.headers && (
                        <div className="sm:col-span-2">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Headers</dt>
                          <div className="bg-gray-50 rounded p-3 border border-gray-200">
                            <pre className="text-xs font-mono text-gray-800 overflow-x-auto">
                              {JSON.stringify(selectedEnvelope.transport_metadata.headers, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )}

              {/* Raw Payload Viewer */}
              <div className="bg-white border border-gray-200 rounded shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Payload (Read-Only)</h3>
                  {canDownloadEnvelopes && selectedEnvelope.raw_payload && (
                    <button
                      onClick={() => handleDownload(selectedEnvelope)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Download
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <div className="bg-gray-900 rounded border border-gray-700 overflow-auto max-h-96">
                    <pre className="text-xs font-mono text-gray-100 p-4">
                      {selectedEnvelope.raw_payload || 'No payload available'}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Linked Objects */}
              <div className="bg-white border border-gray-200 rounded shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-900">Linked Objects</h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* Linked Intent IDs */}
                  {selectedEnvelope.linked_intent_ids && selectedEnvelope.linked_intent_ids.length > 0 && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Intent ID(s)</dt>
                      <div className="space-y-2">
                        {selectedEnvelope.linked_intent_ids.map((intentId, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                            <span className="text-sm font-mono text-gray-900">{intentId}</span>
                            <Link
                              href={`/console/ingestion/intents/${intentId}`}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View →
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Linked Batch ID */}
                  {selectedEnvelope.linked_batch_id && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Batch ID</dt>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-sm font-mono text-gray-900">{selectedEnvelope.linked_batch_id}</span>
                        <Link
                          href={`/console/ingestion/batch/${selectedEnvelope.linked_batch_id}`}
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Batch →
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  {(!selectedEnvelope.linked_intent_ids || selectedEnvelope.linked_intent_ids.length === 0) && !selectedEnvelope.linked_batch_id && (
                    <p className="text-sm text-gray-500">No linked objects</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
