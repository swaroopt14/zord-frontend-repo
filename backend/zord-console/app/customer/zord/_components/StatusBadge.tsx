'use client'

interface StatusBadgeProps {
  status: 'GREEN' | 'AMBER' | 'RED' | 'BLUE' | 'INFO' | 'SUCCESS' | 'PENDING' | 'FAILED' | string
  text: string
}

const STYLE_MAP: Record<string, { dot: string; text: string; bg: string }> = {
  GREEN: { dot: 'bg-emerald-500', text: 'text-emerald-200', bg: 'bg-emerald-950/35' },
  SUCCESS: { dot: 'bg-emerald-500', text: 'text-emerald-200', bg: 'bg-emerald-950/35' },
  AMBER: { dot: 'bg-amber-500', text: 'text-amber-200', bg: 'bg-amber-950/35' },
  PENDING: { dot: 'bg-amber-500', text: 'text-amber-200', bg: 'bg-amber-950/35' },
  RED: { dot: 'bg-red-500', text: 'text-red-200', bg: 'bg-red-950/35' },
  FAILED: { dot: 'bg-red-500', text: 'text-red-200', bg: 'bg-red-950/35' },
  BLUE: { dot: 'bg-blue-500', text: 'text-blue-200', bg: 'bg-blue-950/35' },
  INFO: { dot: 'bg-blue-500', text: 'text-blue-200', bg: 'bg-blue-950/35' },
}

export function StatusBadge({ status, text }: StatusBadgeProps) {
  const style = STYLE_MAP[status] || { dot: 'bg-slate-400', text: 'text-slate-200', bg: 'bg-slate-700/40' }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border border-slate-600 px-2 py-1 text-xs ${style.bg} ${style.text}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
      <span>{text}</span>
    </span>
  )
}
