'use client'

import { useState } from 'react'

interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  status: 'active' | 'degraded' | 'down'
  successRate: string
  lastDelivery: string
  totalDeliveries: number
  failedDeliveries: number
}

const endpoints: WebhookEndpoint[] = [
  { id: 'wh_001', url: 'https://api.acmepay.com/webhooks/payment-status', events: ['intent.completed', 'intent.failed'], status: 'degraded', successRate: '94.2%', lastDelivery: '2m ago', totalDeliveries: 4821, failedDeliveries: 279 },
  { id: 'wh_002', url: 'https://api.acmepay.com/webhooks/settlement-confirm', events: ['settlement.confirmed'], status: 'down', successRate: '78.1%', lastDelivery: '14m ago', totalDeliveries: 1203, failedDeliveries: 264 },
  { id: 'wh_003', url: 'https://api.acmepay.com/webhooks/refund-notify', events: ['refund.initiated', 'refund.completed'], status: 'active', successRate: '99.8%', lastDelivery: '5m ago', totalDeliveries: 892, failedDeliveries: 2 },
  { id: 'wh_004', url: 'https://api.acmepay.com/webhooks/evidence-ready', events: ['evidence.generated'], status: 'active', successRate: '100%', lastDelivery: '1m ago', totalDeliveries: 4102, failedDeliveries: 0 },
]

const recentDeliveries = [
  { id: 'del_001', endpoint: 'payment-status', event: 'intent.completed', statusCode: 200, latency: '120ms', time: '14:23:48', intentId: 'pi_20260210_91XK' },
  { id: 'del_002', endpoint: 'payment-status', event: 'intent.completed', statusCode: 200, latency: '95ms', time: '14:23:47', intentId: 'pi_20260210_55TG' },
  { id: 'del_003', endpoint: 'settlement-confirm', event: 'settlement.confirmed', statusCode: 503, latency: '30012ms', time: '14:23:46', intentId: 'pi_20260210_91XK' },
  { id: 'del_004', endpoint: 'payment-status', event: 'intent.failed', statusCode: 200, latency: '88ms', time: '14:23:45', intentId: 'pi_20260210_82WJ' },
  { id: 'del_005', endpoint: 'evidence-ready', event: 'evidence.generated', statusCode: 200, latency: '67ms', time: '14:23:44', intentId: 'pi_20260210_91XK' },
]

export default function WebhookDeliveryPage() {
  const [view, setView] = useState<'endpoints' | 'deliveries'>('endpoints')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cx-text">Webhook Delivery</h1>
          <p className="text-sm text-cx-neutral mt-0.5">Tenant-visible webhook endpoint status and delivery logs</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setView('endpoints')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'endpoints' ? 'bg-white text-cx-text shadow-sm' : 'text-cx-neutral'}`}>Endpoints</button>
          <button onClick={() => setView('deliveries')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'deliveries' ? 'bg-white text-cx-text shadow-sm' : 'text-cx-neutral'}`}>Recent Deliveries</button>
        </div>
      </div>

      {view === 'endpoints' && (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div key={ep.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-cx-purple-100 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      ep.status === 'active' ? 'bg-cx-teal-500' :
                      ep.status === 'degraded' ? 'bg-cx-orange-500' :
                      'bg-red-500'
                    }`} />
                    <span className="text-sm font-mono text-cx-text truncate">{ep.url}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      ep.status === 'active' ? 'bg-cx-teal-50 text-cx-teal-700' :
                      ep.status === 'degraded' ? 'bg-cx-orange-50 text-cx-orange-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {ep.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {ep.events.map((ev) => (
                      <span key={ev} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-cx-neutral font-mono">{ev}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-6 ml-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-cx-text tabular-nums">{ep.successRate}</p>
                    <p className="text-[10px] text-cx-neutral">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-cx-text tabular-nums">{ep.totalDeliveries.toLocaleString()}</p>
                    <p className="text-[10px] text-cx-neutral">Total</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold tabular-nums ${ep.failedDeliveries > 0 ? 'text-cx-orange-600' : 'text-cx-teal-600'}`}>{ep.failedDeliveries}</p>
                    <p className="text-[10px] text-cx-neutral">Failed</p>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-semibold text-cx-purple-600 bg-cx-purple-50 border border-cx-purple-200 rounded-lg hover:bg-cx-purple-100 transition-colors">
                    Resend Failed
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'deliveries' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Time</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Endpoint</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Event</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Latency</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-cx-neutral uppercase tracking-wider">Intent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentDeliveries.map((del) => (
                <tr key={del.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-xs font-mono text-cx-neutral">{del.time}</td>
                  <td className="px-5 py-3 text-xs font-mono text-cx-text">{del.endpoint}</td>
                  <td className="px-5 py-3 text-xs font-mono text-cx-neutral">{del.event}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-mono font-bold ${del.statusCode < 300 ? 'text-cx-teal-600' : 'text-red-600'}`}>{del.statusCode}</span>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-cx-neutral tabular-nums">{del.latency}</td>
                  <td className="px-5 py-3 text-xs font-mono text-cx-purple-600">{del.intentId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
