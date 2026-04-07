'use client'

import Link from 'next/link'

interface KpiCardProps {
  title: string
  value: string
  subtext?: string
  href: string
  tone?: 'emerald' | 'amber' | 'red' | 'blue' | 'slate'
}

const TONE_STYLES: Record<NonNullable<KpiCardProps['tone']>, string> = {
  emerald: 'border-emerald-700/70 bg-emerald-950/20',
  amber: 'border-amber-700/70 bg-amber-950/20',
  red: 'border-red-700/70 bg-red-950/20',
  blue: 'border-blue-700/70 bg-blue-950/20',
  slate: 'border-slate-700 bg-slate-800/80',
}

export function KpiCard({ title, value, subtext, href, tone = 'slate' }: KpiCardProps) {
  return (
    <Link
      href={href}
      className={`group rounded-xl border p-4 shadow-[0_8px_30px_rgba(2,6,23,0.32)] transition hover:-translate-y-[1px] hover:border-slate-500 ${TONE_STYLES[tone]}`}
      aria-label={`${title} KPI details`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 font-mono text-2xl tabular-nums text-slate-100">{value}</p>
      {subtext ? <p className="mt-1 text-xs text-slate-400">{subtext}</p> : null}
      <p className="mt-3 text-[11px] font-medium text-blue-300 group-hover:text-blue-200">Drill down</p>
    </Link>
  )
}
