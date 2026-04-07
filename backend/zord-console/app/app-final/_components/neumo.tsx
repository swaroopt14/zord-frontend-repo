'use client'

import type { ReactNode } from 'react'

export const NEO_BASE = '#B2B8A3'
export const NEO_LIGHT = '#CAD1B9'
export const NEO_DARK = '#9A9F8D'
export const NEO_INSET_LIGHT = '#D5DCBF'
export const NEO_INSET_DARK = '#8E9382'
export const NEO_CREAM = '#F7F1E3'
export const NEO_TEXT = '#243225'
export const NEO_MUTED = '#5C6455'

export function ModuleBadge({ children }: { children: ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-[0.18em]"
      style={{
        color: NEO_TEXT,
        background: NEO_CREAM,
        border: '1px solid rgba(255,255,255,0.24)',
        boxShadow: `6px 6px 14px ${NEO_DARK}, -6px -6px 14px ${NEO_LIGHT}`,
      }}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: NEO_TEXT }} />
      {children}
    </div>
  )
}

export function UtilityPill({ children }: { children: ReactNode }) {
  return (
    <div
      className="inline-flex min-h-[48px] items-center rounded-[18px] px-4 py-3 text-[14px] font-semibold"
      style={{
        color: NEO_TEXT,
        background: NEO_CREAM,
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: `6px 6px 16px ${NEO_DARK}, -5px -5px 14px rgba(255,255,255,0.72)`,
      }}
    >
      {children}
    </div>
  )
}

export function SegmentedTabs<T extends string>({
  items,
  active,
  onChange,
}: {
  items: readonly T[]
  active: T
  onChange: (item: T) => void
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-[20px] p-1.5"
      style={{
        background: NEO_BASE,
        border: '2px solid rgba(255,255,255,0.2)',
        boxShadow:
          '4px 4px 10px rgba(107,115,96,0.28), -4px -4px 10px rgba(255,255,255,0.7), inset 6px 6px 12px rgba(88,93,77,0.55), inset -6px -6px 12px rgba(194,201,171,0.34)',
      }}
    >
      {items.map((item) => {
        const isActive = item === active
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className="rounded-[16px] px-4 py-2.5 text-[14px] font-bold transition-all"
            style={{
              background: isActive ? NEO_CREAM : 'transparent',
              color: isActive ? NEO_TEXT : '#5E6557',
              boxShadow: isActive ? '6px 6px 14px rgba(107,115,96,0.22), -4px -4px 12px rgba(255,255,255,0.72)' : 'none',
              textShadow: isActive ? '1px 1px 0 rgba(255,255,255,0.24)' : '1px 1px 0 rgba(213,220,191,0.45)',
            }}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

export function NeumoCard({
  title,
  subtitle,
  right,
  children,
  className = '',
}: {
  title: string
  subtitle: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[30px] p-7 ${className}`}
      style={{
        background: NEO_BASE,
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '18px 18px 36px rgba(154,159,141,0.42), -14px -14px 30px rgba(213,220,191,0.82), inset 1px 1px 0 rgba(255,255,255,0.18)',
      }}
    >
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-[28px] font-black tracking-[-0.04em]" style={{ color: NEO_TEXT }}>
            {title}
          </div>
          <div className="mt-2 max-w-[860px] text-[17px] leading-7" style={{ color: NEO_MUTED }}>
            {subtitle}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

export function SummaryCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div
      className="rounded-[28px] px-6 py-6"
      style={{
        background: NEO_BASE,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '16px 16px 34px rgba(154,159,141,0.4), -12px -12px 26px rgba(202,209,185,0.82), inset 0 1px 0 rgba(255,255,255,0.18)',
      }}
    >
      <div className="text-[12px] font-black uppercase tracking-[0.18em]" style={{ color: NEO_MUTED, textShadow: '1px 1px 0 rgba(213,220,191,0.55)' }}>
        {label}
      </div>
      <div className="mt-4 text-[42px] font-black leading-none tracking-[-0.05em]" style={{ color: NEO_TEXT }}>
        {value}
      </div>
      <div className="mt-3 text-[16px] leading-7" style={{ color: NEO_MUTED }}>
        {note}
      </div>
    </div>
  )
}

export function StatusChip({
  tone,
  children,
}: {
  tone: 'healthy' | 'watch' | 'critical'
  children: ReactNode
}) {
  const styles =
    tone === 'healthy'
      ? { background: '#D9E7D3', border: '1px solid rgba(161,172,157,0.85)', color: '#30402F' }
      : tone === 'watch'
      ? { background: '#DBCFAC', border: '1px solid rgba(188,177,147,0.9)', color: '#5C4A2D' }
      : { background: '#94A7AE', border: '1px solid rgba(126,142,148,0.9)', color: '#F8FAFC' }

  return (
    <span className="inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold" style={styles}>
      {children}
    </span>
  )
}

export function InfoStrip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      className="mb-6 rounded-[24px] px-5 py-4"
      style={{
        background: NEO_BASE,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: `inset 6px 6px 12px ${NEO_INSET_DARK}, inset -6px -6px 12px ${NEO_INSET_LIGHT}`,
      }}
    >
      <div className="text-[12px] font-black uppercase tracking-[0.18em]" style={{ color: NEO_TEXT }}>
        {label}
      </div>
      <div className="mt-2 text-[16px] leading-7" style={{ color: NEO_MUTED }}>
        {children}
      </div>
    </div>
  )
}

export function ActionButton({
  children,
  active = false,
}: {
  children: ReactNode
  active?: boolean
}) {
  return (
    <button
      type="button"
      className="rounded-[18px] px-4 py-2.5 text-[14px] font-bold"
      style={{
        color: NEO_TEXT,
        background: active ? NEO_CREAM : NEO_BASE,
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: active
          ? '6px 6px 14px rgba(107,115,96,0.22), -4px -4px 12px rgba(255,255,255,0.72)'
          : '4px 4px 10px rgba(107,115,96,0.28), -4px -4px 10px rgba(255,255,255,0.7), inset 6px 6px 12px rgba(88,93,77,0.55), inset -6px -6px 12px rgba(194,201,171,0.34)',
      }}
    >
      {children}
    </button>
  )
}
