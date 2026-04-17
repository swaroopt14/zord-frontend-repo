'use client'

import { type CSSProperties, ReactNode, useState } from 'react'
import Image from 'next/image'
import { DashboardLayout, TopMetricsToolbar } from '@/components/fintech-dashboard'
import { motion } from 'framer-motion'


const FONT_MONO = "'IBM Plex Mono', monospace"
const PAGE_BG = '#F0F2F5'
const PAGE_TEXT = '#1C1F2E'
const PAGE_MUTED = '#5A6070'
const ELEM_PRIMARY = '#1C1F2E'
const ELEM_ACCENT = '#6366F1'
const TEXT_ON_STRONG = '#F0F2F5'
const STRONG_MUTED = 'rgba(240,242,245,0.72)'
const STRONG_SUBTLE = 'rgba(240,242,245,0.58)'
const NEO_BASE = '#1C1F2E'
const NEO_LIGHT = '#2A2F45'
const NEO_DARK = '#141725'
const NEO_INSET_LIGHT = 'rgba(255,255,255,0.09)'
const NEO_INSET_DARK = 'rgba(20,22,38,0.28)'
const NEO_CREAM = '#21253A'
const NEO_TEXT = '#F0F2F5'
const NEO_MUTED = STRONG_MUTED
const NEO_ACTIVE = ELEM_ACCENT
const NEO_CARD_SHADOW =
  '0 8px 24px rgba(20,22,38,0.28), 0 2px 6px rgba(20,22,38,0.18), inset 0 0.5px 0 rgba(255,255,255,0.09)'
const NEO_TRACK_SHADOW =
  'inset 7px 7px 14px rgba(20,22,38,0.34), inset -5px -5px 10px rgba(255,255,255,0.04)'
const NEO_RAISED_SHADOW =
  '0 8px 24px rgba(20,22,38,0.24), 0 2px 6px rgba(20,22,38,0.14), inset 0 0.5px 0 rgba(255,255,255,0.09)'
const NEO_INSET_SHADOW =
  'inset 7px 7px 14px rgba(20,22,38,0.34), inset -5px -5px 10px rgba(255,255,255,0.04)'
const ELEM_DROP_SHADOW =
  '0 8px 24px rgba(20,22,38,0.28), 0 2px 6px rgba(20,22,38,0.18), inset 0 0.5px 0 rgba(255,255,255,0.09)'
const ELEM_BEVEL_SHADOW =
  'inset 0 0.5px 0 rgba(255,255,255,0.09), inset -4px -4px 12px rgba(0,0,0,0.18)'
const STRONG_CARD_SHADOW = `${ELEM_DROP_SHADOW}, ${ELEM_BEVEL_SHADOW}`
const STRONG_RAISED_SHADOW =
  '0 10px 26px rgba(20,22,38,0.26), inset 0 0.5px 0 rgba(255,255,255,0.10), inset -3px -3px 8px rgba(0,0,0,0.16)'
const NEO_DARK_ACTIVE_SHADOW =
  '0 12px 28px rgba(99,102,241,0.22), inset 0 1px 0 rgba(255,255,255,0.14)'
const CORE_PAGE_BG = '#F0F2F5'
const CORE_PAGE_SPOTS =
  'radial-gradient(circle at 18% 10%, rgba(255,255,255,0.80), transparent 28%), radial-gradient(circle at 78% 8%, rgba(206,211,222,0.34), transparent 32%), radial-gradient(circle at 82% 72%, rgba(227,230,236,0.42), transparent 28%)'
const CLAY_BG = '#1C1F2E'
const CLAY_SAGE = '#21253A'
const CLAY_CREAM = '#21253A'
const CLAY_TEXT = '#F0F2F5'
const CLAY_PURPLE = '#1C1F2E'
const CLAY_PINK = '#21253A'
const SWITCHBOARD_TEXT = '#F0F2F5'
const CLAY_TROUGH_SHADOW =
  'inset 7px 7px 14px rgba(20,22,38,0.34), inset -5px -5px 10px rgba(255,255,255,0.04)'
const CLAY_BUTTON_SHADOW =
  '0 8px 24px rgba(20,22,38,0.24), 0 2px 6px rgba(20,22,38,0.14), inset 0 0.5px 0 rgba(255,255,255,0.09)'
const CLAY_TAB_ACTIVE_SHADOW =
  '0 10px 26px rgba(20,22,38,0.22), inset 0 0.5px 0 rgba(255,255,255,0.16), inset -3px -3px 8px rgba(0,0,0,0.16)'
const CLAY_CARD_DARK_SHADOW =
  '0 8px 24px rgba(20,22,38,0.28), 0 2px 6px rgba(20,22,38,0.18), inset 0 0.5px 0 rgba(255,255,255,0.09)'
const CLAY_CARD_LIGHT_SHADOW =
  '0 8px 24px rgba(20,22,38,0.28), 0 2px 6px rgba(20,22,38,0.18), inset 0 0.5px 0 rgba(255,255,255,0.09)'
const CLAY_NOTE_SHADOW =
  '0 8px 24px rgba(20,22,38,0.24), 0 2px 6px rgba(20,22,38,0.14), inset 0 0.5px 0 rgba(255,255,255,0.09)'
const FONT_DISPLAY = '"Sora", "Plus Jakarta Sans", "DM Sans", "Inter", sans-serif'
const PREMIUM_SURFACE = 'linear-gradient(180deg, rgba(33,37,58,0.98) 0%, rgba(28,31,46,0.98) 100%)'
const PREMIUM_SURFACE_RAISED =
  'linear-gradient(180deg, rgba(39,44,68,0.98) 0%, rgba(28,31,46,0.98) 100%)'
const PREMIUM_BORDER = 'rgba(255,255,255,0.07)'
const PREMIUM_BORDER_STRONG = 'rgba(255,255,255,0.12)'
const PREMIUM_SHADOW =
  '0 22px 52px rgba(20,22,38,0.30), 0 2px 8px rgba(20,22,38,0.22), inset 0 0.5px 0 rgba(255,255,255,0.10)'
const PREMIUM_INSET =
  'inset 8px 8px 18px rgba(20,22,38,0.32), inset -5px -5px 12px rgba(255,255,255,0.035)'

function statusSurface(tone: string) {
  if (tone === 'emerald') {
    return {
      label: '#86EFAC',
      dot: '#22C55E',
      border: 'rgba(34,197,94,0.30)',
      background: 'linear-gradient(180deg, rgba(34,197,94,0.11) 0%, rgba(33,37,58,0.98) 100%)',
      chipBackground: 'rgba(34,197,94,0.12)',
      chipColor: '#BBF7D0',
      glow: 'rgba(34,197,94,0.15)',
    }
  }
  if (tone === 'amber') {
    return {
      label: '#FDE68A',
      dot: '#EAB308',
      border: 'rgba(234,179,8,0.30)',
      background: 'linear-gradient(180deg, rgba(234,179,8,0.12) 0%, rgba(33,37,58,0.98) 100%)',
      chipBackground: 'rgba(234,179,8,0.12)',
      chipColor: '#FEF3C7',
      glow: 'rgba(234,179,8,0.15)',
    }
  }
  if (tone === 'rose') {
    return {
      label: '#FCA5A5',
      dot: '#EF4444',
      border: 'rgba(239,68,68,0.32)',
      background: 'linear-gradient(180deg, rgba(239,68,68,0.13) 0%, rgba(33,37,58,0.98) 100%)',
      chipBackground: 'rgba(239,68,68,0.12)',
      chipColor: '#FECACA',
      glow: 'rgba(239,68,68,0.16)',
    }
  }
  return {
    label: '#C7D2FE',
    dot: '#6366F1',
    border: 'rgba(99,102,241,0.26)',
    background: 'linear-gradient(180deg, rgba(99,102,241,0.10) 0%, rgba(33,37,58,0.98) 100%)',
    chipBackground: 'rgba(99,102,241,0.12)',
    chipColor: '#C7D2FE',
    glow: 'rgba(99,102,241,0.14)',
  }
}

type SectionTheme = {
  shellBackground: string
  shellBorder: string
  shellShadow: string
  accent: string
  accentSoft: string
  accentBorder: string
  panelBackground: string
  panelBorder: string
  panelShadow: string
  noteBackground: string
  noteBorder: string
  noteShadow: string
  titleColor?: string
  descriptionColor?: string
  metaColor?: string
}

const SECTION_THEMES = {
  switchboard: {
    shellBackground: 'linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)',
    shellBorder: 'rgba(255,255,255,0.07)',
    shellShadow: CLAY_CARD_LIGHT_SHADOW,
    accent: SWITCHBOARD_TEXT,
    accentSoft: 'rgba(240,242,245,0.06)',
    accentBorder: 'rgba(255,255,255,0.08)',
    panelBackground: 'linear-gradient(180deg, #252A41 0%, #1C1F2E 100%)',
    panelBorder: 'rgba(255,255,255,0.07)',
    panelShadow: CLAY_BUTTON_SHADOW,
    noteBackground: 'linear-gradient(180deg, #24293F 0%, #1C1F2E 100%)',
    noteBorder: 'rgba(255,255,255,0.07)',
    noteShadow: CLAY_NOTE_SHADOW,
    titleColor: SWITCHBOARD_TEXT,
    descriptionColor: 'rgba(240,242,245,0.76)',
    metaColor: SWITCHBOARD_TEXT,
  },
  alerts: {
    shellBackground: 'linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)',
    shellBorder: 'rgba(255,255,255,0.07)',
    shellShadow: CLAY_CARD_LIGHT_SHADOW,
    accent: '#EAB308',
    accentSoft: 'rgba(234,179,8,0.12)',
    accentBorder: 'rgba(234,179,8,0.18)',
    panelBackground: 'linear-gradient(180deg, #252A41 0%, #1C1F2E 100%)',
    panelBorder: 'rgba(255,255,255,0.07)',
    panelShadow: CLAY_BUTTON_SHADOW,
    noteBackground: 'linear-gradient(180deg, #24293F 0%, #1C1F2E 100%)',
    noteBorder: 'rgba(255,255,255,0.07)',
    noteShadow: CLAY_NOTE_SHADOW,
    titleColor: '#F0F2F5',
    descriptionColor: 'rgba(240,242,245,0.76)',
    metaColor: '#F0F2F5',
  },
  flow: {
    shellBackground: 'linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)',
    shellBorder: 'rgba(255,255,255,0.07)',
    shellShadow: CLAY_CARD_LIGHT_SHADOW,
    accent: '#6366F1',
    accentSoft: 'rgba(99,102,241,0.13)',
    accentBorder: 'rgba(99,102,241,0.20)',
    panelBackground: 'linear-gradient(180deg, #252A41 0%, #1C1F2E 100%)',
    panelBorder: 'rgba(255,255,255,0.07)',
    panelShadow: CLAY_BUTTON_SHADOW,
    noteBackground: 'linear-gradient(180deg, #24293F 0%, #1C1F2E 100%)',
    noteBorder: 'rgba(255,255,255,0.07)',
    noteShadow: CLAY_NOTE_SHADOW,
    titleColor: '#F0F2F5',
    descriptionColor: 'rgba(240,242,245,0.76)',
    metaColor: '#F0F2F5',
  },
  risk: {
    shellBackground: 'linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)',
    shellBorder: 'rgba(255,255,255,0.07)',
    shellShadow: CLAY_CARD_LIGHT_SHADOW,
    accent: '#EF4444',
    accentSoft: 'rgba(239,68,68,0.12)',
    accentBorder: 'rgba(239,68,68,0.18)',
    panelBackground: 'linear-gradient(180deg, #252A41 0%, #1C1F2E 100%)',
    panelBorder: 'rgba(255,255,255,0.07)',
    panelShadow: CLAY_BUTTON_SHADOW,
    noteBackground: 'linear-gradient(180deg, #24293F 0%, #1C1F2E 100%)',
    noteBorder: 'rgba(255,255,255,0.07)',
    noteShadow: CLAY_NOTE_SHADOW,
    titleColor: '#F0F2F5',
    descriptionColor: 'rgba(240,242,245,0.76)',
    metaColor: '#F0F2F5',
  },
  realtime: {
    shellBackground: 'linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)',
    shellBorder: 'rgba(255,255,255,0.07)',
    shellShadow: CLAY_CARD_LIGHT_SHADOW,
    accent: '#22C55E',
    accentSoft: 'rgba(34,197,94,0.12)',
    accentBorder: 'rgba(34,197,94,0.18)',
    panelBackground: 'linear-gradient(180deg, #252A41 0%, #1C1F2E 100%)',
    panelBorder: 'rgba(255,255,255,0.07)',
    panelShadow: CLAY_BUTTON_SHADOW,
    noteBackground: 'linear-gradient(180deg, #24293F 0%, #1C1F2E 100%)',
    noteBorder: 'rgba(255,255,255,0.07)',
    noteShadow: CLAY_NOTE_SHADOW,
    titleColor: '#F0F2F5',
    descriptionColor: 'rgba(240,242,245,0.76)',
    metaColor: '#F0F2F5',
  },
  exports: {
    shellBackground: 'linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)',
    shellBorder: 'rgba(255,255,255,0.07)',
    shellShadow: CLAY_CARD_LIGHT_SHADOW,
    accent: '#6366F1',
    accentSoft: 'rgba(99,102,241,0.13)',
    accentBorder: 'rgba(99,102,241,0.20)',
    panelBackground: 'linear-gradient(180deg, #252A41 0%, #1C1F2E 100%)',
    panelBorder: 'rgba(255,255,255,0.07)',
    panelShadow: CLAY_BUTTON_SHADOW,
    noteBackground: 'linear-gradient(180deg, #24293F 0%, #1C1F2E 100%)',
    noteBorder: 'rgba(255,255,255,0.07)',
    noteShadow: CLAY_NOTE_SHADOW,
    titleColor: '#F0F2F5',
    descriptionColor: 'rgba(240,242,245,0.76)',
    metaColor: '#F0F2F5',
  },
} as const

const TAB_CONFIG: Record<
  string,
  {
    title: string
    subtitle: string
    eyebrow: string
  }
> = {
  'Command Center': {
    title: 'Command Center',
    subtitle: 'Execution health, money exposure, and trust signals in one operating layer',
    eyebrow: 'Execution Layer',
  },
  'Payout Intelligence': {
    title: 'Payout Intelligence',
    subtitle: 'Provider performance, payout risk, and release speed before money slips',
    eyebrow: 'Risk Layer',
  },
  'Reconciliation Intelligence': {
    title: 'Reconciliation Intelligence',
    subtitle: 'Trust restoration, variance containment, and close-ready payout evidence',
    eyebrow: 'Trust Layer',
  },
}

const COMMAND_CENTER_KPI_ITEMS = [
  {
    label: 'Execution Health',
    lens: 'Execution',
    value: '98.88%',
    sub: '14,712 payouts confirmed cleanly out of 14,879 intents',
    trend: 'Healthy execution with failure load contained below 1.2%',
    note: 'Answers: is the payout engine working right now?',
    accent: 'text-[#5A5D68]',
  },
  {
    label: 'Money at Risk',
    lens: 'Risk',
    value: '₹1.04 Cr',
    sub: 'Pending finality plus failed / reversed value still under watch',
    trend: 'Biggest exposure sits in delayed statements and SLA-breach cohorts',
    note: 'Answers: where can the customer still lose money?',
    accent: 'text-[#F0F2F5]',
  },
  {
    label: 'Outcome Trust',
    lens: 'Trust',
    value: '91.8%',
    sub: 'Webhook, poll, and settlement evidence aligned for close-ready payouts',
    trend: 'Audit posture is strong, but statement lag still lowers full confidence',
    note: 'Answers: can finance defend the payout outcome with evidence?',
    accent: 'text-[#5A5D68]',
  },
  {
    label: 'Leakage Prevented',
    lens: 'Risk',
    value: '₹7.52 L',
    sub: 'Recovered this cycle through routing changes and recon automation',
    trend: 'Savings are coming from avoided retries, variance catch, and faster proof',
    note: 'Answers: how much money did operations protect this cycle?',
    accent: 'text-[#5A5D68]',
  },
] as const

const PAYOUT_KPI_ITEMS = [
  {
    label: 'Payout Success Rate',
    lens: 'Execution',
    value: '98.88%',
    sub: '14,712 confirmed of 14,879',
    trend: '↑ +0.24% WoW',
    note: 'Execution health: confirms routed payout volume is landing without churn.',
    accent: 'text-[#5A5D68]',
  },
  {
    label: 'Total Confirmed',
    lens: 'Execution',
    value: '₹18.03 Cr',
    sub: '14,712 intents · this cycle',
    trend: '↑ +12% vs last week',
    note: 'Outcome landed: value already delivered and no longer sitting in risk queues.',
    accent: 'text-[#5A5D68]',
  },
  {
    label: 'Pending Finality',
    lens: 'Risk',
    value: '₹76.5 L',
    sub: '51 intents — SFTP awaited',
    trend: '→ 6 approaching SLA',
    note: 'Money risk: capital still blocked until UTR and bank evidence are confirmed.',
    accent: 'text-[#5A5D68]',
  },
  {
    label: 'Failed + Reversed',
    lens: 'Risk',
    value: '₹28 L',
    sub: '27 conflict · 89 SLA breach',
    trend: '↓ Better than last week',
    note: 'Loss prevention: unresolved failures become write-off or support cost if ignored.',
    accent: 'text-[#F0F2F5]',
  },
] as const

const PAYOUT_TREND_DATA = [
  { day: 'Mon', success: 98.2, failures: 84 },
  { day: 'Tue', success: 98.4, failures: 63 },
  { day: 'Wed', success: 98.1, failures: 91 },
  { day: 'Thu', success: 98.6, failures: 58 },
  { day: 'Fri', success: 98.9, failures: 43 },
  { day: 'Sat', success: 98.7, failures: 52 },
  { day: 'Today', success: 98.88, failures: 41 },
]

const VELOCITY_BINS = [
  { label: '0-1m', count: 8821, tone: 'bg-[#6B6E7A]' },
  { label: '1-5m', count: 2341, tone: 'bg-[#38BDF8]' },
  { label: '5-15m', count: 892, tone: 'bg-[#7DD3FC]' },
  { label: '15-30m', count: 421, tone: 'bg-[#A8AFBF]' },
  { label: '30-60m', count: 204, tone: 'bg-[#A8AFBF]' },
  { label: '>60m', count: 201, tone: 'bg-[#A8AFBF]' },
]

const PSP_ROWS = [
  { name: 'Razorpay', success: '99.1%', latency: '210ms', fee: '120', webhook: '99.6%', severity: 'Low', tone: 'emerald' },
  { name: 'Cashfree', success: '98.4%', latency: '340ms', fee: '140', webhook: '98.8%', severity: 'Medium', tone: 'amber' },
  { name: 'PayU', success: '91.6%', latency: '4.2s', fee: '180', webhook: '93.2%', severity: 'Critical', tone: 'rose' },
  { name: 'Stripe', success: '99.4%', latency: '180ms', fee: '90', webhook: '99.8%', severity: 'Low', tone: 'emerald' },
] as const

const BANK_FAILURE_ROWS = [
  { bank: 'ICICI Bank', total: '3,241', failed: '84', concentration: '2.59%', trend: '+12% WoW', dir: 'up', logo: '/sources/icici.png' },
  { bank: 'SBI', total: '2,891', failed: '41', concentration: '1.42%', trend: '-6% WoW', dir: 'down', logo: '/sources/sbi-.png' },
  { bank: 'HDFC Bank', total: '2,104', failed: '18', concentration: '0.86%', trend: '-9% WoW', dir: 'down', logo: '/sources/hdfc-bank-clean.png' },
  { bank: 'Axis Bank', total: '1,844', failed: '24', concentration: '1.30%', trend: '+4% WoW', dir: 'up', logo: '/sources/axis.png' },
  { bank: 'Kotak', total: '1,221', failed: '8', concentration: '0.66%', trend: '-3% WoW', dir: 'down', logo: '/sources/kotak.png' },
] as const

const IFSC_ROWS = [
  { ifsc: 'ICIC0000321', bank: 'ICICI Bank', failures: '18', reason: 'GATEWAY_TIMEOUT' },
  { ifsc: 'SBIN0000456', bank: 'SBI', failures: '14', reason: 'INVALID_IFSC' },
  { ifsc: 'HDFC0001021', bank: 'HDFC Bank', failures: '11', reason: 'NSF' },
  { ifsc: 'UTIB0002130', bank: 'Axis Bank', failures: '9', reason: 'INVALID_BENEFICIARY' },
  { ifsc: 'KKBK0000877', bank: 'Kotak', failures: '7', reason: 'RAIL_UNAVAILABLE' },
] as const

const RECON_ROWS = [
  { state: 'Confirmed and safe', value: 14021, pct: 95, tone: 'bg-[#6B6E7A]' },
  { state: 'Awaiting statement proof', value: 421, pct: 34, tone: 'bg-[#7DD3FC]' },
  { state: 'Partially settled', value: 192, pct: 18, tone: 'bg-[#A8AFBF]' },
  { state: 'Amount unverified', value: 78, pct: 8, tone: 'bg-[#A8AFBF]' },
] as const

const SELLER_ROWS = [
  { seller: 'SEL-0042', intent: 'INT-PY-88214', status: 'CONFIRMED', amount: '₹47,500', utr: 'ICICI2024...', eta: '08:14' },
  { seller: 'SEL-0117', intent: 'INT-PY-88229', status: 'PROVISIONAL', amount: '₹2,34,000', utr: 'awaited', eta: '—' },
  { seller: 'SEL-0289', intent: 'INT-PY-88244', status: 'FAILED', amount: '₹8,750', utr: '—', eta: 'SLA breach' },
  { seller: 'SEL-0391', intent: 'INT-PY-88271', status: 'CONFIRMED', amount: '₹1,18,000', utr: 'HDFC8821...', eta: '06:42' },
  { seller: 'SEL-0454', intent: 'INT-PY-88286', status: 'DISPATCHED', amount: '₹55,200', utr: 'in-flight', eta: '22m elapsed' },
] as const

const RECON_KPI_ITEMS = [
  {
    label: 'Outcome Trust Score',
    lens: 'Trust',
    value: '96.42%',
    sub: '14,354 payout intents now defensible for finance close',
    trend: '↑ +1.10% vs prior window',
    note: 'Trust layer: how much of the payout book is backed by reconciled evidence.',
    accent: 'text-[#5A5D68]',
  },
  {
    label: 'Evidence Coverage',
    lens: 'Trust',
    value: '91.80%',
    sub: 'Webhook, poll, and statement aligned',
    trend: '↑ +0.70% coverage lift',
    note: 'Trust layer: strongest defence against audit challenge and dispute re-open.',
    accent: 'text-[#5A5D68]',
  },
  {
    label: 'Time to Provisional',
    lens: 'Execution',
    value: '2.84m',
    sub: 'Initial confidence from available signals',
    trend: '↓ Faster by 0.4m',
    note: 'Execution layer: early confidence reduces ops drag before final proof arrives.',
    accent: 'text-[#5A5D68]',
  },
  {
    label: 'Variance at Risk',
    lens: 'Risk',
    value: '₹11.9 K',
    sub: 'Cross-period and settlement-gap value still needing explanation',
    trend: '→ Stable within SLA',
    note: 'Risk layer: small variances compound into leakage and close-delay if not contained.',
    accent: 'text-[#F0F2F5]',
  },
] as const

const RECON_RECOVERY_PLAYS = [
  {
    title: 'Statement lag recovery',
    amount: '₹4.8 L',
    subtitle: '12 intents recovered once statement evidence landed',
    impact: '+31 closures',
    tone: 'blue',
  },
  {
    title: 'Duplicate failure suppression',
    amount: '₹1.9 L',
    subtitle: 'Prevented false manual escalation on repeated PSP callbacks',
    impact: '-18 reviews',
    tone: 'slate',
  },
  {
    title: 'Cross-period variance catch',
    amount: '₹82 K',
    subtitle: 'Flagged period-shifted settlements before finance close',
    impact: '2 finance saves',
    tone: 'amber',
  },
] as const

const CONFIDENCE_BINS = [
  { label: '0.0-0.2', count: 44 },
  { label: '0.2-0.4', count: 89 },
  { label: '0.4-0.6', count: 182 },
  { label: '0.6-0.8', count: 641 },
  { label: '0.8-1.0', count: 1388 },
] as const

const OPEN_RECON_ITEMS = [
  { intent: 'INT-RC-88210', amount: '₹2.44 L', missing: 'Statement', since: '18.2m' },
  { intent: 'INT-RC-88211', amount: '₹88.4 K', missing: 'Webhook + Statement', since: '24.8m' },
  { intent: 'INT-RC-88214', amount: '₹4.08 L', missing: 'Statement', since: '31.1m' },
  { intent: 'INT-RC-88218', amount: '₹51.2 K', missing: 'Poll', since: '39.7m' },
  { intent: 'INT-RC-88222', amount: '₹1.26 L', missing: 'Statement', since: '47.3m' },
] as const

const CLOSURE_BY_HOUR = [
  { bucket: '00:00', value: 118 },
  { bucket: '04:00', value: 96 },
  { bucket: '08:00', value: 143 },
  { bucket: '12:00', value: 182 },
  { bucket: '16:00', value: 168 },
  { bucket: '20:00', value: 149 },
] as const

const VARIANCE_ROWS = [
  { intent: 'INT-RC-77121', intended: '₹1.20 L', settled: '₹1.16 L', variance: '₹4.0 K', crossPeriod: 'No' },
  { intent: 'INT-RC-77144', intended: '₹84.0 K', settled: '₹79.6 K', variance: '₹4.4 K', crossPeriod: 'Yes' },
  { intent: 'INT-RC-77159', intended: '₹2.08 L', settled: '₹2.08 L', variance: '₹0', crossPeriod: 'No' },
  { intent: 'INT-RC-77193', intended: '₹66.4 K', settled: '₹62.9 K', variance: '₹3.5 K', crossPeriod: 'Yes' },
] as const

const AUTO_MANUAL_CLOSURE = [
  { name: 'Auto-close', pct: 78, color: '#6B6E7A' },
  { name: 'Manual-close', pct: 22, color: '#A8AFBF' },
] as const

const CROSS_PERIOD_FLAGS = [
  { intent: 'INT-XP-1002', variance: '₹12.4 K', status: 'Rolled to next cycle' },
  { intent: 'INT-XP-1008', variance: '₹8.2 K', status: 'Statement lag detected' },
  { intent: 'INT-XP-1014', variance: '₹5.1 K', status: 'Bank batch offset' },
] as const

const PSP_STATUS_PILLS = [
  { name: 'Razorpay', state: 'HEALTHY', metric: '1.9% errors · 210ms', tone: 'emerald' },
  { name: 'Cashfree', state: 'DEGRADED', metric: '5.6% errors · 340ms', tone: 'amber' },
  { name: 'PayU', state: 'CRITICAL', metric: '12.4% errors · 4.2s', tone: 'rose' },
  { name: 'Stripe', state: 'HEALTHY', metric: '1.1% errors · 180ms', tone: 'emerald' },
  { name: 'Bank API', state: 'UNKNOWN', metric: 'No signal in 3m', tone: 'slate' },
] as const

const RAIL_STATUS = [
  { rail: 'IMPS', status: 'Operational', note: 'Realtime confirmations healthy', tone: 'emerald' },
  { rail: 'NEFT', status: 'Batch Window', note: 'Next settlement file 14:30 IST', tone: 'blue' },
  { rail: 'RTGS', status: 'Watch', note: 'Cut-off 16:15 IST · monitor large tickets', tone: 'amber' },
] as const

const ALERT_FEED_ITEMS = [
  { title: 'PayU weekend degradation', detail: '19 seller payouts drifting beyond P95 on Sat–Sun traffic', severity: 'Critical', action: 'Route away from PayU' },
  { title: '6 pending finality intents near SLA', detail: '₹18.6 L still waiting for bank statement evidence', severity: 'High', action: 'Escalate statement chase' },
  { title: 'ICICI IFSC hotspot rising', detail: '84 failures linked to 3 branches and invalid beneficiary retries', severity: 'Medium', action: 'Fix beneficiary master' },
  { title: 'Parser lag on statement batch 14:00', detail: 'Latest SFTP file delayed by 18 minutes versus median', severity: 'Medium', action: 'Watch recon confidence' },
  { title: 'Evidence export queue growing', detail: '4 finance packs waiting for CFO review and send-out', severity: 'Low', action: 'Review export queue' },
] as const

const COMMAND_VOLUME_TREND = [
  { hour: '00', dispatched: 188, confirmed: 176 },
  { hour: '04', dispatched: 154, confirmed: 148 },
  { hour: '08', dispatched: 214, confirmed: 206 },
  { hour: '12', dispatched: 242, confirmed: 231 },
  { hour: '16', dispatched: 236, confirmed: 228 },
  { hour: '20', dispatched: 219, confirmed: 211 },
  { hour: '24', dispatched: 198, confirmed: 191 },
] as const

const MONEY_AT_RISK_BUCKETS = [
  { label: 'Pending finality', amount: '₹76.5 L', pct: 74, tone: 'bg-[#6A7392]' },
  { label: 'SLA breached', amount: '₹18.2 L', pct: 18, tone: 'bg-[#8B6A53]' },
  { label: 'Correlation ambiguous', amount: '₹6.8 L', pct: 5, tone: 'bg-[#98A2B3]' },
  { label: 'Reversed after success', amount: '₹2.5 L', pct: 3, tone: 'bg-[#5E6774]' },
] as const

const FAILURE_REASON_ROWS = [
  { code: 'GATEWAY_TIMEOUT', count: 64, share: '38%', tone: 'bg-[#6A7392]' },
  { code: 'INVALID_IFSC', count: 38, share: '22%', tone: 'bg-[#8B6A53]' },
  { code: 'INVALID_BENEFICIARY', count: 29, share: '17%', tone: 'bg-[#98A2B3]' },
  { code: 'NSF', count: 21, share: '12%', tone: 'bg-[#7B8594]' },
  { code: 'RAIL_UNAVAILABLE', count: 17, share: '11%', tone: 'bg-[#5E6774]' },
] as const

const LIVE_PAYMENT_STREAM = [
  { intent: 'INT-CC-88210', amount: '₹2.4 L', status: 'CONFIRMED', elapsed: '42s' },
  { intent: 'INT-CC-88211', amount: '₹88.4 K', status: 'DISPATCHED', elapsed: '3m 12s' },
  { intent: 'INT-CC-88214', amount: '₹4.1 L', status: 'PROVISIONAL', elapsed: '5m 41s' },
  { intent: 'INT-CC-88217', amount: '₹52.8 K', status: 'FAILED', elapsed: '7m 08s' },
  { intent: 'INT-CC-88219', amount: '₹1.2 L', status: 'CONFIRMED', elapsed: '31s' },
  { intent: 'INT-CC-88221', amount: '₹64.0 K', status: 'REVERSED', elapsed: '14m 03s' },
] as const

const EVIDENCE_EXPORTS = [
  { entity: 'Finance Ops', format: 'PDF Pack', time: '12:41' },
  { entity: 'Compliance', format: 'RBI_IS_2025', time: '11:58' },
  { entity: 'Seller Support', format: 'JSON', time: '10:16' },
  { entity: 'CFO Desk', format: 'PDF Pack', time: '09:42' },
  { entity: 'Audit Queue', format: 'ZIP Bundle', time: '08:55' },
] as const

const SETTLEMENT_COHORT_ROWS = [
  { week: 'W15', total: '14,879', success: '98.88%', failed: '0.78%', pending: '0.34%', confirmed: '₹18.03 Cr' },
  { week: 'W14', total: '13,921', success: '98.42%', failed: '0.95%', pending: '0.41%', confirmed: '₹16.8 Cr' },
  { week: 'W13', total: '14,102', success: '97.96%', failed: '1.18%', pending: '0.52%', confirmed: '₹17.1 Cr' },
  { week: 'W12', total: '12,441', success: '98.23%', failed: '1.01%', pending: '0.40%', confirmed: '₹15.2 Cr' },
] as const

const AMOUNT_BUCKET_ROWS = [
  { label: 'Under ₹1K', count: '3,421', success: '99.1%', pct: 62, tone: 'bg-[#6B6E7A]' },
  { label: '₹1K – ₹10K', count: '6,892', success: '98.8%', pct: 82, tone: 'bg-[#38BDF8]' },
  { label: '₹10K – ₹50K', count: '3,104', success: '97.2%', pct: 55, tone: 'bg-[#7DD3FC]' },
  { label: '₹50K – ₹1L', count: '892', success: '94.1%', pct: 28, tone: 'bg-[#A8AFBF]' },
  { label: 'Above ₹1L', count: '570', success: '91.4%', pct: 18, tone: 'bg-[#A8AFBF]' },
] as const

const SIGNAL_COVERAGE_MATRIX = [
  { block: '08:00–10:00', webhook: 'green', poll: 'green', statement: 'amber' },
  { block: '10:00–12:00', webhook: 'green', poll: 'green', statement: 'green' },
  { block: '12:00–14:00', webhook: 'green', poll: 'amber', statement: 'red' },
  { block: '14:00–16:00', webhook: 'green', poll: 'green', statement: 'amber' },
  { block: '16:00–18:00', webhook: 'green', poll: 'green', statement: 'green' },
] as const

const RECON_TIMELINE_EVENTS = [
  { label: 'Dispatch', time: '12:03:18', status: 'done' },
  { label: 'Webhook', time: '12:03:49', status: 'done' },
  { label: 'Poll', time: '12:04:07', status: 'done' },
  { label: 'Statement', time: '14:31:12', status: 'pending' },
  { label: 'Finality', time: 'awaited', status: 'pending' },
] as const

const UTR_CHECK_ROWS = [
  { intent: 'INT-RC-88210', webhook: 'UTR88421', poll: 'UTR88421', statement: 'UTR88421', status: 'Aligned' },
  { intent: 'INT-RC-88211', webhook: 'UTR88429', poll: 'UTR88429', statement: 'Awaited', status: 'Awaiting statement' },
  { intent: 'INT-RC-88214', webhook: 'UTR88441', poll: 'UTR88701', statement: 'UTR88701', status: 'Mismatch' },
  { intent: 'INT-RC-88218', webhook: 'Awaited', poll: 'UTR88711', statement: 'UTR88711', status: 'Poll only' },
] as const

const PARSER_HEALTH = {
  filename: 'HDFC_2026_03_25_1400.csv',
  received: '14:18 IST',
  lines: '24,182',
  parsed: '24,006',
  success: '99.27%',
}

function Card({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <section
      className={`rounded-[30px] ${className}`}
      style={{
        background: PREMIUM_SURFACE,
        border: `1px solid ${PREMIUM_BORDER}`,
        boxShadow: CLAY_CARD_LIGHT_SHADOW,
        ...style,
      }}
    >
      {children}
    </section>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  meta,
  theme,
}: {
  eyebrow: string
  title: string
  description: string
  meta?: ReactNode
  theme?: SectionTheme
}) {
  const eyebrowAccent = theme?.accent ?? NEO_ACTIVE
  const eyebrowBackground = theme?.accentSoft ?? 'rgba(156,167,151,0.16)'
  const eyebrowBorder = theme?.accentBorder ?? 'rgba(156,167,151,0.24)'
  const titleColor = theme?.titleColor ?? (theme ? CLAY_TEXT : NEO_TEXT)
  const descriptionColor = theme?.descriptionColor ?? (theme ? 'rgba(240,242,245,0.76)' : NEO_MUTED)

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]"
          style={{
            color: eyebrowAccent,
            background: eyebrowBackground,
            border: `1px solid ${eyebrowBorder}`,
            boxShadow: CLAY_BUTTON_SHADOW,
          }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: eyebrowAccent }} />
          {eyebrow}
        </div>
        <div className="mt-3 text-[26px] font-bold tracking-[-0.03em]" style={{ color: titleColor }}>
          {title}
        </div>
        <div className="mt-2 max-w-[720px] text-[17px] leading-7" style={{ color: descriptionColor }}>
          {description}
        </div>
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </div>
  )
}

function SectionMetaPill({
  children,
  theme,
}: {
  children: ReactNode
  theme: SectionTheme
}) {
  return (
    <div
      className="inline-flex min-h-[42px] items-center justify-center whitespace-nowrap rounded-[18px] px-4 py-2.5 text-[13px] font-semibold leading-none tracking-[0.01em]"
      style={{
        color: theme.metaColor ?? theme.accent,
        background: CLAY_CREAM,
        border: `1px solid ${theme.accentBorder}`,
        boxShadow: CLAY_BUTTON_SHADOW,
      }}
    >
      {children}
    </div>
  )
}

function LiquidGlassTabs<T extends string>({
  items,
  active,
  onChange,
}: {
  items: readonly { id: T; label: string }[]
  active: T
  onChange: (value: T) => void
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: SWITCHBOARD_TEXT }}>
        Operating View
      </div>
      <div
        className="relative isolate w-full max-w-[860px] overflow-hidden rounded-[30px] p-[10px]"
        style={{
          background: 'linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow:
            '0 8px 24px rgba(20,22,38,0.28), 0 2px 6px rgba(20,22,38,0.18), inset 7px 7px 14px rgba(20,22,38,0.34), inset -5px -5px 10px rgba(255,255,255,0.04)',
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3px] rounded-[27px]"
          style={{
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow:
              'inset 0 0.5px 0 rgba(255,255,255,0.08), inset -1px -1px 0 rgba(0,0,0,0.18)',
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[9px] rounded-[23px]"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.01) 40%, rgba(0,0,0,0.16) 100%)',
            boxShadow:
              'inset 2px 2px 5px rgba(20,22,38,0.22), inset -2px -2px 5px rgba(255,255,255,0.05)',
          }}
        />
        <div className="relative z-10 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {items.map((item) => {
            const isActive = item.id === active
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className="relative isolate flex min-h-[56px] w-full items-center justify-center overflow-hidden rounded-[20px] px-4 py-3 text-center text-[12px] font-black tracking-[0.12em] transition-all duration-300"
                style={{
                  color: isActive ? SWITCHBOARD_TEXT : 'rgba(17,17,17,0.72)',
                  textShadow: isActive
                    ? '0 1px 0 rgba(255,255,255,0.52)'
                    : '0 1px 0 rgba(255,255,255,0.20)',
                }}
              >
                {isActive ? (
                <motion.span
                  layoutId="core-liquid-glass-tab"
                  className="absolute inset-0 rounded-[20px]"
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  style={{
                      background: 'linear-gradient(180deg, #F0F2F5 0%, #DCE0E8 100%)',
                      border: '1px solid rgba(255,255,255,0.32)',
                      boxShadow:
                        '0 10px 26px rgba(20,22,38,0.24), inset 0 1px 0 rgba(255,255,255,0.74), inset -3px -3px 8px rgba(20,22,38,0.12)',
                    }}
                  >
                    <span
                      className="absolute inset-[4px] rounded-[16px]"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.14) 100%)',
                        boxShadow:
                          'inset 1px 1px 0 rgba(255,255,255,0.32), inset -2px -2px 5px rgba(20,22,38,0.08)',
                      }}
                    />
                  </motion.span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[20px]"
                    style={{
                      border: '1px solid rgba(255,255,255,0.10)',
                      boxShadow:
                        'inset 1px 1px 0 rgba(255,255,255,0.08), inset -1px -1px 0 rgba(100,105,122,0.10)',
                    }}
                  />
                )}
                <span className="relative z-10 leading-tight" style={{ color: isActive ? PAGE_TEXT : 'rgba(240,242,245,0.76)' }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function GlassSwitchTabs<T extends string>({
  items,
  active,
  onChange,
  compact = false,
  variant = 'default',
}: {
  items: readonly { id: T; label: string }[]
  active: T
  onChange: (value: T) => void
  compact?: boolean
  variant?: 'default' | 'plum'
}) {
  const isPlum = variant === 'plum'

  return (
    <div
      className={`inline-flex items-center ${
        compact ? 'gap-1 p-1 rounded-[18px]' : 'gap-1.5 p-1.5 rounded-[20px]'
      }`}
      style={{
        background: isPlum ? 'linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)' : CLAY_SAGE,
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: isPlum
          ? 'inset 7px 7px 14px rgba(20,22,38,0.34), inset -5px -5px 10px rgba(255,255,255,0.04)'
          : CLAY_TROUGH_SHADOW,
      }}
    >
      {items.map((item) => {
        const isActive = item.id === active
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`font-semibold tracking-[0.01em] transition-all duration-200 ${
              compact ? 'px-5 py-2 text-[13px] rounded-[15px]' : 'px-5 py-2.5 text-[13.5px] rounded-[16px]'
            }`}
            style={{
              background: isActive
                ? isPlum
                  ? 'linear-gradient(180deg, #F0F2F5 0%, #DCE0E8 100%)'
                  : CLAY_CREAM
                : 'transparent',
              color: isPlum ? (isActive ? PAGE_TEXT : 'rgba(240,242,245,0.76)') : isActive ? CLAY_TEXT : CLAY_TEXT,
              boxShadow: isActive
                ? isPlum
                  ? '0 10px 26px rgba(20,22,38,0.24), inset 0 1px 0 rgba(255,255,255,0.74), inset -3px -3px 8px rgba(20,22,38,0.12)'
                  : CLAY_TAB_ACTIVE_SHADOW
                : 'none',
              textShadow: isActive
                ? isPlum
                  ? '0 1px 0 rgba(255,255,255,0.4)'
                  : '-1px -1px 2px rgba(80,90,75,0.18), 1px 1px 2px rgba(255,255,255,0.3)'
                : isPlum
                ? '1px 1px 1px rgba(255,255,255,0.22)'
                : '1px 1px 1px rgba(255,255,255,0.2)',
            }}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

function GlassUtilityPill({
  children,
  tone = 'neutral',
  mono = false,
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'smoke' | 'dark'
  mono?: boolean
}) {
  const toneStyles =
    tone === 'accent'
      ? {
          color: TEXT_ON_STRONG,
          background: ELEM_ACCENT,
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: STRONG_CARD_SHADOW,
        }
      : tone === 'smoke'
      ? {
          color: STRONG_MUTED,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: NEO_INSET_SHADOW,
        }
      : tone === 'dark'
      ? {
          color: TEXT_ON_STRONG,
          background: ELEM_PRIMARY,
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: STRONG_CARD_SHADOW,
        }
      : {
          color: NEO_TEXT,
          background: NEO_CREAM,
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: NEO_RAISED_SHADOW,
        }

  return (
    <div
      className={`inline-flex items-center rounded-[18px] px-4.5 py-2.5 text-[13px] font-semibold ${
        mono ? '' : 'tracking-[0.01em]'
      }`}
      style={{ ...(mono ? { fontFamily: FONT_MONO } : {}), ...toneStyles }}
    >
      {children}
    </div>
  )
}

function DashboardKpiStrip({
  items,
}: {
  items: readonly {
    label: string
    lens: 'Execution' | 'Risk' | 'Trust'
    value: string
    sub: string
    trend: string
    note: string
    accent: string
  }[]
}) {
  return (
    <section className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {items.map((kpi) => {
        const lensClasses =
          kpi.lens === 'Execution'
            ? 'border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.12)] text-[#BBF7D0]'
            : kpi.lens === 'Risk'
            ? 'border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.12)] text-[#FECACA]'
            : 'border-[rgba(99,102,241,0.28)] bg-[rgba(99,102,241,0.12)] text-[#C7D2FE]'

        const trendColor = kpi.lens === 'Risk' ? '#FCA5A5' : kpi.lens === 'Execution' ? '#86EFAC' : '#C7D2FE'
        const accentBar =
          kpi.lens === 'Execution'
            ? 'linear-gradient(90deg, rgba(34,197,94,0.12), rgba(34,197,94,0.82), rgba(255,255,255,0.18))'
            : kpi.lens === 'Risk'
            ? 'linear-gradient(90deg, rgba(239,68,68,0.12), rgba(239,68,68,0.84), rgba(255,255,255,0.16))'
            : 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.22), rgba(255,255,255,0.08))'
        const accentGlow =
          kpi.lens === 'Execution'
            ? 'radial-gradient(circle, rgba(34,197,94,0.18), transparent 70%)'
            : kpi.lens === 'Risk'
            ? 'radial-gradient(circle, rgba(239,68,68,0.18), transparent 72%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 74%)'
        const cardSurface =
          kpi.lens === 'Execution'
            ? 'radial-gradient(circle at 100% 0%, rgba(34,197,94,0.10), transparent 30%), linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)'
            : kpi.lens === 'Risk'
            ? 'radial-gradient(circle at 100% 0%, rgba(239,68,68,0.12), transparent 32%), linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)'
            : 'linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)'

        return (
          <section
            key={kpi.label}
            className="relative overflow-hidden rounded-[30px] p-7"
            style={{
              background: cardSurface,
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: CLAY_CARD_DARK_SHADOW,
            }}
          >
            <div
              className="pointer-events-none absolute inset-x-6 top-0 h-1.5 rounded-b-full"
              style={{ background: accentBar }}
            />
            <div
              className="pointer-events-none absolute -right-10 top-10 h-28 w-28 rounded-full opacity-60 blur-3xl"
              style={{ background: accentGlow }}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="text-base font-bold uppercase tracking-[0.09em]" style={{ color: STRONG_SUBTLE }}>
                {kpi.label}
              </div>
              <span className={`inline-flex rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold ${lensClasses}`}>{kpi.lens}</span>
            </div>
            <div className="mt-5 text-[2.7rem] font-black leading-none tracking-[-0.04em]" style={{ color: TEXT_ON_STRONG }}>
              {kpi.value}
            </div>
            <div className="mt-4 text-[16px] leading-7" style={{ color: STRONG_MUTED }}>
              {kpi.sub}
            </div>
            <div className="mt-4 text-[16px] font-bold" style={{ color: trendColor }}>
              {kpi.trend}
            </div>
            <div
              className="mt-5 rounded-[20px] px-5 py-4 text-[14px] leading-6"
              style={{
                color: STRONG_MUTED,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow:
                  'inset 2px 2px 6px rgba(255,255,255,0.08), inset -3px -3px 8px rgba(0,0,0,0.18)',
              }}
            >
              {kpi.note}
            </div>
          </section>
        )
      })}
    </section>
  )
}

function CommandStatusOverview() {
  const [view, setView] = useState<'psp' | 'rails' | 'provider' | 'banks'>('psp')
  const theme = SECTION_THEMES.switchboard
  const payuSignal = PSP_STATUS_PILLS.find((pill) => pill.name === 'PayU')
  const bankApiSignal = PSP_STATUS_PILLS.find((pill) => pill.name === 'Bank API')
  const iciciSignal = BANK_FAILURE_ROWS.find((row) => row.bank === 'ICICI Bank')
  const sbiSignal = BANK_FAILURE_ROWS.find((row) => row.bank === 'SBI')

  return (
    <section className="mb-6">
      <Card
        className="relative overflow-hidden p-6 backdrop-blur-[20px]"
        style={{
          background: theme.shellBackground,
          border: `1px solid ${theme.shellBorder}`,
          boxShadow:
            '0 8px 24px rgba(20,22,38,0.28), 0 2px 6px rgba(20,22,38,0.18), inset 0 0.5px 0 rgba(255,255,255,0.09)',
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[4px] rounded-[26px]"
          style={{
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow:
              'inset 8px 8px 16px rgba(20,22,38,0.22), inset -6px -6px 12px rgba(255,255,255,0.03)',
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-5 bottom-4 top-[108px] rounded-[24px]"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow:
              'inset 2px 2px 6px rgba(255,255,255,0.04), inset -4px -4px 10px rgba(20,22,38,0.18)',
          }}
        />
        <SectionHeader
          eyebrow="Switchboard"
          title="Operations Switchboard"
          description="One compact control card for providers, rails, routing posture, and bank-side exposure"
          meta={<SectionMetaPill theme={theme}>4 views</SectionMetaPill>}
          theme={theme}
        />

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            {
              label: 'Provider Watch',
              value: '4 PSPs + bank API',
              note: 'route quality and callback trust',
              accent: SWITCHBOARD_TEXT,
              background: 'linear-gradient(180deg, #252A41 0%, #1C1F2E 100%)',
              border: 'rgba(255,255,255,0.07)',
            },
            {
              label: 'Rail Posture',
              value: 'IMPS healthy',
              note: 'NEFT batch + RTGS watch',
              accent: SWITCHBOARD_TEXT,
              background: 'linear-gradient(180deg, #252A41 0%, #1C1F2E 100%)',
              border: 'rgba(255,255,255,0.07)',
            },
            {
              label: 'Bank Hotspots',
              value: '3 branches flagged',
              note: 'ICICI and SBI need attention',
              accent: SWITCHBOARD_TEXT,
              background: 'linear-gradient(180deg, #252A41 0%, #1C1F2E 100%)',
              border: 'rgba(255,255,255,0.07)',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="relative overflow-hidden rounded-[22px] px-4 py-4"
              style={{
                background: item.background,
                border: `1px solid ${item.border}`,
                boxShadow:
                  '0 8px 24px rgba(20,22,38,0.22), 0 2px 6px rgba(20,22,38,0.14), inset 0 0.5px 0 rgba(255,255,255,0.09)',
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[3px] rounded-[18px]"
                style={{
                  border: '1px solid rgba(255,255,255,0.22)',
                  boxShadow:
                    'inset 5px 5px 10px rgba(20,22,38,0.20), inset -3px -3px 6px rgba(255,255,255,0.04)',
                }}
              />
              <div className="relative z-10">
                <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: item.accent }}>
                  {item.label}
                </div>
                <div className="mt-2 text-[18px] font-black tracking-[-0.03em]" style={{ color: SWITCHBOARD_TEXT }}>
                  {item.value}
                </div>
                <div className="mt-1.5 text-[13px] leading-5" style={{ color: SWITCHBOARD_TEXT }}>
                  {item.note}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.accent }}>
            Select an operating lens
          </div>
          <GlassSwitchTabs
            compact
            variant="plum"
            active={view}
            onChange={(value) => setView(value)}
            items={[
              { id: 'psp', label: 'PSP Status' },
              { id: 'rails', label: 'Rail Status' },
              { id: 'provider', label: 'Provider Health' },
              { id: 'banks', label: 'Bank Exposure' },
            ] as const}
          />
        </div>

        <div
          className="relative mt-6 overflow-hidden rounded-[24px] p-6"
          style={{
            background: theme.panelBackground,
            border: `1px solid ${theme.panelBorder}`,
            boxShadow:
              '0 8px 24px rgba(20,22,38,0.24), 0 2px 6px rgba(20,22,38,0.14), inset 7px 7px 14px rgba(20,22,38,0.20), inset -5px -5px 12px rgba(255,255,255,0.04)',
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[4px] rounded-[20px]"
            style={{
              border: '1px solid rgba(255,255,255,0.24)',
              boxShadow:
                'inset 5px 5px 10px rgba(20,22,38,0.18), inset -4px -4px 8px rgba(255,255,255,0.04)',
            }}
          />
          {view === 'psp' && (
            <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {PSP_STATUS_PILLS.map((pill) => {
                const tone = statusSurface(pill.tone)
                return (
                  <div
                    key={pill.name}
                    className="group relative min-h-[158px] overflow-hidden rounded-[24px] border px-5 py-5 transition-transform duration-300 hover:-translate-y-0.5"
                    style={{
                      borderColor: tone.border,
                      background: tone.background,
                      boxShadow:
                        `0 18px 36px rgba(20,22,38,0.28), 0 0 28px ${tone.glow}, inset 0 0.5px 0 rgba(255,255,255,0.10)`,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-5 top-0 h-[3px] rounded-b-full opacity-90"
                      style={{
                        background: tone.dot,
                        boxShadow: `0 0 22px ${tone.glow}`,
                      }}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-[4px] rounded-[18px]"
                      style={{
                        border: '1px solid rgba(255,255,255,0.07)',
                        boxShadow:
                          'inset 5px 5px 10px rgba(20,22,38,0.24), inset -4px -4px 8px rgba(255,255,255,0.04)',
                      }}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-7 top-4 h-24 w-24 rounded-full opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-75"
                      style={{
                        background: tone.glow,
                      }}
                    />
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5 text-[17px] font-black tracking-[-0.03em]">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone.dot, boxShadow: `0 0 14px ${tone.dot}` }} />
                          {pill.name}
                        </div>
                        <div className="mt-2 text-[13px] leading-5" style={{ color: STRONG_MUTED }}>
                          {pill.metric}
                        </div>
                      </div>
                      <span
                        className="rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                        style={{
                          borderColor: tone.border,
                          background: tone.chipBackground,
                          color: tone.chipColor,
                        }}
                      >
                        {pill.state}
                      </span>
                    </div>
                    <div className="relative z-10 mt-7 h-px w-full bg-white/10" />
                    <div className="relative z-10 mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: STRONG_SUBTLE }}>
                      <span>Provider lane</span>
                      <span style={{ color: tone.label }}>Live</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {view === 'rails' && (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              {RAIL_STATUS.map((rail) => {
                const tone = statusSurface(rail.tone)
                return (
                  <div
                    key={rail.rail}
                    className="rounded-[24px] border px-5 py-5"
                    style={{
                      borderColor: tone.border,
                      background: PREMIUM_SURFACE_RAISED,
                      boxShadow: `0 18px 36px rgba(20,22,38,0.26), 0 0 26px ${tone.glow}, inset 0 0.5px 0 rgba(255,255,255,0.09)`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[17px] font-bold" style={{ color: SWITCHBOARD_TEXT }}>{rail.rail}</div>
                      <span
                        className="inline-flex rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold"
                        style={{ borderColor: tone.border, background: tone.chipBackground, color: tone.chipColor }}
                      >
                        {rail.status}
                      </span>
                    </div>
                    <div className="mt-3 text-[15px] leading-6" style={{ color: STRONG_MUTED }}>{rail.note}</div>
                  </div>
                )
              })}
            </div>
          )}

          {view === 'provider' && (
            <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#1C1F2E]/95" style={{ boxShadow: PREMIUM_INSET }}>
              <table className="w-full text-left text-[15px]">
                <thead className="bg-white/5 text-[12px] uppercase tracking-[0.09em]" style={{ color: STRONG_SUBTLE }}>
                  <tr>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Success</th>
                    <th className="px-4 py-3">Latency</th>
                    <th className="px-4 py-3">Webhook</th>
                    <th className="px-4 py-3 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {PSP_ROWS.map((row) => (
                    <tr key={row.name} className="border-t border-white/10" style={{ color: SWITCHBOARD_TEXT }}>
                      <td className="px-4 py-4 text-[16px] font-bold">{row.name}</td>
                      <td className="px-4 py-4 text-[16px] font-bold">{row.success}</td>
                      <td className="px-4 py-4">{row.latency}</td>
                      <td className="px-4 py-4">{row.webhook}</td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wide"
                          style={{
                            borderColor: statusSurface(row.tone).border,
                            background: statusSurface(row.tone).chipBackground,
                            color: statusSurface(row.tone).chipColor,
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: statusSurface(row.tone).dot }}
                          />
                          {row.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === 'banks' && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {BANK_FAILURE_ROWS.map((row) => (
                <div
                  key={row.bank}
                  className="rounded-2xl border p-4 shadow-[0_10px_24px_rgba(184,198,214,0.18)]"
                  style={{
                    borderColor: row.dir === 'up' ? 'rgba(239,68,68,0.30)' : 'rgba(34,197,94,0.24)',
                    background: row.dir === 'up'
                      ? 'linear-gradient(180deg, rgba(239,68,68,0.14) 0%, rgba(33,37,58,0.96) 100%)'
                      : 'linear-gradient(180deg, rgba(34,197,94,0.10) 0%, rgba(33,37,58,0.96) 100%)',
                    boxShadow: `0 16px 34px rgba(20,22,38,0.24), ${row.dir === 'up' ? '0 0 26px rgba(239,68,68,0.12)' : '0 0 22px rgba(34,197,94,0.08)'}, inset 0 0.5px 0 rgba(255,255,255,0.09)`,
                  }}
                  >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/10 shadow-sm ring-1 ring-white/10">
                      <Image src={row.logo} alt={`${row.bank} logo`} width={40} height={40} className="h-full w-full rounded-full object-contain p-1.5" />
                    </div>
                    <div className="text-[16px] font-bold" style={{ color: SWITCHBOARD_TEXT }}>{row.bank}</div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <div style={{ color: STRONG_SUBTLE }}>Failed</div>
                      <div className="mt-1 font-semibold" style={{ color: SWITCHBOARD_TEXT }}>{row.failed}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <div style={{ color: STRONG_SUBTLE }}>Fail %</div>
                      <div className="mt-1 font-semibold" style={{ color: SWITCHBOARD_TEXT }}>{row.concentration}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs font-semibold" style={{ color: SWITCHBOARD_TEXT }}>
                    {row.trend}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="relative mt-5 overflow-hidden rounded-[24px] px-5 py-5"
          style={{
            color: SWITCHBOARD_TEXT,
            background:
              'radial-gradient(circle at 12% 0%, rgba(99,102,241,0.18), transparent 26%), linear-gradient(180deg, #252A41 0%, #1C1F2E 100%)',
            border: `1px solid ${PREMIUM_BORDER_STRONG}`,
            boxShadow: PREMIUM_SHADOW,
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 top-2 h-16 w-24 rounded-full opacity-70 blur-2xl"
            style={{ background: 'rgba(99,102,241,0.18)' }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[4px] rounded-[18px]"
            style={{
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow:
                'inset 5px 5px 10px rgba(20,22,38,0.24), inset -4px -4px 8px rgba(255,255,255,0.04)',
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 top-0 h-3 rounded-b-[999px]"
            style={{
              background: '#6366F1',
              boxShadow: '0 6px 16px rgba(99,102,241,0.28)',
            }}
          />
          <div className="relative z-10 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div
              className="rounded-[22px] px-5 py-5"
              style={{
                background:
                  'radial-gradient(circle at 18% 0%, rgba(255,255,255,0.18), transparent 36%), linear-gradient(180deg, rgba(99,102,241,0.92) 0%, rgba(79,70,229,0.78) 100%)',
                color: '#FFFFFF',
                boxShadow:
                  '0 18px 36px rgba(99,102,241,0.24), inset 0 0.5px 0 rgba(255,255,255,0.18), inset -3px -3px 8px rgba(0,0,0,0.16)',
              }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-black tracking-[0.12em]">
                  AI
                </span>
                <div
                  className="text-[10px] font-black uppercase tracking-[0.18em] text-white/80"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  ZORD Signal
                </div>
              </div>
              <div
                className="mt-5 text-[24px] font-semibold leading-7 tracking-[-0.04em]"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                Operational Recommendation
              </div>
              <div
                className="mt-2 text-[14px] leading-6 text-white/75"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                Control-layer insight for routing posture, callback trust, and bank exposure triage.
              </div>
            </div>
            <div
              className="min-w-0 rounded-[22px] px-5 py-5"
              style={{
                background: 'linear-gradient(180deg, rgba(33,37,58,0.72) 0%, rgba(28,31,46,0.72) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: PREMIUM_INSET,
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="text-[11px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: '#A5B4FC', fontFamily: FONT_DISPLAY }}
                >
                  Recommended next move
                </div>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{
                    background: 'rgba(99,102,241,0.14)',
                    color: '#C7D2FE',
                    border: '1px solid rgba(99,102,241,0.22)',
                    fontFamily: FONT_DISPLAY,
                  }}
                >
                  Route detail to Payout Intelligence
                </span>
              </div>
              <div
                className="mt-4 text-[28px] font-semibold leading-[1.14] tracking-[-0.05em] sm:text-[32px]"
                style={{ color: SWITCHBOARD_TEXT, fontFamily: FONT_DISPLAY }}
              >
                Keep Switchboard scan-first. Move PayU and bank-risk diagnosis into Payout Intelligence.
              </div>
              <div
                className="mt-4 max-w-[980px] text-[16px] leading-8"
                style={{ color: STRONG_MUTED, fontFamily: FONT_DISPLAY }}
              >
                {`PayU is currently ${payuSignal?.metric ?? '12.4% errors · 4.2s'}, Bank API is ${bankApiSignal?.metric?.toLowerCase() ?? 'no signal in 3m'}, and ICICI / SBI hotspots are still active with ${iciciSignal?.failed ?? '84'} + ${sbiSignal?.failed ?? '41'} failed payouts under watch. Use this surface for fast posture checks; keep routing, callback, and bank-side drilldown inside the deeper intelligence workspace.`}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{
                    background: 'rgba(239,68,68,0.14)',
                    color: '#FECACA',
                    border: '1px solid rgba(239,68,68,0.24)',
                    boxShadow: '0 4px 10px rgba(239,68,68,0.10)',
                    fontFamily: FONT_DISPLAY,
                  }}
                >
                  PayU {payuSignal?.state ?? 'CRITICAL'}
                </span>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{
                    background: 'rgba(99,102,241,0.14)',
                    color: '#C7D2FE',
                    border: '1px solid rgba(99,102,241,0.24)',
                    boxShadow: '0 4px 10px rgba(99,102,241,0.10)',
                    fontFamily: FONT_DISPLAY,
                  }}
                >
                  {bankApiSignal?.name ?? 'Bank API'} {bankApiSignal?.metric ?? 'No signal in 3m'}
                </span>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{
                    background: 'rgba(234,179,8,0.14)',
                    color: '#FDE68A',
                    border: '1px solid rgba(234,179,8,0.24)',
                    boxShadow: '0 4px 10px rgba(234,179,8,0.10)',
                    fontFamily: FONT_DISPLAY,
                  }}
                >
                  ICICI {iciciSignal?.failed ?? '84'} failed
                </span>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{
                    background: '#6366F1',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 6px 14px rgba(99,102,241,0.22)',
                    fontFamily: FONT_DISPLAY,
                  }}
                >
                  Open Payout Intelligence
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}

function AlertFeedCard() {
  const theme = SECTION_THEMES.alerts

  return (
    <Card
      className="xl:col-span-5 p-6 backdrop-blur-[20px]"
      style={{
        background: theme.shellBackground,
        border: `1px solid ${theme.shellBorder}`,
        boxShadow: theme.shellShadow,
      }}
    >
      <SectionHeader
        eyebrow="Priority Queue"
        title="Alert Feed"
        description="Top operational risks that need action before they become money loss"
        meta={<SectionMetaPill theme={theme}>5 active</SectionMetaPill>}
        theme={theme}
      />
      <div className="mt-5 space-y-3">
        {ALERT_FEED_ITEMS.map((item) => {
          const tone =
            item.severity === 'Critical'
              ? { border: 'rgba(239,68,68,0.30)', background: 'rgba(239,68,68,0.13)', color: '#FECACA', rail: '#EF4444' }
              : item.severity === 'High'
              ? { border: 'rgba(234,179,8,0.30)', background: 'rgba(234,179,8,0.13)', color: '#FEF3C7', rail: '#EAB308' }
              : item.severity === 'Medium'
              ? { border: 'rgba(99,102,241,0.28)', background: 'rgba(99,102,241,0.12)', color: '#C7D2FE', rail: '#6366F1' }
              : { border: 'rgba(168,175,191,0.24)', background: 'rgba(168,175,191,0.10)', color: '#E2E8F0', rail: '#A8AFBF' }
          return (
            <div
              key={item.title}
              className="rounded-[22px] border p-5 shadow-[0_12px_28px_rgba(184,198,214,0.16)]"
              style={{ borderColor: tone.border, background: theme.panelBackground }}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 h-12 w-1 shrink-0 rounded-full" style={{ background: tone.rail }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[17px] font-bold text-[#F0F2F5]">{item.title}</div>
                      <div className="mt-2 text-[14px] leading-6 text-[#A8AFBF]">{item.detail}</div>
                    </div>
                    <span
                      className="inline-flex rounded-full border px-3.5 py-1.5 text-[12px] font-semibold"
                      style={{ borderColor: tone.border, background: tone.background, color: tone.color }}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <div
                    className="mt-4 inline-flex rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold"
                    style={{
                      borderColor: theme.accentBorder,
                      background: theme.accentSoft,
                      color: theme.accent,
                    }}
                  >
                    {item.action}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function CommandVolumeTrendCard() {
  const [activeIndex, setActiveIndex] = useState(COMMAND_VOLUME_TREND.length - 1)
  const theme = SECTION_THEMES.flow

  const width = 700
  const height = 420
  const left = 28
  const right = 12
  const top = 34
  const bottom = 316
  const labelY = 384
  const max = Math.max(...COMMAND_VOLUME_TREND.map((item) => item.dispatched))
  const step = (width - left - right) / (COMMAND_VOLUME_TREND.length - 1)
  const bandWidth = step * 0.78
  const yFor = (value: number) => top + (1 - value / max) * (bottom - top)
  const lineFor = (key: 'dispatched' | 'confirmed') =>
    COMMAND_VOLUME_TREND.map((item, index) => `${index === 0 ? 'M' : 'L'} ${left + index * step} ${yFor(item[key])}`).join(' ')

  const activePoint = COMMAND_VOLUME_TREND[activeIndex]
  const activeX = left + activeIndex * step
  const dispatchedY = yFor(activePoint.dispatched)
  const confirmedY = yFor(activePoint.confirmed)
  const activeGap = activePoint.dispatched - activePoint.confirmed
  const confirmEfficiency = ((activePoint.confirmed / activePoint.dispatched) * 100).toFixed(1)
  const peakHour = COMMAND_VOLUME_TREND.reduce((best, item) => (item.dispatched > best.dispatched ? item : best), COMMAND_VOLUME_TREND[0])
  const averageConfirmed = Math.round(
    COMMAND_VOLUME_TREND.reduce((total, item) => total + item.confirmed, 0) / COMMAND_VOLUME_TREND.length,
  )

  return (
    <Card
      className="xl:col-span-7 flex min-h-[480px] flex-col p-4 backdrop-blur-[20px]"
      style={{
        background: theme.shellBackground,
        border: `1px solid ${theme.shellBorder}`,
        boxShadow: theme.shellShadow,
      }}
    >
      <SectionHeader
        eyebrow="Flow Analytics"
        title="24h Volume Trend"
        description="Dispatched versus confirmed volume to catch divergence early"
        meta={
          <div className="flex items-center gap-5 text-[14px] font-semibold">
            <span className="inline-flex items-center gap-2 text-[#A8AFBF]"><span className="h-2.5 w-2.5 rounded-full bg-[#A8AFBF]" />Dispatched</span>
            <span className="inline-flex items-center gap-2" style={{ color: theme.accent }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: theme.accent }} />
              Confirmed
            </span>
          </div>
        }
        theme={theme}
      />
      <div
        className="mt-3 flex flex-1 flex-col rounded-[22px] px-3 pb-2 pt-3"
        style={{
          background: theme.panelBackground,
          border: `1px solid ${theme.panelBorder}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), ${theme.panelShadow}`,
        }}
      >
        <div className="grid grid-cols-1 gap-3 pb-4 md:grid-cols-4">
          <div className="rounded-2xl border px-4 py-3" style={{ background: 'rgba(255,255,255,0.07)', borderColor: theme.panelBorder, boxShadow: theme.panelShadow }}>
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#A8AFBF]">Peak dispatched</div>
            <div className="mt-1.5 text-[28px] font-black tracking-[-0.04em] text-[#F0F2F5]">{peakHour.dispatched}</div>
            <div className="mt-1.5 text-[14px] leading-6 text-[#A8AFBF]">Highest release pressure at {peakHour.hour}:00</div>
          </div>
          <div className="rounded-2xl border px-4 py-3" style={{ background: 'rgba(255,255,255,0.07)', borderColor: theme.panelBorder, boxShadow: theme.panelShadow }}>
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#A8AFBF]">Average confirmed</div>
            <div className="mt-1.5 text-[28px] font-black tracking-[-0.04em] text-[#F0F2F5]">{averageConfirmed}</div>
            <div className="mt-1.5 text-[14px] leading-6 text-[#A8AFBF]">Steady confirmation load across the day</div>
          </div>
          <div className="rounded-2xl border px-4 py-3" style={{ background: 'rgba(255,255,255,0.07)', borderColor: theme.panelBorder, boxShadow: theme.panelShadow }}>
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#A8AFBF]">Live divergence</div>
            <div className="mt-1.5 text-[28px] font-black tracking-[-0.04em] text-[#F0F2F5]">{activeGap} gap</div>
            <div className="mt-1.5 text-[14px] leading-6 text-[#A8AFBF]">{confirmEfficiency}% of dispatched volume is already confirmed at {activePoint.hour}:00</div>
          </div>
        </div>
          <div className="rounded-[22px] border px-5 py-4" style={{ background: theme.noteBackground, borderColor: theme.noteBorder, boxShadow: theme.noteShadow }}>
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#A8AFBF]">AI insight</div>
            <div className="mt-2 text-[18px] font-bold text-[#F0F2F5]">Confirmation drift is lowest after 12:00</div>
            <div className="mt-2 text-[14px] leading-6 text-[#A8AFBF]">AI sees the healthiest dispatch-to-confirmation compression in the midday band, which makes it the safest window for routing heavier payout batches.</div>
          </div>
        <div className="relative flex-1">
          <motion.div
            key={activePoint.hour}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="pointer-events-none absolute z-20 w-[244px] rounded-[24px] border px-5 py-4 backdrop-blur-[14px]"
            style={{
              left: `clamp(12px, calc(${(activeX / width) * 100}% - 110px), calc(100% - 232px))`,
              top: `${Math.max(22, Math.min(confirmedY - 86, 96))}px`,
              borderColor: theme.noteBorder,
              background: theme.noteBackground,
              boxShadow: theme.noteShadow,
            }}
          >
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#A8AFBF]">{activePoint.hour}:00 snapshot</div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <div className="text-[12px] text-[#A8AFBF]">Confirmed</div>
                <div className="text-[34px] font-black leading-none tracking-[-0.04em]" style={{ color: theme.accent }}>{activePoint.confirmed}</div>
              </div>
              <div className="text-right">
                <div className="text-[12px] text-[#A8AFBF]">Dispatched</div>
                <div className="text-[22px] font-bold text-[#F0F2F5]">{activePoint.dispatched}</div>
              </div>
            </div>
            <div className="mt-3 text-[14px] leading-6 text-[#A8AFBF]">Gap of {activeGap} payouts waiting to settle through the confirmation path.</div>
          </motion.div>
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full min-h-[400px] w-full">
            <defs>
              <linearGradient id="command-confirmed-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.accent} stopOpacity="0.20" />
                <stop offset="100%" stopColor={theme.accent} stopOpacity="0.03" />
              </linearGradient>
              <linearGradient id="command-focus-band" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(94,123,150,0.20)" stopOpacity="0.95" />
                <stop offset="100%" stopColor="rgba(94,123,150,0.04)" stopOpacity="0.16" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const y = top + (bottom - top) * tick
              return <line key={tick} x1={left} y1={y} x2={width - right} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            })}
            {COMMAND_VOLUME_TREND.map((item, index) => {
              const x = left + index * step
              const isActive = index === activeIndex
              return (
                <g key={`${item.hour}-band`}>
                  {isActive ? (
                    <>
                      <rect x={x - bandWidth / 2} y={top} width={bandWidth} height={bottom - top} rx="22" fill="url(#command-focus-band)" opacity="0.55" />
                      <line x1={x} y1={top + 8} x2={x} y2={bottom} stroke="rgba(94,123,150,0.18)" strokeWidth="1.5" strokeDasharray="5 6" />
                    </>
                  ) : null}
                </g>
              )
            })}
            <path d={`${lineFor('confirmed')} L ${left + (COMMAND_VOLUME_TREND.length - 1) * step} ${bottom} L ${left} ${bottom} Z`} fill="url(#command-confirmed-area)" />
            <path d={lineFor('dispatched')} fill="none" stroke="#A8AFBF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={lineFor('confirmed')} fill="none" stroke={theme.accent} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
            {COMMAND_VOLUME_TREND.map((item, index) => {
              const x = left + index * step
              const isActive = index === activeIndex
              return (
                <g key={item.hour}>
                  {isActive ? <circle cx={x} cy={yFor(item.confirmed)} r="13" fill="rgba(94,123,150,0.14)" /> : null}
                  <circle cx={x} cy={yFor(item.confirmed)} r="6" fill="#fff" stroke={theme.accent} strokeWidth="2.8" />
                  <circle cx={x} cy={yFor(item.dispatched)} r="4.5" fill="#fff" stroke="#A8AFBF" strokeWidth="2" />
                  <text x={x} y={labelY} fontSize="12" fill={isActive ? '#A8AFBF' : '#A8AFBF'} fontWeight={isActive ? '700' : '500'} textAnchor="middle">
                    {item.hour}
                  </text>
                  <rect
                    x={x - step / 2}
                    y={top}
                    width={step}
                    height={labelY - top + 14}
                    fill="transparent"
                    onMouseEnter={() => setActiveIndex(index)}
                  />
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </Card>
  )
}

function RiskCommandCard() {
  const [view, setView] = useState<'risk' | 'reasons'>('risk')
  const max = Math.max(...FAILURE_REASON_ROWS.map((item) => item.count))
  const theme = SECTION_THEMES.risk

  return (
    <Card
      className="xl:col-span-5 p-6 backdrop-blur-[20px]"
      style={{
        background: theme.shellBackground,
        border: `1px solid ${theme.shellBorder}`,
        boxShadow: theme.shellShadow,
      }}
    >
      <SectionHeader
        eyebrow="Risk Lens"
        title="Risk Radar"
        description="One intelligent card for uncertain money exposure and the reasons most likely to burn it"
        meta={
          <GlassSwitchTabs
            compact
            active={view}
            onChange={(value) => setView(value)}
            items={[
              { id: 'risk', label: 'Money at risk' },
              { id: 'reasons', label: 'Failure reasons' },
            ] as const}
          />
        }
        theme={theme}
      />

      <div className="mt-5 rounded-2xl p-5" style={{ background: theme.panelBackground, border: `1px solid ${theme.panelBorder}`, boxShadow: theme.panelShadow }}>
        {view === 'risk' ? (
          <>
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#A8AFBF]">Total uncertain payout value</div>
            <div className="mt-3 text-[42px] font-black leading-none tracking-[-0.04em] text-[#F0F2F5]">₹1.04 Cr</div>
            <div className="mt-3 text-[16px] leading-7 text-[#A8AFBF]">Pending finality, SLA-breach clusters, and reversal / ambiguity buckets consolidated for ops and finance.</div>
            <div className="mt-5 space-y-3">
              {MONEY_AT_RISK_BUCKETS.map((bucket) => (
                <div key={bucket.label}>
                  <div className="flex items-center justify-between text-[16px]">
                    <span className="font-semibold text-[#F0F2F5]">{bucket.label}</span>
                    <span className="font-semibold text-[#F0F2F5]">{bucket.amount}</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-white/10">
                    <div className={`h-2.5 rounded-full ${bucket.tone}`} style={{ width: `${bucket.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#A8AFBF]">Today’s failure pattern</div>
              <div className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-[12px] font-semibold text-[#A8AFBF]">173 failures</div>
            </div>
            <div className="mt-5 space-y-4">
              {FAILURE_REASON_ROWS.map((row) => (
                <div key={row.code}>
                  <div className="flex items-center justify-between gap-3 text-[15px]">
                    <span className="font-semibold text-[#F0F2F5]">{row.code}</span>
                    <span className="text-[#A8AFBF]">{row.count} · {row.share}</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-white/10">
                    <div className={`h-3 rounded-full ${row.tone}`} style={{ width: `${(row.count / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-5 rounded-[22px] px-5 py-4 text-[15px] leading-7 text-[#A8AFBF]" style={{ background: theme.noteBackground, border: `1px solid ${theme.noteBorder}`, boxShadow: theme.noteShadow }}>
        <span className="font-bold" style={{ color: theme.accent }}>AI note:</span> the current risk stack says statement delay is the biggest value block, while failure codes point to beneficiary-data cleanup as the fastest win.
      </div>
    </Card>
  )
}

function LivePaymentStreamCard() {
  const theme = SECTION_THEMES.realtime

  return (
    <Card
      className="xl:col-span-7 p-6 backdrop-blur-[20px]"
      style={{
        background: theme.shellBackground,
        border: `1px solid ${theme.shellBorder}`,
        boxShadow: theme.shellShadow,
      }}
    >
      <SectionHeader
        eyebrow="Realtime Feed"
        title="Live Payment Stream"
        description="See the system working in real time and visually catch anomalies as they happen"
        meta={<SectionMetaPill theme={theme}>Realtime</SectionMetaPill>}
        theme={theme}
      />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          { label: 'Confirmed', value: '2', tone: '#22C55E', background: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.24)' },
          { label: 'In flight', value: '2', tone: '#6366F1', background: 'rgba(99,102,241,0.11)', border: 'rgba(99,102,241,0.24)' },
          { label: 'Failed / reversed', value: '2', tone: '#EF4444', background: 'rgba(239,68,68,0.11)', border: 'rgba(239,68,68,0.26)' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[18px] px-4 py-3"
            style={{
              background: item.background,
              border: `1px solid ${item.border}`,
              boxShadow: theme.panelShadow,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: NEO_MUTED }}>
                {item.label}
              </div>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.tone }} />
            </div>
            <div className="mt-2 text-[24px] font-black tracking-[-0.03em]" style={{ color: NEO_TEXT }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl" style={{ border: `1px solid ${theme.panelBorder}`, background: theme.panelBackground }}>
        <table className="w-full text-left">
          <thead className="text-[12px] uppercase tracking-[0.09em] text-[#A8AFBF]" style={{ background: 'rgba(95,125,120,0.08)' }}>
            <tr>
              <th className="px-4 py-3">Intent</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Elapsed</th>
            </tr>
          </thead>
          <tbody>
            {LIVE_PAYMENT_STREAM.map((item) => (
              <tr key={item.intent} className="border-t border-white/10 text-[15px] text-[#F0F2F5]">
                <td className="px-4 py-4 text-[15px] font-bold" style={{ fontFamily: FONT_MONO }}>{item.intent}</td>
                <td className="px-4 py-4 font-semibold">{item.amount}</td>
                <td className="px-4 py-4">
                  <span
                    className="inline-flex rounded-full border px-3.5 py-1.5 text-[12px] font-semibold"
                    style={{
                      borderColor:
                        item.status === 'CONFIRMED'
                          ? 'rgba(34,197,94,0.28)'
                          : item.status === 'FAILED' || item.status === 'REVERSED'
                          ? 'rgba(239,68,68,0.28)'
                          : item.status === 'PROVISIONAL'
                          ? 'rgba(234,179,8,0.26)'
                          : 'rgba(99,102,241,0.24)',
                      background:
                        item.status === 'CONFIRMED'
                          ? 'rgba(34,197,94,0.12)'
                          : item.status === 'FAILED' || item.status === 'REVERSED'
                          ? 'rgba(239,68,68,0.12)'
                          : item.status === 'PROVISIONAL'
                          ? 'rgba(234,179,8,0.12)'
                          : 'rgba(99,102,241,0.12)',
                      color:
                        item.status === 'CONFIRMED'
                          ? '#BBF7D0'
                          : item.status === 'FAILED' || item.status === 'REVERSED'
                          ? '#FECACA'
                          : item.status === 'PROVISIONAL'
                          ? '#FEF3C7'
                          : '#C7D2FE',
                    }}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-right text-[#A8AFBF]">{item.elapsed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function EvidenceExportsCard() {
  const theme = SECTION_THEMES.exports

  return (
    <Card
      className="xl:col-span-5 p-6 backdrop-blur-[20px]"
      style={{
        background: theme.shellBackground,
        border: `1px solid ${theme.shellBorder}`,
        boxShadow: theme.shellShadow,
      }}
    >
      <SectionHeader
        eyebrow="Export Ledger"
        title="Recent Evidence Exports"
        description="Track what has already been shared with finance, audit, or compliance"
        meta={<SectionMetaPill theme={theme}>Last 5</SectionMetaPill>}
        theme={theme}
      />
      <div className="mt-5 space-y-3">
        {EVIDENCE_EXPORTS.map((item) => (
          <div
            key={`${item.entity}-${item.time}`}
            className="flex items-center justify-between gap-4 rounded-[22px] border px-5 py-5"
            style={{
              borderColor: theme.panelBorder,
              background: theme.panelBackground,
              boxShadow: theme.panelShadow,
            }}
          >
            <div className="flex min-w-0 items-center gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                style={{
                  background: theme.noteBackground,
                  border: `1px solid ${theme.noteBorder}`,
                  boxShadow: theme.noteShadow,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden style={{ color: theme.accent }}>
                  <path d="M5.25 2.25h4.5l3 3v10.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-10.5a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M9.75 2.25v3h3" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="truncate text-[17px] font-bold text-[#F0F2F5]">{item.entity}</div>
                <div
                  className="mt-1.5 inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{
                    borderColor: theme.accentBorder,
                    background: theme.accentSoft,
                    color: theme.accent,
                  }}
                >
                  {item.format}
                </div>
              </div>
            </div>
            <div className="shrink-0 text-[16px] font-bold" style={{ fontFamily: FONT_MONO, color: theme.accent }}>{item.time}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function CommandCenterContent() {
  return (
    <>
      <DashboardKpiStrip items={COMMAND_CENTER_KPI_ITEMS} />
      <CommandStatusOverview />

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <AlertFeedCard />
        <CommandVolumeTrendCard />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <RiskCommandCard />
        <LivePaymentStreamCard />
      </section>

      <section className="mb-6">
        <EvidenceExportsCard />
      </section>
    </>
  )
}

function PayoutTrendCard() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(PAYOUT_TREND_DATA.length - 1)
  const [focusMode, setFocusMode] = useState<'success' | 'failures'>('success')
  const width = 860
  const height = 336
  const labelLane = 26
  const plotLeft = 94
  const padRight = 16
  const top = 18
  const bottom = 258
  const chartHeight = bottom - top
  const minSuccess = 97.5
  const maxSuccess = 99.1
  const maxFailures = Math.max(...PAYOUT_TREND_DATA.map((item) => item.failures))
  const stepX = (width - plotLeft - padRight) / (PAYOUT_TREND_DATA.length - 1)

  const getY = (value: number) => {
    return top + ((maxSuccess - value) / (maxSuccess - minSuccess)) * chartHeight
  }

  const linePath = PAYOUT_TREND_DATA.map((point, index) => `${index === 0 ? 'M' : 'L'} ${plotLeft + index * stepX} ${getY(point.success)}`).join(' ')
  const areaPath = `${linePath} L ${plotLeft + (PAYOUT_TREND_DATA.length - 1) * stepX} ${bottom} L ${plotLeft} ${bottom} Z`
  const hovered = hoveredIndex !== null ? PAYOUT_TREND_DATA[hoveredIndex] : null
  const hoveredX = hoveredIndex !== null ? plotLeft + hoveredIndex * stepX : 0
  const hoveredY = hovered ? getY(hovered.success) : 0
  const failureBaseY = bottom + 4
  const lineOpacity = focusMode === 'success' ? 1 : 0.45
  const barOpacity = focusMode === 'failures' ? 0.92 : 0.48

  return (
    <Card className="xl:col-span-8 min-h-[520px] overflow-hidden border-white/10 bg-[#1C1F2E]/95 p-0 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Settlement Success Trend</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Execution health versus failure load so ops can act before money is lost</div>
        </div>
        <GlassSwitchTabs
          compact
          active={focusMode}
          onChange={(value) => setFocusMode(value)}
          items={[
            { id: 'success', label: 'Cycle success' },
            { id: 'failures', label: 'Failures' },
          ] as const}
        />
      </div>

      <div className="mt-5 relative h-[342px] overflow-hidden border-y border-white/10 bg-[linear-gradient(180deg,rgba(39,44,68,0.96),rgba(28,31,46,0.92))] px-0 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none absolute z-10"
            style={{ left: `clamp(12px, ${hoveredX - 78}px, calc(100% - 172px))`, top: Math.max(18, hoveredY - 18) }}
          >
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-[0_22px_40px_rgba(99,102,241,0.16)] backdrop-blur-[14px]">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A8AFBF]">{hovered.day}</div>
              <div className="mt-1 text-[17px] font-bold text-[#F0F2F5]">{hovered.success.toFixed(2)}% success</div>
              <div className="mt-1 text-[14px] leading-6 text-white/60">{hovered.failures} failure events</div>
            </div>
          </motion.div>
        )}

        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" onMouseLeave={() => setHoveredIndex(PAYOUT_TREND_DATA.length - 1)}>
          <defs>
            <linearGradient id="payout-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity={focusMode === 'success' ? '0.24' : '0.10'} />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="payout-failure-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#111827" stopOpacity={focusMode === 'failures' ? '0.34' : '0.20'} />
              <stop offset="100%" stopColor="#111827" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="payout-hover-column" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {hoveredIndex !== null && (
            <rect
              x={Math.max(0, hoveredX - stepX / 2)}
              y={top - 8}
              width={stepX}
              height={bottom - top + 44}
              rx="24"
              fill="url(#payout-hover-column)"
            />
          )}

          {[97.6, 98.0, 98.4, 98.8, 99.1].map((tick) => {
            const y = getY(tick)
            return (
              <g key={tick}>
                <line x1={plotLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <text x={labelLane} y={y + 4} fontSize="11" fill="#A8AFBF">
                  {tick.toFixed(1)}%
                </text>
              </g>
            )
          })}

          {PAYOUT_TREND_DATA.map((point, index) => {
            const x = plotLeft + index * stepX
            const barHeight = (point.failures / maxFailures) * 92
            return (
              <g key={point.day}>
                <rect x={x - 17} y={failureBaseY - barHeight} width="34" height={barHeight} rx="12" fill="url(#payout-failure-fill)" opacity={barOpacity} />
              </g>
            )
          })}

          <motion.path
            d={areaPath}
            fill="url(#payout-area-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          />
          {hovered && (
            <line x1={hoveredX} y1={top} x2={hoveredX} y2={bottom + 6} stroke="rgba(99,102,241,0.16)" strokeWidth="1.5" strokeDasharray="4 6" />
          )}
          <motion.path
            d={linePath}
            fill="none"
            stroke="#6366F1"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: lineOpacity }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />

          {PAYOUT_TREND_DATA.map((point, index) => {
            const x = plotLeft + index * stepX
            const y = getY(point.success)
            const isActive = hoveredIndex === index
            return (
              <g key={`${point.day}-dot`}>
                {isActive && (
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="16"
                    fill="rgba(99,102,241,0.10)"
                    animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <circle cx={x} cy={y} r="7" fill="#fff" stroke="#6366F1" strokeWidth="3.5" opacity={focusMode === 'success' ? 1 : 0.82} />
                <rect
                  x={x - stepX / 2}
                  y={top - 8}
                  width={stepX}
                  height={bottom - top + 44}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(index)}
                />
              </g>
            )
          })}

          {PAYOUT_TREND_DATA.map((point, index) => (
            <text key={`${point.day}-label`} x={plotLeft + index * stepX} y="304" fontSize="12" fill="#A8AFBF" textAnchor="middle">
              {point.day}
            </text>
          ))}
        </svg>
      </div>
    </Card>
  )
}

function PayoutVelocityCard() {
  const max = Math.max(...VELOCITY_BINS.map((item) => item.count))

  return (
    <Card className="xl:col-span-4 min-h-[520px] p-8 border-white/10 bg-[#21253A]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Payout Velocity</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">How fast dispatched money becomes seller-ready and support-safe</div>
        </div>
        <div className="space-y-2 text-right">
          <div className="rounded-full border border-white/10 bg-white/10 px-4.5 py-2 text-[13px] font-semibold text-[#6366F1]">P50 44s</div>
          <div className="rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-[13px] font-semibold text-white/70">P95 45m</div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-5">
        <div className="flex h-[210px] items-end gap-3">
          {VELOCITY_BINS.map((bin) => {
            const height = Math.max(18, (bin.count / max) * 170)
            return (
              <div key={bin.label} className="flex flex-1 flex-col items-center gap-3">
                <div className="text-[11px] font-semibold text-white/60">{bin.count.toLocaleString()}</div>
                <div className="flex w-full items-end justify-center rounded-t-[18px] bg-indigo-500/10" style={{ height }}>
                  <div className={`w-full rounded-t-[18px] ${bin.tone}`} style={{ height }} />
                </div>
                <div className="text-xs font-semibold text-[#A8AFBF]">{bin.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function SettlementWeekCohortCard() {
  return (
    <Card className="p-8 border-white/10 bg-[#1C1F2E]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Settlement Week Cohort</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Rolling cohort view to spot whether payout quality is improving or slipping week to week</div>
        </div>
        <GlassUtilityPill tone="smoke">8 weeks</GlassUtilityPill>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
        <table className="w-full text-left text-[15px]">
          <thead className="bg-white/5 text-[12px] uppercase tracking-[0.09em] text-white/50">
            <tr>
              <th className="px-4 py-3">Week</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Success</th>
              <th className="px-4 py-3">Failed</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3 text-right">Amount Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {SETTLEMENT_COHORT_ROWS.map((row) => (
              <tr key={row.week} className="border-t border-white/10 text-[15px] text-white">
                <td className="px-4 py-4 font-semibold">{row.week}</td>
                <td className="px-4 py-4">{row.total}</td>
                <td className="px-4 py-4 font-semibold text-[#6366F1]">{row.success}</td>
                <td className="px-4 py-4 text-white/70">{row.failed}</td>
                <td className="px-4 py-4 text-white/70">{row.pending}</td>
                <td className="px-4 py-4 text-right font-semibold">{row.confirmed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function AmountBucketDistributionCard() {
  return (
    <Card className="xl:col-span-7 min-h-[430px] p-8 border-white/10 bg-[#21253A]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Amount Bucket Distribution</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Success rate shifts by payout size, so high-value cohorts deserve separate monitoring</div>
        </div>
        <GlassUtilityPill tone="smoke">Value buckets</GlassUtilityPill>
      </div>
      <div className="mt-6 space-y-4">
        {AMOUNT_BUCKET_ROWS.map((row) => (
          <div key={row.label} className="rounded-[22px] border border-white/10 bg-white/10 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[17px] font-bold text-white">{row.label}</div>
                <div className="mt-1 text-[13px] text-white/60">{row.count} payouts</div>
              </div>
              <span className="rounded-full border border-white/10 bg-indigo-500/10 px-4.5 py-2 text-[13px] font-semibold text-[#6366F1]">{row.success}</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-white/10">
              <div className={`h-3 rounded-full ${row.tone}`} style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function PayoutCostMonitorCard() {
  return (
    <Card className="xl:col-span-5 min-h-[430px] p-8 border-white/10 bg-[#1C1F2E]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Payout Cost Monitor</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Quantify fee waste so routing and retry policies can protect margin</div>
        </div>
        <GlassUtilityPill tone="accent">AI tracked</GlassUtilityPill>
      </div>
      <div className="mt-6 space-y-4">
        <div className="rounded-[22px] border border-white/10 bg-white/10 p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Total PSP fees this cycle</div>
          <div className="mt-2 text-[42px] font-black leading-none tracking-[-0.04em] text-[#F0F2F5]">₹2.14 L</div>
          <div className="mt-2 text-[17px] font-bold text-[#6366F1]">↑ ₹18K vs last week</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[22px] border border-white/10 bg-white/10 p-5">
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Per Success</div>
            <div className="mt-2 text-[30px] font-black leading-none tracking-[-0.04em] text-[#F0F2F5]">₹14.5</div>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/10 p-5">
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Per Failure</div>
            <div className="mt-2 text-[30px] font-black leading-none tracking-[-0.04em] text-[#F0F2F5]">₹29.0</div>
          </div>
        </div>
        <div
          className="rounded-2xl p-4"
          style={{
            background: NEO_CREAM,
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: NEO_INSET_SHADOW,
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: NEO_ACTIVE }}>
            AI routing note
          </div>
          <div className="mt-2 text-sm leading-6" style={{ color: NEO_MUTED }}>
            Shifting weekend IMPS volume away from PayU would have prevented an estimated ₹4.8K in duplicate fee burn this cycle.
          </div>
        </div>
      </div>
    </Card>
  )
}

function PspComparisonCard() {
  return (
    <Card className="xl:col-span-7 min-h-[410px] p-8 border-white/10 bg-[#1C1F2E]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Multi-PSP Comparison</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Provider quality across success, latency, fee pressure, and webhook trust</div>
        </div>
        <GlassUtilityPill tone="accent">Live</GlassUtilityPill>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
        <table className="w-full text-left text-[15px]">
          <thead className="bg-white/5">
            <tr className="text-[12px] uppercase tracking-[0.09em] text-white/60">
              <th className="px-4 py-3">PSP</th>
              <th className="px-4 py-3">Success</th>
              <th className="px-4 py-3">P95 Latency</th>
              <th className="px-4 py-3">Fee (bps)</th>
              <th className="px-4 py-3">Webhook</th>
              <th className="px-4 py-3 text-right">Severity</th>
            </tr>
          </thead>
          <tbody>
            {PSP_ROWS.map((row) => {
              const tone = statusSurface(row.tone)
              return (
                <tr key={row.name} className="border-t border-white/10 text-[15px] text-white">
                  <td className="px-4 py-4 text-[16px] font-bold">{row.name}</td>
                  <td className="px-4 py-4 text-[16px] font-bold">{row.success}</td>
                  <td className="px-4 py-4 font-medium">{row.latency}</td>
                  <td className="px-4 py-4 font-medium" style={{ fontFamily: FONT_MONO }}>{row.fee}</td>
                  <td className="px-4 py-4 font-medium">{row.webhook}</td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wide"
                      style={{
                        borderColor: tone.border,
                        background: tone.chipBackground,
                        color: tone.chipColor,
                      }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: tone.dot, boxShadow: `0 0 12px ${tone.dot}` }} />
                      {row.severity}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function ReconStateCard() {
  return (
    <Card className="xl:col-span-5 min-h-[410px] p-8 border-white/10 bg-[#21253A]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Funds at Risk Ladder</div>
      <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">How much payout value is safe, waiting on proof, or still financially exposed</div>

      <div className="mt-6 space-y-4">
        {RECON_ROWS.map((row) => (
          <div key={row.state}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[17px] font-bold text-white">{row.state}</div>
              <div className="text-[17px] font-bold text-white" style={{ fontFamily: FONT_MONO }}>
                {row.value.toLocaleString()}
              </div>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-white/10">
              <div className={`${row.tone} h-2.5 rounded-full`} style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-[22px] border border-white/10 bg-white/10 p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-white/50">Variance</div>
          <div className="mt-2 text-[30px] font-black leading-none tracking-[-0.04em] text-white">₹3.2 L</div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/10 p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-white/50">Auto-close</div>
          <div className="mt-2 text-[30px] font-black leading-none tracking-[-0.04em] text-white">98.4%</div>
        </div>
      </div>
    </Card>
  )
}

function BeneficiaryBanksCard() {
  return (
    <Card className="xl:col-span-6 min-h-[400px] p-8 border-white/10 bg-[#1C1F2E]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Failure Concentration by Bank</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Focus escalation where bank-side failures create the most payout leakage</div>
        </div>
        <GlassUtilityPill tone="smoke">Last 7 days</GlassUtilityPill>
      </div>

      <div className="mt-6 space-y-3">
        {BANK_FAILURE_ROWS.map((row) => (
          <div key={row.bank} className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-white/90 ring-1 ring-white/10">
                <Image src={row.logo} alt={`${row.bank} logo`} width={44} height={44} className="h-full w-full rounded-full object-contain p-1.5" />
              </div>
              <div>
                <div className="text-[16px] font-bold text-white">{row.bank}</div>
                <div className="mt-1 text-[13px] text-white/60">{row.total} payouts · {row.failed} failed</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[17px] font-bold text-white">{row.concentration}</div>
              <div className={`mt-1 text-xs font-semibold ${row.dir === 'up' ? 'text-[#F0F2F5]' : 'text-[#6366F1]'}`}>{row.trend}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function FailingIfscCard() {
  return (
    <Card className="xl:col-span-6 min-h-[400px] p-8 border-white/10 bg-[#21253A]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Branch / IFSC Data Friction</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Correctable data errors that create avoidable payout failures and support cost</div>
        </div>
        <GlassUtilityPill tone="smoke">Branch view</GlassUtilityPill>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
        <table className="w-full text-left text-[15px]">
          <thead className="bg-white/5">
            <tr className="text-[12px] uppercase tracking-[0.09em] text-white/60">
              <th className="px-4 py-3">IFSC</th>
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3 text-right">Fails</th>
            </tr>
          </thead>
          <tbody>
            {IFSC_ROWS.map((row) => (
              <tr key={row.ifsc} className="border-t border-white/10 text-[15px] text-white">
                <td className="px-4 py-4 text-[15px] font-bold" style={{ fontFamily: FONT_MONO }}>{row.ifsc}</td>
                <td className="px-4 py-4">{row.bank}</td>
                <td className="px-4 py-4 text-white/70">{row.reason}</td>
                <td className="px-4 py-4 text-right font-semibold">{row.failures}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function SellerLookupCard() {
  return (
    <Card className="p-8 border-white/10 bg-[#1C1F2E]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Seller / Vendor Payout Status Lookup</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Resolve payout complaints fast with seller status, UTR evidence, and ETA context</div>
        </div>
        <GlassUtilityPill tone="smoke">Export</GlassUtilityPill>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50">
          <svg className="h-4 w-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          Search by seller_id, vendor name, UTR, or intent_id
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="text-[12px] uppercase tracking-[0.09em] text-white/50">
              <tr>
                <th className="px-3 py-3">Seller</th>
                <th className="px-3 py-3">Intent</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">UTR</th>
                <th className="px-3 py-3">Confirm time</th>
              </tr>
            </thead>
            <tbody>
              {SELLER_ROWS.map((row) => (
                <tr key={row.intent} className="border-t border-white/10 text-[15px] text-white">
                  <td className="px-3 py-4 font-semibold">{row.seller}</td>
                  <td className="px-3 py-4" style={{ fontFamily: FONT_MONO }}>{row.intent}</td>
                  <td className="px-3 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${
                        row.status === 'CONFIRMED'
                          ? 'border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.12)] text-[#BBF7D0]'
                          : row.status === 'FAILED'
                          ? 'border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.12)] text-[#FECACA]'
                          : row.status === 'PROVISIONAL'
                          ? 'border-[rgba(234,179,8,0.24)] bg-[rgba(234,179,8,0.12)] text-[#FEF3C7]'
                          : 'border-[rgba(99,102,241,0.24)] bg-[rgba(99,102,241,0.12)] text-[#C7D2FE]'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-4 font-semibold">{row.amount}</td>
                  <td className="px-3 py-4 text-white/60">{row.utr}</td>
                  <td className="px-3 py-4 text-white/60">{row.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}

function PayoutIntelligenceContent() {
  return (
    <>
      <DashboardKpiStrip items={PAYOUT_KPI_ITEMS} />

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <PayoutTrendCard />
        <PayoutVelocityCard />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <AmountBucketDistributionCard />
        <PayoutCostMonitorCard />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <PspComparisonCard />
        <ReconStateCard />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <BeneficiaryBanksCard />
        <FailingIfscCard />
      </section>

      <section className="mb-6">
        <SettlementWeekCohortCard />
      </section>

      <section className="mb-6">
        <SellerLookupCard />
      </section>
    </>
  )
}

function SignalCoverageCard() {
  const [activePlay, setActivePlay] = useState<string>(RECON_RECOVERY_PLAYS[0].title)
  const selectedPlay = RECON_RECOVERY_PLAYS.find((item) => item.title === activePlay) ?? RECON_RECOVERY_PLAYS[0]

  return (
    <Card className="xl:col-span-7 min-h-[410px] p-8 border-white/10 bg-[#1C1F2E]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Reconciliation Savings Engine</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Where evidence and automation are directly protecting client money and reducing finance drag</div>
        </div>
          <div className="flex items-center gap-2">
            <GlassUtilityPill tone="smoke">24h window</GlassUtilityPill>
            <motion.div
              key={selectedPlay.title}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(39,44,68,0.96),rgba(28,31,46,0.92))] px-4 py-2 text-[13px] font-semibold text-[#6366F1] shadow-[0_12px_26px_rgba(99,102,241,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              Active play: {selectedPlay.title}
            </motion.div>
          </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Recovered value</div>
          <div className="mt-3 text-3xl font-extrabold text-[#F0F2F5]">₹7.52 L</div>
          <div className="mt-2 text-sm text-[#A8AFBF]">Recovered through delayed evidence and auto-closure rules</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Leakage prevented</div>
          <div className="mt-3 text-3xl font-extrabold text-[#F0F2F5]">₹2.72 L</div>
          <div className="mt-2 text-sm text-[#A8AFBF]">Stopped from rolling into write-offs or duplicate finance actions</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Manual hours saved</div>
          <div className="mt-3 text-3xl font-extrabold text-[#F0F2F5]">26.4h</div>
          <div className="mt-2 text-sm text-[#A8AFBF]">Reduced spreadsheet chasing and statement follow-up effort</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10">
          <div className="border-b border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-white/50">
            Recovery plays
          </div>
          <div className="p-3">
            {RECON_RECOVERY_PLAYS.map((play) => (
              <motion.button
                key={play.title}
                type="button"
                onMouseEnter={() => setActivePlay(play.title)}
                whileHover={{ y: -1 }}
                className={`mb-3 w-full rounded-2xl border p-4 text-left last:mb-0 ${
                  activePlay === play.title
                    ? 'border-white/10 bg-white/5 shadow-[0_12px_24px_rgba(99,102,241,0.10)]'
                    : 'border-white/10 bg-white/10 hover:bg-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[17px] font-bold text-[#F0F2F5]">{play.title}</div>
                    <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">{play.subtitle}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-[#F0F2F5]">{play.amount}</div>
                    <div className={`mt-1 text-xs font-semibold ${
                      play.tone === 'blue' ? 'text-[#6366F1]' : play.tone === 'amber' ? 'text-[#EAB308]' : 'text-[#22C55E]'
                    }`}>
                      {play.impact}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <motion.div
          key={selectedPlay.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(39,44,68,0.96),rgba(28,31,46,0.92))] p-5 shadow-[0_16px_32px_rgba(15,23,42,0.08)]"
        >
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Current savings driver</div>
          <div className="mt-3 text-[30px] font-black leading-none tracking-[-0.04em] text-[#F0F2F5]">{selectedPlay.amount}</div>
          <div className="mt-2 text-base font-semibold text-[#F0F2F5]">{selectedPlay.title}</div>
          <div className="mt-3 text-sm leading-6 text-[#A8AFBF]">{selectedPlay.subtitle}</div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Why it matters</div>
            <div className="mt-2 text-sm text-[#A8AFBF]">
              This play directly reduces unresolved money sitting in recon queues and lowers the probability of period-end leakage.
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Observed impact</div>
            <div className="mt-2 text-lg font-semibold text-[#F0F2F5]">{selectedPlay.impact}</div>
          </div>
        </motion.div>
      </div>
    </Card>
  )
}

function ConfidenceDistributionCard() {
  const [hoveredBin, setHoveredBin] = useState<string | null>(CONFIDENCE_BINS[CONFIDENCE_BINS.length - 1].label)
  const max = Math.max(...CONFIDENCE_BINS.map((item) => item.count))
  const activeBin = CONFIDENCE_BINS.find((item) => item.label === hoveredBin) ?? CONFIDENCE_BINS[CONFIDENCE_BINS.length - 1]

  return (
    <Card className="xl:col-span-5 min-h-[410px] p-8 border-white/10 bg-[#21253A]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Outcome Trust Distribution</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">How much closure volume is audit-ready versus still probabilistic</div>
        </div>
        <motion.div
          key={activeBin.label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right shadow-[0_12px_24px_rgba(99,102,241,0.10)]"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">{activeBin.label}</div>
          <div className="mt-1 text-xl font-extrabold text-[#F0F2F5]">{activeBin.count}</div>
          <div className="text-xs text-[#A8AFBF]">intents in bucket</div>
        </motion.div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-5">
        <div className="flex h-[220px] items-end gap-4">
          {CONFIDENCE_BINS.map((bin) => {
            const height = Math.max(24, (bin.count / max) * 180)
            const isActive = hoveredBin === bin.label
            return (
              <div key={bin.label} className="flex flex-1 flex-col items-center gap-3">
                <div className={`text-[11px] font-semibold ${isActive ? 'text-[#6366F1]' : 'text-white/50'}`}>{bin.count}</div>
                <motion.div
                  onMouseEnter={() => setHoveredBin(bin.label)}
                  whileHover={{ y: -3 }}
                  className="w-full rounded-t-[20px] bg-[linear-gradient(180deg,rgba(99,102,241,0.92),rgba(129,140,248,0.38))] shadow-[0_14px_28px_rgba(99,102,241,0.12)]"
                  style={{ height, opacity: isActive ? 1 : 0.62 }}
                />
                <div className="text-xs font-semibold text-[#A8AFBF]">{bin.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function SignalCoverageMatrixProofCard() {
  const colorFor = (state: 'green' | 'amber' | 'red') =>
    state === 'green' ? 'bg-[#22C55E]' : state === 'amber' ? 'bg-[#EAB308]' : 'bg-[#EF4444]'

  return (
    <Card className="xl:col-span-7 p-8 border-white/10 bg-[#1C1F2E]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Signal Coverage Matrix</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">The exact proof grid showing which signals arrived, when they arrived, and where trust is blocked</div>
        </div>
        <div className="rounded-full border border-white/10 bg-indigo-500/10 px-4.5 py-2 text-[13px] font-semibold text-[#6366F1]">Multi-signal proof</div>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
        <div className="grid grid-cols-[1.4fr_repeat(3,1fr)] border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.08em] text-white/50">
          <div className="px-4 py-3">Time block</div>
          <div className="px-4 py-3 text-center">Webhook</div>
          <div className="px-4 py-3 text-center">Poll</div>
          <div className="px-4 py-3 text-center">Statement</div>
        </div>
        {SIGNAL_COVERAGE_MATRIX.map((row) => (
          <div key={row.block} className="grid grid-cols-[1.4fr_repeat(3,1fr)] border-t border-white/10 text-sm">
            <div className="px-4 py-4 font-semibold text-white">{row.block}</div>
            {(['webhook', 'poll', 'statement'] as const).map((key) => (
              <div key={key} className="flex items-center justify-center px-4 py-4">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] font-semibold text-white/70">
                  <span className={`h-2.5 w-2.5 rounded-full ${colorFor(row[key])}`} />
                  {row[key] === 'green' ? 'Received' : row[key] === 'amber' ? 'Delayed' : 'Missing'}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  )
}

function ReconTimelineIntentCard() {
  return (
    <Card className="xl:col-span-5 p-8 border-white/10 bg-[#21253A]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Recon Timeline per Intent</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Visual proof trail for a disputed payout from dispatch to finality</div>
        </div>
        <GlassUtilityPill tone="neutral" mono>
          INT-RC-88210
        </GlassUtilityPill>
      </div>
      <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 p-6">
        {RECON_TIMELINE_EVENTS.map((event, index) => (
          <div key={event.label} className="flex gap-4">
            <div className="flex w-5 flex-col items-center">
              <div className={`mt-1 h-3.5 w-3.5 rounded-full ${event.status === 'done' ? 'bg-[#6366F1]' : 'bg-white/20'}`} />
              {index < RECON_TIMELINE_EVENTS.length - 1 && <div className={`mt-2 h-10 w-[2px] ${event.status === 'done' ? 'bg-[#6366F1]/40' : 'bg-white/10'}`} />}
            </div>
            <div className="pb-6">
              <div className="text-[17px] font-bold text-white">{event.label}</div>
              <div className="mt-1 text-[13px] text-white/60">{event.time}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function UtrConsistencyCheckerCard() {
  return (
    <Card className="xl:col-span-7 p-8 border-white/10 bg-[#1C1F2E]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">UTR Consistency Checker</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Flag mismatches across webhook, poll, and statement before finance trusts the wrong payout</div>
        </div>
        <GlassUtilityPill tone="dark">1 mismatch</GlassUtilityPill>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
        <table className="w-full text-left text-[15px]">
          <thead className="bg-white/5 text-[12px] uppercase tracking-[0.09em] text-white/50">
            <tr>
              <th className="px-4 py-3">Intent</th>
              <th className="px-4 py-3">Webhook</th>
              <th className="px-4 py-3">Poll</th>
              <th className="px-4 py-3">Statement</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {UTR_CHECK_ROWS.map((row) => (
              <tr key={row.intent} className="border-t border-white/10 text-[15px] text-white">
                <td className="px-4 py-4 text-[15px] font-bold" style={{ fontFamily: FONT_MONO }}>{row.intent}</td>
                <td className="px-4 py-4">{row.webhook}</td>
                <td className="px-4 py-4">{row.poll}</td>
                <td className="px-4 py-4">{row.statement}</td>
                <td className="px-4 py-4 text-right">
                  <span
                    className={`inline-flex rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${
                      row.status === 'Aligned'
                        ? 'border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.12)] text-[#BBF7D0]'
                        : row.status === 'Mismatch'
                        ? 'border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.12)] text-[#FECACA]'
                        : 'border-[rgba(234,179,8,0.24)] bg-[rgba(234,179,8,0.12)] text-[#FEF3C7]'
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function StatementParserHealthCard() {
  return (
    <Card className="xl:col-span-5 p-8 border-white/10 bg-[#21253A]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Statement Parser Health</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Parser reliability check so missing statements do not silently drag trust scores down</div>
        </div>
        <GlassUtilityPill tone="accent">{PARSER_HEALTH.success}</GlassUtilityPill>
      </div>
      <div className="mt-6 space-y-4 rounded-[24px] border border-white/10 bg-white/10 p-6">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Latest file</div>
          <div className="mt-2 text-[17px] font-bold text-white">{PARSER_HEALTH.filename}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Received</div>
            <div className="mt-2 text-[24px] font-black tracking-[-0.03em] text-[#F0F2F5]">{PARSER_HEALTH.received}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Parse success</div>
            <div className="mt-2 text-[24px] font-black tracking-[-0.03em] text-[#F0F2F5]">{PARSER_HEALTH.success}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Total lines</div>
            <div className="mt-2 text-[24px] font-black tracking-[-0.03em] text-[#F0F2F5]">{PARSER_HEALTH.lines}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Parsed lines</div>
            <div className="mt-2 text-[24px] font-black tracking-[-0.03em] text-[#F0F2F5]">{PARSER_HEALTH.parsed}</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function OpenReconItemsCard() {
  const [activeIntent, setActiveIntent] = useState<string>(OPEN_RECON_ITEMS[0].intent)
  const activeRow = OPEN_RECON_ITEMS.find((row) => row.intent === activeIntent) ?? OPEN_RECON_ITEMS[0]

  return (
    <Card className="xl:col-span-6 min-h-[400px] p-8 border-white/10 bg-[#1C1F2E]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Cash Blocked in Recon</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Prioritized by amount, missing proof, and how long money has stayed unresolved</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right shadow-[0_12px_24px_rgba(99,102,241,0.10)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Active item</div>
            <div className="mt-1 text-[17px] font-bold text-[#F0F2F5]" style={{ fontFamily: FONT_MONO }}>{activeRow.intent}</div>
            <div className="text-xs text-[#A8AFBF]">{activeRow.missing}</div>
          </div>
          <GlassUtilityPill tone="smoke">Export</GlassUtilityPill>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-[22px] border border-white/10 bg-white/10 p-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Open amount</div>
          <div className="mt-2 text-[30px] font-black leading-none tracking-[-0.04em] text-[#F0F2F5]">₹9.18 L</div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/10 p-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Awaiting statement</div>
          <div className="mt-2 text-[30px] font-black leading-none tracking-[-0.04em] text-[#F0F2F5]">4</div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/10 p-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Oldest pending</div>
          <div className="mt-2 text-[30px] font-black leading-none tracking-[-0.04em] text-[#F0F2F5]">47.3m</div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
        <table className="w-full text-left text-[15px]">
          <thead className="bg-white/5 text-[12px] uppercase tracking-[0.09em] text-white/50">
            <tr>
              <th className="px-4 py-3">Intent</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Missing</th>
              <th className="px-4 py-3 text-right">Since Dispatch</th>
            </tr>
          </thead>
          <tbody>
            {OPEN_RECON_ITEMS.map((row) => (
              <tr
                key={row.intent}
                onMouseEnter={() => setActiveIntent(row.intent)}
                className={`border-t border-white/10 text-sm text-white transition-colors ${
                  row.intent === activeIntent ? 'bg-white/5' : 'hover:bg-white/5'
                }`}
              >
                <td className="px-4 py-4 text-[15px] font-bold" style={{ fontFamily: FONT_MONO }}>{row.intent}</td>
                <td className="px-4 py-4 font-semibold">{row.amount}</td>
                <td className="px-4 py-4 text-white/70">
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[13px] font-semibold text-[#A8AFBF]">
                    {row.missing}
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-semibold text-[#F0F2F5]">{row.since}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function ClosureByHourCard() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(CLOSURE_BY_HOUR.length - 1)
  const width = 620
  const height = 260
  const left = 22
  const right = 18
  const top = 18
  const bottom = 196
  const max = Math.max(...CLOSURE_BY_HOUR.map((item) => item.value))
  const step = (width - left - right) / (CLOSURE_BY_HOUR.length - 1)
  const getY = (value: number) => top + (1 - value / max) * (bottom - top)
  const areaPath =
    CLOSURE_BY_HOUR.map((item, index) => `${index === 0 ? 'M' : 'L'} ${left + index * step} ${getY(item.value)}`).join(' ') +
    ` L ${left + (CLOSURE_BY_HOUR.length - 1) * step} ${bottom} L ${left} ${bottom} Z`
  const linePath = CLOSURE_BY_HOUR.map((item, index) => `${index === 0 ? 'M' : 'L'} ${left + index * step} ${getY(item.value)}`).join(' ')
  const activePoint = hoveredIdx !== null ? CLOSURE_BY_HOUR[hoveredIdx] : null
  const activeX = hoveredIdx !== null ? left + hoveredIdx * step : 0
  const activeY = activePoint ? getY(activePoint.value) : 0

  return (
    <Card className="xl:col-span-6 min-h-[400px] p-8 border-white/10 bg-[#21253A]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Trust Restoration by Hour</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">When unresolved payouts move back into a defensible, close-ready state</div>
        </div>
        {activePoint && (
          <motion.div
            key={activePoint.bucket}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right shadow-[0_12px_24px_rgba(99,102,241,0.10)]"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">{activePoint.bucket}</div>
            <div className="mt-1 text-xl font-extrabold text-[#F0F2F5]">{activePoint.value}</div>
            <div className="text-xs text-[#A8AFBF]">closures</div>
          </motion.div>
        )}
      </div>

      <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 p-5">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[240px] w-full">
          <defs>
            <linearGradient id="closure-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = top + (bottom - top) * tick
            return <line key={tick} x1={left} y1={y} x2={width - right} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          })}
          {hoveredIdx !== null && (
            <rect x={Math.max(left, activeX - step / 2)} y={top} width={step} height={bottom - top + 14} rx="22" fill="rgba(99,102,241,0.06)" />
          )}
          <path d={areaPath} fill="url(#closure-area-fill)" />
          <path d={linePath} fill="none" stroke="#6366F1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {activePoint && <line x1={activeX} y1={top} x2={activeX} y2={bottom + 6} stroke="rgba(99,102,241,0.16)" strokeWidth="1.5" strokeDasharray="4 5" />}
          {CLOSURE_BY_HOUR.map((item, index) => {
            const x = left + index * step
            const y = getY(item.value)
            const isActive = hoveredIdx === index
            return (
              <g key={item.bucket}>
                {isActive && (
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="rgba(99,102,241,0.10)"
                    animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <circle cx={x} cy={y} r="6.5" fill="#fff" stroke="#6366F1" strokeWidth="3" />
                <rect x={x - step / 2} y={top} width={step} height={bottom - top + 16} fill="transparent" onMouseEnter={() => setHoveredIdx(index)} />
                <text x={x} y="236" fontSize="12" fill="#A8AFBF" textAnchor="middle">
                  {item.bucket}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </Card>
  )
}

function AmountVarianceCard() {
  const [activeVariance, setActiveVariance] = useState<string>(VARIANCE_ROWS[1].intent)
  const highlightedVariance = VARIANCE_ROWS.find((row) => row.intent === activeVariance) ?? VARIANCE_ROWS[1]

  return (
    <Card className="xl:col-span-7 p-8 border-white/10 bg-[#1C1F2E]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Variance Leakage Register</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Where settled value diverges from intended value and threatens close accuracy</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right shadow-[0_12px_24px_rgba(99,102,241,0.08)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Largest gap</div>
            <div className="mt-1 text-[17px] font-bold text-[#F0F2F5]" style={{ fontFamily: FONT_MONO }}>{highlightedVariance.intent}</div>
            <div className="text-xs text-[#F0F2F5]">{highlightedVariance.variance}</div>
          </div>
          <GlassUtilityPill tone="smoke">Export</GlassUtilityPill>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-[22px] border border-white/10 bg-white/10 p-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Flagged intents</div>
          <div className="mt-2 text-[30px] font-black leading-none tracking-[-0.04em] text-[#F0F2F5]">4</div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/10 p-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Cross-period</div>
          <div className="mt-2 text-[30px] font-black leading-none tracking-[-0.04em] text-[#F0F2F5]">2</div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/10 p-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Net variance</div>
          <div className="mt-2 text-[30px] font-black leading-none tracking-[-0.04em] text-[#F0F2F5]">₹11.9 K</div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
        <table className="w-full text-left text-[15px]">
          <thead className="bg-white/5 text-[12px] uppercase tracking-[0.09em] text-white/50">
            <tr>
              <th className="px-4 py-3">Intent</th>
              <th className="px-4 py-3">Intended</th>
              <th className="px-4 py-3">Settled</th>
              <th className="px-4 py-3">Variance</th>
              <th className="px-4 py-3 text-right">Cross Period</th>
            </tr>
          </thead>
          <tbody>
            {VARIANCE_ROWS.map((row) => (
              <tr
                key={row.intent}
                onMouseEnter={() => setActiveVariance(row.intent)}
                className={`border-t border-white/10 text-sm text-white transition-colors ${
                  row.intent === activeVariance ? 'bg-white/5' : 'hover:bg-white/5'
                }`}
              >
                <td className="px-4 py-4 text-[15px] font-bold" style={{ fontFamily: FONT_MONO }}>{row.intent}</td>
                <td className="px-4 py-4">{row.intended}</td>
                <td className="px-4 py-4">{row.settled}</td>
                <td className="px-4 py-4 font-semibold text-[#F0F2F5]">{row.variance}</td>
                <td className="px-4 py-4 text-right text-white/70">
                  <span className={`inline-flex rounded-full px-4 py-1.5 text-[13px] font-semibold ${
                    row.crossPeriod === 'Yes' ? 'bg-indigo-500/10 text-[#F0F2F5]' : 'bg-white/5 text-[#A8AFBF]'
                  }`}>
                    {row.crossPeriod}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function AutoManualClosureCard() {
  const [activeClosure, setActiveClosure] = useState<string>(AUTO_MANUAL_CLOSURE[0].name)

  return (
    <Card className="xl:col-span-5 p-8 border-white/10 bg-[#21253A]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Evidence Automation Coverage</div>
      <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">How much trust is restored automatically versus handed to manual finance review</div>

      <div className="mt-6 flex items-center gap-6 rounded-2xl border border-white/10 bg-white/10 p-5">
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full" style={{ background: `conic-gradient(${AUTO_MANUAL_CLOSURE[0].color} 0 ${AUTO_MANUAL_CLOSURE[0].pct}%, ${AUTO_MANUAL_CLOSURE[1].color} ${AUTO_MANUAL_CLOSURE[0].pct}% 100%)` }}>
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#1C1F2E] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]">
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Auto</div>
            <div className="text-[30px] font-black leading-none tracking-[-0.04em] text-white">{AUTO_MANUAL_CLOSURE[0].pct}%</div>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {AUTO_MANUAL_CLOSURE.map((item) => (
            <motion.div
              key={item.name}
              onMouseEnter={() => setActiveClosure(item.name)}
              whileHover={{ y: -2 }}
              className={`rounded-2xl border p-4 transition-colors ${
                activeClosure === item.name ? 'border-white/10 bg-white/10 shadow-[0_12px_24px_rgba(99,102,241,0.08)]' : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-[17px] font-bold text-white">{item.name}</div>
                <div className="text-[17px] font-bold text-white">{item.pct}%</div>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-white/10">
                <div className="h-2.5 rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
              </div>
            </motion.div>
          ))}
          <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
            <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-white/50">Statement parser health</div>
            <div className="mt-2 text-lg font-semibold text-white">Healthy</div>
            <div className="mt-1 text-xs text-[#A8AFBF]">{activeClosure === 'Auto-close' ? 'Auto-closure remains dominant this window' : 'Manual review share increased in flagged cohorts'}</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function CrossPeriodFlagsCard() {
  return (
    <Card className="xl:col-span-5 min-h-[400px] p-8 border-white/10 bg-[#1C1F2E]/95 backdrop-blur-[20px] ring-1 ring-white/10 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold tracking-[-0.03em] text-[#F0F2F5]">Period-Boundary Leakage</div>
          <div className="mt-2 text-[17px] leading-7 text-[#A8AFBF]">Transactions settling outside intended close windows and distorting period reporting</div>
        </div>
        <GlassUtilityPill tone="smoke">Export</GlassUtilityPill>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {CROSS_PERIOD_FLAGS.map((row) => (
          <motion.div
            key={row.intent}
            whileHover={{ y: -3, scale: 1.01 }}
            className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(39,44,68,0.96),rgba(28,31,46,0.92))] p-5 shadow-[0_14px_30px_rgba(99,102,241,0.10)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[16px] font-bold text-[#F0F2F5]" style={{ fontFamily: FONT_MONO }}>{row.intent}</div>
                <div className="mt-3 text-[30px] font-black leading-none tracking-[-0.04em] text-[#F0F2F5]">{row.variance}</div>
              </div>
              <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[12px] font-semibold text-[#F0F2F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                {row.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}

function ReconciliationIntelligenceContent() {
  return (
    <>
      <DashboardKpiStrip items={RECON_KPI_ITEMS} />

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <SignalCoverageMatrixProofCard />
        <ConfidenceDistributionCard />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <ReconTimelineIntentCard />
        <UtrConsistencyCheckerCard />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <OpenReconItemsCard />
        <StatementParserHealthCard />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <ClosureByHourCard />
        <AutoManualClosureCard />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <AmountVarianceCard />
        <CrossPeriodFlagsCard />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <SignalCoverageCard />
      </section>
    </>
  )
}

export default function CorePage() {
  const [activeTab, setActiveTab] = useState('Command Center')
  const header = TAB_CONFIG[activeTab] ?? TAB_CONFIG['Command Center']
  const isPayoutTab = activeTab === 'Payout Intelligence'
  const isReconTab = activeTab === 'Reconciliation Intelligence'

  return (
    <DashboardLayout mainClassName="max-w-none px-5 md:px-5">
      <div className="relative z-0 font-sans">
        <div className="pointer-events-none fixed inset-0 z-0" style={{ background: CORE_PAGE_BG }} />
        <div className="pointer-events-none fixed inset-0 z-0" style={{ background: CORE_PAGE_SPOTS }} />
        <div className="pointer-events-none fixed left-0 top-[22%] z-0 h-px w-[120%] origin-left -rotate-[7deg] bg-gradient-to-r from-transparent via-black/5 to-transparent" />
        <div className="pointer-events-none fixed left-0 top-[54%] z-0 h-px w-[120%] origin-left -rotate-[7deg] bg-gradient-to-r from-transparent via-black/5 to-transparent" />

        <div className="relative z-10">
          <section className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-[820px]">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-[0.18em]"
                style={{
                  color: TEXT_ON_STRONG,
                  background: 'linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: NEO_RAISED_SHADOW,
                }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: NEO_ACTIVE }} />
                {header.eyebrow}
              </div>
              <h1 className="mt-5 text-[40px] font-black leading-none tracking-[-0.05em]" style={{ color: PAGE_TEXT }}>
                {header.title}
              </h1>
              <p className="mt-3 text-[18px] leading-8" style={{ color: PAGE_MUTED }}>
                {header.subtitle}
              </p>
            </div>

            <button
              className="inline-flex items-center gap-2 rounded-[18px] px-4 py-3 transition-colors"
              style={{
                color: TEXT_ON_STRONG,
                background: 'linear-gradient(180deg, #21253A 0%, #1C1F2E 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: NEO_RAISED_SHADOW,
              }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v2m0 8v2m-6-6h2m8 0h2m-1.657-5.657-1.414 1.414m-6.586 6.586-1.414 1.414m0-11.314 1.414 1.414m6.586 6.586 1.414 1.414" />
              </svg>
              <span className="text-[13px] font-bold uppercase tracking-[0.14em]">Tune Layout</span>
            </button>
          </section>

          <LiquidGlassTabs
            active={activeTab}
            onChange={(value) => setActiveTab(value)}
            items={[
              { id: 'Command Center', label: 'Command Center' },
              { id: 'Payout Intelligence', label: 'Payout Intelligence' },
              { id: 'Reconciliation Intelligence', label: 'Reconciliation Intelligence' },
            ] as const}
          />

          <TopMetricsToolbar variant="plum" />

          {isPayoutTab ? <PayoutIntelligenceContent /> : isReconTab ? <ReconciliationIntelligenceContent /> : <CommandCenterContent />}
        </div>
      </div>
    </DashboardLayout>
  )
}
