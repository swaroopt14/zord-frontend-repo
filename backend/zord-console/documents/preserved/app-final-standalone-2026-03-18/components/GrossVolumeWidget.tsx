'use client'

import { MoreVertical, TrendingUp } from 'lucide-react'

export default function GrossVolumeWidget() {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 h-fit">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Gross Volume</h2>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Main Value */}
      <div className="mb-8">
        <div className="flex items-end gap-3">
          <div className="text-6xl font-bold">$41,540</div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-green-700">15%</span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Online Payments</span>
            <span className="font-semibold">$26,800</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: '65%' }}></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Subscriptions</span>
            <span className="font-semibold">$10,400</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: '25%' }}></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">In-Store Sales</span>
            <span className="font-semibold">$4,340</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-pink-500" style={{ width: '10%' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
