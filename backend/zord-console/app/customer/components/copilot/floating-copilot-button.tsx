'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { CopilotChatCore } from './copilot-chat-core'

function isTypingTarget(el: Element | null) {
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  return (el as HTMLElement).isContentEditable
}

function FloatingCopilotButtonInner() {
  const searchParams = useSearchParams()
  const intentFromUrl = searchParams.get('intent')

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const firstOpenHandled = useRef(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    // Prevent background scroll while modal is open.
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mounted, open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey
      if (!isCmdOrCtrl || e.code !== 'Space') return
      if (isTypingTarget(document.activeElement)) return
      e.preventDefault()
      setOpen(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!intentFromUrl) return
    if (firstOpenHandled.current) return
    firstOpenHandled.current = true
    setOpen(true)
  }, [intentFromUrl])

  const modal = useMemo(() => {
    if (!mounted || !open) return null
    return createPortal(
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(8, 8, 10, 0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
          onClick={() => setOpen(false)}
        />
        <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-8">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Zord copilot"
            className="w-full max-w-[860px] h-[78vh] sm:h-[72vh] max-h-[760px] min-h-[520px] rounded-[20px] overflow-hidden"
            style={{
              background: 'rgba(20, 20, 22, 0.6)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 20px 60px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
            }}
          >
            <CopilotChatCore
              intentFromUrl={intentFromUrl}
              compact
              variant="glass"
              onRequestClose={() => setOpen(false)}
            />
          </div>
        </div>
      </div>,
      document.body
    )
  }, [intentFromUrl, mounted, open])

  return (
    <>
      <button
        type="button"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all focus:outline-none"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 10px 40px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          color: '#E6E6E6',
        }}
        onClick={() => setOpen(true)}
        aria-label="Open Zord copilot"
        title="Copilot (Cmd/Ctrl + Space)"
      >
        <span className="text-xl font-extrabold tracking-tighter">Z</span>
      </button>
      {modal}
    </>
  )
}

export function FloatingCopilotButton() {
  // useSearchParams requires Suspense in Next App Router
  return (
    <Suspense fallback={null}>
      <FloatingCopilotButtonInner />
    </Suspense>
  )
}
