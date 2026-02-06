'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, getCurrentUser } from '@/services/auth'
import { Layout } from '@/components/aws'
import { format } from 'date-fns'
import { DLQData } from '@/types/ingress'

// Channel badge
function ChannelBadge({ channel }: { channel: string }) {
  const styles: Record<string, string> = {
    API: 'bg-blue-100 text-blue-800',
    WEBHOOK: 'bg-purple-100 text-purple-800',
    STREAM: 'bg-green-100 text-green-800',
    BATCH: 'bg-orange-100 text-orange-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[channel] || 'bg-gray-100 text-gray-800'}`}>
      {channel}
    </span>
  )
}

export default function DLQPage() {
  const router = useRouter()
  const [data, setData] = useState<DLQData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/console/login')
      return
    }
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [router])

  const loadData = async () => {
    try {
      setError(null)
      const response = await fetch('/api/prod/ingress/dlq')
      if (!response.ok) throw new Error('Failed to load')
      const result: DLQData = await response.json()
      setData(result)
      setLastRefresh(new Date())
    } catch (err) {
      setError('Failed to load DLQ data')
    } finally {
      setLoading(false)
    }
  }

  const user = getCurrentUser()

  if (loading && !data) {
    return (
      <Layout serviceName="Ingestion" breadcrumbs={['Validation & Safety', 'DLQ (Failures)']} tenant={user?.tenant}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
              <p className="mt-4 text-sm text-gray-600">Loading DLQ data...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !data) {
    return (
      <Layout serviceName="Ingestion" breadcrumbs={['Validation & Safety', 'DLQ (Failures)']} tenant={user?.tenant}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white border border-red-200 rounded p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Failed to load data'}</p>
            <button onClick={loadData} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">Retry</button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout serviceName="Ingestion" breadcrumbs={['Validation & Safety', 'DLQ (Failures)']} tenant={user?.tenant}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-gray-900">DLQ (Failures)</h1>
              <span className="text-sm text-gray-500">{data.overview.total_failures} Total</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{data.overview.time_range}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Central DLQ Aggregator | Cross-channel failure monitoring</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500">Updated: {format(lastRefresh, 'HH:mm:ss')}</span>
            <button onClick={loadData} className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Refresh</button>
            <Link href="/console/ingestion/replay-auth" className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Replay Auth</Link>
            <Link href="/console/ingestion/event-graph" className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Event Graph</Link>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* DLQ Overview */}
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-medium text-gray-900">DLQ Overview</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded border border-gray-200">
                  <div className="text-3xl font-semibold text-gray-900">{data.overview.total_failures}</div>
                  <div className="text-xs text-gray-500">Total Failures</div>
                </div>
                <div className="grid grid-rows-2 gap-2">
                  <div className="text-center p-2 bg-yellow-50 rounded border border-yellow-200">
                    <div className="text-xl font-semibold text-yellow-700">{data.overview.replayable}</div>
                    <div className="text-xs text-gray-500">Replayable</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                    <div className="text-xl font-semibold text-red-700">{data.overview.non_replayable}</div>
                    <div className="text-xs text-gray-500">Non-replayable</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="text-xs font-medium text-gray-500 uppercase mb-3">Top Reasons</div>
                {data.top_reasons.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-gray-700">{r.reason}</span>
                    <span className="text-sm text-gray-600">{r.count} ({r.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* By Channel */}
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-medium text-gray-900">By Channel (Stripe DNA)</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.by_channel.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <ChannelBadge channel={c.channel} />
                      <span className="text-sm font-medium text-gray-900">{c.count}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${c.percent}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-600">{c.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                Channel Detail
              </button>
            </div>
          </div>
        </div>

        {/* Recent Failures */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Recent Failures</h2>
            <Link href="/console/ingestion/error-monitor" className="text-xs text-blue-600 hover:text-blue-800">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DLQ ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Replay</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recent_failures.map((f, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/console/ingestion/pre-acc-guard/dlq/${f.dlq_id}`} className="text-sm font-mono text-blue-600 hover:text-blue-800">
                        {f.dlq_id.substring(0, 12)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={f.reason}>{f.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ChannelBadge channel={f.channel} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{f.tenant_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(f.timestamp), 'HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {f.replayable ? (
                        <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">Replayable</span>
                      ) : (
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
