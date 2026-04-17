'use client'

import type { ReactNode } from 'react'

export const NEO_BASE = '#B8BBC4'
export const NEO_LIGHT = '#EDF0F4'
export const NEO_DARK = '#ADB0BA'
export const NEO_INSET_LIGHT = '#FFFFFF'
export const NEO_INSET_DARK = '#B2B5BE'
export const NEO_CREAM = '#C2C5CE'
export const NEO_TEXT = '#0E1016'
export const NEO_MUTED = '#52555E'
export const NEO_ACTIVE = '#6B6E7A'
export const NEO_ACCENT_SURFACE = 'linear-gradient(180deg, #787B86 0%, #6B6E7A 100%)'
export const NEO_ACCENT_BORDER = '1px solid rgba(255,255,255,0.16)'
export const NEO_ACCENT_SHADOW =
  '0 16px 30px rgba(100,105,122,0.22), inset 1px 1px 0 rgba(255,255,255,0.18), inset -4px -4px 12px rgba(0,0,0,0.12)'
export const NEO_ACCENT_TEXT = '#FFFFFF'
export const NEO_ACCENT_MUTED = 'rgba(236,239,243,0.82)'
export const NEO_SURFACE_BORDER = '1px solid rgba(255,255,255,0.42)'
export const NEO_CARD_SHADOW =
  '6px 6px 14px rgba(100,105,122,0.28), -3px -3px 9px rgba(255,255,255,0.52), inset 0.5px 0.5px 0 rgba(255,255,255,0.36)'
export const NEO_RAISED_SHADOW =
  '4px 4px 10px rgba(100,105,122,0.22), -3px -3px 8px rgba(255,255,255,0.48), inset 0.5px 0.5px 0 rgba(255,255,255,0.32)'
export const NEO_INSET_SHADOW =
  'inset 5px 5px 12px rgba(100,105,122,0.24), inset -5px -5px 12px rgba(255,255,255,0.54)'
export const NEO_SHELL_SHADOW =
  '14px 14px 28px rgba(100,105,122,0.26), -10px -10px 22px rgba(255,255,255,0.58), inset 1px 1px 0 rgba(255,255,255,0.38)'

export function ModuleBadge({ children }: { children: ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-[0.18em]"
      style={{
        color: NEO_TEXT,
        background: NEO_CREAM,
        border: NEO_SURFACE_BORDER,
        boxShadow: NEO_RAISED_SHADOW,
      }}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: NEO_ACTIVE }} />
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
        border: NEO_SURFACE_BORDER,
        boxShadow: NEO_RAISED_SHADOW,
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
        border: NEO_SURFACE_BORDER,
        boxShadow: NEO_INSET_SHADOW,
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
              color: isActive ? NEO_TEXT : NEO_MUTED,
              boxShadow: isActive ? NEO_RAISED_SHADOW : 'none',
              textShadow: isActive
                ? '1px 1px 0 rgba(255,255,255,0.34)'
                : '1px 1px 0 rgba(255,255,255,0.48)',
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
        border: NEO_SURFACE_BORDER,
        boxShadow: NEO_SHELL_SHADOW,
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
        background: NEO_ACCENT_SURFACE,
        border: NEO_ACCENT_BORDER,
        boxShadow: NEO_ACCENT_SHADOW,
      }}
    >
      <div
        className="inline-flex rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]"
        style={{
          color: NEO_ACCENT_MUTED,
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.14)',
        }}
      >
        {label}
      </div>
      <div className="mt-4 text-[42px] font-black leading-none tracking-[-0.05em]" style={{ color: NEO_ACCENT_TEXT }}>
        {value}
      </div>
      <div className="mt-3 text-[16px] leading-7" style={{ color: NEO_ACCENT_MUTED }}>
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
      ? { background: 'rgba(50,110,65,0.16)', border: '1px solid rgba(46,110,62,0.24)', color: '#235530' }
      : tone === 'watch'
      ? { background: 'rgba(145,105,0,0.16)', border: '1px solid rgba(158,112,0,0.24)', color: '#6A4E00' }
      : { background: 'rgba(160,65,45,0.16)', border: '1px solid rgba(160,56,40,0.24)', color: '#782A18' }

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
        background: NEO_ACCENT_SURFACE,
        border: NEO_ACCENT_BORDER,
        boxShadow: NEO_ACCENT_SHADOW,
      }}
    >
      <div
        className="inline-flex rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]"
        style={{
          color: NEO_ACCENT_MUTED,
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.14)',
        }}
      >
        {label}
      </div>
      <div className="mt-3 text-[16px] leading-7" style={{ color: NEO_ACCENT_MUTED }}>
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
        color: active ? '#FFFFFF' : NEO_TEXT,
        background: active ? NEO_ACTIVE : NEO_BASE,
        border: NEO_SURFACE_BORDER,
        boxShadow: active
          ? '0 10px 22px rgba(100,105,122,0.22), inset 1px 1px 0 rgba(255,255,255,0.14), inset -3px -3px 8px rgba(0,0,0,0.14)'
          : NEO_INSET_SHADOW,
      }}
    >
      {children}
    </button>
  )
}
