'use client'

import { useState } from 'react'

interface ApiLog {
  id: string
  method: string
  path: string
  statusCode: number
  latency: string
  timestamp: string
  source: string
  requestSize: string
  responseSize: string
}

const logs: ApiLog[] = [
  { id: 'log_001', method: 'POST', path: '/v1/ingest', statusCode: 200, latency: '45ms', timestamp: '14:23:45.123', source: 'merchant-sdk', requestSize: '1.2 KB', responseSize: '0.3 KB' },
  { id: 'log_002', method: 'POST', path: '/v1/ingest', statusCode: 200, latency: '52ms', timestamp: '14:23:44.891', source: 'merchant-sdk', requestSize: '1.4 KB', responseSize: '0.3 KB' },
  { id: 'log_003', method: 'GET', path: '/v1/intents/pi_20260210_82WJ', statusCode: 200, latency: '12ms', timestamp: '14:23:44.500', source: 'merchant-dashboard', requestSize: '0.1 KB', responseSize: '2.1 KB' },
  { id: 'log_004', method: 'POST', path: '/v1/ingest', statusCode: 422, latency: '8ms', timestamp: '14:23:43.200', source: 'merchant-sdk', requestSize: '0.9 KB', responseSize: '0.4 KB' },
  { id: 'log_005', method: 'GET', path: '/v1/intents', statusCode: 200, latency: '78ms', timestamp: '14:23:42.100', source: 'merchant-dashboard', requestSize: '0.2 KB', responseSize: '12.4 KB' },
  { id: 'log_006', method: 'POST', path: '/v1/ingest', statusCode: 200, latency: '38ms', timestamp: '14:23:41.800', source: 'api-batch', requestSize: '8.2 KB', responseSize: '0.5 KB' },
  { id: 'log_007', method: 'POST', path: '/v1/ingest', statusCode: 401, latency: '3ms', timestamp: '14:23:40.500', source: 'unknown', requestSize: '1.1 KB', responseSize: '0.2 KB' },
  { id: 'log_008', method: 'GET', path: '/v1/health', statusCode: 200, latency: '2ms', timestamp: '14:23:40.000', source: 'health-check', requestSize: '0.0 KB', responseSize: '0.1 KB' },
]

const methodColors: Record<string, string> = {
  GET: 'bg-cx-teal-50 text-cx-teal-700',
  POST: 'bg-cx-purple-50 text-cx-purple-700',
  PUT: 'bg-cx-orange-50 text-cx-orange-700',
  DELETE: 'bg-red-50 text-red-700',
}

export default function ApiLogsPage() {
  const [methodFilter, setMethodFilter] = useState<string>('all')

  const filtered = methodFilter === 'all' ? logs : logs.filter(l => l.method === methodFilter)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-cx-text">API Logs</h1>
        <p className="text-sm text-cx-neutral mt-0.5">Tenant-visible API request/response logs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Requests (1h)', value: '2,847', color: 'border-l-cx-purple-500' },
          { label: 'Success Rate', value: '99.2%', color: 'border-l-cx-teal-500' },
          { label: 'Avg Latency', value: '34ms', color: 'border-l-cx-purple-500' },
          { label: 'Error Count', value: '23', color: 'border-l-cx-orange-500' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border border-gray-100 border-l-4 ${s.color} p-4`}>
            <p className="text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold text-cx-text mt-1 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {['all', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                methodFilter === m ? 'bg-white text-cx-text shadow-sm' : 'text-cx-neutral hover:text-cx-text'
              }`}
            >
              {m === 'all' ? 'All Methods' : m}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Filter by path or source..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-cx-text placeholder-gray-400 focus:ring-1 focus:ring-cx-purple-500 focus:border-cx-purple-500 outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Time</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Method</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Path</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Latency</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Source</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Req / Res</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                <td className="px-5 py-3 text-xs font-mono text-cx-neutral">{log.timestamp}</td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${methodColors[log.method] || 'bg-gray-100 text-gray-600'}`}>
                    {log.method}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm font-mono text-cx-text">{log.path}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-mono font-bold ${
                    log.statusCode < 300 ? 'text-cx-teal-600' :
                    log.statusCode < 500 ? 'text-cx-orange-600' :
                    'text-red-600'
                  }`}>
                    {log.statusCode}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs font-mono text-cx-neutral tabular-nums">{log.latency}</td>
                <td className="px-5 py-3 text-xs text-cx-neutral">{log.source}</td>
                <td className="px-5 py-3 text-xs text-cx-neutral tabular-nums">{log.requestSize} / {log.responseSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
