'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { MoreVertical } from 'lucide-react'

const data = [
  { month: 'Jan', retention: 38 },
  { month: 'Feb', retention: 41 },
  { month: 'Mar', retention: 39 },
  { month: 'Apr', retention: 43 },
  { month: 'May', retention: 42 },
  { month: 'Jun', retention: 42 },
]

export default function RetentionChart() {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Retention</h2>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Percentage */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-3xl font-bold">42%</span>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#999"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#999"
              style={{ fontSize: '12px' }}
              domain={[0, 50]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value) => `${value}%`}
            />
            <Area
              type="monotone"
              dataKey="retention"
              stroke="#ec4899"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRetention)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
