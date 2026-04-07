'use client'

import { useState } from 'react'
import { MoreVertical, Zap } from 'lucide-react'

const data = [
  { label: 'Initiated Payments', shortLabel: 'Initiated', value: 65200 },
  { label: 'Authorized Payments', shortLabel: 'Authorized', value: 54800 },
  { label: 'Successful Payments', shortLabel: 'Successful', value: 48600 },
  { label: 'Payouts to Merchants', shortLabel: 'Payouts', value: 38300 },
  { label: 'Completed Transactions', shortLabel: 'Completed', value: 32900 },
]

const MAX_Y = 70000

export default function PaymentsChart() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(2)

  const legendItems = [
    { key: 'initiated', label: 'Initiated Payments', value: '65.2k' },
    { key: 'authorized', label: 'Authorized Payments', value: '54.8k' },
    { key: 'successful', label: 'Successful Payments', value: '48.6k' },
    { key: 'payouts', label: 'Payouts to Merchants', value: '38.3k' },
    { key: 'completed', label: 'Completed Transactions', value: '32.9k' },
  ]

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Payments</h2>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-8 mb-8 overflow-x-auto pb-2">
        {legendItems.map((item, index) => (
          <div
            key={item.key}
            className={`whitespace-nowrap cursor-pointer transition-opacity ${
              hoveredIndex === index ? 'opacity-100' : 'opacity-60'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(2)}
          >
            <p className="text-sm text-gray-500 mb-1">{item.label}</p>
            <p className={`text-lg font-semibold ${
              index === 2 ? 'text-black' : 'text-gray-400'
            }`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart Container */}
      <div className="relative w-full mt-4" style={{ height: '360px' }}>
        {/* Y-Axis Labels */}
        <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-500 text-right pr-3 pointer-events-none font-medium">
          <span>70k</span>
          <span>60k</span>
          <span>50k</span>
          <span>40k</span>
          <span>30k</span>
        </div>

        {/* Chart Area Background */}
        <svg className="absolute left-16 right-0 top-0 bottom-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          {/* Background fill */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#dbeafe', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#e0f2fe', stopOpacity: 0.1 }} />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bgGradient)" />
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`line-${i}`}
              x1="0"
              y1={`${(i / 4) * 100}%`}
              x2="100%"
              y2={`${(i / 4) * 100}%`}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Bars Container */}
        <div className="absolute left-16 right-0 top-0 bottom-12 flex items-end gap-4 px-6 pb-6">
          {data.map((item, index) => {
            const height = (item.value / MAX_Y) * 100
            const isHovered = hoveredIndex === index

            return (
              <div key={index} className="flex-1 relative group flex flex-col items-center justify-end h-full">
                {/* Bar */}
                <div
                  className="w-full rounded-t-md transition-all duration-300 relative cursor-pointer hover:shadow-lg"
                  style={{
                    height: `${height}%`,
                    background: isHovered
                      ? 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)'
                      : 'repeating-linear-gradient(45deg, #60a5fa 0px, #60a5fa 3px, rgba(147, 197, 253, 0.4) 3px, rgba(147, 197, 253, 0.4) 6px)',
                    boxShadow: isHovered ? '0 8px 16px rgba(59, 130, 246, 0.3)' : 'none',
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(2)}
                >
                  {/* Top marker */}
                  {isHovered && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-2.5 bg-blue-300 rounded-full shadow-md" />
                  )}
                </div>

                {/* Tooltip */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-white text-xs text-gray-700 px-3 py-2 rounded-full shadow-xl whitespace-nowrap font-medium border border-gray-200">
                    {(item.value / 1000).toFixed(1)}k transactions | Conversion: 89% | Drop-off: -11%
                  </div>
                </div>

                {/* X-Axis Label */}
                <div className="absolute -bottom-8 text-xs font-medium text-gray-700 whitespace-nowrap">
                  {item.shortLabel}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Prompt Section */}
      <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-gray-600" />
          <h3 className="text-gray-700 font-semibold">What would you like to explore next?</h3>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 border border-gray-300">
          <span className="text-gray-700">I want to know what caused the drop-off from authorized to </span>
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded font-medium text-sm">
            /successful payments
          </span>
          <span className="text-gray-500 ml-1">|</span>
        </div>
      </div>
    </div>
  )
}
