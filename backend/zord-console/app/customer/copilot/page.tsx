import { CopilotChatCore } from '../components/copilot/copilot-chat-core'

export default function CustomerCopilotPage({
  searchParams,
}: {
  searchParams?: { intent?: string }
}) {
  const intentFromUrl = searchParams?.intent ?? null

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <div
        className="mx-auto max-w-6xl rounded-[30px] p-5 sm:p-6"
        style={{
          background: 'rgba(20,20,22,0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: '#E6E6E6' }}>
              Zord Prompt Layer
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#A6A6A6' }}>
              ChatGPT-like workspace for prompts and investigation. Cmd/Ctrl + Space opens the floating layer.
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'rgba(76,175,80,0.2)', color: '#d5f4dc', border: '1px solid rgba(76,175,80,0.45)' }}
              title="No backend contract configured"
            >
              Local only
            </span>
            {intentFromUrl ? (
              <span
                className="rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#E6E6E6', border: '1px solid rgba(255,255,255,0.12)' }}
                title="Context from URL"
              >
                intent={intentFromUrl}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="overflow-hidden rounded-[22px]"
          style={{
            background: 'rgba(20,20,22,0.6)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 20px 60px rgba(0,0,0,0.6)',
            height: 'calc(100vh - 3.5rem - 24px - 112px)',
            minHeight: 560,
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
          }}
        >
          <CopilotChatCore intentFromUrl={intentFromUrl} variant="page" />
        </div>
      </div>
    </div>
  )

}
