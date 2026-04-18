'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type GlyphName =
  | 'home'
  | 'document'
  | 'menu-dots'
  | 'search'
  | 'users'
  | 'bank'
  | 'folder'
  | 'shield'
  | 'grid'
  | 'eye'
  | 'zap'
  | 'refresh'
  | 'arrow-up-right'
  | 'chart'

type DockId = 'home' | 'workspace' | 'recoveries' | 'grid' | 'sync' | 'proof'
type WorkspaceTab = 'Today' | 'Routing' | 'Proof' | 'Banks'

const DASHBOARD_FONT_STACK = '"DM Sans", "Geist", "Plus Jakarta Sans", "Inter", system-ui, sans-serif'

function Glyph({ name, className = '' }: { name: GlyphName; className?: string }) {
  const base = `inline-block ${className}`

  switch (name) {
    case 'home':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M4 8.6 10 3.8l6 4.8v7.1H4V8.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M8.2 15.7v-4.6h3.6v4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'arrow-up-right':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M6 14 14 6M8 6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'document':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M6 3.8h5.8L15 7v9.2A1.8 1.8 0 0 1 13.2 18H6.8A1.8 1.8 0 0 1 5 16.2V5.6A1.8 1.8 0 0 1 6.8 3.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M11.8 3.8V7H15M7.8 10.2h4.8M7.8 13h4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'menu-dots':
      return <svg className={base} viewBox="0 0 20 20" fill="currentColor"><circle cx="5" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="15" cy="10" r="1.6" /></svg>
    case 'search':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5.8" stroke="currentColor" strokeWidth="1.7" /><path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
    case 'users':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M6.2 9.3a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2ZM13.8 8.6a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" stroke="currentColor" strokeWidth="1.5" /><path d="M2.8 15.8c.3-2.5 2.4-4.3 5.1-4.3s4.8 1.8 5.1 4.3M11.4 15.8c.2-1.9 1.8-3.2 3.9-3.2 1 0 2 .3 2.7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    case 'bank':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M3 7.2 10 3l7 4.2M4.5 8.5v6.8M8 8.5v6.8M12 8.5v6.8M15.5 8.5v6.8M2.5 16.5h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'folder':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M3.5 6.2A2.2 2.2 0 0 1 5.7 4h2l1.6 1.6h5a2.2 2.2 0 0 1 2.2 2.2v6.5a2.2 2.2 0 0 1-2.2 2.2H5.7a2.2 2.2 0 0 1-2.2-2.2V6.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
    case 'shield':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M10 2.5 4.5 4.8v4.5c0 4 2.3 6.3 5.5 8.2 3.2-1.9 5.5-4.2 5.5-8.2V4.8L10 2.5Z" stroke="currentColor" strokeWidth="1.6" /><path d="m7.3 10.1 1.8 1.8 3.6-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'grid':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="12" y="3" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="12" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="12" y="12" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" /></svg>
    case 'eye':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" stroke="currentColor" strokeWidth="1.6" /><circle cx="10" cy="10" r="2.4" fill="currentColor" /></svg>
    case 'zap':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M10.7 2.8 5.8 10h3l-.5 7.2 5-7.3h-3l.4-7.1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'refresh':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M16 6.5V3.8l-2.6 2.3A6.2 6.2 0 1 0 16 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'chart':
      return <svg className={base} viewBox="0 0 20 20" fill="none"><path d="M4 14.5V9.5M10 14.5V5.5M16 14.5V7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M3 16.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    default:
      return null
  }
}

const dockItems: Array<{ id: DockId; label: string; title: string; summary: string; icon: GlyphName }> = [
  {
    id: 'home',
    label: 'Home',
    title: 'Home overview',
    summary: 'The high-signal operating overview for payout value, provider posture, recovery lift, and next-action intelligence.',
    icon: 'home',
  },
  {
    id: 'workspace',
    label: 'Command',
    title: 'Payout command view',
    summary: 'The main operating workspace for routed value, live recovery, and finance-ready evidence.',
    icon: 'folder',
  },
  {
    id: 'recoveries',
    label: 'Recoveries',
    title: 'Recovery console',
    summary: 'Track reroutes, provider lift, and recovered payout value without leaving the operating surface.',
    icon: 'zap',
  },
  {
    id: 'grid',
    label: 'Grid',
    title: 'Operations grid',
    summary: 'See the live intent table, team handoff pressure, heat maps, and operating patterns in one grid.',
    icon: 'grid',
  },
  {
    id: 'sync',
    label: 'Sync',
    title: 'Live sync board',
    summary: 'Monitor payment sync performance, connector drift, and analyzed trends across the full movement graph.',
    icon: 'refresh',
  },
  {
    id: 'proof',
    label: 'Proof',
    title: 'Proof desk',
    summary: 'Track export readiness, evidence coverage, and finance-close confidence from one place.',
    icon: 'document',
  },
] as const

const workspaceTabs: WorkspaceTab[] = ['Today', 'Routing', 'Proof', 'Banks']

const workspacePromptCopy = {
  Today: {
    question: 'What should the intelligence layer analyze inside the payout command view?',
    supporting: 'Grounded on routed value, callback timing, bank-side movement, and export readiness already visible in the workspace.',
    suggestions: [
      'Show where routed value is concentrating right now',
      'Clarify which issue belongs to bank-side operations',
      'What is delaying proof export today?',
    ],
  },
  Routing: {
    question: 'Which provider lane needs the next routing decision?',
    supporting: 'Grounded on provider posture, overflow pressure, and confirmation drift already visible in the workspace.',
    suggestions: [
      'Which route should take overflow next?',
      'What is still degraded after the reroute?',
      'Show the lane with the highest callback risk',
    ],
  },
  Proof: {
    question: 'Which payout packets are closest to close-ready proof right now?',
    supporting: 'Grounded on callbacks, statement cues, export queue state, and finance readiness already visible in the workspace.',
    suggestions: [
      'Which proof pack can finance close now?',
      'What evidence is still missing today?',
      'Show the delayed export queue',
    ],
  },
  Banks: {
    question: 'Where is bank-side behavior still slowing clean confirmation?',
    supporting: 'Grounded on bank callbacks, statement lag, pending finality, and active escalation cues already visible in the workspace.',
    suggestions: [
      'Which bank hotspot needs escalation first?',
      'Show callback lag by bank cluster',
      'What is blocking clean finality now?',
    ],
  },
} as const

const workspaceTiles = [
  { icon: 'folder' as GlyphName, title: 'Intelligence workspace', body: 'Read routed value, live exceptions, and finance evidence from one operating surface.' },
  { icon: 'users' as GlyphName, title: 'Ownership routing', body: 'Clarify whether the next move belongs to ops, finance, engineering, or bank-side follow-up.' },
  { icon: 'bank' as GlyphName, title: 'Bank coordination', body: 'Surface callback lag and bank-side drift before they begin blocking clean confirmation.' },
  { icon: 'shield' as GlyphName, title: 'Provider guardrail', body: 'Keep route posture visible while traffic shifts around degraded providers and overflow lanes.' },
] as const

type HomeSimulation = {
  prompt: string
  keywords: readonly string[]
  metric: string
  title: string
  summary: string
  tooltipValue: string
  tooltipDelta: string
  tooltipNote: string
  range: readonly [number, number]
  salesValue: string
  expensesValue: string
  budgetValue: string
  insightText: string
  insightValue: string
}

type WorkspaceSimulation = {
  prompt: string
  keywords: readonly string[]
  question: string
  supporting: string
  assistant: string
  heroLabel: string
  heroValue: string
  heroBars: readonly number[]
  listTitle: string
  listRows: readonly [string, string][]
  listFooter: string
  listAction: string
  statTitle: string
  statValue: string
  statNote: string
  compareLabels: readonly [string, string]
  bottomTitle: string
  bottomValue: string
  bottomMeta: string
  moduleBodies: readonly string[]
}

const homeSimulationScenarios: readonly HomeSimulation[] = [
  {
    prompt: 'What changed across routed payout quality?',
    keywords: ['quality', 'routed', 'reroute', 'income', 'payout'],
    metric: '$1,651,045,139',
    title: 'Payout income',
    summary: 'Payout income accelerated after overflow moved away from degraded PSP lanes and into healthier routes.',
    tooltipValue: '$115k',
    tooltipDelta: '+32%',
    tooltipNote: 'Income growth to end the half-year.',
    range: [20, 50],
    salesValue: '$141,7k',
    expensesValue: '$17,2k',
    budgetValue: '$92,1k',
    insightText: 'The reroute shift lifted cleared payout quality and reduced exception drag across the period.',
    insightValue: '$57,6k',
  },
  {
    prompt: 'Why did proof readiness shift this cycle?',
    keywords: ['proof', 'readiness', 'export', 'evidence', 'finance'],
    metric: '$1,598,204,711',
    title: 'Finance-ready value',
    summary: 'Proof coverage improved after callback packets and bank references were stitched into export-ready bundles.',
    tooltipValue: '$92k',
    tooltipDelta: '+18%',
    tooltipNote: 'Proof-ready growth through the close window.',
    range: [24, 54],
    salesValue: '$136,2k',
    expensesValue: '$15,8k',
    budgetValue: '$88,4k',
    insightText: 'Proof readiness rose once delayed callbacks and statement cues converged inside the same cycle.',
    insightValue: '$49,1k',
  },
  {
    prompt: 'Where is bank-side confirmation still lagging?',
    keywords: ['bank', 'confirmation', 'lag', 'callback', 'statement'],
    metric: '$1,622,408,553',
    title: 'Confirmed payout value',
    summary: 'Confirmed value recovered as callback lag eased across the highest-volume bank corridors and manual trails dropped.',
    tooltipValue: '$104k',
    tooltipDelta: '+21%',
    tooltipNote: 'Confirmation lift after callback lag normalized.',
    range: [18, 46],
    salesValue: '$132,8k',
    expensesValue: '$18,4k',
    budgetValue: '$90,6k',
    insightText: 'Bank-side lag is now concentrated in fewer corridors, so the graph tightens once callback drift clears.',
    insightValue: '$53,8k',
  },
] as const

const workspaceSimulationScenarios: Record<WorkspaceTab, readonly WorkspaceSimulation[]> = {
  Today: [
    {
      prompt: 'Show where routed value is concentrating right now',
      keywords: ['routed', 'value', 'concentrating', 'where', 'today'],
      question: 'What should the intelligence layer analyze inside the payout command view?',
      supporting: 'Grounded on routed value, callback timing, bank-side movement, and export readiness already visible in the workspace.',
      assistant: 'Recovered routed value is concentrating in the Razorpay and Stripe overflow lanes after traffic shifted away from degraded PSP routes. Bank-side delay is low there, so ops can keep the current distribution while finance uses those intents for proof-first close.',
      heroLabel: 'Command scope clean payouts',
      heroValue: '1,231',
      heroBars: [3, 3, 11, 18, 9, 6, 2, 4, 3, 3, 3],
      listTitle: 'Provider posture',
      listRows: [['Razorpay', '99.1%'], ['Cashfree', '98.4%'], ['PayU', '91.6%']],
      listFooter: '+19 more routes',
      listAction: 'View all providers',
      statTitle: 'Recovery intelligence',
      statValue: '+65.5%',
      statNote: 'Routed value recovered this cycle',
      compareLabels: ['Previous cycle', 'Current cycle'],
      bottomTitle: 'Escalations ready',
      bottomValue: '459',
      bottomMeta: 'Provider and bank-side issues packaged for operator review.',
      moduleBodies: [
        'Read routed value, live exceptions, and finance evidence from one operating surface.',
        'Clarify whether the next move belongs to ops, finance, engineering, or bank-side follow-up.',
        'Surface callback lag and bank-side drift before they begin blocking clean confirmation.',
        'Keep route posture visible while traffic shifts around degraded providers and overflow lanes.',
      ],
    },
    {
      prompt: 'Clarify which issue belongs to bank-side operations',
      keywords: ['bank-side', 'bank', 'operations', 'ownership', 'issue'],
      question: 'Which payout issues should move into bank-side operations first?',
      supporting: 'Grounded on callback lag, finality status, and bank-side drift already visible in the workspace.',
      assistant: 'Bank-side operations should take the intents still waiting on statement-side confirmation and callback recovery, especially where provider posture is already healthy. Ops can leave route configuration unchanged and move the next action to bank follow-up.',
      heroLabel: 'Bank-side ownership queue',
      heroValue: '84',
      heroBars: [2, 4, 7, 10, 12, 9, 8, 6, 5, 4, 3],
      listTitle: 'Bank clusters',
      listRows: [['ICICI', '27'], ['HDFC', '18'], ['Axis', '12']],
      listFooter: '+6 more hotspots',
      listAction: 'View bank queues',
      statTitle: 'Confirmation drift',
      statValue: '+12.4%',
      statNote: 'Bank-side review pressure',
      compareLabels: ['Callback', 'Statement'],
      bottomTitle: 'Escalations ready',
      bottomValue: '31',
      bottomMeta: 'Intents packaged for bank-side confirmation review.',
      moduleBodies: [
        'Read bank-side lag, pending callbacks, and operator notes from one ownership lane.',
        'Clarify whether the next move belongs to ops or statement-side follow-up.',
        'Surface the banks where callback lag is already slowing clean confirmation.',
        'Keep provider posture visible while bank-side work clears the remaining finality gap.',
      ],
    },
    {
      prompt: 'What is delaying proof export today?',
      keywords: ['proof', 'export', 'delaying', 'delay', 'today'],
      question: 'What is delaying proof export today?',
      supporting: 'Grounded on export queues, callback completion, and finance bundle readiness already visible in the workspace.',
      assistant: 'Proof export is still gated by missing callback attachments and late bank references on a narrow set of intents. The queue is small enough to clear today, but finance should prioritize packets where provider logs and callback proofs are already paired.',
      heroLabel: 'Proof packs ready',
      heroValue: '142',
      heroBars: [2, 3, 8, 13, 10, 7, 4, 6, 3, 2, 2],
      listTitle: 'Evidence sources',
      listRows: [['Statements', '41'], ['Callbacks', '62'], ['Exports', '39']],
      listFooter: '+8 pending bundles',
      listAction: 'Review proof queue',
      statTitle: 'Close confidence',
      statValue: '84.2%',
      statNote: 'Finance-ready proof confidence',
      compareLabels: ['Audit', 'Close'],
      bottomTitle: 'Export queue',
      bottomValue: '27',
      bottomMeta: 'Proof packets waiting on final callback or statement cues.',
      moduleBodies: [
        'Read export coverage, callback completion, and finance evidence from one proof lane.',
        'Clarify whether the next move belongs to finance, ops, or engineering trace review.',
        'Surface bank-side gaps before they begin blocking proof close.',
        'Keep provider posture visible while teams clear the delayed export queue.',
      ],
    },
  ],
  Routing: [
    {
      prompt: 'Which route should take overflow next?',
      keywords: ['route', 'overflow', 'next', 'routing'],
      question: 'Which provider lane needs the next routing decision?',
      supporting: 'Grounded on provider posture, overflow pressure, and confirmation drift already visible in the workspace.',
      assistant: 'Overflow should move into Razorpay and Stripe first because both lanes are clearing with lower callback lag than the degraded partners. Keep Cashfree live for resilience, but do not route the next burst there until confirmation volatility settles.',
      heroLabel: 'Overflow recovery lanes',
      heroValue: '62',
      heroBars: [2, 5, 9, 14, 13, 10, 8, 6, 4, 3, 2],
      listTitle: 'Route candidates',
      listRows: [['Razorpay', 'Primary'], ['Stripe', 'Overflow'], ['Cashfree', 'Fallback']],
      listFooter: '+4 more lanes',
      listAction: 'Open routing map',
      statTitle: 'Recovery rate',
      statValue: '+24.7%',
      statNote: 'Recovered after reroute',
      compareLabels: ['Primary', 'Overflow'],
      bottomTitle: 'Action queue',
      bottomValue: '18',
      bottomMeta: 'Routing decisions ready for the next operator pass.',
      moduleBodies: [
        'Read route health, overflow allocation, and fallback depth from one routing surface.',
        'Clarify whether the next move is a reroute, throttle, or bank-side watch.',
        'Surface the banks still constraining the highest-performing routes.',
        'Keep degraded providers visible while traffic shifts around overflow lanes.',
      ],
    },
  ],
  Proof: [
    {
      prompt: 'Which proof pack can finance close now?',
      keywords: ['proof', 'finance', 'close', 'pack'],
      question: 'Which payout packets are closest to close-ready proof right now?',
      supporting: 'Grounded on callbacks, statement cues, export queue state, and finance readiness already visible in the workspace.',
      assistant: 'Finance can close the packets where callback proofs and statement references are already paired. The remaining risk sits in a smaller band of intents still waiting on statement-side confirmation or export assembly.',
      heroLabel: 'Proof packs ready',
      heroValue: '142',
      heroBars: [2, 3, 8, 13, 10, 7, 4, 6, 3, 2, 2],
      listTitle: 'Proof sources',
      listRows: [['Callbacks', '62'], ['Statements', '41'], ['Provider logs', '39']],
      listFooter: '+11 missing packets',
      listAction: 'Open proof desk',
      statTitle: 'Close confidence',
      statValue: '84.2%',
      statNote: 'Finance-ready proof confidence',
      compareLabels: ['Queued', 'Ready'],
      bottomTitle: 'Export queue',
      bottomValue: '27',
      bottomMeta: 'Packets still waiting on final assembly before close.',
      moduleBodies: [
        'Read proof coverage, source parity, and export readiness from one finance surface.',
        'Clarify whether the next move belongs to finance close or evidence assembly.',
        'Surface bank-side gaps before they begin blocking packet completion.',
        'Keep route posture visible while the export queue is being cleared.',
      ],
    },
  ],
  Banks: [
    {
      prompt: 'Which bank hotspot needs escalation first?',
      keywords: ['bank', 'hotspot', 'escalation', 'first'],
      question: 'Where is bank-side behavior still slowing clean confirmation?',
      supporting: 'Grounded on bank callbacks, statement lag, pending finality, and active escalation cues already visible in the workspace.',
      assistant: 'The first escalation should go to the bank clusters where callback lag remains high even after reroute pressure eased. Those hotspots are now the primary blocker to clean finality, not provider posture.',
      heroLabel: 'Bank-side exposure',
      heroValue: '27',
      heroBars: [2, 4, 5, 7, 9, 11, 10, 8, 6, 4, 3],
      listTitle: 'Bank hotspots',
      listRows: [['ICICI', 'High'], ['Axis', 'Medium'], ['SBI', 'Watch']],
      listFooter: '+5 more banks',
      listAction: 'View bank queues',
      statTitle: 'Callback drift',
      statValue: '+9.8%',
      statNote: 'Pending finality pressure',
      compareLabels: ['Callback', 'Statement'],
      bottomTitle: 'Bank escalations',
      bottomValue: '12',
      bottomMeta: 'High-priority bank follow-ups ready for review.',
      moduleBodies: [
        'Read bank-side drift, callback lag, and finality pressure from one oversight lane.',
        'Clarify whether the next move belongs to bank ops or routing rebalancing.',
        'Surface which bank hotspots still block clean confirmation despite healthy provider posture.',
        'Keep provider and proof posture visible while bank-side work clears the remaining gap.',
      ],
    },
  ],
}

function resolvePromptScenario<T extends { keywords: readonly string[]; prompt: string }>(
  prompt: string,
  scenarios: readonly T[],
  fallback: T,
) {
  const lowerPrompt = prompt.toLowerCase()
  let bestMatch = fallback
  let bestScore = 0

  for (const scenario of scenarios) {
    const keywordScore = scenario.keywords.reduce((score, keyword) => score + (lowerPrompt.includes(keyword) ? 1 : 0), 0)
    const exactPromptBoost = lowerPrompt.includes(scenario.prompt.toLowerCase()) ? 2 : 0
    const score = keywordScore + exactPromptBoost
    if (score > bestScore) {
      bestMatch = scenario
      bestScore = score
    }
  }

  return bestMatch
}

const homeOverviewData = [
  { point: 1, month: 'Jan', routed: 64, trend: 52, selected: false },
  { point: 2, month: 'Jan', routed: 72, trend: 55, selected: false },
  { point: 3, month: 'Jan', routed: 68, trend: 53, selected: false },
  { point: 4, month: 'Feb', routed: 61, trend: 57, selected: false },
  { point: 5, month: 'Feb', routed: 59, trend: 56, selected: false },
  { point: 6, month: 'Feb', routed: 78, trend: 59, selected: false },
  { point: 7, month: 'Feb', routed: 82, trend: 61, selected: true },
  { point: 8, month: 'Mar', routed: 88, trend: 64, selected: true },
  { point: 9, month: 'Mar', routed: 94, trend: 68, selected: true },
  { point: 10, month: 'Mar', routed: 97, trend: 72, selected: true },
  { point: 11, month: 'Mar', routed: 101, trend: 76, selected: true },
  { point: 12, month: 'Apr', routed: 96, trend: 74, selected: true },
  { point: 13, month: 'Apr', routed: 103, trend: 77, selected: true },
  { point: 14, month: 'Apr', routed: 92, trend: 73, selected: true },
  { point: 15, month: 'Apr', routed: 87, trend: 69, selected: true },
  { point: 16, month: 'May', routed: 79, trend: 66, selected: false },
  { point: 17, month: 'May', routed: 74, trend: 64, selected: false },
  { point: 18, month: 'May', routed: 77, trend: 67, selected: false },
  { point: 19, month: 'Jun', routed: 83, trend: 71, selected: false },
  { point: 20, month: 'Jun', routed: 90, trend: 76, selected: false },
  { point: 21, month: 'Jun', routed: 93, trend: 79, selected: false },
  { point: 22, month: 'Jul', routed: 88, trend: 73, selected: false },
  { point: 23, month: 'Jul', routed: 84, trend: 69, selected: false },
  { point: 24, month: 'Jul', routed: 86, trend: 72, selected: false },
  { point: 25, month: 'Aug', routed: 95, trend: 78, selected: false },
  { point: 26, month: 'Aug', routed: 99, trend: 82, selected: false },
  { point: 27, month: 'Aug', routed: 91, trend: 76, selected: false },
  { point: 28, month: 'Sep', routed: 98, trend: 81, selected: false },
  { point: 29, month: 'Sep', routed: 102, trend: 85, selected: false },
  { point: 30, month: 'Sep', routed: 107, trend: 89, selected: false },
] as const

const recoveryTrendData = [
  { month: 'Jan', value: 41, baseline: 34 },
  { month: 'Feb', value: 46, baseline: 37 },
  { month: 'Mar', value: 52, baseline: 39 },
  { month: 'Apr', value: 58, baseline: 42 },
  { month: 'May', value: 63, baseline: 46 },
  { month: 'Jun', value: 72, baseline: 49 },
  { month: 'Jul', value: 69, baseline: 50 },
  { month: 'Aug', value: 76, baseline: 53 },
  { month: 'Sep', value: 81, baseline: 56 },
] as const

const recoveryMix = [
  { name: 'Primary', value: 45 },
  { name: 'Overflow', value: 85 },
  { name: 'Fallback', value: 48 },
  { name: 'Manual', value: 22 },
] as const

const recoveryWatchlist = [
  { name: 'Razorpay', value: '₹18.4L', delta: '-0.92%' },
  { name: 'Stripe', value: '₹11.2L', delta: '+1.87%' },
  { name: 'Cashfree', value: '₹9.8L', delta: '-0.45%' },
  { name: 'Fallbacks', value: '₹15.4L', delta: '+0.64%' },
] as const

const intentRows = [
  { intent: 'PAYOUT_24118', owner: 'Ops', risk: 'High', proof: 'Pending', next: 'Bank follow-up' },
  { intent: 'PAYOUT_24109', owner: 'Finance', risk: 'Medium', proof: 'Ready', next: 'Close packet' },
  { intent: 'PAYOUT_24097', owner: 'Engineering', risk: 'High', proof: 'Missing', next: 'Webhook trace' },
  { intent: 'PAYOUT_24084', owner: 'Ops', risk: 'Low', proof: 'Ready', next: 'Reroute check' },
  { intent: 'PAYOUT_24071', owner: 'Bank Ops', risk: 'High', proof: 'Pending', next: 'Escalation' },
  { intent: 'PAYOUT_24063', owner: 'Finance', risk: 'Medium', proof: 'Ready', next: 'Export now' },
] as const

const spiderData = [
  { subject: 'Routing', value: 86 },
  { subject: 'Callback', value: 72 },
  { subject: 'Proof', value: 81 },
  { subject: 'Banking', value: 68 },
  { subject: 'Recovery', value: 76 },
  { subject: 'Handoff', value: 71 },
] as const

const gridBarData = [
  { label: 'Ops', open: 44, cleared: 29 },
  { label: 'Finance', open: 31, cleared: 26 },
  { label: 'Engineering', open: 18, cleared: 11 },
  { label: 'Bank Ops', open: 27, cleared: 16 },
] as const

const heatMap = [
  [3, 5, 4, 2, 1, 0],
  [5, 7, 6, 4, 2, 1],
  [7, 9, 8, 5, 4, 2],
  [6, 8, 9, 7, 5, 3],
] as const

const syncTrendData = [
  { point: '08:00', payments: 62, webhooks: 54, statements: 44 },
  { point: '10:00', payments: 75, webhooks: 61, statements: 49 },
  { point: '12:00', payments: 84, webhooks: 72, statements: 55 },
  { point: '14:00', payments: 93, webhooks: 76, statements: 63 },
  { point: '16:00', payments: 88, webhooks: 73, statements: 60 },
  { point: '18:00', payments: 95, webhooks: 82, statements: 68 },
  { point: '20:00', payments: 90, webhooks: 79, statements: 64 },
] as const

const syncPieData = [
  { name: 'Payments', value: 46 },
  { name: 'Webhooks', value: 31 },
  { name: 'Statements', value: 23 },
] as const

const syncBarData = [
  { name: 'Razorpay', lag: 118, retries: 12 },
  { name: 'Stripe', lag: 92, retries: 8 },
  { name: 'Cashfree', lag: 141, retries: 18 },
  { name: 'ICICI', lag: 167, retries: 22 },
] as const

const proofRows = [
  { name: 'Export queue', value: '27', note: 'Still waiting on final assembly' },
  { name: 'Ready packets', value: '142', note: 'Finance-ready this cycle' },
  { name: 'Audit confidence', value: '84.2%', note: 'Valid evidence chain present' },
  { name: 'Missing sources', value: '11', note: 'Need callback or statement cues' },
] as const

const proofSourceData = [
  { name: 'Callbacks', value: 41 },
  { name: 'Statements', value: 28 },
  { name: 'Provider logs', value: 19 },
  { name: 'Manual notes', value: 12 },
] as const

const chartTooltipStyle = {
  border: '0.5px solid #E5E5E5',
  borderRadius: '8px',
  background: '#ffffff',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
}

function LightCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <article className={`rounded-[1.6rem] border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.04)] ${className}`}>
      {children}
    </article>
  )
}

function SurfaceEyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#9a9a95]">{children}</div>
}

function HomeSurface({
  scenario,
  promptInput,
  onPromptInputChange,
  onPromptSubmit,
  onQuickPrompt,
}: {
  scenario: HomeSimulation
  promptInput: string
  onPromptInputChange: (value: string) => void
  onPromptSubmit: () => void
  onQuickPrompt: (prompt: string) => void
}) {
  const totalChartBars = 112
  const [selectedRangeStart, selectedRangeEnd] = scenario.range
  const rangeLeftPercent = (selectedRangeStart / totalChartBars) * 100
  const rangeWidthPercent = ((selectedRangeEnd - selectedRangeStart + 1) / totalChartBars) * 100
  const chartDomainMax = 150000
  const dashboardChartData = Array.from({ length: totalChartBars }, (_, index) => {
    const selected = index >= selectedRangeStart && index <= selectedRangeEnd
    const primaryPeak = Math.exp(-Math.pow(index - 34, 2) / (2 * 10.5 * 10.5)) * 34000
    const secondaryPeak = Math.exp(-Math.pow(index - 80, 2) / (2 * 7.4 * 7.4)) * 11000
    const lateLift = index > 94 ? (index - 94) * 1200 : 0
    const barBase =
      46000 +
      Math.sin(index * 0.24 - 0.2) * 6800 +
      Math.cos(index * 0.07 + 0.2) * 4200 +
      Math.sin(index * 0.57) * 2100
    const lineBase =
      47000 +
      Math.sin(index * 0.19 - 0.5) * 2600 +
      Math.cos(index * 0.44 + 0.15) * 1700 +
      Math.sin(index * 0.73) * 900
    const lowerLineBase =
      26000 +
      Math.sin(index * 0.17 + 0.8) * 2200 +
      Math.cos(index * 0.31 - 0.4) * 1500 +
      Math.sin(index * 0.58) * 700
    const barValue = Math.max(18000, Math.min(122000, barBase + primaryPeak + secondaryPeak + lateLift))
    const lineValue = Math.max(34000, Math.min(71000, lineBase + primaryPeak * 0.12 + secondaryPeak * 0.1 + lateLift * 0.12))
    const lowerLineValue = Math.max(12000, Math.min(46000, lowerLineBase + primaryPeak * 0.06 + secondaryPeak * 0.05))

    return {
      point: index,
      barValue,
      lineValue,
      lowerLineValue,
      selected,
    }
  })

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#8b8a86]">
            Half-year payout statement
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-[#6f716d]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d4d4d4]" />
              <span>Without reroute</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#111111]" />
              <span>Recovered after reroute</span>
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-[#6f716d] sm:grid-cols-4">
          {['Week', 'Month', 'Quarter', 'Year'].map((label) => (
            <div
              key={label}
              className={`rounded-full px-3 py-2 text-center ${label === 'Month' ? 'border border-[#E5E5E5] bg-white text-[#111111]' : 'text-[#8b8a86]'}`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <div className="text-[4.8rem] font-light tracking-[-0.03em] text-[#111111] md:text-[6rem] lg:text-[6rem]">
          {scenario.metric}
        </div>
        <div className="mt-2 text-lg font-normal text-[#111111]">{scenario.title}</div>
        <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#6f716d]">
          {scenario.summary}
        </p>
      </div>

      <div className="relative mt-10 rounded-[2rem] border border-[#E5E5E5] bg-white px-4 py-6 shadow-[0_14px_32px_rgba(0,0,0,0.04)] sm:px-5 lg:px-6">
        <div
          className="pointer-events-none absolute bottom-[4.9rem] top-6 z-0 bg-white/70"
          style={{ left: `${rangeLeftPercent}%`, width: `${rangeWidthPercent}%`, opacity: 0.08 }}
        />

        <div className="absolute left-[43%] top-[54%] z-10 w-[15rem] -translate-y-1/2 rounded-lg border-[0.5px] border-[#E0E0DE] bg-white px-3.5 py-3 sm:w-[16.5rem]">
          <button
            type="button"
            className="absolute right-2 top-2 text-[10px] leading-none text-[#999999]"
            aria-label="Dismiss chart note"
          >
            ×
          </button>
            <div className="flex items-center justify-between gap-3">
            <div className="text-[16px] font-semibold text-[#111111]">{scenario.tooltipValue}</div>
            <span className="inline-flex h-6 items-center rounded-full bg-[#22C55E] px-2.5 text-[10px] font-medium text-[#166534]">
              {scenario.tooltipDelta}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-normal leading-4 text-[#8b8a86]">{scenario.tooltipNote}</div>
        </div>

        <div className="relative z-[1] h-[21rem] md:h-[23rem]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dashboardChartData} margin={{ top: 10, right: 26, left: 0, bottom: 0 }} barGap={2}>
              <XAxis hide dataKey="point" />
              <YAxis
                orientation="right"
                axisLine={false}
                tickLine={false}
                tickMargin={14}
                domain={[0, 150000]}
                ticks={[0, 50000, 100000, 150000]}
                tickFormatter={(value: number) => (value === 0 ? '0' : `${value / 1000}k`)}
                tick={{ fill: '#999999', fontSize: 11, fontWeight: 400 }}
              />
              <Bar dataKey="barValue" barSize={4} radius={[0, 0, 0, 0]} isAnimationActive>
                {dashboardChartData.map((entry) => (
                  <Cell key={`home-bar-${entry.point}`} fill={entry.selected ? '#1A1A1A' : '#888888'} />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="lowerLineValue"
                stroke="#D0D0D0"
                strokeWidth={1.1}
                dot={false}
                activeDot={false}
                strokeLinecap="round"
                connectNulls
                isAnimationActive
              />
              <Line
                type="monotone"
                dataKey="lineValue"
                stroke="#111111"
                strokeWidth={1.35}
                dot={false}
                activeDot={false}
                strokeLinecap="round"
                connectNulls
                isAnimationActive
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 h-[13px] rounded-[4px] bg-[#EBEBEA]">
          <div
            className="relative h-[13px] rounded-[4px] bg-[#C5C5C2]"
            style={{ marginLeft: `${rangeLeftPercent}%`, width: `${rangeWidthPercent}%` }}
          >
            <div className="absolute inset-y-0 left-0 w-[3px] bg-[#444444]" />
            <div className="absolute inset-y-0 right-0 w-[3px] bg-[#444444]" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-9 text-[11px] text-[#999999]">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month) => (
            <div key={month} className="text-center">
              {month}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        <LightCard className="border-[#E5E5E5] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <SurfaceEyebrow>Sales forecast</SurfaceEyebrow>
            <Glyph name="menu-dots" className="h-4 w-4 text-[#9a9a95]" />
          </div>
          <div className="mt-4 text-[2.5rem] font-light tracking-[-0.04em] text-[#111111]">{scenario.salesValue}</div>
          <div className="mt-1 text-sm text-[#6f716d]">Sales</div>
          <div className="mt-5 flex items-center gap-3 text-[12px] text-[#8b8a86]">
            <span>Week</span>
            <span className="border-b border-[#111111] pb-0.5 text-[#111111]">Month</span>
            <span>Quarter</span>
            <span>Year</span>
          </div>
          <div className="mt-5 flex items-end gap-3">
            {dashboardChartData.slice(0, 6).map((entry) => (
              <span
                key={`forecast-${entry.point}`}
                className="w-2 rounded-full bg-[#111111]"
                style={{ height: `${Math.max(entry.barValue / chartDomainMax, 0.22) * 5.5}rem`, opacity: entry.selected ? 1 : 0.24 }}
              />
            ))}
          </div>
        </LightCard>

        <LightCard className="border-[#E5E5E5] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <SurfaceEyebrow>Monthly expenses</SurfaceEyebrow>
            <Glyph name="menu-dots" className="h-4 w-4 text-[#9a9a95]" />
          </div>
          <div className="mt-4 text-[2.5rem] font-light tracking-[-0.04em] text-[#111111]">{scenario.expensesValue}</div>
          <div className="mt-1 text-sm text-[#6f716d]">Expenses</div>
          <div className="mt-5 flex flex-wrap gap-3 text-[12px] text-[#6f716d]">
            {[
              ['Meals', '#111111'],
              ['Rent & Mortgage', '#4ADE80'],
              ['Automotive', '#b7b7b7'],
              ['Others', '#e0e0e0'],
            ].map(([label, color]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 h-20 rounded-[1rem] bg-[linear-gradient(135deg,#f6f6f6_0_14%,#ffffff_14%_28%,#f1f4f8_28%_42%,#ffffff_42%_56%,#f6f6f6_56%_70%,#ffffff_70%_84%,#f1f4f8_84%_100%)]" />
        </LightCard>

        <LightCard className="border-[#E5E5E5] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <SurfaceEyebrow>Project budget forecast</SurfaceEyebrow>
            <Glyph name="menu-dots" className="h-4 w-4 text-[#9a9a95]" />
          </div>
          <div className="mt-4 text-[2.5rem] font-light tracking-[-0.04em] text-[#111111]">{scenario.budgetValue}</div>
          <div className="mt-1 text-sm text-[#6f716d]">Budgeted forecast</div>
          <div className="mt-5 flex items-center gap-5 text-[12px] text-[#6f716d]">
            {[
              ['Sales', '#dedede'],
              ['Forecast', '#111111'],
            ].map(([label, color]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-end gap-2">
            {dashboardChartData.slice(8, 16).map((entry) => (
              <span
                key={`budget-${entry.point}`}
                className="w-full rounded-full bg-[#111111]"
                style={{ height: `${Math.max(entry.lineValue / chartDomainMax, 0.16) * 4.8}rem`, opacity: 0.2 + (entry.point % 4) * 0.14 }}
              />
            ))}
          </div>
        </LightCard>

        <LightCard className="border-[#E5E5E5] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <SurfaceEyebrow>Insight</SurfaceEyebrow>
            <Glyph name="arrow-up-right" className="h-4 w-4 text-[#9a9a95]" />
          </div>
          <div className="mt-4 max-w-[14rem] text-lg leading-7 text-[#111111]">
            {scenario.insightText}
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[2rem] font-light tracking-[-0.04em] text-[#111111]">{scenario.insightValue}</div>
              <div className="text-sm text-[#6f716d]">traces in the active review set</div>
            </div>
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 120 72" className="h-full w-full" aria-hidden="true">
                <path d="M12 60a48 48 0 0 1 96 0" fill="none" stroke="#d9d9d9" strokeWidth="8" strokeLinecap="round" />
                <path d="M12 60a48 48 0 0 1 74 -37" fill="none" stroke="#111111" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </LightCard>
      </div>

      <div className="relative z-10 mx-auto -mt-10 w-full max-w-[62rem] px-4">
        <div className="rounded-[1.35rem] bg-[#1F1F1F] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
          <div className="mb-3 flex flex-wrap gap-2">
            {homeSimulationScenarios.map((item) => (
              <button
                key={`home-command-${item.prompt}`}
                type="button"
                onClick={() => onQuickPrompt(item.prompt)}
                className={`rounded-[0.9rem] px-3 py-2 text-[12px] transition ${scenario.prompt === item.prompt ? 'bg-white/16 text-white' : 'bg-white/10 text-white/74 hover:bg-white/14 hover:text-white'}`}
              >
                {item.prompt}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-[1rem] border border-white/8 bg-[#232323] p-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[0.85rem] bg-[#4ADE80] text-[#111111]">
              <Glyph name="zap" className="h-5 w-5" />
            </div>
            <input
              value={promptInput}
              onChange={(event) => onPromptInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onPromptSubmit()
              }}
              placeholder="Ask anything or search"
              className="flex-1 bg-transparent text-center text-[15px] text-white/90 outline-none placeholder:text-white/42"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPromptSubmit}
                className="flex h-12 w-12 items-center justify-center rounded-[0.85rem] border border-white/8 bg-transparent text-white"
                aria-label="Home overview help"
              >
                <Glyph name="arrow-up-right" className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-[0.85rem] border border-white/8 bg-transparent text-white"
                aria-label="Home overview tools"
              >
                <Glyph name="grid" className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkspaceSurface({
  activeTab,
  setActiveTab,
  scenario,
  selectedPromptLabel,
  suggestions,
  onSuggestionClick,
  promptInput,
  onPromptInputChange,
  onPromptSubmit,
}: {
  activeTab: WorkspaceTab
  setActiveTab: (tab: WorkspaceTab) => void
  scenario: WorkspaceSimulation
  selectedPromptLabel: string | null
  suggestions: readonly string[]
  onSuggestionClick: (suggestion: string) => void
  promptInput: string
  onPromptInputChange: (value: string) => void
  onPromptSubmit: () => void
}) {
  return (
    <div className="mt-8 grid items-stretch gap-4 xl:grid-cols-[1.78fr_1.46fr]">
      <div className="grid gap-4 xl:grid-cols-[0.98fr_0.84fr]">
        <article className="flex min-h-[33.5rem] flex-col justify-between rounded-[1.7rem] border border-[#cfdaea] bg-[#DDE8F8] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="max-w-[11rem] text-[11px] font-medium uppercase leading-5 tracking-[0.1em] text-[#5c7194]">
                {scenario.heroLabel}
              </div>
              <div className="mt-6 text-[4.35rem] font-light tracking-[-0.06em] text-[#111111]">{scenario.heroValue}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/70 text-[#5b76a1]">
              <Glyph name="document" className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-10 flex items-end justify-start gap-[0.48rem]">
            {scenario.heroBars.map((height, index) => (
              <span
                key={`hero-bar-${index}`}
                className="w-[1rem] rounded-[0.55rem]"
                style={{
                  height: `${height * 1.08}rem`,
                  background: index < 2 || index > 7 ? '#aac1de' : '#355695',
                }}
              />
            ))}
          </div>
        </article>

        <div className="flex flex-col gap-4">
          <LightCard>
            <SurfaceEyebrow>{scenario.listTitle}</SurfaceEyebrow>
            <div className="mt-7 space-y-4">
              {scenario.listRows.map(([label, value]) => (
                <div key={label}>
                  <div className="flex items-center justify-between gap-3 text-[#111111]">
                    <span className="text-[15px]">{label}</span>
                    <span className="text-[15px] font-medium">{value}</span>
                  </div>
                  <div className="mt-3 h-px bg-black/8" />
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="text-[13px] text-[#8a8a86]">{scenario.listFooter}</div>
              <button type="button" className="rounded-[1rem] border border-black/10 bg-[#f5f4ef] px-4 py-2.5 text-[13px] text-[#111111]">
                {scenario.listAction}
              </button>
            </div>
          </LightCard>

          <LightCard>
            <SurfaceEyebrow>{scenario.statTitle}</SurfaceEyebrow>
            <div className="mt-5 text-[3.6rem] font-light tracking-[-0.06em] text-[#111111]">{scenario.statValue}</div>
            <div className="mt-2 text-[13px] leading-6 text-[#8a8a86]">{scenario.statNote}</div>
          </LightCard>

          <div className="grid grid-cols-2 gap-4">
            {scenario.compareLabels.map((label, index) => (
              <article
                key={label}
                className={`rounded-[1.45rem] border p-4 shadow-[0_10px_24px_rgba(0,0,0,0.04)] ${
                  index === 1 ? 'border-[#cfdaea] bg-[#DDE8F8]' : 'border-black/10 bg-white'
                }`}
              >
                <div className={`text-[13px] font-medium leading-5 ${index === 1 ? 'text-[#446ea7]' : 'text-[#a1a19b]'}`}>{label}</div>
                <div className="mt-6 flex h-24 items-end gap-[0.42rem]">
                  {[3, 5, 4, 7, 5].map((height, index) => (
                    <span
                      key={`${label}-${index}`}
                      className="w-[1.02rem] rounded-[0.45rem]"
                      style={{
                        height: `${height * 0.92}rem`,
                        background: index === 1 || index === 3 ? (label === scenario.compareLabels[1] ? '#6f93c4' : '#ececec') : label === scenario.compareLabels[1] ? '#355695' : '#d8d8d3',
                      }}
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <LightCard className="xl:col-span-2">
          <SurfaceEyebrow>{scenario.bottomTitle}</SurfaceEyebrow>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div className="text-[3.1rem] font-light tracking-[-0.05em] text-[#111111]">{scenario.bottomValue}</div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-black/10 bg-[#fafafa] text-[#8a8a86]">
              <Glyph name="arrow-up-right" className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 max-w-[30rem] text-[13px] leading-7 text-[#8a8a86]">
            {scenario.bottomMeta}
          </div>
        </LightCard>
      </div>

      <article className="flex min-h-[48rem] flex-col rounded-[1.85rem] border border-white/8 bg-[#111111] p-4 text-white shadow-[0_24px_56px_rgba(0,0,0,0.18)] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {workspaceTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full border px-4 py-2.5 text-[13px] font-medium transition ${
                  activeTab === tab ? 'border-white/14 bg-white/10 text-white' : 'border-white/10 bg-[#161616] text-white/58'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/10 bg-[#161616] text-white/70" aria-label="Workspace documents">
            <Glyph name="document" className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="mt-5 flex flex-1 flex-col rounded-[1.5rem] border border-white/8 bg-[#151515] px-4 py-5 sm:px-5">
          <div className="border-b border-white/8 pb-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-[28rem]">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/32">AI Intelligence Layer</div>
                <div className="mt-2 text-[1.1rem] font-medium tracking-[-0.03em] text-white">
                  Route posture, owner handoff, and proof readiness in one reasoning layer.
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#4ADE80]/20 bg-[#4ADE80]/10 px-3 py-2 text-[12px] font-medium text-white shadow-[0_8px_24px_rgba(74,222,128,0.08)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#4ADE80]" />
                Live operating context
              </div>
            </div>

            <div className="mt-5 rounded-[1.35rem] border border-white/8 bg-[#1A1A1A] p-4 sm:p-5">
              <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#4ADE80]">
                <span className="h-2 w-2 rounded-full bg-[#4ADE80]" />
                Live reasoning prompt
              </div>
              <div className="mt-4 max-w-[34rem] text-[1.08rem] leading-7 tracking-[-0.03em] text-white">{scenario.question}</div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px]">
                <span className="text-[#4ADE80]">11:32 AM</span>
                <span className="h-1 w-1 rounded-full bg-[#4ADE80]" />
                <span className="max-w-[33rem] text-white/48">{scenario.supporting}</span>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/32">Suggested Questions</div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onSuggestionClick(suggestion)}
                    className={`rounded-full border px-4 py-2.5 text-[13px] shadow-[0_8px_20px_rgba(0,0,0,0.14)] transition ${
                      selectedPromptLabel === suggestion
                        ? 'border-[#4ADE80]/38 bg-[#171717] text-white'
                        : 'border-white/10 bg-[#111111] text-white/78 hover:border-[#4ADE80]/32 hover:text-white'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-[1.2rem] border border-white/8 bg-[#171717] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/32">Latest answer</div>
              <div className="mt-3 text-[14px] leading-7 text-white/86">{scenario.assistant}</div>
            </div>
          </div>

          <div className="mt-5 flex-1">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white/32">Operator Modules</div>
            <div className="grid gap-3 md:grid-cols-2">
              {workspaceTiles.map((tile, index) => (
                <article key={tile.title} className="rounded-[1.25rem] border border-white/8 bg-[#1B1B1B] px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#4ADE80]/12 text-[#4ADE80]">
                      <Glyph name={tile.icon} className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[1.05rem] font-medium tracking-[-0.03em] text-white">{tile.title}</div>
                      <p className="mt-3 text-[13px] leading-6 text-white/48">{scenario.moduleBodies[index] ?? tile.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[1.35rem] bg-[#1F1F1F] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
          <div className="flex items-center gap-3 rounded-[1rem] border border-white/8 bg-[#232323] p-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[0.85rem] bg-[#4ADE80] text-[#111111]">
              <Glyph name="zap" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <input
                value={promptInput}
                onChange={(event) => onPromptInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onPromptSubmit()
                }}
                placeholder="Ask anything or search"
                className="w-full bg-transparent text-center text-[15px] text-white/90 outline-none placeholder:text-white/42"
              />
              <div className="mt-1 text-center text-[11px] text-white/42">Route posture, bank coordination, and proof readiness</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onPromptSubmit} className="flex h-12 w-12 items-center justify-center rounded-[0.85rem] border border-white/8 bg-transparent text-white" aria-label="Run workspace prompt">
                <Glyph name="arrow-up-right" className="h-[18px] w-[18px]" />
              </button>
              <button type="button" className="flex h-12 w-12 items-center justify-center rounded-[0.85rem] border border-white/8 bg-transparent text-white" aria-label="Workspace tools">
                <Glyph name="grid" className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}

function RecoverySurface() {
  return (
    <div className="mt-8">
      <div className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="grid gap-4">
          <LightCard>
            <SurfaceEyebrow>Total recovered value</SurfaceEyebrow>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="text-[3.4rem] font-light tracking-[-0.06em] text-[#111111]">₹54.8L</div>
              <span className="rounded-full bg-[#111111] px-3 py-1.5 text-[14px] font-medium text-white">+24.7%</span>
            </div>
            <div className="mt-3 text-[13px] leading-6 text-[#8a8a86]">Recovered value from reroutes, overflow, and bank-side correction this cycle.</div>
          </LightCard>

          <LightCard>
            <SurfaceEyebrow>Recovery watchlist</SurfaceEyebrow>
            <div className="mt-5 space-y-4">
              {recoveryWatchlist.map((row) => (
                <div key={row.name} className="flex items-center justify-between gap-4 border-b border-black/8 pb-4 last:border-b-0 last:pb-0">
                  <div>
                    <div className="text-[15px] font-medium text-[#111111]">{row.name}</div>
                    <div className="mt-1 text-[12px] text-[#8a8a86]">{row.delta}</div>
                  </div>
                  <div className="text-[18px] font-light tracking-[-0.04em] text-[#111111]">{row.value}</div>
                </div>
              ))}
            </div>
          </LightCard>
        </div>

        <LightCard className="overflow-hidden bg-[#f7f8fa]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SurfaceEyebrow>Recovered portfolio trend</SurfaceEyebrow>
              <div className="mt-4 text-[3.6rem] font-light tracking-[-0.06em] text-[#111111]">₹54,81,525</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#111111] px-3 py-1.5 text-[13px] font-medium text-white">1Y focus</span>
              <span className="text-[13px] text-[#8a8a86]">Recovered against pre-reroute baseline</span>
            </div>
          </div>

          <div className="mt-6 h-[24rem]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recoveryTrendData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="recoveryAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(17,17,17,0.28)" />
                    <stop offset="100%" stopColor="rgba(17,17,17,0.02)" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8a8a86', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a8a86', fontSize: 12 }} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={false} />
                <Area type="monotone" dataKey="baseline" stroke="#b4b7bf" fill="none" strokeWidth={2} />
                <Area type="monotone" dataKey="value" stroke="#111111" fill="url(#recoveryAreaFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </LightCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.02fr_0.98fr_0.82fr]">
        <LightCard>
          <SurfaceEyebrow>Recovery mix</SurfaceEyebrow>
          <div className="mt-6 space-y-4">
            {recoveryMix.map((row) => (
              <div key={row.name}>
                <div className="flex items-center justify-between text-[14px] text-[#111111]">
                  <span>{row.name}</span>
                  <span>{row.value}%</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-[#ececef]">
                  <div className="h-2.5 rounded-full bg-[#111111]" style={{ width: `${row.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </LightCard>

        <LightCard>
          <SurfaceEyebrow>Recovered lanes</SurfaceEyebrow>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              ['Primary', '45%'],
              ['Overflow', '85%'],
              ['Fallback', '48%'],
              ['Manual', '22%'],
            ].map(([name, value]) => (
              <div key={name} className="rounded-[1.2rem] border border-black/8 bg-[#f7f7f8] p-4">
                <div className="text-[12px] uppercase tracking-[0.08em] text-[#8a8a86]">{name}</div>
                <div className="mt-3 text-[2rem] font-light tracking-[-0.04em] text-[#111111]">{value}</div>
              </div>
            ))}
          </div>
        </LightCard>

        <LightCard>
          <SurfaceEyebrow>Recovery health</SurfaceEyebrow>
          <div className="mt-4 text-[3rem] font-light tracking-[-0.06em] text-[#111111]">81</div>
          <div className="text-[13px] text-[#8a8a86]">Recovery score across providers and fallback depth.</div>
          <div className="mt-6 space-y-3 text-[13px] text-[#6f716d]">
            <div className="flex items-center justify-between"><span>Overflow clean</span><span>92%</span></div>
            <div className="flex items-center justify-between"><span>Manual unresolved</span><span>14 intents</span></div>
            <div className="flex items-center justify-between"><span>Near-SLA recoveries</span><span>6</span></div>
          </div>
        </LightCard>
      </div>
    </div>
  )
}

function OperationsGridSurface() {
  return (
    <div className="mt-8">
      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <LightCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <SurfaceEyebrow>Intent table</SurfaceEyebrow>
              <div className="mt-2 text-[1.05rem] font-medium text-[#111111]">Live owner and proof handoff</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-3 py-1.5 text-[12px] font-medium text-white">
              <Glyph name="grid" className="h-3.5 w-3.5" />
              6 active
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.3rem] border border-black/8">
            <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_1fr] bg-[#f7f7f8] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-[#8a8a86]">
              <span>Intent</span>
              <span>Owner</span>
              <span>Risk</span>
              <span>Proof</span>
              <span>Next step</span>
            </div>
            {intentRows.map((row) => (
              <div key={row.intent} className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_1fr] border-t border-black/8 px-4 py-4 text-[13px] text-[#111111]">
                <span className="font-medium">{row.intent}</span>
                <span>{row.owner}</span>
                <span>{row.risk}</span>
                <span>{row.proof}</span>
                <span className="text-[#6f716d]">{row.next}</span>
              </div>
            ))}
          </div>
        </LightCard>

        <div className="grid gap-4">
          <LightCard>
            <SurfaceEyebrow>Spider graph</SurfaceEyebrow>
            <div className="mt-3 text-[1rem] font-medium text-[#111111]">Operating pressure map</div>
            <div className="mt-4 h-[17rem]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={spiderData}>
                  <PolarGrid stroke="rgba(17,17,17,0.12)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6f716d', fontSize: 11 }} />
                  <PolarRadiusAxis axisLine={false} tick={false} domain={[0, 100]} />
                  <Radar dataKey="value" stroke="#111111" fill="#4ADE80" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </LightCard>

          <LightCard>
            <SurfaceEyebrow>Heat map</SurfaceEyebrow>
            <div className="mt-3 text-[1rem] font-medium text-[#111111]">Exception concentration by hour</div>
            <div className="mt-5 grid grid-cols-6 gap-2">
              {heatMap.flatMap((row, rowIndex) =>
                row.map((value, columnIndex) => (
                  <div
                    key={`${rowIndex}-${columnIndex}`}
                    className="aspect-square rounded-[0.9rem]"
                    style={{
                      background:
                        value > 7 ? '#111111' : value > 5 ? 'rgba(17,17,17,0.72)' : value > 3 ? 'rgba(17,17,17,0.42)' : 'rgba(17,17,17,0.12)',
                    }}
                  />
                )),
              )}
            </div>
          </LightCard>
        </div>
      </div>

      <div className="mt-4">
        <LightCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <SurfaceEyebrow>Bar graph</SurfaceEyebrow>
              <div className="mt-2 text-[1.05rem] font-medium text-[#111111]">Open vs cleared work by team</div>
            </div>
            <div className="text-[13px] text-[#8a8a86]">Operations grid view</div>
          </div>

          <div className="mt-5 h-[18rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gridBarData} barGap={8}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6f716d', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a8a86', fontSize: 12 }} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={false} />
                <Bar dataKey="open" fill="#111111" radius={[8, 8, 0, 0]} />
                <Bar dataKey="cleared" fill="#bfc4cd" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </LightCard>
      </div>
    </div>
  )
}

function LiveSyncSurface() {
  return (
    <div className="mt-8">
      <LightCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SurfaceEyebrow>Payments trend analysis</SurfaceEyebrow>
            <div className="mt-3 text-[3.4rem] font-light tracking-[-0.06em] text-[#111111]">94.6%</div>
            <div className="text-[13px] text-[#8a8a86]">Full-graph sync completion across payments, webhooks, and statements.</div>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#6f716d]">
            {['Payments', 'Webhooks', 'Statements'].map((item, index) => (
              <div key={item} className="flex items-center gap-2 rounded-full bg-[#f7f7f8] px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: ['#111111', '#4ADE80', '#b8bcc5'][index] }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 h-[20rem]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={syncTrendData}>
              <XAxis dataKey="point" axisLine={false} tickLine={false} tick={{ fill: '#6f716d', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a8a86', fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={false} />
              <Line type="monotone" dataKey="payments" stroke="#111111" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="webhooks" stroke="#4ADE80" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="statements" stroke="#b8bcc5" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </LightCard>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_0.95fr_0.85fr]">
        <LightCard>
          <SurfaceEyebrow>Pie chart</SurfaceEyebrow>
          <div className="mt-3 text-[1rem] font-medium text-[#111111]">Movement share</div>
          <div className="mt-4 h-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={syncPieData} dataKey="value" innerRadius={52} outerRadius={82} paddingAngle={4}>
                  {syncPieData.map((entry, index) => (
                    <Cell key={entry.name} fill={['#111111', '#4ADE80', '#c9cdd3'][index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {syncPieData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-[13px] text-[#6f716d]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: ['#111111', '#4ADE80', '#c9cdd3'][index] }} />
                  <span>{item.name}</span>
                </div>
                <span>{item.value}%</span>
              </div>
            ))}
          </div>
        </LightCard>

        <LightCard>
          <SurfaceEyebrow>Bar graph</SurfaceEyebrow>
          <div className="mt-3 text-[1rem] font-medium text-[#111111]">Connector latency and retries</div>
          <div className="mt-5 h-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={syncBarData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6f716d', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a8a86', fontSize: 12 }} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={false} />
                <Bar dataKey="lag" fill="#111111" radius={[8, 8, 0, 0]} />
                <Bar dataKey="retries" fill="#4ADE80" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </LightCard>

        <LightCard>
          <SurfaceEyebrow>Trend analysis</SurfaceEyebrow>
          <div className="mt-3 text-[1rem] font-medium text-[#111111]">Payment sync insights</div>
          <div className="mt-5 space-y-4 text-[13px] leading-6 text-[#6f716d]">
            <div className="rounded-[1rem] bg-[#f7f7f8] p-4">Payments stayed healthiest after 18:00, while statement lag widened during the 14:00 to 16:00 window.</div>
            <div className="rounded-[1rem] bg-[#f7f7f8] p-4">ICICI and Cashfree are carrying the highest retry pressure, so sync quality is now gated more by connector lag than raw payment volume.</div>
            <div className="rounded-[1rem] bg-[#f7f7f8] p-4">Webhook alignment is stable enough for close, but statement completion still needs active watch before finance uses end-of-day exports.</div>
          </div>
        </LightCard>
      </div>
    </div>
  )
}

function ProofSurface() {
  return (
    <div className="mt-8 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="grid gap-4">
        {proofRows.map((item) => (
          <LightCard key={item.name}>
            <SurfaceEyebrow>{item.name}</SurfaceEyebrow>
            <div className="mt-4 text-[3rem] font-light tracking-[-0.05em] text-[#111111]">{item.value}</div>
            <div className="mt-2 text-[13px] text-[#8a8a86]">{item.note}</div>
          </LightCard>
        ))}
      </div>

      <LightCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SurfaceEyebrow>Evidence coverage</SurfaceEyebrow>
            <div className="mt-3 text-[1rem] font-medium text-[#111111]">Source distribution across proof packets</div>
          </div>
          <div className="text-[13px] text-[#8a8a86]">Proof desk analytics</div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="h-[18rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={proofSourceData} dataKey="value" innerRadius={48} outerRadius={84}>
                  {proofSourceData.map((entry, index) => (
                    <Cell key={entry.name} fill={['#111111', '#4ADE80', '#a8adb7', '#d6dae0'][index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {proofSourceData.map((item, index) => (
              <div key={item.name}>
                <div className="flex items-center justify-between text-[14px] text-[#111111]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: ['#111111', '#4ADE80', '#a8adb7', '#d6dae0'][index] }} />
                    <span>{item.name}</span>
                  </div>
                  <span>{item.value}%</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-[#ececef]">
                  <div className="h-2.5 rounded-full" style={{ width: `${item.value}%`, background: ['#111111', '#4ADE80', '#a8adb7', '#d6dae0'][index] }} />
                </div>
              </div>
            ))}

            <div className="rounded-[1.2rem] bg-[#f7f7f8] p-4 text-[13px] leading-6 text-[#6f716d]">
              Finance-ready proof is strongest where callbacks and statements are both present. The remaining gap is concentrated in intents still missing bank-side statement cues.
            </div>
          </div>
        </div>
      </LightCard>
    </div>
  )
}

export default function PayoutCommandViewClient() {
  const [activeDock, setActiveDock] = useState<DockId>('home')
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('Today')
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)
  const [homeScenario, setHomeScenario] = useState<HomeSimulation>(homeSimulationScenarios[0])
  const [homePromptInput, setHomePromptInput] = useState('')
  const [workspaceScenario, setWorkspaceScenario] = useState<WorkspaceSimulation>(workspaceSimulationScenarios.Today[0])
  const [workspacePromptInput, setWorkspacePromptInput] = useState('')

  const activeSurface = dockItems.find((item) => item.id === activeDock) ?? dockItems[0]
  const activePrompt = useMemo(() => workspacePromptCopy[activeTab], [activeTab])

  const runHomeSimulation = useCallback((prompt: string) => {
    const cleanedPrompt = prompt.trim()
    if (!cleanedPrompt) return
    const nextScenario = resolvePromptScenario(cleanedPrompt, homeSimulationScenarios, homeSimulationScenarios[0])
    setHomeScenario(nextScenario)
    setHomePromptInput('')
  }, [])

  const runWorkspaceSimulation = useCallback((prompt: string) => {
    const cleanedPrompt = prompt.trim()
    if (!cleanedPrompt) return
    const scenarios = workspaceSimulationScenarios[activeTab]
    const nextScenario = resolvePromptScenario(cleanedPrompt, scenarios, scenarios[0])
    setWorkspaceScenario(nextScenario)
    setSelectedSuggestion(prompt)
    setWorkspacePromptInput('')
  }, [activeTab])

  const surfaceBody = useMemo(() => {
    if (activeDock === 'home') {
      return (
        <HomeSurface
          scenario={homeScenario}
          promptInput={homePromptInput}
          onPromptInputChange={setHomePromptInput}
          onPromptSubmit={() => runHomeSimulation(homePromptInput)}
          onQuickPrompt={runHomeSimulation}
        />
      )
    }

    if (activeDock === 'workspace') {
      return (
        <WorkspaceSurface
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab)
            setSelectedSuggestion(null)
            setWorkspacePromptInput('')
            setWorkspaceScenario(workspaceSimulationScenarios[tab][0])
          }}
          scenario={workspaceScenario}
          selectedPromptLabel={selectedSuggestion}
          suggestions={activePrompt.suggestions}
          onSuggestionClick={runWorkspaceSimulation}
          promptInput={workspacePromptInput}
          onPromptInputChange={setWorkspacePromptInput}
          onPromptSubmit={() => runWorkspaceSimulation(workspacePromptInput)}
        />
      )
    }

    if (activeDock === 'recoveries') {
      return <RecoverySurface />
    }

    if (activeDock === 'grid') {
      return <OperationsGridSurface />
    }

    if (activeDock === 'sync') {
      return <LiveSyncSurface />
    }

    return <ProofSurface />
  }, [activeDock, activePrompt.suggestions, activeTab, homePromptInput, homeScenario, runHomeSimulation, runWorkspaceSimulation, selectedSuggestion, workspacePromptInput, workspaceScenario])

  return (
    <main className="min-h-screen bg-[#ebebeb]" style={{ fontFamily: DASHBOARD_FONT_STACK }}>
      <div className="w-full overflow-hidden border border-black/10 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.12)]">
        <div className="flex min-h-[56px] flex-col gap-4 border-b border-[#E5E5E5] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#111111] text-sm font-semibold text-white">Z</span>
              <div>
                <div className="text-[12px] uppercase tracking-[0.18em] text-[#8a8a86]">Workspace</div>
                <div className="text-[15px] font-medium text-[#111111]">{activeSurface.title}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {dockItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveDock(item.id)
                    setSelectedSuggestion(null)
                    if (item.id === 'workspace') {
                      setActiveTab('Today')
                      setWorkspaceScenario(workspaceSimulationScenarios.Today[0])
                      setWorkspacePromptInput('')
                    }
                    if (item.id === 'home') {
                      setHomePromptInput('')
                    }
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-[8px] border transition ${
                    activeDock === item.id ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#E5E5E5] bg-white text-[#111111]'
                  }`}
                  aria-label={item.label}
                  aria-pressed={activeDock === item.id}
                  title={item.label}
                >
                  <Glyph name={item.icon} className="h-[18px] w-[18px]" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-11 min-w-[18rem] items-center gap-3 rounded-[10px] border border-[#E5E5E5] bg-[#F5F5F5] px-3.5 text-[#7a7a76] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <Glyph name="search" className="h-4 w-4 text-[#111111]" />
              <span className="text-sm">Type client name or payout ID...</span>
            </div>
            <div className="flex items-center gap-3 rounded-[10px] border border-[#E5E5E5] bg-white px-2.5 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111111] text-sm font-medium text-white">OS</div>
              <div className="pr-1">
                <div className="text-sm font-medium text-[#111111]">Ops supervisor</div>
                <div className="text-xs text-[#7a7a76]">Payout desk</div>
              </div>
            </div>
          </div>
        </div>

        <section className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#8a8a86]">
                <span>Workspaces</span>
                <span>/</span>
                <span>Overview</span>
                <span>/</span>
                <span className="text-[#111111]">{activeSurface.title}</span>
              </div>
              <h1 className="mt-3 text-[2.25rem] font-medium tracking-[-0.05em] text-[#111111] md:text-[2.85rem]">{activeSurface.title}</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6f716d]">{activeSurface.summary}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {['refresh', 'eye', 'menu-dots'].map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-black/10 bg-white text-[#111111]"
                  aria-label={icon}
                >
                  <Glyph name={icon as GlyphName} className="h-4 w-4" />
                </button>
              ))}
              <button
                type="button"
                className="flex items-center gap-3 rounded-[12px] bg-[#111111] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
              >
                <div className="flex -space-x-2">
                  {['A', 'F', 'E'].map((item, index) => (
                    <span
                      key={item}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/60 text-[11px] font-medium text-[#111111]"
                      style={{ background: ['#d8e6ff', '#dbf7dd', '#edd8f4'][index] }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <span>Share</span>
              </button>
            </div>
          </div>

          {surfaceBody}
        </section>
      </div>
    </main>
  )
}
