'use client'

export default function InsightCard() {
  return (
    <div className="relative overflow-hidden rounded-xl shadow-sm border border-gray-100 h-64">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-orange-500 opacity-90"></div>

      {/* Content */}
      <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">
        <div>
          <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-4">
            Insights
          </div>
          <div className="text-6xl font-bold">75%</div>
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-2">Authorization rate increased by 4% compared to last week.</h3>
          <p className="text-white/80 text-sm">
            This improvement reduced failed transactions by 950 and is projected to recover $12,400
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-48 h-1 bg-white/30 rounded-full overflow-hidden mt-6">
          <div className="h-full bg-white" style={{ width: '75%' }}></div>
        </div>
      </div>
    </div>
  )
}
