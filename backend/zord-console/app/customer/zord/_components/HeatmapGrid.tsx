'use client'

interface HeatCell {
  x: string
  y: string
  value: number
}

interface HeatmapGridProps {
  titleX: string
  titleY: string
  cells: HeatCell[]
}

function colorFor(value: number, max: number): string {
  const ratio = max <= 0 ? 0 : value / max
  if (ratio > 0.85) return 'bg-red-600'
  if (ratio > 0.6) return 'bg-orange-500'
  if (ratio > 0.35) return 'bg-amber-500'
  if (ratio > 0.15) return 'bg-blue-500'
  return 'bg-slate-700'
}

export function HeatmapGrid({ titleX, titleY, cells }: HeatmapGridProps) {
  const xAxis = Array.from(new Set(cells.map((cell) => cell.x)))
  const yAxis = Array.from(new Set(cells.map((cell) => cell.y)))
  const maxValue = Math.max(1, ...cells.map((cell) => cell.value))

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left text-slate-400">{titleY}</th>
            {xAxis.map((x) => (
              <th key={x} className="px-1 py-1 text-left text-slate-400">{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yAxis.map((y) => (
            <tr key={y}>
              <td className="pr-2 text-slate-400">{y}</td>
              {xAxis.map((x) => {
                const cell = cells.find((entry) => entry.x === x && entry.y === y)
                const value = cell?.value || 0
                return (
                  <td key={`${x}-${y}`} className="p-0.5">
                    <div
                      className={`h-6 w-8 rounded ${colorFor(value, maxValue)} border border-slate-800`}
                      title={`${titleX}: ${x}\n${titleY}: ${y}\nValue: ${value.toFixed(2)}`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
