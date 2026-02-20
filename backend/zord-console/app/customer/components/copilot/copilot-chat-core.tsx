'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PromptInput } from './prompt-input'

type ChatItem =
  | { id: string; type: 'user'; text: string; created_at: string | null }
  | { id: string; type: 'system'; text: string; created_at: string | null }

function nowIso() {
  return new Date().toISOString()
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
  const [draft, setDraft] = useState('')
  const [items, setItems] = useState<ChatItem[]>(() => {
    // Important: keep the initial render deterministic between server and client to avoid hydration mismatches.
    const base: ChatItem[] = [
      {
        id: 'sys_0',
        type: 'system',
        created_at: null,
        text: 'Zord Copilot UI is available in this build, but no backend chat contract is configured. Prompts are not sent anywhere.',
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

  const canSend = useMemo(() => draft.trim().length > 0, [draft])
  const hasUserMessages = useMemo(() => items.some((it) => it.type === 'user'), [items])
  const densityPad = compact ? 'px-4 py-3' : 'px-5 py-4'

  const submit = useCallback(() => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    setItems((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, type: 'user', created_at: nowIso(), text },
      {
        id: `sys_${Date.now()}_no_backend`,
        type: 'system',
        created_at: nowIso(),
        text: 'No response: backend contract not configured.',
      },
    ])
  }, [draft])

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
              title="No backend chat contract is configured"
            >
              LOCAL ONLY
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

      <PromptInput
        value={draft}
        onChange={setDraft}
        onSubmit={submit}
        disabled={!canSend}
        placeholder="Type a prompt (not sent anywhere in this build)…"
      />
    </div>
  )
}
