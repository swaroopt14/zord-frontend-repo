'use client'

import { useEffect, useState } from 'react'

interface UseZordApiOptions {
  pollMs?: number
  enabled?: boolean
}

export function useZordApi<T>(fetcher: () => Promise<T>, deps: unknown[], options: UseZordApiOptions = {}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (options.enabled === false) {
      setLoading(false)
      return
    }

    let disposed = false

    async function run() {
      try {
        setError(null)
        const value = await fetcher()
        if (disposed) return
        setData(value)
      } catch (err) {
        if (disposed) return
        setError(err instanceof Error ? err.message : 'Request failed')
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    setLoading(true)
    void run()

    let interval: ReturnType<typeof setInterval> | undefined
    if (options.pollMs && options.pollMs > 0) {
      interval = setInterval(() => void run(), options.pollMs)
    }

    return () => {
      disposed = true
      if (interval) clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
