import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`liquid-glass rounded-[16px] p-1 transition-all duration-400 ease-out hover:-translate-y-[2px] group relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10 w-full h-full bg-[#030305]/60 backdrop-blur-xl rounded-[12px] p-5 shadow-inner">
        {children}
      </div>
    </div>
  )
}
