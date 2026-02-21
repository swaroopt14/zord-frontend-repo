import { CopilotChatCore } from '../components/copilot/copilot-chat-core'

export default function CustomerCopilotPage({
  searchParams,
}: {
  searchParams?: { intent?: string }
}) {
  const intentFromUrl = searchParams?.intent ?? null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
            Zord Prompt Layer
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--glass-item-text)' }}>
            ChatGPT-like workspace for prompts and investigation. Cmd/Ctrl + Space opens the floating layer.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{ background: 'var(--glass-badge-bg)', color: 'var(--glass-badge-text)', border: '1px solid var(--glass-border)' }}
            title="No backend contract configured"
          >
            Local only
          </span>
          {intentFromUrl ? (
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ background: 'rgba(244, 244, 245, 0.10)', color: 'var(--glass-item-active)', border: '1px solid var(--glass-border)' }}
              title="Context from URL"
            >
              intent={intentFromUrl}
            </span>
          ) : null}
        </div>
      </div>

      <div
        className="rounded-[20px] overflow-hidden"
        style={{
          background: 'var(--glass-panel)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--glass-shadow)',
          height: 'calc(100vh - 3.5rem - 24px - 96px)',
          minHeight: 560,
        }}
      >
        <CopilotChatCore intentFromUrl={intentFromUrl} variant="page" />
      </div>
    </div>
  )

}