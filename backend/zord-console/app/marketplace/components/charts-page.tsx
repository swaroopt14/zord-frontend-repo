'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'

const menuRoutes: Record<string, string> = {
  Overview: '/marketplace',
  Payouts: '/marketplace/payouts',
  'Seller Ledger': '/marketplace/seller-ledger',
  Disputes: '/marketplace/disputes',
  Reconciliation: '/marketplace/reconciliation',
  Reports: '/marketplace/reports',
}

const menuDescriptions: Record<string, string> = {
  'Seller Ledger': 'Track seller-level credits, debits, and payable balance history.',
  Disputes: 'Review chargeback cases, response windows, and dispute outcomes.',
  Reconciliation: 'Match gateway settlements with internal intents and resolve mismatches.',
  Reports: 'Generate payout, settlement, and compliance reports for finance ops.',
}

type PayoutStatus = 'SUCCESS' | 'PROCESSING' | 'PENDING' | 'FAILED' | 'DLQ' | 'REPLAY_SCHEDULED'

type PayoutRow = {
  intentId: string
  sellerId: string
  sellerName: string
  amount: number
  psp: string
  rail: 'IMPS' | 'NEFT' | 'RTGS' | 'UPI'
  status: PayoutStatus
  bankRef: string
  lastUpdated: string
  updatedHoursAgo: number
  traceId: string
  failureReason?: string
  dlqError?: string
}

const payoutStatusFilterOptions = ['All', 'Success', 'Processing', 'Pending', 'Failed', 'DLQ', 'Replay Scheduled']
const payoutStatusFilterToValue: Record<string, PayoutStatus | ''> = {
  All: '',
  Success: 'SUCCESS',
  Processing: 'PROCESSING',
  Pending: 'PENDING',
  Failed: 'FAILED',
  DLQ: 'DLQ',
  'Replay Scheduled': 'REPLAY_SCHEDULED',
}
const payoutStatusValueToLabel: Record<PayoutStatus, string> = {
  SUCCESS: 'SUCCESS',
  PROCESSING: 'PROCESSING',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  DLQ: 'DLQ',
  REPLAY_SCHEDULED: 'REPLAY',
}
const payoutDateRangeMaxHours: Record<string, number> = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30 }

export default function MarketplacePage() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeUtilityItem, setActiveUtilityItem] = useState('Continue Watching')
  const pathname = usePathname()
  const router = useRouter()
  const activeSection = Object.entries(menuRoutes).find(([, route]) => route === pathname)?.[0] ?? 'Overview'
  const [settlementActive, setSettlementActive] = useState<number | null>(null)
  const [payoutActive, setPayoutActive] = useState<number | null>(17)

  const settlementTrendValues = [24, 34, 28, 40, 33, 27, 42, 36, 57, 66, 76, 88, 79, 84, 72, 59, 51, 44, 39, 34, 41, 37]
  const highlightedStart = 8
  const highlightedEnd = 14
  const activeSettlementIndex = settlementActive ?? 11
  const activeSettlementCount = 220 + settlementTrendValues[activeSettlementIndex] * 4
  const settlementInfoCards = [
    { label: 'Hourly Avg', value: '1,203', unit: 'settlements/hr' },
    { label: 'Processing Latency', value: '242', unit: 'ms' },
    { label: 'Exception Events', value: '11', unit: 'events' },
  ]

  // Financial Activity line + bar data
  const payoutVolumeSeries = [
    { day: '1 Jun', cashIn: 2.7, cashOut: 3.5, balance: 12.1 },
    { day: '2 Jun', cashIn: 3.5, cashOut: 4.1, balance: 12.2 },
    { day: '3 Jun', cashIn: 2.9, cashOut: 3.2, balance: 12.0 },
    { day: '4 Jun', cashIn: 4.2, cashOut: 5.3, balance: 12.2 },
    { day: '5 Jun', cashIn: 3.1, cashOut: 3.9, balance: 12.1 },
    { day: '6 Jun', cashIn: 3.9, cashOut: 5.4, balance: 12.4 },
    { day: '7 Jun', cashIn: 2.4, cashOut: 4.7, balance: 12.0 },
    { day: '8 Jun', cashIn: 4.9, cashOut: 6.4, balance: 12.3 },
    { day: '9 Jun', cashIn: 3.5, cashOut: 4.4, balance: 12.2 },
    { day: '10 Jun', cashIn: 4.1, cashOut: 5.6, balance: 12.6 },
    { day: '11 Jun', cashIn: 3.0, cashOut: 4.2, balance: 12.8 },
    { day: '12 Jun', cashIn: 5.4, cashOut: 7.9, balance: 13.1 },
    { day: '13 Jun', cashIn: 4.6, cashOut: 6.7, balance: 13.8 },
    { day: '14 Jun', cashIn: 5.8, cashOut: 6.2, balance: 13.2 },
    { day: '15 Jun', cashIn: 4.5, cashOut: 5.4, balance: 13.0 },
    { day: '16 Jun', cashIn: 5.2, cashOut: 5.8, balance: 12.8 },
    { day: '17 Jun', cashIn: 4.7, cashOut: 5.1, balance: 12.9 },
    { day: '18 Jun', cashIn: 3.6, cashOut: 6.0, balance: 12.7 },
    { day: '19 Jun', cashIn: 4.4, cashOut: 4.9, balance: 12.4 },
    { day: '20 Jun', cashIn: 3.8, cashOut: 4.5, balance: 12.5 },
    { day: '21 Jun', cashIn: 2.9, cashOut: 3.6, balance: 12.1 },
    { day: '22 Jun', cashIn: 5.3, cashOut: 6.5, balance: 12.6 },
    { day: '23 Jun', cashIn: 3.5, cashOut: 4.4, balance: 12.5 },
    { day: 'Today', cashIn: 3.2, cashOut: 3.9, balance: 12.3 },
  ]
  const payoutChartWidth = 720
  const payoutChartHeight = 300
  const payoutPadding = { top: 26, bottom: 34 }
  const payoutInnerHeight = payoutChartHeight - payoutPadding.top - payoutPadding.bottom
  const payoutBalanceMin = 10
  const payoutBalanceMax = 14
  const payoutCashMax = 8
  const payoutBarGroupWidth = payoutChartWidth / payoutVolumeSeries.length
  const payoutBarWidth = Math.max(3.5, payoutBarGroupWidth * 0.32)
  const payoutPoints = payoutVolumeSeries.map((point, i) => {
    const x = i * (payoutChartWidth / (payoutVolumeSeries.length - 1))
    const y =
      payoutPadding.top +
      ((payoutBalanceMax - point.balance) / (payoutBalanceMax - payoutBalanceMin)) * payoutInnerHeight
    return { ...point, x, y }
  })
  const payoutLinePath = `M${payoutPoints.map((p) => `${p.x},${p.y}`).join(' L')}`
  const activePayoutIndex = payoutActive ?? 17
  const activePayoutPoint = payoutPoints[activePayoutIndex]
  const payoutTooltipLeft = Math.min(Math.max((activePayoutPoint.x / payoutChartWidth) * 100, 18), 82)

  // Payout operations table data
  const sourceLogos: Record<string, string> = {
    Razorpay: '/sources/razorpay-clean-clean.png',
    Cashfree: '/sources/cashfree-clean.png',
    PayPal: '/sources/paypal-clean.png',
    Stripe: '/sources/stripe-clean.png',
    PhonePe: '/sources/phonepe-clean.png',
    'Google Pay': '/sources/gpay-clean.png',
    BHIM: '/sources/bhim-clean.png',
    'HDFC Bank': '/sources/hdfc-bank-clean.png',
  }
  const payoutRows = useMemo<PayoutRow[]>(
    () => [
      { intentId: 'INT-8841', sellerId: 'SELL7741', sellerName: 'Rajesh Sharma', amount: 47500, psp: 'Razorpay', rail: 'IMPS', status: 'SUCCESS', bankRef: 'ICICI26092024011958', lastUpdated: '08:30 AM', updatedHoursAgo: 1, traceId: 'ZRD-TRACE-3f8a9b2c' },
      { intentId: 'INT-8842', sellerId: 'SELL4421', sellerName: 'Aman Verma', amount: 31200, psp: 'Razorpay', rail: 'IMPS', status: 'FAILED', bankRef: '—', lastUpdated: '18:47 PM', updatedHoursAgo: 3, traceId: 'ZRD-TRACE-0ab22fd1', failureReason: 'Gateway Timeout' },
      { intentId: 'INT-8843', sellerId: 'SELL3921', sellerName: 'Kavita Singh', amount: 12800, psp: 'Cashfree', rail: 'NEFT', status: 'PROCESSING', bankRef: '—', lastUpdated: '09:10 AM', updatedHoursAgo: 2, traceId: 'ZRD-TRACE-27f6be22' },
      { intentId: 'INT-8844', sellerId: 'SELL9982', sellerName: 'Ravi Kumar', amount: 9200, psp: 'Razorpay', rail: 'IMPS', status: 'DLQ', bankRef: '—', lastUpdated: '07:52 AM', updatedHoursAgo: 4, traceId: 'ZRD-TRACE-fbb14ce9', dlqError: 'Missing IFSC' },
      { intentId: 'INT-8845', sellerId: 'SELL1192', sellerName: 'Priya Nair', amount: 54200, psp: 'PayPal', rail: 'RTGS', status: 'SUCCESS', bankRef: 'HDFC45092024099117', lastUpdated: '07:28 AM', updatedHoursAgo: 5, traceId: 'ZRD-TRACE-c28bb0d5' },
      { intentId: 'INT-8846', sellerId: 'SELL2207', sellerName: 'Nitesh Shah', amount: 8700, psp: 'Cashfree', rail: 'UPI', status: 'PENDING', bankRef: '—', lastUpdated: '06:56 AM', updatedHoursAgo: 6, traceId: 'ZRD-TRACE-95e74bc1' },
      { intentId: 'INT-8847', sellerId: 'SELL7344', sellerName: 'Anjali Patil', amount: 16800, psp: 'Stripe', rail: 'NEFT', status: 'REPLAY_SCHEDULED', bankRef: '—', lastUpdated: '06:15 AM', updatedHoursAgo: 7, traceId: 'ZRD-TRACE-bf62ad33', failureReason: 'Webhook mismatch' },
      { intentId: 'INT-8848', sellerId: 'SELL5549', sellerName: 'Farhan Ali', amount: 13100, psp: 'Razorpay', rail: 'IMPS', status: 'SUCCESS', bankRef: 'AXIS26092024022049', lastUpdated: '05:48 AM', updatedHoursAgo: 8, traceId: 'ZRD-TRACE-9f8e11dc' },
      { intentId: 'INT-8849', sellerId: 'SELL1015', sellerName: 'Neha Kapoor', amount: 20250, psp: 'Cashfree', rail: 'RTGS', status: 'FAILED', bankRef: '—', lastUpdated: '05:22 AM', updatedHoursAgo: 9, traceId: 'ZRD-TRACE-4f09c62a', failureReason: 'Bank API timeout' },
      { intentId: 'INT-8850', sellerId: 'SELL4002', sellerName: 'Harish Iyer', amount: 6950, psp: 'Razorpay', rail: 'UPI', status: 'PROCESSING', bankRef: '—', lastUpdated: '05:01 AM', updatedHoursAgo: 10, traceId: 'ZRD-TRACE-a14d9871' },
      { intentId: 'INT-8851', sellerId: 'SELL7810', sellerName: 'Mohan Das', amount: 8800, psp: 'PayPal', rail: 'IMPS', status: 'SUCCESS', bankRef: 'SBI26092024002411', lastUpdated: '04:37 AM', updatedHoursAgo: 11, traceId: 'ZRD-TRACE-749bcf10' },
      { intentId: 'INT-8852', sellerId: 'SELL5538', sellerName: 'Aditi Rao', amount: 22700, psp: 'Stripe', rail: 'NEFT', status: 'DLQ', bankRef: '—', lastUpdated: '04:15 AM', updatedHoursAgo: 12, traceId: 'ZRD-TRACE-8bc61a45', dlqError: 'Invalid beneficiary account' },
      { intentId: 'INT-8853', sellerId: 'SELL8912', sellerName: 'Suresh Jain', amount: 15990, psp: 'Cashfree', rail: 'IMPS', status: 'SUCCESS', bankRef: 'ICICI26092024111958', lastUpdated: '03:50 AM', updatedHoursAgo: 13, traceId: 'ZRD-TRACE-46ce2042' },
      { intentId: 'INT-8854', sellerId: 'SELL1120', sellerName: 'Deepika Roy', amount: 30400, psp: 'Razorpay', rail: 'RTGS', status: 'PENDING', bankRef: '—', lastUpdated: '03:18 AM', updatedHoursAgo: 14, traceId: 'ZRD-TRACE-f2a65d73' },
      { intentId: 'INT-8855', sellerId: 'SELL4771', sellerName: 'Vikram Joshi', amount: 11950, psp: 'PhonePe', rail: 'UPI', status: 'FAILED', bankRef: '—', lastUpdated: '02:42 AM', updatedHoursAgo: 15, traceId: 'ZRD-TRACE-026ac389', failureReason: 'Insufficient payer balance' },
      { intentId: 'INT-8856', sellerId: 'SELL3309', sellerName: 'Megha Kulkarni', amount: 24000, psp: 'Google Pay', rail: 'UPI', status: 'SUCCESS', bankRef: 'YES26092024911751', lastUpdated: '02:12 AM', updatedHoursAgo: 16, traceId: 'ZRD-TRACE-98de447a' },
      { intentId: 'INT-8857', sellerId: 'SELL6421', sellerName: 'Arjun Reddy', amount: 7450, psp: 'BHIM', rail: 'UPI', status: 'REPLAY_SCHEDULED', bankRef: '—', lastUpdated: '01:44 AM', updatedHoursAgo: 17, traceId: 'ZRD-TRACE-531ec92f', failureReason: 'Webhook delayed' },
      { intentId: 'INT-8858', sellerId: 'SELL0031', sellerName: 'Isha Menon', amount: 28600, psp: 'HDFC Bank', rail: 'NEFT', status: 'SUCCESS', bankRef: 'HDFC26092024441189', lastUpdated: '01:19 AM', updatedHoursAgo: 18, traceId: 'ZRD-TRACE-e61aa91b' },
      { intentId: 'INT-8859', sellerId: 'SELL2380', sellerName: 'Nikhil Bose', amount: 9400, psp: 'Razorpay', rail: 'IMPS', status: 'PROCESSING', bankRef: '—', lastUpdated: '00:57 AM', updatedHoursAgo: 20, traceId: 'ZRD-TRACE-9cc4df55' },
      { intentId: 'INT-8860', sellerId: 'SELL7291', sellerName: 'Shalini Gupta', amount: 12100, psp: 'Cashfree', rail: 'NEFT', status: 'DLQ', bankRef: '—', lastUpdated: '00:20 AM', updatedHoursAgo: 22, traceId: 'ZRD-TRACE-1ca9f807', dlqError: 'Beneficiary name mismatch' },
      { intentId: 'INT-8861', sellerId: 'SELL5828', sellerName: 'Rohit S.', amount: 19100, psp: 'Stripe', rail: 'RTGS', status: 'SUCCESS', bankRef: 'KOTAK26092024517871', lastUpdated: '23:41 PM', updatedHoursAgo: 25, traceId: 'ZRD-TRACE-f90d1e1f' },
      { intentId: 'INT-8862', sellerId: 'SELL9466', sellerName: 'Tanya Malhotra', amount: 10150, psp: 'Razorpay', rail: 'IMPS', status: 'FAILED', bankRef: '—', lastUpdated: '22:58 PM', updatedHoursAgo: 27, traceId: 'ZRD-TRACE-2a34bc63', failureReason: 'Gateway rejected beneficiary' },
      { intentId: 'INT-8863', sellerId: 'SELL1862', sellerName: 'Pooja Agarwal', amount: 6500, psp: 'Cashfree', rail: 'UPI', status: 'PENDING', bankRef: '—', lastUpdated: '22:11 PM', updatedHoursAgo: 29, traceId: 'ZRD-TRACE-5ee74a9b' },
      { intentId: 'INT-8864', sellerId: 'SELL4208', sellerName: 'Rahul Chawla', amount: 21990, psp: 'PayPal', rail: 'RTGS', status: 'SUCCESS', bankRef: 'IDFC26092024870114', lastUpdated: '21:39 PM', updatedHoursAgo: 32, traceId: 'ZRD-TRACE-c0ab6b29' },
      { intentId: 'INT-8865', sellerId: 'SELL2717', sellerName: 'Komal Desai', amount: 7800, psp: 'Razorpay', rail: 'IMPS', status: 'REPLAY_SCHEDULED', bankRef: '—', lastUpdated: '20:56 PM', updatedHoursAgo: 38, traceId: 'ZRD-TRACE-c9fc3287', failureReason: 'Bank host unavailable' },
      { intentId: 'INT-8866', sellerId: 'SELL7394', sellerName: 'Abhishek Gill', amount: 13250, psp: 'Cashfree', rail: 'NEFT', status: 'SUCCESS', bankRef: 'PNB26092024473022', lastUpdated: '20:04 PM', updatedHoursAgo: 45, traceId: 'ZRD-TRACE-b8c17ea0' },
      { intentId: 'INT-8867', sellerId: 'SELL6601', sellerName: 'Naina Sehgal', amount: 25300, psp: 'Stripe', rail: 'RTGS', status: 'FAILED', bankRef: '—', lastUpdated: '19:30 PM', updatedHoursAgo: 52, traceId: 'ZRD-TRACE-88272a50', failureReason: 'PSP service unavailable' },
      { intentId: 'INT-8868', sellerId: 'SELL7191', sellerName: 'Pranav Kulkarni', amount: 9150, psp: 'Razorpay', rail: 'IMPS', status: 'DLQ', bankRef: '—', lastUpdated: '18:45 PM', updatedHoursAgo: 66, traceId: 'ZRD-TRACE-82ee522c', dlqError: 'Invalid account number checksum' },
      { intentId: 'INT-8869', sellerId: 'SELL5411', sellerName: 'Gauri S.', amount: 14900, psp: 'PayPal', rail: 'UPI', status: 'SUCCESS', bankRef: 'BOB26092024768144', lastUpdated: '17:55 PM', updatedHoursAgo: 74, traceId: 'ZRD-TRACE-d3aa0168' },
      { intentId: 'INT-8870', sellerId: 'SELL8847', sellerName: 'Zeeshan Khan', amount: 10600, psp: 'Cashfree', rail: 'NEFT', status: 'PROCESSING', bankRef: '—', lastUpdated: '16:52 PM', updatedHoursAgo: 92, traceId: 'ZRD-TRACE-c86ee53d' },
    ],
    []
  )
  const [dateRangeFilter, setDateRangeFilter] = useState('24h')
  const [sellerFilter, setSellerFilter] = useState('')
  const [pspFilter, setPspFilter] = useState('All')
  const [railFilter, setRailFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [payoutSearch, setPayoutSearch] = useState('')
  const [payoutPage, setPayoutPage] = useState(1)
  const pspOptions = useMemo(() => ['All', ...Array.from(new Set(payoutRows.map((row) => row.psp)))], [payoutRows])
  const railOptions = useMemo(() => ['All', ...Array.from(new Set(payoutRows.map((row) => row.rail)))], [payoutRows])
  const rowsPerPage = 25

  const getStatusColor = (status: PayoutStatus) => {
    switch (status) {
      case 'SUCCESS':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700'
      case 'PROCESSING':
        return 'border-blue-200 bg-blue-50 text-blue-700'
      case 'PENDING':
        return 'border-amber-200 bg-amber-50 text-amber-700'
      case 'FAILED':
        return 'border-red-200 bg-red-50 text-red-700'
      case 'DLQ':
        return 'border-slate-300 bg-slate-100 text-slate-700'
      case 'REPLAY_SCHEDULED':
        return 'border-orange-200 bg-orange-50 text-orange-700'
      default:
        return 'border-gray-200 bg-gray-50 text-gray-700'
    }
  }
  const getPayoutActionLabel = (row: PayoutRow) => {
    if (row.status === 'FAILED') return 'Replay'
    if (row.status === 'DLQ') return 'Fix'
    return 'View'
  }
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

  const filteredPayoutRows = useMemo(() => {
    const maxHours = payoutDateRangeMaxHours[dateRangeFilter] ?? 24
    const normalizedSeller = sellerFilter.trim().toLowerCase()
    const normalizedSearch = payoutSearch.trim().toLowerCase()
    const selectedStatus = payoutStatusFilterToValue[statusFilter] || ''

    return payoutRows.filter((row) => {
      const matchesDate = row.updatedHoursAgo <= maxHours
      const matchesSeller =
        normalizedSeller === '' ||
        `${row.sellerId} ${row.sellerName}`.toLowerCase().includes(normalizedSeller)
      const matchesPsp = pspFilter === 'All' || row.psp === pspFilter
      const matchesRail = railFilter === 'All' || row.rail === railFilter
      const matchesStatus = selectedStatus === '' || row.status === selectedStatus
      const matchesSearch =
        normalizedSearch === '' ||
        `${row.intentId} ${row.bankRef} ${row.sellerId} ${row.sellerName}`.toLowerCase().includes(normalizedSearch)

      return matchesDate && matchesSeller && matchesPsp && matchesRail && matchesStatus && matchesSearch
    })
  }, [dateRangeFilter, payoutRows, sellerFilter, pspFilter, railFilter, statusFilter, payoutSearch])
  const totalPayoutPages = Math.max(1, Math.ceil(filteredPayoutRows.length / rowsPerPage))
  const safePayoutPage = Math.min(payoutPage, totalPayoutPages)
  const paginatedPayoutRows = filteredPayoutRows.slice((safePayoutPage - 1) * rowsPerPage, safePayoutPage * rowsPerPage)
  const isFailedOnlyView = statusFilter === 'Failed'
  const isDlqOnlyView = statusFilter === 'DLQ'
  const payoutStartIndex = filteredPayoutRows.length === 0 ? 0 : (safePayoutPage - 1) * rowsPerPage + 1
  const payoutEndIndex = Math.min(safePayoutPage * rowsPerPage, filteredPayoutRows.length)

  useEffect(() => {
    setPayoutPage(1)
  }, [dateRangeFilter, sellerFilter, pspFilter, railFilter, statusFilter, payoutSearch])

  const zpiAlerts = [
    {
      severity: 'CRITICAL',
      title: 'Cashfree IMPS failures ↑3.2x',
      subtitle: 'above baseline in last 30 min',
      color: '#ff3b30',
      surface: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(248,250,252,0.9))',
      border: '1px solid rgba(15,23,42,0.09)',
      badgeBg: 'rgba(255,59,48,0.16)',
      badgeBorder: '1px solid rgba(255,59,48,0.4)',
      hoverShadow: '0 12px 24px rgba(15,23,42,0.14)',
    },
    {
      severity: 'HIGH',
      title: 'ICICI settlement latency ↑40%',
      subtitle: 'compared to yesterday',
      color: '#ff9500',
      surface: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(248,250,252,0.9))',
      border: '1px solid rgba(15,23,42,0.09)',
      badgeBg: 'rgba(255,149,0,0.16)',
      badgeBorder: '1px solid rgba(255,149,0,0.4)',
      hoverShadow: '0 12px 24px rgba(15,23,42,0.14)',
    },
  ]

  const sidebarGroups = [
    {
      title: 'MENU',
      items: [
        { label: 'Overview', path: 'M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z', active: true },
        { label: 'Payouts', path: 'M3 6.75h18M3 12h18M7.5 15.75h9' },
        { label: 'Seller Ledger', path: 'M7.5 4.5h7.5l3 3v12H7.5zM10.5 9h6M10.5 12.75h6' },
        { label: 'Disputes', path: 'M12 9v4m0 4h.01M10.29 3.86l-7 12.124a1.5 1.5 0 001.3 2.25h14.82a1.5 1.5 0 001.3-2.25l-7-12.124a1.5 1.5 0 00-2.42 0z', badge: '10' },
        { label: 'Reconciliation', path: 'M9 12.75l2.25 2.25L15 9.75M4.5 6.75h15M4.5 17.25h9' },
        { label: 'Reports', path: 'M4.5 18h15M6 15V9m4.5 6v-3m4.5 3v-6', badge: '24' },
      ],
    },
    {
      title: 'LIBRARY',
      items: [
        { label: 'Continue Watching', path: 'M6 5.25l12 6.75L6 18.75z' },
        { label: 'Downloads', path: 'M12 3.75v10.5m0 0l3.75-3.75M12 14.25l-3.75-3.75M4.5 20.25h15' },
        { label: 'Favorites', path: 'M12.001 20.25c-3.1-2.31-7.5-5.75-7.5-9.75a4.5 4.5 0 018.01-2.77A4.5 4.5 0 0119.5 10.5c0 4-4.4 7.44-7.5 9.75z' },
        { label: 'My Collection', path: 'M3.75 7.5A2.25 2.25 0 016 5.25h4.06a2.25 2.25 0 011.59.66l.69.68a2.25 2.25 0 001.59.66H18a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25V7.5z' },
      ],
    },
    {
      title: 'GENERAL',
      items: [
        { label: 'Settings', path: 'M9.75 3.5h4.5l.6 2.4a5.5 5.5 0 012.1 1.2l2.3-.6 2.25 3.9-2 1.3a6.2 6.2 0 010 2.4l2 1.3-2.25 3.9-2.3-.6a5.5 5.5 0 01-2.1 1.2l-.6 2.4h-4.5l-.6-2.4a5.5 5.5 0 01-2.1-1.2l-2.3.6-2.25-3.9 2-1.3a6.2 6.2 0 010-2.4l-2-1.3 2.25-3.9 2.3.6a5.5 5.5 0 012.1-1.2l.6-2.4z' },
        { label: 'Help', path: 'M12 17.25h.01M10.29 9.75a1.75 1.75 0 113.42.57c0 1.14-.78 1.56-1.42 2.02-.56.41-1.04.82-1.04 1.66v.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Account', path: 'M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0' },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#dfe3e8] p-0">
      <div className="w-full rounded-none bg-white shadow-none overflow-hidden">
        <div className={`grid ${collapsed ? 'grid-cols-[98px_1fr]' : 'grid-cols-[292px_1fr]'} min-h-[720px] transition-[grid-template-columns] duration-300`}>
          <aside
            className={`relative overflow-hidden border-r border-white/70 text-[#273042] transition-all duration-300 ${
              collapsed ? 'px-3 py-5' : 'px-5 py-6'
            } bg-[linear-gradient(145deg,rgba(255,255,255,0.88),rgba(255,255,255,0.66))] backdrop-blur-2xl`}
            style={{ fontFamily: '"Sora", "DM Sans", "Plus Jakarta Sans", sans-serif' }}
          >
            <div className="pointer-events-none absolute -top-12 -left-16 h-40 w-40 rounded-full bg-[#f98b63]/20 blur-3xl" />
            <div className="pointer-events-none absolute top-1/3 -right-14 h-48 w-48 rounded-full bg-[#f6a376]/25 blur-3xl" />
            <div className="relative z-10 flex h-full flex-col">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className={`absolute top-1 rounded-full border border-[#f6c4ac] bg-white/85 p-1.5 text-[#cf6845] shadow-[0_8px_20px_rgba(249,140,102,0.25)] transition-all hover:scale-105 ${
                  collapsed ? 'right-0' : 'right-1'
                }`}
                aria-label="Toggle sidebar"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={collapsed ? 'M9 5.25L15 12l-6 6.75' : 'M15 5.25L9 12l6 6.75'} />
                </svg>
              </button>

              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} pt-1`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f98b63] to-[#f6a376] text-white shadow-[0_10px_24px_rgba(249,140,102,0.32)]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12A7.5 7.5 0 0112 4.5h7.5V12A7.5 7.5 0 0112 19.5H4.5V12z" />
                  </svg>
                </div>
                {!collapsed && (
                  <div>
                    <p className="text-xl font-semibold tracking-tight text-[#1f2937]">Zord</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#9ca3af]">Marketplace</p>
                  </div>
                )}
              </div>

              {!collapsed && (
                <label className="mt-5 block">
                  <span className="sr-only">Search</span>
                  <div className="flex h-11 items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_rgba(15,23,42,0.06)]">
                    <svg className="h-4 w-4 text-[#9ca3af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.65 7.65 0 103.35 3.35a7.65 7.65 0 0013.3 13.3z" />
                    </svg>
                    <input
                      placeholder="Search"
                      className="w-full bg-transparent text-sm text-[#374151] placeholder:text-[#9ca3af] focus:outline-none"
                    />
                  </div>
                </label>
              )}

              {!collapsed && (
                <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#f98b63] to-[#f6a376] p-4 text-white shadow-[0_14px_28px_rgba(249,140,102,0.35)]">
                  <p className="text-sm font-semibold tracking-wide">Zord Marketplace</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.25em] opacity-90">MYNTRA</p>
                  <p className="mt-5 text-xs uppercase tracking-wider opacity-80">Available for Payout</p>
                  <p className="mt-2 text-3xl font-semibold leading-none">₹12,57,700</p>
                  <p className="mt-5 text-xs opacity-85">Eligible for next payout run</p>
                </div>
              )}

              <nav className={`mt-5 flex-1 overflow-y-auto ${collapsed ? 'px-0' : 'pr-1'}`}>
                {sidebarGroups.map((group, groupIdx) => (
                  <div key={group.title} className={`${groupIdx > 0 ? 'mt-4 border-t border-white/70 pt-4' : ''}`}>
                    {!collapsed && (
                      <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">{group.title}</p>
                    )}
                    <div className={`mt-2 flex flex-col ${collapsed ? 'items-center gap-2.5' : 'gap-1.5'}`}>
                      {group.items.map((item) => {
                        const menuRoute = group.title === 'MENU' ? menuRoutes[item.label] : undefined
                        const isActive = menuRoute ? item.label === activeSection : item.label === activeUtilityItem
                        return (
                          <button
                            key={item.label}
                            onClick={() => {
                              if (menuRoute) {
                                router.push(menuRoute)
                                return
                              }
                              setActiveUtilityItem(item.label)
                            }}
                            title={collapsed ? item.label : undefined}
                            className={`group relative flex items-center rounded-2xl transition-all duration-200 ${
                              collapsed ? 'h-11 w-11 justify-center' : 'h-11 w-full gap-3 px-3'
                            } ${
                              isActive
                                ? 'bg-gradient-to-r from-[#f98b63]/20 via-[#f6a376]/15 to-transparent text-[#d0613d] shadow-[inset_0_0_0_1px_rgba(249,140,102,0.24)]'
                                : 'text-[#5f6b7a] hover:bg-white/70 hover:text-[#374151]'
                            }`}
                          >
                            <span
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                                isActive
                                  ? 'bg-[#f98b63]/18 text-[#d0613d]'
                                  : 'bg-white/75 text-[#6b7280] group-hover:text-[#4b5563]'
                              }`}
                            >
                              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path strokeLinecap="round" strokeLinejoin="round" d={item.path} />
                              </svg>
                            </span>
                            {!collapsed && <span className="flex-1 text-left text-sm font-medium">{item.label}</span>}
                            {!collapsed && item.badge && (
                              <span className="rounded-full bg-[#f1694b] px-2 py-0.5 text-[10px] font-semibold text-white">{item.badge}</span>
                            )}
                            {collapsed && item.badge && (
                              <span className="absolute -right-1 -top-1 rounded-full bg-[#f1694b] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="mt-4 border-t border-white/70 pt-4">
                {!collapsed ? (
                  <div className="flex items-center justify-between rounded-2xl border border-white/75 bg-white/70 px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full border border-white/70 bg-[radial-gradient(circle_at_35%_35%,#ffd7c8,#f98b63)]" />
                      <div>
                        <p className="text-sm font-semibold text-[#2f3b4d]">Kristin Watson</p>
                        <p className="text-[11px] text-[#9ca3af]">kristinwatson@gmail.com</p>
                      </div>
                    </div>
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#e56c49] hover:bg-[#f98b63]/12">
                      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.625A2.625 2.625 0 0013.125 3h-6.75A2.625 2.625 0 003.75 5.625v12.75A2.625 2.625 0 006.375 21h6.75a2.625 2.625 0 002.625-2.625V15m-6-3h10.5m0 0L17.25 9m3 3l-3 3" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 rounded-full border border-white/70 bg-[radial-gradient(circle_at_35%_35%,#ffd7c8,#f98b63)]" />
                    <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#e56c49] hover:bg-[#f98b63]/12">
                      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.625A2.625 2.625 0 0013.125 3h-6.75A2.625 2.625 0 003.75 5.625v12.75A2.625 2.625 0 006.375 21h6.75a2.625 2.625 0 002.625-2.625V15m-6-3h10.5m0 0L17.25 9m3 3l-3 3" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="bg-white">
            <div className="relative z-0 h-[190px] bg-gradient-to-r from-[#f98b63] to-[#f6a376] text-white px-8 pt-5">
              <div className="flex items-start justify-end">
                <div className="flex items-center gap-4">
                  <div className="relative h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.17V11a6 6 0 10-12 0v3.17a2 2 0 01-.6 1.43L4 17h5m6 0a3 3 0 01-6 0" />
                    </svg>
                  </div>
                  <div className="h-11 w-11 rounded-full border-2 border-white/70 bg-[radial-gradient(circle_at_35%_35%,#f8f8f8,#cfcfcf)]" />
                </div>
              </div>
              <div className="absolute right-8 top-2 grid grid-cols-3 gap-2 opacity-30">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-8 w-8 bg-white/40"
                    style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                  />
                ))}
              </div>
            </div>

            <div className="px-6 -mt-10 relative z-10">
              {activeSection === 'Overview' ? (
                <>
                  <div
                    className="grid grid-cols-4 gap-5"
                    style={{ fontFamily: '"Glacial Indifference", "Sora", "Space Grotesk", sans-serif' }}
                  >
                    <div className="rounded-[22px] border border-[#4d3aa8]/20 bg-gradient-to-br from-[#5f4cc3] via-[#5644b3] to-[#4b3da6] p-6 shadow-[0_22px_55px_rgba(71,54,168,0.35)]">
                      <p className="text-[11px] uppercase tracking-wider text-white/70">Total Payout Volume</p>
                      <p className="mt-3 text-3xl font-semibold text-white">₹12.4M</p>
                      <p className="text-sm text-white/70">Last 24h</p>
                      <p className="text-sm text-emerald-200 font-semibold">+8%</p>
                    </div>
                    <div className="rounded-[22px] border border-[#29324e]/25 bg-gradient-to-br from-[#1f2a44] via-[#1b253d] to-[#141b2f] p-6 shadow-[0_22px_55px_rgba(20,24,44,0.45)]">
                      <p className="text-[11px] uppercase tracking-wider text-white/70">Successful Payouts</p>
                      <p className="mt-3 text-3xl font-semibold text-white">1,364</p>
                      <p className="text-sm text-white/70">98.2%</p>
                    </div>
                    <div className="rounded-[22px] border border-[#f4b183]/30 bg-gradient-to-br from-[#f6b07c] via-[#f39b63] to-[#ee8750] p-6 shadow-[0_22px_55px_rgba(239,140,94,0.35)]">
                      <p className="text-[11px] uppercase tracking-wider text-white/80">Pending Settlement</p>
                      <p className="mt-3 text-3xl font-semibold text-white">₹3.1M</p>
                      <p className="text-sm text-white/80">72 payouts</p>
                    </div>
                    <div className="rounded-[22px] border border-[#ffb3b3]/35 bg-gradient-to-br from-[#ff8f8f] via-[#ff6f6f] to-[#f14c4c] p-6 shadow-[0_22px_55px_rgba(220,38,38,0.35)]">
                      <p className="text-[11px] uppercase tracking-wider text-white/80">Failed Payouts</p>
                      <p className="mt-3 text-3xl font-semibold text-white">18</p>
                      <p className="text-sm text-white/80">↓ 12%</p>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-6">
                {/* Settlement Activity Chart */}
                <section className="rounded-2xl border border-[#dde3ec] bg-[#f7f9fc] shadow-[0_18px_36px_rgba(15,23,42,0.08)] flex flex-col">
                  <div className="flex items-start justify-between px-6 pt-5">
                    <div>
                      <h3 className="text-base font-semibold text-[#0f172a]">Settlement Activity (Last 4 Months)</h3>
                      <p className="text-xs text-[#64748b]">Monitor daily payout settlements and confirmations</p>
                      <p className="mt-3 text-xs text-[#94a3b8]">Avg. settlements this week</p>
                      <div className="mt-1 flex items-baseline gap-3">
                        <span className="text-4xl font-semibold leading-none text-[#0f172a]">28,953</span>
                        <span className="text-[15px] text-[#64748b]">Settlements</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#7c4ff2]">+10% vs last hour</p>
                    </div>
                    <button className="text-xl text-[#94a3b8]">⋯</button>
                  </div>

                  <div className="px-6 pt-5 pb-6 flex-1">
                    <div className="rounded-2xl border border-[#e5eaf2] bg-[#f1f4f9] p-3">
                      <div className="relative h-56">
                        <div className="absolute left-2 right-[38%] top-2 bottom-9 flex items-end gap-1.5">
                          {settlementTrendValues.map((value, index) => {
                            const isHighlighted = index >= highlightedStart && index <= highlightedEnd
                            const isActive = settlementActive === null || settlementActive === index
                            return (
                              <button
                                key={`${value}-${index}`}
                                className="group/bar relative flex-1 rounded-t-[9px] transition-all duration-300"
                                style={{
                                  height: `${value}%`,
                                  background: isHighlighted
                                    ? 'linear-gradient(180deg, #b296ff 0%, #7c4ff2 100%)'
                                    : 'linear-gradient(180deg, #d6d9e2 0%, #c6cad4 100%)',
                                  opacity: isActive ? 1 : 0.45,
                                  boxShadow: isHighlighted ? '0 6px 14px rgba(124,79,242,0.28)' : 'none',
                                }}
                                onMouseEnter={() => setSettlementActive(index)}
                                onMouseLeave={() => setSettlementActive(null)}
                                aria-label={`Settlement bar ${index + 1}`}
                              />
                            )
                          })}
                        </div>

                        <div className="absolute right-2 top-3 w-[35%] min-w-[175px] rounded-2xl border border-[#d8deea] bg-white/90 p-3 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
                          <p className="text-[13px] font-semibold text-[#334155]">Webhook Source</p>
                          <p className="mt-1 text-sm text-[#475569]">{activeSettlementCount} settlements</p>
                          <p className="text-sm text-[#64748b]">Window {activeSettlementIndex + 1}</p>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 text-[11px] text-[#94a3b8]">
                          <span>API</span>
                          <span>CSV</span>
                          <span className="font-semibold text-[#7c4ff2]">Webhook</span>
                          <span>File</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {settlementInfoCards.map((card) => (
                        <div key={card.label} className="rounded-2xl border border-[#dbe2ec] bg-[#f8fafc] px-4 py-3">
                          <p className="text-xs text-[#64748b]">{card.label}</p>
                          <p className="mt-2 text-3xl font-semibold leading-none text-[#0f172a]">{card.value}</p>
                          <p className="mt-2 text-sm text-[#64748b]">{card.unit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Payout Volume Line Chart */}
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.10)]">
                  <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                      <h3 className="text-base font-semibold text-[#0f172a]">Payout Financial Activity</h3>
                      <p className="mt-1 text-xs text-[#64748b]">Cash-in, cash-out and balance trend</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#475569]">
                      <button className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">Last 30 days ▾</button>
                      <button className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">17 Jun - 17 Jul</button>
                    </div>
                  </div>

                  <div className="px-6 py-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-[#e8edf5] bg-[#fbfcff] p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-[#94a3b8]">Net Income</p>
                        <div className="mt-2 inline-flex rounded-full border border-[#f4b183]/50 bg-[#fff5ef] px-2 py-0.5 text-[11px] font-semibold text-[#d0613d]">
                          Accrual
                        </div>
                        <p className="mt-2 text-3xl font-semibold text-[#0f172a]">₹90,000.00</p>
                        <p className="mt-1 text-xs font-semibold text-[#f97316]">+10% vs last hour</p>
                      </div>
                      <div className="rounded-xl border border-[#e8edf5] bg-[#fbfcff] p-4 text-right">
                        <p className="text-xs uppercase tracking-[0.16em] text-[#94a3b8]">Cashflow</p>
                        <p className="mt-7 text-3xl font-semibold text-[#0f172a]">₹25,000.00</p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <h4 className="text-xl font-semibold text-[#0f172a]">Cashflow &amp; Balance</h4>
                      <button className="rounded-lg border border-[#f4b183]/45 bg-[#fff5ef] px-3 py-1 text-xs font-semibold text-[#d0613d]">
                        Daily
                      </button>
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#e8edf5] bg-[#fbfcff] p-4">
                      <div className="relative">
                        <svg viewBox={`0 0 ${payoutChartWidth} ${payoutChartHeight}`} className="h-72 w-full">
                          <defs>
                            <linearGradient id="zordBalanceFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#1f3b8a" stopOpacity="0.18" />
                              <stop offset="100%" stopColor="#1f3b8a" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          <g stroke="#e2e8f0" strokeDasharray="4 6" strokeWidth="1">
                            <line x1="0" y1={payoutPadding.top} x2={payoutChartWidth} y2={payoutPadding.top} />
                            <line x1="0" y1={payoutPadding.top + payoutInnerHeight * 0.33} x2={payoutChartWidth} y2={payoutPadding.top + payoutInnerHeight * 0.33} />
                            <line x1="0" y1={payoutPadding.top + payoutInnerHeight * 0.66} x2={payoutChartWidth} y2={payoutPadding.top + payoutInnerHeight * 0.66} />
                            <line x1="0" y1={payoutPadding.top + payoutInnerHeight} x2={payoutChartWidth} y2={payoutPadding.top + payoutInnerHeight} />
                          </g>

                          {payoutPoints.map((point) => {
                            const groupLeft = point.x - payoutBarGroupWidth / 2
                            const cashInHeight = (point.cashIn / payoutCashMax) * payoutInnerHeight
                            const cashOutHeight = (point.cashOut / payoutCashMax) * payoutInnerHeight
                            const yCashIn = payoutPadding.top + payoutInnerHeight - cashInHeight
                            const yCashOut = payoutPadding.top + payoutInnerHeight - cashOutHeight
                            return (
                              <g key={point.day}>
                                <rect
                                  x={groupLeft + payoutBarGroupWidth * 0.08}
                                  y={yCashIn}
                                  width={payoutBarWidth}
                                  height={cashInHeight}
                                  rx="2"
                                  fill="rgba(249,139,99,0.35)"
                                />
                                <rect
                                  x={groupLeft + payoutBarGroupWidth * 0.08 + payoutBarWidth + 1.8}
                                  y={yCashOut}
                                  width={payoutBarWidth}
                                  height={cashOutHeight}
                                  rx="2"
                                  fill="rgba(30,41,59,0.22)"
                                />
                              </g>
                            )
                          })}

                          <path
                            d={`${payoutLinePath} L${payoutChartWidth},${payoutPadding.top + payoutInnerHeight} L0,${payoutPadding.top + payoutInnerHeight} Z`}
                            fill="url(#zordBalanceFill)"
                          />
                          <path
                            d={payoutLinePath}
                            stroke="#1f3b8a"
                            strokeWidth="3.2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {payoutPoints.map((point, idx) => (
                            <g key={`marker-${point.day}`}>
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r="8"
                                fill="transparent"
                                onMouseEnter={() => setPayoutActive(idx)}
                                onMouseLeave={() => setPayoutActive(null)}
                              />
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r={activePayoutIndex === idx ? '4.2' : '2.3'}
                                fill={activePayoutIndex === idx ? '#1f3b8a' : '#94a3b8'}
                                stroke="white"
                                strokeWidth={activePayoutIndex === idx ? '1.4' : '1'}
                              />
                            </g>
                          ))}
                        </svg>

                        <div
                          className="absolute rounded-xl border border-[#d6deeb] bg-white/96 px-3 py-2 shadow-[0_10px_22px_rgba(15,23,42,0.12)]"
                          style={{
                            left: `${payoutTooltipLeft}%`,
                            top: `${(activePayoutPoint.y / payoutChartHeight) * 100}%`,
                            transform: 'translate(-16%, -120%)',
                          }}
                        >
                          <p className="text-sm font-semibold text-[#0f172a]">Cash balance</p>
                          <p className="text-xs text-[#64748b]">{activePayoutPoint.day}</p>
                          <p className="mt-1 rounded-md bg-[#f8fafc] px-2 py-1 text-sm font-semibold text-[#0f172a]">
                            ₹{(activePayoutPoint.balance * 10000).toLocaleString()}.00
                          </p>
                        </div>

                        <div className="pointer-events-none absolute left-0 top-3 flex h-[calc(100%-52px)] flex-col justify-between text-xs text-[#94a3b8]">
                          <span>₹8k</span>
                          <span>₹6k</span>
                          <span>₹4k</span>
                          <span>₹2k</span>
                          <span>0</span>
                        </div>
                        <div className="pointer-events-none absolute right-0 top-3 flex h-[calc(100%-52px)] flex-col justify-between text-xs text-[#94a3b8]">
                          <span>₹14k</span>
                          <span>₹13k</span>
                          <span>₹12k</span>
                          <span>₹10k</span>
                          <span>0</span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-[#94a3b8]">
                        <span>{payoutVolumeSeries[0].day}</span>
                        <span>{payoutVolumeSeries[Math.floor(payoutVolumeSeries.length / 2)].day}</span>
                        <span>{payoutVolumeSeries[payoutVolumeSeries.length - 1].day}</span>
                      </div>

                      <div className="mt-4 flex items-center gap-6 text-xs text-[#475569]">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-3 w-3 rounded-sm bg-[#f98b63]"></span>
                          Cash in
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-3 w-3 rounded-sm bg-[#334155]/60"></span>
                          Cash out
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-[3px] w-4 rounded bg-[#1f3b8a]"></span>
                          Cash balance
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
                  </div>
                </>
              ) : null}

              <div className="mt-8 grid grid-cols-1 gap-6 pb-8">
                {activeSection === 'Payouts' ? (
                  <section className="space-y-4">
                    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">Payouts</h1>
                          <p className="text-sm text-[#64748b]">Seller Settlements</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button className="rounded-lg border border-[#f4b183]/55 bg-[#fff5ef] px-3 py-2 text-xs font-semibold text-[#d0613d]">Run Payout Batch</button>
                          <button className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#0f172a] hover:bg-gray-50">Upload CSV</button>
                          <button className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#0f172a] hover:bg-gray-50">Export Report</button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.07)]">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <label className="text-xs font-medium text-[#475569]">
                          Date Range
                          <select value={dateRangeFilter} onChange={(event) => setDateRangeFilter(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-[#0f172a] outline-none">
                            <option value="24h">Last 24h</option>
                            <option value="7d">Last 7d</option>
                            <option value="30d">Last 30d</option>
                          </select>
                        </label>
                        <label className="text-xs font-medium text-[#475569]">
                          Seller ID
                          <input value={sellerFilter} onChange={(event) => setSellerFilter(event.target.value)} placeholder="Search seller..." className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-[#0f172a] placeholder:text-[#94a3b8] outline-none" />
                        </label>
                        <label className="text-xs font-medium text-[#475569]">
                          PSP
                          <select value={pspFilter} onChange={(event) => setPspFilter(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-[#0f172a] outline-none">
                            {pspOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-medium text-[#475569]">
                          Rail
                          <select value={railFilter} onChange={(event) => setRailFilter(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-[#0f172a] outline-none">
                            {railOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-medium text-[#475569]">
                          Status
                          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-[#0f172a] outline-none">
                            {payoutStatusFilterOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-medium text-[#475569]">
                          Search
                          <input value={payoutSearch} onChange={(event) => setPayoutSearch(event.target.value)} placeholder="Intent ID / UTR / Seller" className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-[#0f172a] placeholder:text-[#94a3b8] outline-none" />
                        </label>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => {
                            setDateRangeFilter('24h')
                            setSellerFilter('')
                            setPspFilter('All')
                            setRailFilter('All')
                            setStatusFilter('All')
                            setPayoutSearch('')
                          }}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-gray-50"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_16px_32px_rgba(15,23,42,0.09)]">
                        <div className="overflow-x-auto">
                          <table className={`w-full text-sm ${isFailedOnlyView || isDlqOnlyView ? 'min-w-[860px]' : 'min-w-[1260px]'}`}>
                            <thead>
                              {isFailedOnlyView ? (
                                <tr className="border-b border-gray-100 bg-gray-50/70">
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Intent ID</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Seller</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">PSP</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Failure Reason</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                                </tr>
                              ) : isDlqOnlyView ? (
                                <tr className="border-b border-gray-100 bg-gray-50/70">
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Intent ID</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Seller</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Error</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                                </tr>
                              ) : (
                                <tr className="border-b border-gray-100 bg-gray-50/70">
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Intent ID</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Seller</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">PSP</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Rail</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Bank Ref (UTR)</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Last Updated</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                                </tr>
                              )}
                            </thead>
                            <tbody>
                              {paginatedPayoutRows.length ? (
                                paginatedPayoutRows.map((row) => (
                                  <tr key={row.intentId} className="border-b border-gray-100 transition-colors hover:bg-gray-50/50">
                                    {isFailedOnlyView ? (
                                      <>
                                        <td className="px-4 py-3 text-xs font-semibold text-[#0f172a]">{row.intentId}</td>
                                        <td className="px-4 py-3 text-xs text-gray-700">{row.sellerId} {row.sellerName}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-[#0f172a]">{formatAmount(row.amount)}</td>
                                        <td className="px-4 py-3 text-xs text-gray-700">{row.psp}</td>
                                        <td className="px-4 py-3 text-xs text-gray-700">{row.failureReason || 'Gateway Timeout'}</td>
                                        <td className="px-4 py-3">
                                          <button className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">Replay</button>
                                        </td>
                                      </>
                                    ) : isDlqOnlyView ? (
                                      <>
                                        <td className="px-4 py-3 text-xs font-semibold text-[#0f172a]">{row.intentId}</td>
                                        <td className="px-4 py-3 text-xs text-gray-700">{row.sellerId} {row.sellerName}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-[#0f172a]">{formatAmount(row.amount)}</td>
                                        <td className="px-4 py-3 text-xs text-gray-700">{row.dlqError || 'Missing IFSC'}</td>
                                        <td className="px-4 py-3">
                                          <button className="rounded-lg border border-gray-300 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">Fix Data</button>
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="px-4 py-3 text-xs font-semibold text-[#0f172a]">{row.intentId}</td>
                                        <td className="px-4 py-3 text-xs text-gray-700">
                                          <span className="font-semibold text-[#334155]">{row.sellerId}</span> {row.sellerName}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-semibold text-[#0f172a]">{formatAmount(row.amount)}</td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            <Image src={sourceLogos[row.psp] || '/sources/stripe-clean.png'} alt={row.psp} width={26} height={18} className="h-4 w-auto object-contain" />
                                            <span className="text-xs text-gray-700">{row.psp}</span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-700">{row.rail}</td>
                                        <td className="px-4 py-3">
                                          <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold ${getStatusColor(row.status)}`}>
                                            {payoutStatusValueToLabel[row.status]}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-700">{row.bankRef}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600">{row.lastUpdated}</td>
                                        <td className="px-4 py-3">
                                          <button className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                            {getPayoutActionLabel(row)}
                                          </button>
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td className="px-4 py-10 text-center text-sm text-gray-500" colSpan={isFailedOnlyView ? 6 : isDlqOnlyView ? 5 : 9}>
                                    No payouts found for selected filters.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
                          <p className="text-xs text-gray-600">Showing {payoutStartIndex}-{payoutEndIndex} of {filteredPayoutRows.length.toLocaleString()} payouts</p>
                          <div className="flex items-center gap-1 text-xs">
                            <button onClick={() => setPayoutPage((page) => Math.max(1, page - 1))} disabled={safePayoutPage === 1} className="rounded-md border border-gray-200 px-2 py-1 text-gray-600 disabled:opacity-40">Previous</button>
                            {Array.from({ length: Math.min(4, totalPayoutPages) }).map((_, index) => {
                              const pageNumber = index + 1
                              return (
                                <button
                                  key={pageNumber}
                                  onClick={() => setPayoutPage(pageNumber)}
                                  className={`rounded-md border px-2 py-1 ${safePayoutPage === pageNumber ? 'border-[#f98b63] bg-[#fff5ef] text-[#d0613d]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                  {pageNumber}
                                </button>
                              )
                            })}
                            <button onClick={() => setPayoutPage((page) => Math.min(totalPayoutPages, page + 1))} disabled={safePayoutPage === totalPayoutPages} className="rounded-md border border-gray-200 px-2 py-1 text-gray-600 disabled:opacity-40">Next</button>
                          </div>
                        </div>
                      </section>
                    </div>
                  </section>
                ) : null}

                {activeSection !== 'Overview' && activeSection !== 'Payouts' ? (
                  <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_18px_36px_rgba(15,23,42,0.10)]">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#94a3b8]">Menu Workspace</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#0f172a]">{activeSection}</h2>
                    <p className="mt-3 max-w-2xl text-sm text-[#64748b]">{menuDescriptions[activeSection] || 'Module view is now isolated from Overview and ready for custom widgets.'}</p>
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                        <p className="text-xs text-[#64748b]">This Week</p>
                        <p className="mt-2 text-2xl font-semibold text-[#0f172a]">128</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                        <p className="text-xs text-[#64748b]">Pending Action</p>
                        <p className="mt-2 text-2xl font-semibold text-[#0f172a]">24</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                        <p className="text-xs text-[#64748b]">SLA</p>
                        <p className="mt-2 text-2xl font-semibold text-[#0f172a]">98.4%</p>
                      </div>
                    </div>
                  </section>
                ) : null}

                {activeSection === 'Overview' ? (
                  <section
                    className="relative overflow-hidden rounded-[22px] p-6"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.8))',
                      backdropFilter: 'blur(18px)',
                      WebkitBackdropFilter: 'blur(18px)',
                      border: '1px solid rgba(15,23,42,0.08)',
                      boxShadow: '0 18px 36px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.95)',
                    }}
                  >
                    <div className="relative z-10 text-left space-y-5">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-[#d1d5db] bg-white">
                          <svg className="h-4 w-4 text-[#4b5563]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5l1.7 4.3 4.3 1.7-4.3 1.7-1.7 4.3-1.7-4.3-4.3-1.7 4.3-1.7L12 4.5z" />
                          </svg>
                        </span>
                        <div>
                          <h3 className="text-xl font-semibold text-[#0f172a] tracking-tight">Zord Intelligence</h3>
                          <p className="mt-1 text-sm text-[#64748b]">Live payout intelligence signals • updated 12s ago</p>
                        </div>
                      </div>

                      {/* Alerts Container */}
                      <div className="space-y-3.5 pt-2">
                        {zpiAlerts.map((alert) => (
                          <div
                            key={alert.severity}
                            className="group/alert relative flex cursor-pointer items-start gap-3.5 overflow-hidden rounded-[14px] p-[18px] transition-all duration-200 hover:translate-y-[-2px]"
                            style={{
                              background: alert.surface,
                              backdropFilter: 'blur(18px)',
                              WebkitBackdropFilter: 'blur(18px)',
                              border: alert.border,
                              boxShadow: 'none',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = alert.hoverShadow;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <div className="absolute left-0 top-0 h-full w-1" style={{ background: alert.color }} />
                            <div
                              className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                              style={{
                                backgroundColor: alert.color,
                                boxShadow: `0 0 10px ${alert.color}`,
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p
                                  className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.22em]"
                                  style={{
                                    color: alert.color,
                                    background: alert.badgeBg,
                                    border: alert.badgeBorder,
                                  }}
                                >
                                  {alert.severity}
                                </p>
                                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#64748b]">Live</span>
                              </div>
                              <p className="mt-2 text-lg font-semibold leading-snug text-[#0f172a]">{alert.title}</p>
                              <p className="mt-1 text-sm text-[#64748b]">{alert.subtitle}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <button
                        className="mt-5 w-full rounded-[14px] py-3 text-base font-medium text-[#0f172a] transition-all duration-200"
                        style={{
                          background: 'rgba(255,255,255,0.82)',
                          border: '1px solid rgba(148,163,184,0.35)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(241,245,249,0.94)';
                          e.currentTarget.style.borderColor = 'rgba(148,163,184,0.45)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.82)';
                          e.currentTarget.style.borderColor = 'rgba(148,163,184,0.35)';
                        }}
                      >
                        Open Intelligence →
                      </button>
                    </div>
                  </section>
                ) : null}

              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
