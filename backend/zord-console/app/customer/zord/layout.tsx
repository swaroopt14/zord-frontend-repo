'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { DASHBOARD_MODULES, PERSONA_OPTIONS, ZordPersona } from './_config/modules'
import { fetchZordAlerts, fetchZordExportQueue, searchZord } from '@/services/backend'
import { useZordSession } from './_components/useZordSession'
import { StatusBadge } from './_components/StatusBadge'

function moduleLabel(baseTitle: string, persona: ZordPersona): string {
  if (persona === 'NBFC' && baseTitle === 'Payout Intelligence') return 'Disbursement Intelligence'
  return baseTitle
}

export default function ZordDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: string; display: string; matched_on: string }> | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [alertsCount, setAlertsCount] = useState(0)
  const [exportQueueCount, setExportQueueCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const {
    tenantId,
    tenantName,
    persona,
    personaConfig,
    environment,
    setPersona,
  } = useZordSession()

  const pinnedSet = useMemo(() => new Set(personaConfig.pinned), [personaConfig.pinned])

  const pinnedModules = useMemo(
    () => DASHBOARD_MODULES.filter((module) => pinnedSet.has(module.key)),
    [pinnedSet],
  )

  const remainingModules = useMemo(
    () => DASHBOARD_MODULES.filter((module) => !pinnedSet.has(module.key)),
    [pinnedSet],
  )

  useEffect(() => {
    let disposed = false

    async function loadHeaderMeta() {
      try {
        const [alerts, exports] = await Promise.all([
          fetchZordAlerts(tenantId),
          fetchZordExportQueue(tenantId),
        ])

        if (disposed) return
        setAlertsCount(Number(alerts.active_count || 0))
        setExportQueueCount(Number(exports.queued_count || 0))
      } catch {
        if (disposed) return
        setAlertsCount(0)
        setExportQueueCount(0)
      }
    }

    void loadHeaderMeta()
    const interval = setInterval(() => {
      void loadHeaderMeta()
    }, 30_000)

    return () => {
      disposed = true
      clearInterval(interval)
    }
  }, [tenantId])

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null)
      return
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await searchZord(tenantId, query, 8)
        setSearchResults(response.items || [])
      } catch {
        setSearchResults([])
      }
    }, 140)

    return () => clearTimeout(timeout)
  }, [query, tenantId])

  useEffect(() => {
    if (!pathname) return
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div
      className="min-h-screen bg-slate-900 text-slate-100"
      style={
        {
          ['--font-zord-body' as string]: '"Inter", "Segoe UI", "Helvetica Neue", sans-serif',
          ['--font-zord-heading' as string]: '"Plus Jakarta Sans", "DM Sans", "Inter", sans-serif',
          ['--font-zord-mono' as string]: '"JetBrains Mono", "IBM Plex Mono", "Menlo", monospace',
          fontFamily: 'var(--font-zord-body)',
        } as CSSProperties
      }
    >
      <header className="sticky top-0 z-40 border-b border-slate-700 bg-slate-900/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-300 lg:hidden"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label="Toggle modules"
          >
            ≡
          </button>

          <div className="flex items-center gap-3">
            <Link href={personaConfig.defaultModule} className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 font-semibold text-white">Z</span>
              <span className="font-[var(--font-zord-heading)] text-sm font-semibold tracking-wide">Zord</span>
            </Link>

            <div className="hidden items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 md:flex">
              <span className="max-w-[140px] truncate">{tenantName}</span>
              <StatusBadge status={environment === 'LIVE' ? 'GREEN' : 'AMBER'} text={environment} />
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-xl items-center md:flex">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search intent_id, envelope_id, client_reference_id, UTR, seller_id"
              className="h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-blue-500"
            />
            <span className="pointer-events-none absolute right-3 text-xs text-slate-400">&lt;200ms</span>

            {searchOpen && query.trim() ? (
              <div className="absolute left-0 right-0 top-12 max-h-72 overflow-auto rounded-md border border-slate-700 bg-slate-900 p-1 shadow-2xl">
                {searchResults?.length ? (
                  searchResults.map((item) => (
                    <button
                      type="button"
                      key={`${item.id}-${item.matched_on}`}
                      onClick={() => {
                        setSearchOpen(false)
                        setQuery('')
                        router.push(`/customer/zord/intent-journal?intent_id=${encodeURIComponent(item.id)}`)
                      }}
                      className="mb-1 w-full rounded-md border border-transparent px-3 py-2 text-left hover:border-slate-700 hover:bg-slate-800"
                    >
                      <p className="font-mono text-xs text-slate-200">{item.display}</p>
                      <p className="text-[11px] text-slate-400">Matched on {item.matched_on}</p>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-3 text-xs text-slate-400">No matches</p>
                )}
              </div>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/customer/zord/intent-journal" className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 md:hidden">
              Lookup
            </Link>

            <Link href="/customer/zord/command-center?focus=alerts" className="relative rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700">
              Alerts
              {alertsCount > 0 ? (
                <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] text-white">{alertsCount}</span>
              ) : null}
            </Link>

            <Link href="/customer/zord/intent-journal?focus=exports" className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700">
              Exports {exportQueueCount > 0 ? `(${exportQueueCount})` : ''}
            </Link>

            <div className="hidden items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 md:flex">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[11px]">U</span>
              <span className="text-xs text-slate-200">Tenant Switcher</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-y-16 left-0 z-30 w-72 border-r border-slate-700 bg-slate-900 p-3 lg:static lg:block`}>
          <div className="mb-3 rounded-md border border-slate-700 bg-slate-800 p-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Entity Profile</p>
            <select
              value={persona}
              onChange={(event) => setPersona(event.target.value as ZordPersona)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none"
            >
              {PERSONA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pinned</div>
          <nav className="mb-4 space-y-1">
            {pinnedModules.map((module) => {
              const active = pathname?.startsWith(module.path)
              return (
                <Link
                  key={module.key}
                  href={module.path}
                  className={`block rounded-md border px-3 py-2 text-sm ${active ? 'border-blue-600 bg-blue-900/30 text-blue-100' : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700/70'}`}
                >
                  <p className="font-medium">{moduleLabel(module.title, persona)}</p>
                  <p className="text-[11px] text-slate-400">{module.subtitle}</p>
                </Link>
              )
            })}
          </nav>

          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">All Modules</div>
          <nav className="space-y-1">
            {remainingModules.map((module) => {
              const active = pathname?.startsWith(module.path)
              return (
                <Link
                  key={module.key}
                  href={module.path}
                  className={`block rounded-md border px-3 py-2 text-sm ${active ? 'border-blue-600 bg-blue-900/30 text-blue-100' : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700/70'}`}
                >
                  <p className="font-medium">{moduleLabel(module.title, persona)}</p>
                  <p className="text-[11px] text-slate-400">{module.northStar}</p>
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
