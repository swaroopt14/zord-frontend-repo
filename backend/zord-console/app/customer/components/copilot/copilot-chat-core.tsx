'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'


type ChatItem =
  | { id: string; type: 'user'; text: string; created_at: string | null }
  | { id: string; type: 'system'; text: string; created_at: string | null }
type CopilotCitation = {
  source_type: string
  record_id: string
  chunk_id: string
  snippet: string
  score: number
}

type CopilotResponse = {
  answer: string
  confidence: string
  entities_found?: {
    intent_id?: string
    trace_id?: string
  }
  citations?: CopilotCitation[]
  next_actions?: string[]
}

function nowIso() {
  return new Date().toISOString()
}

function hasMissingGeminiKey(details: unknown): boolean {
  const s = String(details || '')
  return (
    s.includes('missing GEMINI_API_KEY/GEMINI_API_KEYS') ||
    s.includes('GEMINI_API_KEY') ||
    s.includes('GEMINI_API_KEYS')
  )
}

function djb2Hash(input: string): number {
  let h = 5381
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h) + input.charCodeAt(i)
  // Force uint32
  return h >>> 0
}

function xorshift32(seed: number): () => number {
  let x = seed >>> 0
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return x >>> 0
  }
}

function toHex(n: number, width: number): string {
  return (n >>> 0).toString(16).padStart(width, '0').slice(-width)
}

function mockUuid(nextU32: () => number): string {
  // RFC4122-ish formatting; deterministic but not cryptographically random.
  const a = toHex(nextU32(), 8)
  const b = toHex(nextU32(), 4)
  const c = toHex(nextU32(), 4)
  const d = toHex(nextU32(), 4)
  const e = toHex(nextU32(), 12)
  return `${a}-${b}-${c}-${d}-${e}`
}

function buildDemoMockAnswer(prompt: string): CopilotResponse {
  const dayUtc = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const seed = djb2Hash(`${dayUtc}::${prompt}`)
  const rnd = xorshift32(seed)

  const intentA = mockUuid(rnd)
  const intentB = mockUuid(rnd)
  const intentC = mockUuid(rnd)
  const traceA = mockUuid(rnd)

  const normalized = prompt.trim().toLowerCase()
  const isSummary =
    normalized.includes("summarize") ||
    normalized.includes("today") ||
    normalized.includes("intents")

  if (isSummary) {
    return {
      answer: [
        `Demo (mock): Prompt Layer LLM key is not configured, so this is a deterministic fallback response for ${dayUtc} (UTC).`,
        ``,
        `Ingestion summary (UTC):`,
        `- Intents processed: 12`,
        `- Rejected / DLQ: 2`,
        `- In-flight: 1`,
        ``,
        `Notable intents:`,
        `- intent_id=${intentA} (status=READY) trace_id=${traceA}`,
        `- intent_id=${intentB} (status=VALIDATED)`,
        `- intent_id=${intentC} (status=DLQ: semantic_validation_failed)`,
        ``,
        `Next actions:`,
        `1) Open /console/ingestion/dlq to review the 2 failed intents`,
        `2) Re-submit with corrected fields (amount > 0, allowed currency, valid IFSC when applicable)`,
      ].join('\n'),
      confidence: 'demo',
      entities_found: { intent_id: intentA, trace_id: traceA },
      next_actions: [
        'Review DLQ items in console',
        'Fix validation errors and resubmit with a new idempotency key',
      ],
    }
  }

  return {
    answer: [
      `Demo (mock): Prompt Layer LLM key is not configured, so this is a deterministic fallback response.`,
      ``,
      `I can answer ingestion questions using tenant / intent / trace context once GEMINI_API_KEY is set.`,
      ``,
      `What I understood: "${prompt.trim()}"`,
      ``,
      `Try: "Summarize today's intents" or "Why did my last intent fail? intent=<intent_id>"`,
    ].join('\n'),
    confidence: 'demo',
  }
}

export function CopilotChatCore({
  intentFromUrl,
  compact,
  variant,
  onRequestClose,
}: {
  intentFromUrl?: string | null
  compact?: boolean
  variant?: 'glass' | 'page'
  onRequestClose?: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const [draft, setDraft] = useState('')
  const [items, setItems] = useState<ChatItem[]>(() => {
    // Important: keep the initial render deterministic between server and client to avoid hydration mismatches.
    const base: ChatItem[] = [
      {
        id: 'sys_0',
        type: 'system',
        created_at: null,
        text: 'Zord Copilot is connected to Prompt Layer. Ask using tenant, intent, or trace context.',

      },
    ]
    if (intentFromUrl) {
      base.push({
        id: 'sys_intent',
        type: 'system',
        created_at: null,
        text: `Context: intent=${intentFromUrl}`,
      })
    }
    return base
  })

  useEffect(() => {
    setMounted(true)
    // Fill timestamps after mount (client-only) so SSR markup matches hydration.
    setItems((prev) =>
      prev.map((it) => (it.created_at ? it : { ...it, created_at: nowIso() }))
    )
  }, [])

  const canSend = useMemo(() => draft.trim().length > 0 && !isSending, [draft, isSending])
  const hasUserMessages = useMemo(() => items.some((it) => it.type === 'user'), [items])
  const densityPad = compact ? 'px-4 py-3' : 'px-5 py-4'
  const formatResponseText = useCallback((resp: CopilotResponse) => {
  const lines: string[] = []
  lines.push(resp.answer || 'No answer returned.')
  lines.push('')
  lines.push(`Confidence: ${resp.confidence || 'unknown'}`)

  if (resp.entities_found?.intent_id || resp.entities_found?.trace_id) {
    lines.push(
      `Entities: intent_id=${resp.entities_found?.intent_id || '-'}, trace_id=${resp.entities_found?.trace_id || '-'}`
    )
  }

  if (resp.citations?.length) {
    lines.push('')
    lines.push('Citations:')
    resp.citations.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.source_type} | record=${c.record_id} | score=${Number(c.score || 0).toFixed(2)}`)
      lines.push(`   ${c.snippet}`)
    })
  }

  if (resp.next_actions?.length) {
    lines.push('')
    lines.push('Next actions:')
    resp.next_actions.forEach((n, i) => lines.push(`${i + 1}. ${n}`))
  }

  return lines.join('\n')
}, [])

  const submit = useCallback(async () => {
  const text = draft.trim()
  if (!text || isSending) return

  setIsSending(true)
  setDraft('')
  setItems((prev) => [...prev, { id: `u_${Date.now()}`, type: 'user', created_at: nowIso(), text }])

  try {
    const tenantMatch = text.match(/tenant(?:\s+id)?\s*(?:is|=|:)?\s*([0-9a-fA-F-]{36})/i)
    const tenantId = tenantMatch?.[1] ?? null

    // Default to same-origin proxy so this works on EC2 for all users (no localhost:8086 in the browser).
    // If needed (local dev), NEXT_PUBLIC_PROMPT_LAYER_URL can override to a full URL.
    const baseUrl = process.env.NEXT_PUBLIC_PROMPT_LAYER_URL || '/api/prompt-layer'
    const payload: Record<string, unknown> = { query: text }
    if (tenantId) payload.tenant_id = tenantId
    if (intentFromUrl) payload.intent_id = intentFromUrl


    const res = await fetch(`${baseUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const raw = await res.text()
    let body: any = {}
    try {
      body = raw ? JSON.parse(raw) : {}
    } catch {
      body = { details: raw }
    }
    if (!res.ok) {
      // Demo fallback: if Prompt Layer is running but missing Gemini keys, return a deterministic mock answer
      // so product videos/screenshares don't get blocked on external LLM credentials.
      if (hasMissingGeminiKey(body?.details)) {
        const demo = buildDemoMockAnswer(text)
        const formatted = formatResponseText(demo)
        setItems((prev) => [
          ...prev,
          { id: `sys_${Date.now()}_demo`, type: 'system', created_at: nowIso(), text: formatted },
        ])
        return
      }

      const details = body?.details ? `\nDetails: ${String(body.details)}` : ''
      throw new Error(`Prompt query failed.${details}`)
    }

    const formatted = formatResponseText(body as CopilotResponse)
    setItems((prev) => [
      ...prev,
      { id: `sys_${Date.now()}_response`, type: 'system', created_at: nowIso(), text: formatted },
    ])
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'

    // If Prompt Layer isn't reachable at all, also fall back to a deterministic demo answer.
    if (hasMissingGeminiKey(msg) || String(msg).toLowerCase().includes('failed to fetch')) {
      const demo = buildDemoMockAnswer(text)
      const formatted = formatResponseText(demo)
      setItems((prev) => [
        ...prev,
        { id: `sys_${Date.now()}_demo`, type: 'system', created_at: nowIso(), text: formatted },
      ])
      setIsSending(false)
      return
    }

    setItems((prev) => [
      ...prev,
      { id: `sys_${Date.now()}_error`, type: 'system', created_at: nowIso(), text: `Query failed.\n${msg}` },
    ])
  } finally {
    setIsSending(false)
  }
}, [draft, formatResponseText, intentFromUrl, isSending])


  const clear = useCallback(() => {
    setDraft('')
    setItems((prev) => prev.filter((it) => it.id === 'sys_0' || it.id === 'sys_intent'))
  }, [])

  const applySuggestion = useCallback((text: string) => {
    setDraft(text)
  }, [])

  const suggestions = useMemo(
    () => [
      "Summarize today's intents",
      'How to add a new schema field?',
      'Explain what is finality?',
      'Show me recent errors',
      'Best practices for schema versioning',
      'Why did my last intent fail?',
    ],
    []
  )

  const contentWidth = compact ? 'max-w-none' : 'max-w-3xl'

  return (
    <div className="flex flex-col h-full">
      <div
        className={densityPad}
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div
              className={compact ? 'text-sm font-extrabold tracking-tight' : 'text-base font-extrabold tracking-tight'}
              style={{ color: 'var(--text)' }}
            >
              <span className="inline-flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tighter">Z</span>
                <span>Ask me anything about Zord Vault</span>
              </span>
            </div>
            <div className="text-[11px] font-medium" style={{ color: 'var(--glass-item-text)' }}>
              {variant === 'page' ? 'This is a full-page prompt workspace.' : 'Cmd/Ctrl + Space to open.'} Shift+Enter for newline.
            </div>
          </div>
          <div className="flex items-center gap-2">
            {variant === 'glass' ? (
              <Link
                href="/customer/copilot"
                className="px-2.5 py-1.5 rounded-[12px] text-[11px] font-semibold"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--glass-item-text)',
                }}
                title="Open the full prompt workspace"
              >
                Open page
              </Link>
            ) : null}
            <button
              type="button"
              onClick={clear}
              className="px-2.5 py-1.5 rounded-[12px] text-[11px] font-semibold"
              style={{
                background: 'var(--glass-item-hover-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--glass-item-active)',
              }}
              title="Clear chat"
            >
              New chat
            </button>
            <div
              className="px-2 py-1 rounded-full text-[10px] font-bold"
              style={{ background: 'var(--glass-badge-bg)', color: 'var(--glass-badge-text)' }}
              title="Connected to Prompt Layer"
            >
              LIVE
            </div>
            {onRequestClose ? (
              <button
                type="button"
                onClick={onRequestClose}
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'transparent',
                  color: 'var(--glass-item-text)',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--glass-item-hover-bg)'
                  e.currentTarget.style.borderColor = 'var(--glass-border)'
                  e.currentTarget.style.color = 'var(--glass-item-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'transparent'
                  e.currentTarget.style.color = 'var(--glass-item-text)'
                }}
                aria-label="Close"
                title="Close"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto cx-glass-scroll">
        <div className={`${contentWidth} mx-auto px-4 sm:px-6 py-5 space-y-5`}>
          {!hasUserMessages && (
            <div className="py-4 sm:py-6">
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    style={{
                      background: 'var(--glass-panel)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--glass-item-active)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--glass-item-hover-bg)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--glass-panel)'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {items.map((it) => (
            <div key={it.id} className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                <div
                  className="w-7 h-7 rounded-[12px] flex items-center justify-center text-xs font-black"
                  style={{
                    background: it.type === 'user' ? 'rgba(124,58,237,0.14)' : 'var(--glass-badge-bg)',
                    border: '1px solid var(--glass-border)',
                    color: it.type === 'user' ? 'var(--cx-primary)' : 'var(--glass-badge-text)',
                  }}
                  title={it.type === 'user' ? 'You' : 'System'}
                >
                  {it.type === 'user' ? 'Y' : 'Z'}
                </div>
              </div>
              <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold" style={{ color: 'var(--glass-item-text)' }}>
                    {it.type === 'user' ? 'You' : 'System'}
                  </div>
                  <div
                    className="text-[10px] font-mono"
                    style={{ color: 'var(--glass-item-disabled)' }}
                    suppressHydrationWarning
                  >
                    {mounted ? (it.created_at ?? '') : ''}
                  </div>
                </div>
                <div
                  className="mt-1 rounded-[16px] px-3 py-2.5 text-sm"
                  style={{
                    background: it.type === 'user' ? 'rgba(124,58,237,0.08)' : 'var(--glass-panel)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text)',
                    boxShadow: it.type === 'user' ? 'none' : 'var(--glass-shadow-sm)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {it.text}
                </div>
              </div>
            </div>
          ))}

          <div className="h-6" />
        </div>
      </div>

      <div className="p-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a prompt (live query to Prompt Layer)..."
            className="flex-1 rounded-xl px-3 py-2 text-sm resize-none outline-none"
            style={{
              background: 'var(--glass-panel)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text)',
              minHeight: 72,
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (canSend) submit()
              }
            }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              background: canSend ? 'var(--cx-primary, #6d5efc)' : 'var(--glass-item-hover-bg)',
              color: canSend ? '#fff' : 'var(--glass-item-disabled)',
              border: '1px solid var(--glass-border)',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
