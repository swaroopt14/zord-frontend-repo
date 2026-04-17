'use client'

function ZordChatIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.1 6.2h11.8a3.1 3.1 0 0 1 3.1 3.1v6a3.1 3.1 0 0 1-3.1 3.1H12l-4.15 2.8c-.44.3-1.03-.03-1.03-.56v-2.24H6.1A3.1 3.1 0 0 1 3 15.3v-6a3.1 3.1 0 0 1 3.1-3.1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" />
    </svg>
  )
}

export function FinalLandingAssistantButton() {
  return (
    <a
      href="mailto:hello@arelais.com?subject=Talk%20to%20ZORD%20Copilot"
      aria-label="Talk to ZORD Copilot"
      className="fixed bottom-5 right-4 z-40 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/14 text-[#d8d3ec] shadow-[0_18px_36px_rgba(0,0,0,0.24)] transition duration-200 hover:scale-[1.03] hover:border-[#c6efcf]/40 hover:text-[#dff7e4] sm:bottom-6 sm:right-6"
      style={{
        background:
          'radial-gradient(circle at 50% 0%, rgba(198,239,207,0.14), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow:
          '0 18px 36px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <span className="pointer-events-none absolute inset-[1px] rounded-[21px] border border-white/[0.06]" />
      <ZordChatIcon className="relative z-10 h-7 w-7" />
    </a>
  )
}
