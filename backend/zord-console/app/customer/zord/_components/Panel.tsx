'use client'

import { ReactNode } from 'react'

interface PanelProps {
  title: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
  className?: string
}

export function Panel({ title, subtitle, right, children, className = '' }: PanelProps) {
  return (
    <section className={`rounded-xl border border-slate-700 bg-slate-800/90 shadow-[0_10px_40px_rgba(2,6,23,0.36)] ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-4 py-3">
        <div>
          <h3 className="font-medium text-slate-100">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        {right}
      </header>
      <div className="px-4 py-4">{children}</div>
    </section>
  )
}
