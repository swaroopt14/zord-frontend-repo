'use client'

import { MoreVertical, TrendingUp } from 'lucide-react'

export default function TransactionsWidget() {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Peak Badge */}
      <div className="mb-6">
        <div className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
          Peak: Wed
        </div>
      </div>

      {/* Main Value and Dots */}
      <div className="flex items-end justify-between gap-4">
        <div className="text-5xl font-bold">106k</div>
        
        {/* Dot Plot showing daily distribution */}
        <div className="flex flex-wrap gap-2 justify-end w-40">
          {[...Array(35)].map((_, i) => {
            const colors = ['bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-green-600']
            const baseIntensity = Math.sin(i * 0.3) * 3
            const peakOffset = Math.abs(i - 10)
            const intensity = Math.max(0, 3 - peakOffset * 0.2 + baseIntensity)
            const colorIndex = Math.floor(Math.max(0, Math.min(3, intensity)))
            
            return (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${colors[colorIndex]}`}
              ></div>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 text-right">
        <p className="text-gray-500 text-sm mb-1">vs last period</p>
        <div className="flex items-center justify-end gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-lg font-semibold text-gray-900">+34,002</span>
        </div>
      </div>
    </div>
  )
}
