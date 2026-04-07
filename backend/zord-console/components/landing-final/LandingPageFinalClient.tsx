'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ZordLogo } from '@/components/ZordLogo'

type GlyphName =
  | 'chevron-down'
  | 'arrow-right'
  | 'menu-dots'
  | 'play'
  | 'check-circle'
  | 'eye'
  | 'code'
  | 'grid'
  | 'chart'
  | 'pie'
  | 'bolt'
  | 'shield'
  | 'link'
  | 'refresh'
  | 'plus'
  | 'minus'
  | 'dot'
  | 'book'
  | 'server'
  | 'wallet'
  | 'globe'

function Glyph({ name, className = '' }: { name: GlyphName; className?: string }) {
  const base = `inline-block ${className}`
  switch (name) {
    case 'chevron-down':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'arrow-right':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M4 10h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="m10.5 5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'menu-dots':
      return <svg className={base} viewBox="0 0 20 20" fill="currentColor"><circle cx="5" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="15" cy="10" r="1.6" /></svg>
    case 'play':
      return <svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="m7 5 8 5-8 5V5Z" /></svg>
    case 'check-circle':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" /><path d="m6.8 10.3 2.2 2.2 4.2-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'eye':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" stroke="currentColor" strokeWidth="1.6" /><circle cx="10" cy="10" r="2.4" fill="currentColor" /></svg>
    case 'code':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="m7 5-4 5 4 5M13 5l4 5-4 5M11.5 3 8.5 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'grid':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="12" y="3" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="12" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="12" y="12" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" /></svg>
    case 'chart':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M4 14.5V9.5M10 14.5V5.5M16 14.5V7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M3 16.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    case 'pie':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M10 3a7 7 0 1 0 7 7h-7V3Z" stroke="currentColor" strokeWidth="1.6" /><path d="M11 3.2A6.8 6.8 0 0 1 16.8 9H11V3.2Z" fill="currentColor" /></svg>
    case 'bolt':
      return <svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M11.7 2 5.8 10h3L7.9 18l6.3-8h-3.2L11.7 2Z" /></svg>
    case 'shield':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M10 2.5 4.5 4.8v4.5c0 4 2.3 6.3 5.5 8.2 3.2-1.9 5.5-4.2 5.5-8.2V4.8L10 2.5Z" stroke="currentColor" strokeWidth="1.6" /><path d="m7.3 10.1 1.8 1.8 3.6-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'link':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M8 12.2 6.4 13.8a2.5 2.5 0 0 1-3.5-3.6l2.7-2.7a2.5 2.5 0 0 1 3.5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M12 7.8l1.6-1.6a2.5 2.5 0 0 1 3.5 3.6l-2.7 2.7a2.5 2.5 0 0 1-3.5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="m7.2 10 5.6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    case 'refresh':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M16 6.5V3.8l-2.6 2.3A6.2 6.2 0 1 0 16 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'plus':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
    case 'minus':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
    case 'book':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M4 4.5h8.5a2.5 2.5 0 0 1 2.5 2.5v8.5H6.5A2.5 2.5 0 0 0 4 18V4.5Z" stroke="currentColor" strokeWidth="1.5" /><path d="M15 15.5H6.5A2.5 2.5 0 0 0 4 18" stroke="currentColor" strokeWidth="1.5" /></svg>
    case 'server':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="4.2" rx="1.4" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="11.8" width="14" height="4.2" rx="1.4" stroke="currentColor" strokeWidth="1.5" /><circle cx="6" cy="6.1" r="0.8" fill="currentColor" /><circle cx="6" cy="13.9" r="0.8" fill="currentColor" /></svg>
    case 'wallet':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M4 6.2A2.2 2.2 0 0 1 6.2 4H14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6.2A2.2 2.2 0 0 1 4 13.8V6.2Z" stroke="currentColor" strokeWidth="1.5" /><path d="M12.8 10h3.2v2.7h-3.2A1.35 1.35 0 0 1 11.4 11.35v0A1.35 1.35 0 0 1 12.8 10Z" stroke="currentColor" strokeWidth="1.5" /></svg>
    case 'globe':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M3.5 10h13M10 3c1.8 2 2.7 4.2 2.7 7S11.8 15 10 17M10 3C8.2 5 7.3 7.2 7.3 10s.9 5 2.7 7" stroke="currentColor" strokeWidth="1.5" /></svg>
    default:
      return <span className={base}>•</span>
  }
}

const navLinks = [
  {
    label: 'Product',
    items: [
      ['Routing', 'Send payouts through the best provider'],
      ['Tracking', 'Watch every transaction in real time'],
      ['Reconciliation', 'Match provider and bank outcomes'],
      ['Proof Packs', 'Keep audit-ready records for every payout'],
    ],
  },
  {
    label: 'How it works',
    href: '/final-landing/how-it-works',
    items: [],
  },
  {
    label: 'Use Cases',
    items: [
      ['Marketplaces', 'Pay sellers on time without blind spots'],
      ['NBFC / Lending', 'Disburse and verify payouts reliably'],
      ['SaaS & Platforms', 'Pay vendors, partners, and customers'],
    ],
  },
  {
    label: 'Security',
    items: [
      ['Access Controls', 'Limit who can view and act'],
      ['Audit Trails', 'Every action logged and attributable'],
      ['Evidence Ready', 'Proof for finance and compliance teams'],
    ],
  },
  {
    label: 'Developers',
    items: [
      ['Docs', 'Start integrating quickly'],
      ['API', 'Send, track, confirm, and prove payouts'],
      ['Webhooks', 'Push signals straight into your systems'],
    ],
  },
  { label: 'Pricing', items: [] },
]

const outcomeTiles = [
  ['Marketplaces', 'Pay sellers on time'],
  ['Lending', 'Track disbursement delivery'],
  ['Finance', 'Reconcile faster'],
  ['Operations', 'Resolve exceptions early'],
  ['Routing', 'Use the best provider'],
  ['Tracking', 'Know every payment step'],
  ['Proof', 'Export audit-ready records'],
  ['Control', 'One place to see everything'],
]

const featureCards = [
  {
    title: 'Reduce failed payouts',
    desc: 'Automatically use the most reliable provider to improve payout success without manual switching.',
    cta: 'See routing',
    icon: 'shield' as GlyphName,
  },
  {
    title: 'Know where your money is',
    desc: 'Track payouts in real time instead of waiting for updates across banks, PSPs, and support channels.',
    cta: 'View tracking',
    icon: 'globe' as GlyphName,
  },
  {
    title: 'Be ready for audits',
    desc: 'Keep clear records and proof for each transfer so finance and compliance always have a defensible answer.',
    cta: 'Explore proof',
    icon: 'chart' as GlyphName,
  },
]

const explainerTabs = [
  {
    title: 'Send payouts through the best provider',
    content:
      'Zord evaluates provider performance and routes money through the best available path so teams see fewer failed or delayed payouts.',
    code: [
      "const payout = await zord.payouts.create({",
      "  amount: 50000,",
      "  currency: 'INR',",
      "  beneficiaryId: 'seller_4821',",
      "  mode: 'best_available',",
      '})',
    ],
  },
  {
    title: 'Track every payment step-by-step',
    content:
      'Each payout gets a live event trail across provider, bank, and settlement stages so operations teams can see where money is stuck instantly.',
    code: [
      "zord.payouts.track('po_01HZX9J3', {",
      "  stages: ['dispatched', 'provider_ack', 'bank_credit'],",
      "  webhooks: true,",
      '})',
    ],
  },
  {
    title: 'Confirm delivery and store proof',
    content:
      'Zord confirms whether money actually reached and stores a proof pack with the evidence finance, legal, and compliance teams need later.',
    code: [
      "const proof = await zord.proofs.export({",
      "  payoutId: 'po_01HZX9J3',",
      "  include: ['webhook', 'statement', 'timeline'],",
      '})',
    ],
  },
]

const footerColumns = {
  Product: ['Routing', 'Tracking', 'Reconciliation', 'Proof Packs'],
  'How it works': ['Send', 'Track', 'Confirm', 'Resolve'],
  'Use Cases': ['Marketplaces', 'NBFC / Lending', 'SaaS & Platforms'],
  Developers: ['Documentation', 'API Reference', 'Webhooks', 'Status'],
}

const howItWorksPreviewSteps = [
  {
    step: '01',
    title: 'Capture payout intent',
    body: 'Validate the request, beneficiary context, and business rules before money moves.',
  },
  {
    step: '02',
    title: 'Route via best provider',
    body: 'Pick the healthiest provider and rail using live cost, latency, and failover conditions.',
  },
  {
    step: '03',
    title: 'Track every state',
    body: 'Watch provider acknowledgement, bank signals, and settlement progression in one timeline.',
  },
  {
    step: '04',
    title: 'Confirm and prove',
    body: 'Confirm whether money reached and export a proof pack for finance, legal, or support.',
  },
]

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'bg-white/90 py-3 shadow-sm backdrop-blur-md' : 'bg-transparent py-5'
      }`}
    >
      <div className="mx-auto flex max-w-[1080px] items-center justify-between px-6">
        <Link href="/final-landing/page" className="z-10">
          <ZordLogo size="sm" variant="light" className="text-slate-900" />
        </Link>

        <nav className="hidden items-stretch gap-2 md:flex">
          {navLinks.map((link) => (
            <div key={link.label} className="group relative flex items-center px-3 py-1">
              {link.href ? (
                <Link href={link.href} className="flex cursor-pointer items-center gap-1.5 py-2 text-[15px] font-light text-slate-800 transition-colors hover:text-indigo-600">
                  {link.label}
                </Link>
              ) : (
                <button className="flex cursor-pointer items-center gap-1.5 py-2 text-[15px] font-light text-slate-800 transition-colors group-hover:text-indigo-600">
                  {link.label}
                  {link.items.length > 0 && <Glyph name="chevron-down" className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-180" />}
                </button>
              )}

              {link.items.length > 0 && (
                <div className="pointer-events-none absolute left-1/2 top-full z-50 translate-x-[-50%] translate-y-3 pt-4 opacity-0 transition-all duration-300 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="relative min-w-[320px] rounded-2xl border border-slate-100 bg-white p-2.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
                    <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-slate-100 bg-white" />
                    <div className="relative z-10 flex flex-col gap-1 bg-white">
                      {link.items.map(([title, desc]) => (
                        <a key={title} href="#" className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50">
                          <div className="mt-0.5 h-10 w-10 shrink-0 rounded-lg bg-indigo-50/70 text-indigo-600 flex items-center justify-center">
                            <span className="text-xs font-semibold tracking-[0.18em]">{title.slice(0, 2).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="mb-0.5 text-[14px] font-medium text-slate-800">{title}</div>
                            <div className="text-[13px] font-light text-slate-500">{desc}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/console/login" className="text-[15px] font-light text-slate-800 transition-colors hover:text-indigo-600">
            Sign in
          </Link>
          <a
            href="mailto:hello@arelais.com?subject=Book%20Demo%20for%20Zord"
            className="flex items-center gap-1 rounded-full bg-indigo-600 px-4 py-1.5 text-[15px] font-light text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow"
          >
            Book Demo
            <Glyph name="arrow-right" className="h-4 w-4" />
          </a>
        </div>

        <button className="text-slate-800 md:hidden">
          <Glyph name="menu-dots" className="h-7 w-7" />
        </button>
      </div>
    </header>
  )
}

function Hero() {
  const [volume, setVolume] = useState(1489203948)

  useEffect(() => {
    const timer = setInterval(() => {
      setVolume((prev) => prev + Math.floor(Math.random() * 2400 + 600))
    }, 300)
    return () => clearInterval(timer)
  }, [])

  const formattedVolume = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(volume),
    [volume],
  )

  return (
    <section
      className="relative z-10 overflow-hidden bg-white pb-12 pt-20 lg:pb-20 lg:pt-28"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 90%, 0 100%)' }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#f6f9fc]">
        <motion.div
          className="absolute -right-[10%] -top-[20%] h-[120%] w-[70%] opacity-80 blur-[60px]"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, rgba(255,122,89,0.4) 0%, transparent 40%), radial-gradient(circle at 60% 50%, rgba(255,105,180,0.4) 0%, transparent 40%), radial-gradient(circle at 40% 10%, rgba(106,90,205,0.4) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(0,191,255,0.3) 0%, transparent 50%)',
          }}
          animate={{
            scale: [1, 1.08, 0.95, 1.04],
            x: [0, -30, 20, -10],
            y: [0, 20, -20, 30],
            rotate: [0, 5, -5, 2],
          }}
          transition={{ duration: 20, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
        />
        <div className="absolute left-0 top-1/4 h-px w-[120%] origin-left -rotate-[8deg] bg-gradient-to-r from-transparent via-black/5 to-transparent" />
        <div className="absolute left-0 top-2/4 h-px w-[120%] origin-left -rotate-[8deg] bg-gradient-to-r from-transparent via-black/5 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1080px] px-6">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <Reveal className="max-w-[42rem] lg:col-span-7 lg:max-w-none lg:-ml-1 xl:-ml-2">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-indigo-600/10 px-3.5 py-1.5 text-[14px] font-light text-indigo-600 md:text-[15px]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-600 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
              </span>
              <span>Payout volume tracked today:</span>
              <span className="font-medium tracking-[-0.03em] [font-variant-numeric:tabular-nums]">{formattedVolume}</span>
            </div>

            <h1 className="mb-4 max-w-none text-[2.8rem] font-normal leading-[0.96] tracking-[-0.055em] text-slate-800 md:text-[3.45rem] xl:text-[4.05rem]">
              <span className="block">Send money reliably.</span>
              <span className="block">Know exactly what happened.</span>
            </h1>

            <p className="mb-6 max-w-[34rem] text-[16px] font-light leading-[1.65] text-slate-500 md:text-[17px]">
              Zord helps you send payouts without failures, track every transaction in real time, and get clear proof when money is delivered.
            </p>

            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <a
                href="mailto:hello@arelais.com?subject=Book%20Demo%20for%20Zord"
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 px-7 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-indigo-500/50"
                style={{
                  boxShadow:
                    '0 15px 33px -12px rgba(99, 102, 241, 0.9), inset 0 4px 6.3px rgba(165, 180, 252, 0.6), inset 0 -5px 6.3px rgba(67, 56, 202, 0.8)',
                }}
              >
                <div className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 group-hover:translate-y-0" />
                <span className="relative flex items-center gap-2.5">
                  Book Demo
                  <Glyph name="arrow-right" className="h-[18px] w-[18px]" />
                </span>
              </a>

              <Link
                href="/final-landing/how-it-works"
                className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-6 py-3.5 text-[15px] font-medium text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-50"
              >
                See how it works
                <Glyph name="play" className="h-[17px] w-[17px]" />
              </Link>
            </div>
          </Reveal>

          <Reveal className="relative hidden justify-end lg:col-span-5 lg:flex lg:pl-4 xl:col-span-5 xl:pl-6">
            <div className="relative w-full max-w-[420px]">
              <motion.section
                className="relative z-10 w-full overflow-hidden rounded-[1.8rem] border border-slate-800 bg-slate-900 shadow-2xl"
                whileHover={{ y: -6 }}
                transition={{ duration: 0.45 }}
              >
                <div className="flex items-center justify-between border-b border-slate-800/70 px-4 pb-2.5 pt-4 text-[10px] text-slate-300">
                  <span>09:42</span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    <span>Strong</span>
                  </div>
                </div>

                <div className="relative mx-3 mt-3 overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,#111827_0%,#1e1b4b_45%,#111827_100%)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,0.45),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.2),transparent_30%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.06)_50%,transparent_100%)] opacity-40" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                  <div className="relative flex items-start justify-between px-4 pt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-200">14,712 payouts synced · Live cohort</p>
                      <p className="max-w-[190px] text-[11px] leading-relaxed text-slate-400">
                        Routing decisions, confirmations, and proof packs appear here automatically.
                      </p>
                    </div>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/50 text-slate-100 backdrop-blur transition hover:bg-black/70">
                      <Glyph name="menu-dots" className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mx-4 mt-8 rounded-2xl border border-white/10 bg-black/25 p-3.5 backdrop-blur-md">
                    <div className="mb-3 flex items-center justify-between text-[10px] text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <div className="flex items-center gap-1.5 rounded-md border border-white/5 bg-slate-800/40 px-2.5 py-1 text-slate-300">
                        <Glyph name="code" className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="font-mono">payout.ts</span>
                      </div>
                    </div>
                    <pre className="overflow-hidden text-[11px] leading-5 text-slate-300"><span className="text-indigo-400">await</span> zord.<span className="text-blue-300">routePayout</span>({'\n'}  amount: <span className="text-amber-200">50000</span>,{'\n'}  mode: <span className="text-emerald-300">&apos;best_available&apos;</span>,{'\n'}  sellerId: <span className="text-emerald-300">&apos;seller_4821&apos;</span>,{'\n'}  proof: <span className="text-fuchsia-300">true</span>{'\n'})</pre>
                  </div>

                  <div className="mt-5 space-y-5 px-5 pb-5">
                    <div className="space-y-1 border-b border-slate-800/70 pb-4">
                      <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-purple-400">PAYOUT CONTROL ROOM</p>
                      <h2 className="font-sans text-[18px] font-semibold tracking-tight text-slate-50">Flexible payout orchestration</h2>
                      <p className="font-sans text-[11px] leading-relaxed text-slate-400">
                        Route payouts, watch provider and bank states, and keep finance audit-ready without stitching together multiple tools.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400">
                          <Glyph name="play" className="h-5 w-5 translate-x-[1px]" />
                        </button>
                        <div className="text-[11px]">
                          <p className="font-medium text-slate-200">Open dashboard</p>
                          <p className="text-slate-500">Updated 18 seconds ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300">
                        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 transition hover:bg-slate-700"><Glyph name="eye" className="h-4 w-4" /></button>
                        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 transition hover:bg-slate-700"><Glyph name="code" className="h-4 w-4" /></button>
                        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 transition hover:bg-slate-700"><Glyph name="grid" className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t border-slate-800/70 pt-4 text-[10px] text-slate-400">
                      <div>
                        <p className="uppercase tracking-[0.22em] font-medium">Mode</p>
                        <p className="mt-1 font-medium text-slate-50">Command</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-[0.22em] font-medium">Window</p>
                        <p className="mt-1 font-medium text-slate-50">24h</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-[0.22em] font-medium">Outcome</p>
                        <p className="mt-1 font-medium text-slate-50">Verified</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              <motion.div
                className="absolute -bottom-6 -left-6 z-20 w-[320px] rounded-[1.6rem] border border-slate-200/60 bg-white/95 p-5 shadow-2xl shadow-indigo-900/10 backdrop-blur-xl"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-inner">
                      <Glyph name="check-circle" className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Proof ready</p>
                      <p className="text-[10px] font-light text-slate-500">Just now via bank + provider signals</p>
                    </div>
                  </div>
                  <button className="text-slate-400 transition-colors hover:text-slate-600">
                    <Glyph name="menu-dots" className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-5">
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-base font-medium text-slate-400">₹</span>
                    <p className="tracking-tight text-[28px] font-medium text-slate-800 [font-variant-numeric:tabular-nums]">4,299.00</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-[10px] font-semibold text-slate-600">S</div>
                    <p className="text-xs text-slate-500">For <span className="font-medium text-slate-700">seller settlement</span></p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                  <span className="font-mono tracking-tight text-slate-400">PO-2026-081</span>
                  <a href="#" className="flex items-center gap-1 font-medium text-indigo-600 transition-colors hover:text-indigo-700">
                    View proof
                    <Glyph name="arrow-right" className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function HowItWorksPreview() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const translateX = useTransform(scrollYProgress, [0, 1], ['6%', '-6%'])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.55, 1, 1, 0.72])

  return (
    <section className="relative z-10 overflow-hidden bg-[#07101d] py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.2),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-[8%] hidden w-px bg-gradient-to-b from-transparent via-white/8 to-transparent lg:block" />
      <div className="pointer-events-none absolute inset-y-0 right-[8%] hidden w-px bg-gradient-to-b from-transparent via-white/8 to-transparent lg:block" />

      <div className="relative z-10 mx-auto max-w-[1240px] px-6">
        <Reveal className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-indigo-300">Journey preview</p>
            <h2 className="text-4xl font-light tracking-tight text-white md:text-5xl">Follow the payout lifecycle before you open the full flow</h2>
            <p className="mt-5 text-lg font-light leading-relaxed text-slate-400">
              As you scroll, Zord reveals the exact sequence from payout intent to proof generation so teams understand what the platform is doing at every stage.
            </p>
          </div>

          <Link
            href="/final-landing/how-it-works"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Open full How it works
            <Glyph name="arrow-right" className="h-4 w-4" />
          </Link>
        </Reveal>

        <div ref={sectionRef} className="overflow-hidden">
          <motion.div style={{ x: translateX, opacity }} className="flex gap-5 will-change-transform">
            {howItWorksPreviewSteps.map((item, index) => (
              <motion.div
                key={item.step}
                className="min-h-[208px] min-w-[360px] flex-1 rounded-[2rem] border border-white/8 bg-white/[0.03] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl md:min-w-[430px]"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: index * 0.07 }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/25 bg-indigo-500/10 text-sm font-medium text-indigo-200">
                    {item.step}
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-indigo-400/30 to-transparent ml-4" />
                </div>
                <h3 className="max-w-[18ch] text-[28px] font-light leading-tight tracking-tight text-white">{item.title}</h3>
                <p className="mt-4 max-w-[34ch] text-sm font-light leading-7 text-slate-400">{item.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function LogoStripSection() {
  return (
    <section className="relative z-0 w-full overflow-hidden bg-[#050B14] pb-40 pt-40 lg:-mt-20 lg:pb-48 lg:pt-56">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[800px] w-full max-w-7xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(30,64,175,0.28),transparent_60%)] opacity-50" />
        {[15, 35, 65, 85].map((left, i) => (
          <div key={left} className="absolute inset-y-0 hidden w-[2px] bg-gradient-to-b from-transparent via-blue-500/10 to-transparent md:block" style={{ left: `${left}%` }}>
            <motion.div
              className="h-1/4 w-full bg-gradient-to-b from-transparent via-blue-400 to-transparent"
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: ['-100%', '100%'], opacity: [0, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 1.1, ease: 'easeInOut' }}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <Reveal className="mb-20 text-center">
          <h2 className="text-4xl font-normal tracking-tight text-white sm:text-5xl">Designed for payout teams under real pressure</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-slate-400">
            Zord helps operations, finance, and engineering teams work from the same payout truth when money is late, missing, or needs proof.
          </p>
        </Reveal>

        <Reveal className="relative mx-auto max-w-6xl">
          <div className="relative mb-20 grid grid-cols-2 gap-6 md:grid-cols-4">
            {outcomeTiles.map(([title, subtitle], idx) => (
              <motion.div
                key={title}
                className="group relative flex h-24 items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-[#0B0C10] text-center transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <div className="absolute left-0 top-0 h-1.5 w-1.5 border-l border-t border-blue-600/30 transition-all group-hover:h-2.5 group-hover:w-2.5 group-hover:border-blue-500" />
                <div className="absolute right-0 top-0 h-1.5 w-1.5 border-r border-t border-blue-600/30 transition-all group-hover:h-2.5 group-hover:w-2.5 group-hover:border-blue-500" />
                <div className="absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l border-blue-600/30 transition-all group-hover:h-2.5 group-hover:w-2.5 group-hover:border-blue-500" />
                <div className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-blue-600/30 transition-all group-hover:h-2.5 group-hover:w-2.5 group-hover:border-blue-500" />
                <div>
                  <div className="mb-1 text-sm font-medium text-white">{title}</div>
                  <div className="px-3 text-[11px] leading-relaxed text-slate-400">{subtitle}</div>
                </div>
                {idx === 4 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_60%)]" />}
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function ProductMontage() {
  return (
    <section
      id="how-it-works"
      className="relative z-10 overflow-hidden bg-slate-50 pb-32 pt-40 lg:-mt-32 lg:pb-0 lg:pt-48"
      style={{ clipPath: 'polygon(0 10%, 100% 0, 100% 100%, 0 100%)' }}
    >
      <div className="relative z-20 mx-auto max-w-[1080px] px-6">
        <Reveal className="mx-auto mb-20 max-w-3xl text-center">
          <h2 className="mb-3 text-sm font-normal uppercase tracking-wide text-indigo-600">One place to see everything</h2>
          <h3 className="mb-6 text-4xl font-normal tracking-tight text-slate-800">Zord fixes this by giving you control and visibility</h3>
          <p className="text-lg font-light text-slate-500">
            Route payouts through the best provider, track what happened step-by-step, and confirm whether money actually reached from a single command layer.
          </p>
        </Reveal>

        <div className="mx-auto grid max-w-6xl items-start gap-8 md:grid-cols-12">
          <Reveal className="flex w-full justify-center md:col-span-6">
            <section className="relative w-full max-w-[500px] flex-1 overflow-hidden rounded-[2.2rem] border border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-500 hover:-translate-y-1">
              <div className="flex items-center justify-between border-b border-slate-800/70 px-5 pb-3 pt-5 text-[11px] text-slate-300">
                <span>09:42</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                  <span>Strong</span>
                </div>
              </div>

              <div className="relative mx-3 mt-3 overflow-hidden rounded-[1.8rem] bg-[linear-gradient(135deg,#111827_0%,#312e81_55%,#111827_100%)] p-6">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="relative flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-200">14,712 payouts · Live cohort</p>
                    <p className="max-w-xs text-xs text-slate-400">
                      Surface provider slowdowns, identify bank-stage failures, and resolve stuck money faster.
                    </p>
                  </div>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-slate-100 backdrop-blur transition hover:bg-black/70">
                    <Glyph name="menu-dots" className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative mt-8 h-44 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,0.4),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_30%)]" />
                  <div className="relative flex h-full items-end gap-2">
                    {[38, 52, 41, 68, 60, 82, 58, 74, 49].map((h, idx) => (
                      <div key={idx} className="flex-1">
                        <div className={`w-full rounded-t-full ${idx === 5 ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : idx > 5 ? 'bg-indigo-200' : 'bg-slate-100'}`} style={{ height: `${h}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="absolute right-4 top-4 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-indigo-200">HIGH-RISK WINDOW</div>
                </div>
              </div>

              <div className="mt-6 space-y-6 px-6 pb-6">
                <div className="space-y-1 border-b border-slate-800/70 pb-4">
                  <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-purple-400">COMMAND CENTER · LIVE</p>
                  <h2 className="font-sans text-xl font-semibold tracking-tight text-slate-50">Know why a payout failed</h2>
                  <p className="text-xs leading-relaxed text-slate-400">
                    See provider, bank, and settlement signals in one timeline before customers escalate and finance starts guessing.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400">
                      <Glyph name="play" className="h-5 w-5" />
                    </button>
                    <div className="text-xs">
                      <p className="font-medium text-slate-200">Review now</p>
                      <p className="text-slate-500">Updated 18 seconds ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 transition hover:bg-slate-700"><Glyph name="chart" className="h-4 w-4" /></button>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 transition hover:bg-slate-700"><Glyph name="pie" className="h-4 w-4" /></button>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 transition hover:bg-slate-700"><Glyph name="grid" className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-slate-800/70 pt-4 text-[11px] text-slate-400">
                  <div>
                    <p className="uppercase tracking-[0.22em] font-medium">Focus</p>
                    <p className="mt-1 font-medium text-slate-50">PSPs</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.22em] font-medium">Window</p>
                    <p className="mt-1 font-medium text-slate-50">24h</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.22em] font-medium">Priority</p>
                    <p className="mt-1 font-medium text-slate-50">High</p>
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal className="flex w-full flex-col gap-8 md:col-span-6">
            <section className="relative w-full overflow-hidden rounded-[1.5rem] bg-slate-900 shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 rounded-[1.5rem] border border-white/10" style={{ maskImage: 'linear-gradient(135deg, white, transparent 60%)' }} />
              <div className="absolute inset-0 rounded-[1.5rem] border border-white/5" style={{ maskImage: 'linear-gradient(135deg, transparent 60%, white)' }} />
              <div className="pointer-events-none absolute -inset-px rounded-[1.5rem] bg-[radial-gradient(80%_60%_at_50%_0%,rgba(99,102,241,0.15),transparent_60%)]" />

              <div className="relative z-10 flex h-full flex-col p-6 pb-7">
                <div className="mb-2 flex items-start justify-between">
                  <div className="w-3/4">
                    <h1 className="font-sans text-[26px] font-medium leading-tight tracking-tight text-white">Pending exposure</h1>
                    <p className="mt-1 text-sm font-light text-slate-400">Amounts waiting for finality</p>
                  </div>
                  <div className="w-1/4 text-right">
                    <div className="font-mono text-[20px] font-semibold tracking-tight text-white">RISK</div>
                    <div className="mt-1 flex items-center justify-end gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
                      <span className="font-sans text-xs font-medium tracking-wider text-amber-400">WATCHING</span>
                    </div>
                  </div>
                </div>

                <div className="relative mx-auto mb-5 mt-3 w-full">
                  <div className="absolute inset-0 translate-y-2 scale-[0.98] rounded-xl bg-slate-950/80 blur-[0.3px] ring-1 ring-white/5" />
                  <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,8,23,0.95))] ring-1 ring-white/10 shadow-inner">
                    <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/60 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <div className="flex items-center gap-1.5 rounded-md border border-white/5 bg-slate-800/40 px-2.5 py-1 text-[11px] text-slate-300">
                        <Glyph name="wallet" className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="font-mono text-slate-300/80">risk.ts</span>
                      </div>
                    </div>
                    <div className="relative h-32 px-4 py-4">
                      <div className="mb-3 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span className="font-semibold text-indigo-400">Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                      </div>
                      <div className="grid h-20 grid-cols-7 gap-2 items-end">
                        {[26, 32, 45, 68, 74, 80, 92].map((height, idx) => (
                          <div key={idx} className={`rounded-t-full ${idx === 3 ? 'bg-indigo-600 shadow-md shadow-indigo-600/30 border-t border-indigo-400' : idx > 3 ? 'bg-indigo-100' : 'bg-slate-100'}`} style={{ height: `${height}%` }} />
                        ))}
                      </div>
                      <div className="absolute left-[54%] top-[46px] text-[10px] font-bold text-indigo-400">₹14L</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100/10 pt-4">
                  <div className="max-w-[140px] flex-1">
                    <p className="mb-1.5 text-[11px] text-slate-500">Current window</p>
                    <button className="flex w-full items-center justify-between rounded-xl border border-slate-200/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10">
                      <span>Today</span>
                      <Glyph name="chevron-down" className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="mb-0.5 text-[11px] text-slate-500">Recovered vs last week</p>
                    <p className="text-2xl font-semibold tracking-tight text-white">28%</p>
                  </div>
                </div>
              </div>
            </section>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function FeatureCards() {
  return (
    <section className="relative z-10 bg-white py-24">
      <div className="mx-auto max-w-[1080px] px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {featureCards.map((item, idx) => (
            <Reveal key={item.title} className="h-full" >
              <div className="group relative h-full rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-600/5">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-indigo-600 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                  <Glyph name={item.icon} className="h-7 w-7" />
                </div>
                <h4 className="mb-3 text-xl font-normal text-slate-800">{item.title}</h4>
                <p className="mb-6 font-light leading-relaxed text-slate-500">{item.desc}</p>
                <a href="#" className="group/link inline-flex items-center font-light text-indigo-600">
                  {item.cta}
                  <Glyph name="arrow-right" className="ml-1 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function DarkStats() {
  const stats = [
    ['14M+', 'Payout events tracked each month'],
    ['99.95%', 'Signal availability across workflows'],
    ['6+', 'Providers and rails monitored together'],
    ['100%', 'Proof packs for confirmed payouts'],
  ]

  return (
    <section
      className="relative overflow-hidden bg-slate-900 py-32 text-white"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 90%, 0 100%)' }}
    >
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-full max-w-4xl -translate-x-1/2 rounded-full bg-indigo-600/30 blur-[100px] mix-blend-screen" />

      <div className="relative z-10 mx-auto max-w-[1080px] px-6 text-center">
        <Reveal>
          <h2 className="mx-auto mb-20 max-w-2xl text-4xl font-normal leading-tight tracking-tight md:text-5xl">
            Built for high-volume payouts without the usual blind spots
          </h2>
        </Reveal>

        <div className="grid gap-8 divide-y divide-white/10 md:grid-cols-4 md:gap-4 md:divide-x md:divide-y-0">
          {stats.map(([value, label]) => (
            <Reveal key={label} className="px-4 pt-8 md:pt-0">
              <div className="mb-2 text-4xl font-light tracking-[-0.02em] [font-variant-numeric:tabular-nums] lg:text-5xl">{value}</div>
              <div className="font-light text-slate-300">{label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function SolutionsExplainer() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-[1080px] px-6">
        <div className="flex flex-col items-start gap-16 lg:flex-row">
          <Reveal className="w-full lg:sticky lg:top-32 lg:w-5/12">
            <h2 className="mb-3 text-sm font-normal uppercase tracking-wide text-indigo-600">Easy to integrate</h2>
            <h3 className="mb-6 text-3xl font-normal leading-tight tracking-tight text-slate-800 md:text-4xl">
              Connect Zord and start sending payouts with better control
            </h3>
            <p className="mb-8 text-lg font-light text-slate-500">
              Keep the business messaging simple on the surface, and still give engineering teams the docs and APIs they need when it is time to go deeper.
            </p>
            <a href="#" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-[15px] font-light text-white shadow-sm transition-all hover:bg-indigo-700">
              Read the docs
              <Glyph name="arrow-right" className="h-4 w-4" />
            </a>
          </Reveal>

          <Reveal className="w-full lg:w-7/12">
            <div className="space-y-4">
              {explainerTabs.map((tab, idx) => (
                <div
                  key={tab.title}
                  className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                    activeTab === idx ? 'border-indigo-600 bg-white shadow-lg shadow-indigo-600/10' : 'cursor-pointer border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab(idx)}
                >
                  <div className="flex items-center justify-between p-6">
                    <h4 className={`text-lg font-normal ${activeTab === idx ? 'text-indigo-600' : 'text-slate-800'}`}>{tab.title}</h4>
                    {activeTab === idx ? (
                      <Glyph name="minus" className="h-6 w-6 text-indigo-600" />
                    ) : (
                      <Glyph name="plus" className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  {activeTab === idx && (
                    <div className="px-6 pb-6 font-light text-slate-500">
                      <p className="mb-6">{tab.content}</p>
                      <div className="overflow-x-auto rounded-xl bg-[#0a2540] p-4 font-mono text-sm font-light text-gray-300 shadow-inner">
                        <div className="mb-3 flex gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500" />
                          <div className="h-3 w-3 rounded-full bg-yellow-500" />
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                        </div>
                        <code>
                          {tab.code.map((line) => (
                            <div key={line}>{line}</div>
                          ))}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#050B14] pb-10 pt-20">
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-full max-w-7xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(67,56,202,0.16),transparent_60%)] opacity-50" />

      <div className="relative z-10 mx-auto max-w-[1080px] px-6">
        <Reveal>
          <div className="relative mb-16 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-purple-500/10 p-8 shadow-2xl shadow-indigo-500/5 md:p-12">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-[80px]" />
            <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
              <h2 className="flex items-center gap-4 text-3xl font-light tracking-tight text-white md:text-4xl lg:text-5xl">
                Take control of your payouts
                <div className="rounded-full bg-amber-400/15 p-3 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                  <Glyph name="wallet" className="h-8 w-8" />
                </div>
              </h2>
              <a
                href="mailto:hello@arelais.com?subject=Book%20Demo%20for%20Zord"
                className="inline-flex h-12 shrink-0 items-center rounded-full bg-gradient-to-bl from-amber-200 via-amber-400 to-amber-500 px-8 text-[14px] font-medium text-slate-900 transition-all hover:-translate-y-0.5 hover:brightness-110"
              >
                Book Demo
              </a>
            </div>
          </div>
        </Reveal>

        <div className="mb-16 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex flex-col gap-12">
          <div className="grid grid-cols-1 gap-8 text-sm md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4 lg:pr-8">
              <Link href="/final-landing/page" className="mb-6 inline-flex">
                <ZordLogo size="md" variant="dark" />
              </Link>
              <p className="mb-8 max-w-sm text-sm font-light leading-relaxed text-slate-400">
                Zord by Arelais helps businesses send payouts reliably, track every transaction, and stay audit-ready when money movement gets messy.
              </p>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs tracking-tight text-slate-400">
                <p className="font-medium text-slate-200">Zord by Arelais</p>
                <p>Bengaluru / Remote-first</p>
                <p>Built for finance, operations, and engineering teams.</p>
                <a href="mailto:hello@arelais.com" className="mt-1 inline-block text-indigo-400 transition-colors hover:text-indigo-300">hello@arelais.com</a>
              </div>
            </div>

            {Object.entries(footerColumns).map(([title, links]) => (
              <div key={title} className="lg:col-span-2">
                <h4 className="mb-6 text-sm font-medium tracking-wide text-indigo-300">{title}</h4>
                <ul className="space-y-3.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="font-light text-slate-400 transition-colors hover:text-white">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="lg:col-span-2">
              <h4 className="mb-6 text-sm font-medium tracking-wide text-indigo-300">Security</h4>
              <ul className="space-y-3.5">
                {['Audit Trails', 'Access Controls', 'Evidence Packs', 'System Status'].map((link) => (
                  <li key={link}>
                    <a href="#" className="font-light text-slate-400 transition-colors hover:text-white">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs sm:flex-row">
            <p className="font-light text-slate-500">© 2026 Arelais. All rights reserved.</p>
            <div className="flex items-center gap-4 sm:gap-6">
              <a href="#" className="font-light text-slate-500 transition-colors hover:text-slate-300">Privacy Policy</a>
              <span className="hidden text-slate-700 sm:inline">/</span>
              <a href="#" className="font-light text-slate-500 transition-colors hover:text-slate-300">Terms & Conditions</a>
              <span className="hidden text-slate-700 sm:inline">/</span>
              <a href="#" className="font-light text-slate-500 transition-colors hover:text-slate-300">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPageFinalClient() {
  return (
    <div
      className="min-h-screen bg-[#050B14] font-sans selection:bg-indigo-500 selection:text-white"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <Navbar />
      <main>
        <Hero />
        <LogoStripSection />
        <ProductMontage />
        <FeatureCards />
        <DarkStats />
        <SolutionsExplainer />
      </main>
      <Footer />
    </div>
  )
}
