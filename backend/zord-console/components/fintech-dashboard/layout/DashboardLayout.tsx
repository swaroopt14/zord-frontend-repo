import { ReactNode } from 'react'
import { Navbar } from './Navbar'

interface DashboardLayoutProps {
  children: ReactNode
  mainClassName?: string
}

export function DashboardLayout({ children, mainClassName = '' }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F2E8D5] text-[#243225] bg-noise font-sans">
      <Navbar />
      <main className={`w-full px-6 py-6 md:px-8 max-w-[1600px] mx-auto ${mainClassName}`}>{children}</main>
    </div>
  )
}
