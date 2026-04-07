'use client'

export const dynamic = 'force-dynamic'

import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'

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

const SOURCE_LOGOS: Record<string, string> = {
  Razorpay: '/sources/razorpay-clean-clean.png',
  Cashfree: '/sources/cashfree-clean.png',
  PayPal: '/sources/paypal-clean.png',
  Stripe: '/sources/stripe-clean.png',
  PhonePe: '/sources/phonepe-clean.png',
  'Google Pay': '/sources/gpay-clean.png',
  BHIM: '/sources/bhim-clean.png',
  'HDFC Bank': '/sources/hdfc-bank-clean.png',
}

const STATUS_OPTIONS = ['All', 'Success', 'Processing', 'Pending', 'Failed', 'DLQ', 'Replay Scheduled']

const STATUS_FILTER_MAP: Record<string, PayoutStatus | ''> = {
  All: '',
  Success: 'SUCCESS',
  Processing: 'PROCESSING',
  Pending: 'PENDING',
  Failed: 'FAILED',
  DLQ: 'DLQ',
  'Replay Scheduled': 'REPLAY_SCHEDULED',
}

const STATUS_LABEL_MAP: Record<PayoutStatus, string> = {
  SUCCESS: 'SUCCESS',
  PROCESSING: 'PROCESSING',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  DLQ: 'DLQ',
  REPLAY_SCHEDULED: 'REPLAY',
}

const DATE_RANGE_HOURS: Record<string, number> = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
}

const PAYOUT_ROWS: PayoutRow[] = [
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
]

const statusClass = (status: PayoutStatus) => {
  if (status === 'SUCCESS') return 'border-[#4CAF50]/45 bg-[#4CAF50]/18 text-[#d8f6df]'
  if (status === 'PROCESSING') return 'border-[#FFA726]/45 bg-[#FFA726]/18 text-[#ffe7c2]'
  if (status === 'PENDING') return 'border-[#FFD54F]/45 bg-[#FFD54F]/18 text-[#fff5cc]'
  if (status === 'FAILED') return 'border-[#FF5252]/45 bg-[#FF5252]/18 text-[#ffe1e1]'
  if (status === 'DLQ') return 'border-white/24 bg-white/10 text-[var(--ij-text-primary)]'
  return 'border-[#FFA726]/45 bg-[#FFA726]/18 text-[#ffe7c2]'
}

const rowActionLabel = (row: PayoutRow) => {
  if (row.status === 'FAILED') return 'Replay'
  if (row.status === 'DLQ') return 'Fix'
  return 'View'
}

const formatAmount = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

function CustomerTestIntentJournalPageContent() {
  const searchParams = useSearchParams()
  const [dateRangeFilter, setDateRangeFilter] = useState('24h')
  const [sellerFilter, setSellerFilter] = useState('')
  const [pspFilter, setPspFilter] = useState('All')
  const [railFilter, setRailFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchFilter, setSearchFilter] = useState('')
  const [page, setPage] = useState(1)
  const rowsPerPage = 25

  const pspOptions = useMemo(() => ['All', ...Array.from(new Set(PAYOUT_ROWS.map((row) => row.psp)))], [])
  const railOptions = useMemo(() => ['All', ...Array.from(new Set(PAYOUT_ROWS.map((row) => row.rail)))], [])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearchFilter(q)
  }, [searchParams])

  useEffect(() => {
    setPage(1)
  }, [dateRangeFilter, sellerFilter, pspFilter, railFilter, statusFilter, searchFilter])

  const filteredRows = useMemo(() => {
    const maxHours = DATE_RANGE_HOURS[dateRangeFilter] ?? 24
    const selectedStatus = STATUS_FILTER_MAP[statusFilter] || ''
    const sellerQuery = sellerFilter.trim().toLowerCase()
    const searchQuery = searchFilter.trim().toLowerCase()

    return PAYOUT_ROWS.filter((row) => {
      const byDate = row.updatedHoursAgo <= maxHours
      const bySeller =
        sellerQuery === '' || `${row.sellerId} ${row.sellerName}`.toLowerCase().includes(sellerQuery)
      const byPsp = pspFilter === 'All' || row.psp === pspFilter
      const byRail = railFilter === 'All' || row.rail === railFilter
      const byStatus = selectedStatus === '' || row.status === selectedStatus
      const bySearch =
        searchQuery === '' ||
        `${row.intentId} ${row.bankRef} ${row.sellerId} ${row.sellerName}`.toLowerCase().includes(searchQuery)
      return byDate && bySeller && byPsp && byRail && byStatus && bySearch
    })
  }, [dateRangeFilter, sellerFilter, pspFilter, railFilter, statusFilter, searchFilter])

  const isFailedOnly = statusFilter === 'Failed'
  const isDlqOnly = statusFilter === 'DLQ'

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const paginatedRows = filteredRows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)
  const startIndex = filteredRows.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1
  const endIndex = Math.min(safePage * rowsPerPage, filteredRows.length)
  const successCount = filteredRows.filter((row) => row.status === 'SUCCESS').length
  const inFlightCount = filteredRows.filter((row) => row.status === 'PROCESSING' || row.status === 'PENDING').length
  const exceptionCount = filteredRows.filter((row) => row.status === 'FAILED' || row.status === 'DLQ').length
  const successRate = filteredRows.length ? ((successCount / filteredRows.length) * 100).toFixed(1) : '0.0'
  const systemDateTime = useMemo(
    () =>
      new Intl.DateTimeFormat('en-IN', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date()),
    []
  )

  return (
    <>
      <style jsx>{`
        .ij-app-bg {
          --ij-text-primary: #e6e6e6;
          --ij-text-secondary: #a6a6a6;
          --ij-text-muted: #7a7a7a;
          --ij-focus-ring: rgba(255, 255, 255, 0.3);
          --ij-hover-bg: rgba(255, 255, 255, 0.16);
          --ij-page-active-bg: rgba(255, 255, 255, 0.14);
          --ij-page-active-border: rgba(255, 255, 255, 0.3);
          --ij-bg:
            radial-gradient(circle at 80% 10%, rgba(28, 44, 68, 0.34) 0%, transparent 60%),
            linear-gradient(180deg, #0b0b0c 0%, #141416 50%, #1c1c1f 100%);
          --ij-shell-bg: rgba(20, 20, 22, 0.6);
          --ij-shell-border: rgba(255, 255, 255, 0.08);
          --ij-shell-shadow: 0 40px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          --ij-glass-bg:
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
            rgba(255, 255, 255, 0.05);
          --ij-glass-border: rgba(255, 255, 255, 0.12);
          --ij-glass-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 10px 40px rgba(0, 0, 0, 0.5);
          --ij-input-placeholder: #7a7a7a;
          --ij-row-hover: rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          background: var(--ij-bg);
        }

        :global(html:not([data-theme='dark'])) .ij-app-bg {
          --ij-text-primary: #1a1a1f;
          --ij-text-secondary: #4a4a55;
          --ij-text-muted: #8c8ca3;
          --ij-focus-ring: rgba(124, 107, 255, 0.35);
          --ij-hover-bg: rgba(124, 107, 255, 0.08);
          --ij-page-active-bg: rgba(124, 107, 255, 0.15);
          --ij-page-active-border: rgba(124, 107, 255, 0.35);
          --ij-bg:
            radial-gradient(circle at 20% 30%, rgba(228, 222, 255, 0.9) 0%, rgba(228, 222, 255, 0) 60%),
            radial-gradient(circle at 80% 10%, rgba(201, 190, 255, 0.85) 0%, rgba(201, 190, 255, 0) 50%),
            linear-gradient(180deg, #f4f1ff 0%, #e7e2ff 35%, #d8d1ff 70%, #cfc5ff 100%);
          --ij-shell-bg: rgba(255, 255, 255, 0.55);
          --ij-shell-border: rgba(124, 107, 255, 0.25);
          --ij-shell-shadow: 0 10px 30px rgba(90, 70, 255, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95);
          --ij-glass-bg:
            linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.35)),
            rgba(255, 255, 255, 0.55);
          --ij-glass-border: rgba(124, 107, 255, 0.25);
          --ij-glass-shadow: 0 10px 30px rgba(90, 70, 255, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95);
          --ij-input-placeholder: #8c8ca3;
          --ij-row-hover: rgba(124, 107, 255, 0.08);
        }

        .ij-backdrop {
          position: relative;
          overflow: hidden;
          border-radius: 32px;
          padding: 32px;
          background: var(--ij-shell-bg);
          border: 1px solid var(--ij-shell-border);
          box-shadow: var(--ij-shell-shadow);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
        }

        .ij-shell {
          max-width: 1280px;
          margin: 4px auto 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ij-backdrop::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(480px 240px at 8% 0%, rgba(255, 255, 255, 0.1), transparent 65%),
            radial-gradient(460px 260px at 100% 12%, rgba(255, 255, 255, 0.08), transparent 65%);
          pointer-events: none;
        }

        .ij-backdrop > * {
          position: relative;
          z-index: 1;
        }

        .ij-glass-card {
          background: var(--ij-glass-bg);
          border: 1px solid var(--ij-glass-border);
          box-shadow: var(--ij-glass-shadow);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
        }

        .ij-system-bar {
          min-height: 60px;
          border-radius: 20px;
          background: var(--ij-glass-bg);
          border: 1px solid var(--ij-glass-border);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: var(--ij-glass-shadow);
        }

        .ij-system-chip {
          border-radius: 12px;
          border: 1px solid var(--ij-glass-border);
          background: var(--ij-glass-bg);
          padding: 8px 12px;
          font-size: 12px;
          color: var(--ij-text-secondary);
        }

        .ij-kpi-card {
          height: 120px;
          border-radius: 20px;
          padding: 16px;
          background: var(--ij-glass-bg);
          border: 1px solid var(--ij-glass-border);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          box-shadow: var(--ij-glass-shadow);
          transition: all 0.2s ease;
        }

        .ij-kpi-card:hover {
          transform: scale(1.02);
        }

        .ij-header-card {
          min-height: 120px;
          display: flex;
          align-items: center;
        }

        .ij-filter-card {
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .ij-table-card {
          border-radius: 22px;
        }

        .ij-control {
          border: 1px solid var(--ij-glass-border);
          background: var(--ij-glass-bg);
          color: var(--ij-text-primary);
          box-shadow: var(--ij-glass-shadow);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
        }

        .ij-control::placeholder {
          color: var(--ij-input-placeholder);
        }

        .ij-control option {
          color: #0f172a;
        }

        .ij-control:focus {
          border-color: var(--ij-focus-ring);
          box-shadow: 0 0 0 1px var(--ij-focus-ring), 0 10px 40px rgba(0, 0, 0, 0.35);
        }

        .ij-btn {
          border: 1px solid var(--ij-glass-border);
          background: var(--ij-glass-bg);
          color: var(--ij-text-primary);
          box-shadow: var(--ij-glass-shadow);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          transition: all 0.2s ease;
        }

        .ij-btn:hover {
          background: var(--ij-hover-bg);
          transform: scale(1.02);
        }

        .ij-btn-primary {
          border: 1px solid rgba(124, 107, 255, 0.45);
          background: linear-gradient(135deg, #7c6bff, #5b4bff);
          color: #ffffff;
          box-shadow: 0 6px 20px rgba(124, 107, 255, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          transition: all 0.2s ease;
        }

        .ij-btn-primary:hover {
          filter: brightness(1.08);
          transform: scale(1.02);
        }

        .ij-table-head {
          border-bottom: 1px solid var(--ij-glass-border);
          background: var(--ij-glass-bg);
        }

        .ij-row {
          border-bottom: 1px solid var(--ij-glass-border);
        }

        .ij-row:hover {
          background: var(--ij-row-hover);
        }

        .ij-mini-btn {
          border: 1px solid var(--ij-glass-border);
          background: var(--ij-glass-bg);
          color: var(--ij-text-primary);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
          transition: all 0.2s ease;
        }

        .ij-mini-btn:hover {
          background: var(--ij-hover-bg);
          transform: scale(1.02);
        }

        .ij-footer {
          border-top: 1px solid var(--ij-glass-border);
          background: var(--ij-glass-bg);
        }

        .ij-page-btn {
          border: 1px solid var(--ij-glass-border);
          background: var(--ij-glass-bg);
          color: var(--ij-text-secondary);
          transition: all 0.2s ease;
        }

        .ij-page-btn:hover {
          background: var(--ij-hover-bg);
        }

        .ij-page-btn-active {
          border-color: var(--ij-page-active-border);
          background: var(--ij-page-active-bg);
          color: var(--ij-text-primary);
        }
      `}</style>
      <div className="ij-app-bg w-full p-6 lg:p-8">
        <main className="ij-backdrop ij-shell">
        <section className="ij-system-bar flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <span className="ij-system-chip">{systemDateTime}</span>
          <span className="ij-system-chip">Rail Health: Normal</span>
          <span className="ij-system-chip">Tenant: Bandhan Bank</span>
          <span className="ij-system-chip">Profile: Rahul (Ops)</span>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="ij-kpi-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ij-text-muted)]">Total Intents</p>
            <p className="mt-2 text-[30px] font-semibold text-[var(--ij-text-primary)]">{filteredRows.length.toLocaleString()}</p>
            <p className="text-xs text-[#4CAF50]">+4.2% today</p>
          </article>
          <article className="ij-kpi-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ij-text-muted)]">Success Rate</p>
            <p className="mt-2 text-[30px] font-semibold text-[var(--ij-text-primary)]">{successRate}%</p>
            <p className="text-xs text-[#4CAF50]">Stable</p>
          </article>
          <article className="ij-kpi-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ij-text-muted)]">In Flight</p>
            <p className="mt-2 text-[30px] font-semibold text-[var(--ij-text-primary)]">{inFlightCount.toLocaleString()}</p>
            <p className="text-xs text-[#FFA726]">Processing</p>
          </article>
          <article className="ij-kpi-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ij-text-muted)]">Exceptions</p>
            <p className="mt-2 text-[30px] font-semibold text-[var(--ij-text-primary)]">{exceptionCount.toLocaleString()}</p>
            <p className="text-xs text-[#FF5252]">Needs attention</p>
          </article>
        </section>

        <section className="ij-glass-card ij-header-card rounded-2xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--ij-text-primary)]">Payouts</h1>
              <p className="text-sm text-[var(--ij-text-secondary)]">Seller Settlements</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="ij-btn-primary rounded-lg px-3 py-2 text-xs font-semibold">Run Payout Batch</button>
              <button className="ij-btn rounded-lg px-3 py-2 text-xs font-semibold">Upload CSV</button>
              <button className="ij-btn rounded-lg px-3 py-2 text-xs font-semibold">Export Report</button>
            </div>
          </div>
        </section>

        <section className="ij-glass-card ij-filter-card rounded-2xl px-6 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <label className="text-xs font-medium text-[var(--ij-text-secondary)]">
              Date Range
              <select value={dateRangeFilter} onChange={(event) => setDateRangeFilter(event.target.value)} className="ij-control mt-1 h-10 w-full rounded-lg px-3 text-xs outline-none">
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7d</option>
                <option value="30d">Last 30d</option>
              </select>
            </label>

            <label className="text-xs font-medium text-[var(--ij-text-secondary)]">
              Seller ID
              <input value={sellerFilter} onChange={(event) => setSellerFilter(event.target.value)} placeholder="Search seller..." className="ij-control mt-1 h-10 w-full rounded-lg px-3 text-xs outline-none" />
            </label>

            <label className="text-xs font-medium text-[var(--ij-text-secondary)]">
              PSP
              <select value={pspFilter} onChange={(event) => setPspFilter(event.target.value)} className="ij-control mt-1 h-10 w-full rounded-lg px-3 text-xs outline-none">
                {pspOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-[var(--ij-text-secondary)]">
              Rail
              <select value={railFilter} onChange={(event) => setRailFilter(event.target.value)} className="ij-control mt-1 h-10 w-full rounded-lg px-3 text-xs outline-none">
                {railOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-[var(--ij-text-secondary)]">
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ij-control mt-1 h-10 w-full rounded-lg px-3 text-xs outline-none">
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-[var(--ij-text-secondary)]">
              Search
              <input value={searchFilter} onChange={(event) => setSearchFilter(event.target.value)} placeholder="Intent ID / UTR / Seller" className="ij-control mt-1 h-10 w-full rounded-lg px-3 text-xs outline-none" />
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
                setSearchFilter('')
              }}
              className="ij-btn rounded-lg px-3 py-2 text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        </section>

        <section className="ij-glass-card ij-table-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className={`w-full text-sm ${isFailedOnly || isDlqOnly ? 'min-w-[860px]' : 'min-w-[1260px]'}`}>
              <thead>
                {isFailedOnly ? (
                  <tr className="ij-table-head">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Intent ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Seller</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">PSP</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Failure Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Action</th>
                  </tr>
                ) : isDlqOnly ? (
                  <tr className="ij-table-head">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Intent ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Seller</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Error</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Action</th>
                  </tr>
                ) : (
                  <tr className="ij-table-head">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Intent ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Seller</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">PSP</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Rail</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Bank Ref (UTR)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Last Updated</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ij-text-secondary)]">Action</th>
                  </tr>
                )}
              </thead>

              <tbody>
                {paginatedRows.length ? (
                  paginatedRows.map((row) => (
                    <tr key={row.intentId} className="ij-row transition-colors">
                      {isFailedOnly ? (
                        <>
                          <td className="px-4 py-3 text-xs font-semibold text-[var(--ij-text-primary)]">{row.intentId}</td>
                          <td className="px-4 py-3 text-xs text-[var(--ij-text-secondary)]">{row.sellerId} {row.sellerName}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-[var(--ij-text-primary)]">{formatAmount(row.amount)}</td>
                          <td className="px-4 py-3 text-xs text-[var(--ij-text-secondary)]">{row.psp}</td>
                          <td className="px-4 py-3 text-xs text-[var(--ij-text-secondary)]">{row.failureReason || 'Gateway Timeout'}</td>
                          <td className="px-4 py-3">
                            <button className="rounded-lg border border-[#FFA726]/45 bg-[#FFA726]/18 px-2.5 py-1 text-xs font-semibold text-[#ffe7c2] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">Replay</button>
                          </td>
                        </>
                      ) : isDlqOnly ? (
                        <>
                          <td className="px-4 py-3 text-xs font-semibold text-[var(--ij-text-primary)]">{row.intentId}</td>
                          <td className="px-4 py-3 text-xs text-[var(--ij-text-secondary)]">{row.sellerId} {row.sellerName}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-[var(--ij-text-primary)]">{formatAmount(row.amount)}</td>
                          <td className="px-4 py-3 text-xs text-[var(--ij-text-secondary)]">{row.dlqError || 'Missing IFSC'}</td>
                          <td className="px-4 py-3">
                            <button className="ij-mini-btn rounded-lg px-2.5 py-1 text-xs font-semibold">Fix Data</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-xs font-semibold text-[var(--ij-text-primary)]">{row.intentId}</td>
                          <td className="px-4 py-3 text-xs text-[var(--ij-text-secondary)]"><span className="font-semibold text-[var(--ij-text-primary)]">{row.sellerId}</span> {row.sellerName}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-[var(--ij-text-primary)]">{formatAmount(row.amount)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Image src={SOURCE_LOGOS[row.psp] || '/sources/stripe-clean.png'} alt={row.psp} width={26} height={18} className="h-4 w-auto object-contain" />
                              <span className="text-xs text-[var(--ij-text-secondary)]">{row.psp}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--ij-text-secondary)]">{row.rail}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                              {STATUS_LABEL_MAP[row.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--ij-text-secondary)]">{row.bankRef}</td>
                          <td className="px-4 py-3 text-xs text-[var(--ij-text-muted)]">{row.lastUpdated}</td>
                          <td className="px-4 py-3">
                            <button className="ij-mini-btn rounded-lg px-2.5 py-1 text-xs font-semibold">{rowActionLabel(row)}</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-[var(--ij-text-secondary)]" colSpan={isFailedOnly ? 6 : isDlqOnly ? 5 : 9}>
                      No payouts found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ij-footer flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-xs text-[var(--ij-text-secondary)]">Showing {startIndex}-{endIndex} of {filteredRows.length.toLocaleString()} payouts</p>
            <div className="flex items-center gap-1 text-xs">
              <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage === 1} className="ij-mini-btn rounded-md px-2 py-1 disabled:opacity-40">Previous</button>
              {Array.from({ length: Math.min(4, totalPages) }).map((_, index) => {
                const pageNumber = index + 1
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`rounded-md px-2 py-1 ${safePage === pageNumber ? 'ij-page-btn-active' : 'ij-page-btn'}`}
                  >
                    {pageNumber}
                  </button>
                )
              })}
              <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={safePage === totalPages} className="ij-mini-btn rounded-md px-2 py-1 disabled:opacity-40">Next</button>
            </div>
          </div>
        </section>
      </main>
    </div>
    </>
  )
}

export default function CustomerTestIntentJournalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0b0c] p-6 text-white">
          <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            Loading intent journal...
          </div>
        </div>
      }
    >
      <CustomerTestIntentJournalPageContent />
    </Suspense>
  )
}
