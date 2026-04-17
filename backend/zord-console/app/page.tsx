'use client'

import { Header } from '@/components/landing/Header'
import { Hero } from '@/components/landing/Hero'
import { LogoStrip } from '@/components/landing/LogoStrip'
import { FeaturesBento } from '@/components/landing/FeaturesBento'
import { ProductShowcase } from '@/components/landing/ProductShowcase'
import { DashboardShowcase } from '@/components/landing/DashboardShowcase'
import { TrustLayer } from '@/components/landing/TrustLayer'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { UseCases } from '@/components/landing/UseCases'
import { Security } from '@/components/landing/Security'
import { Developers } from '@/components/landing/Developers'
import { Pricing } from '@/components/landing/Pricing'
import { ZordLogo } from '@/components/ZordLogo'

const footerColumns = [
  {
    title: 'Product',
    links: ['Overview', 'Tracking', 'Proof', 'Dashboard', 'Security'],
  },
  {
    title: 'How it works',
    links: ['Route payouts', 'Track status', 'Confirm delivery', 'Store proof', 'Export records'],
  },
  {
    title: 'Use Cases',
    links: ['Marketplaces', 'NBFC / Lending', 'SaaS & Platforms', 'Vendor payouts', 'Partner payouts'],
  },
  {
    title: 'Developers',
    links: ['Docs', 'API', 'Search', 'Exports', 'Support'],
  },
]

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{title}</div>
      <div className="mt-4 space-y-2.5">
        {links.map((link) => (
          <div key={link} className="text-[13px] text-white/50 transition hover:text-white cursor-pointer hover:underline">
            {link}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#070708] text-white"
      style={{
        ['--font-zord-mono' as string]: "'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
        fontFamily: "'Roobert', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Header />
      
      <div className="relative pt-[72px]">
        <Hero />
        
        <LogoStrip />
        
        <ProductShowcase />
        
        <HowItWorks />
        
        <DashboardShowcase />
        
        <UseCases />
        
        <Security />
        
        <Developers />
        
        <Pricing />
        
        <TrustLayer />

        <footer className="mx-auto max-w-[1200px] border-t border-white/10 px-6 py-16 md:px-12 mt-20">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
            <div>
              <ZordLogo size="sm" variant="dark" className="items-center text-white" />
              <p className="mt-6 max-w-[320px] text-[13px] leading-7 text-white/50">
                Zord by Arelais. Helping businesses send and track payouts reliably.
              </p>
              <p className="mt-4 text-[13px] text-white/50">Contact: hello@arelais.com</p>
            </div>
            {footerColumns.map((col) => (
              <FooterColumn key={col.title} title={col.title} links={col.links} />
            ))}
          </div>
          <div className="mt-16 flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-8">
            <div className="text-[12px] text-white/40">© 2026 Arelais</div>
            <div className="mt-4 md:mt-0 flex gap-6 text-[12px] text-white/40">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">System Status</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
