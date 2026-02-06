'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getCurrentUser } from '@/services/auth'
import { getAllReceipts } from '@/services/api'
import { Receipt } from '@/types/receipt'
import { StatusBadge } from '@/components/ingestion'
import { format } from 'date-fns'
import { Layout, PageHeader, DataTable, type Column } from '@/components/aws'
import { canViewEvidence } from '@/utils/permissions'
import Link from 'next/link'

export default function EvidenceExplorerPage() {
  const router = useRouter()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/console/login')
      return
    }

    const user = getCurrentUser()
    if (user && !canViewEvidence(user.role)) {
      router.push('/console/ingestion')
      return
    }

    loadReceipts()
  }, [router])

  const loadReceipts = async () => {
    try {
      const user = getCurrentUser()
      const allReceipts = await getAllReceipts(user?.tenant)
      const withEvidence = allReceipts
        .filter(r => r.evidenceExists)
        .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      setReceipts(withEvidence)
    } catch (error) {
      console.error('Failed to load receipts with evidence:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<Receipt>[] = [
    {
      key: 'receiptId',
      header: 'Receipt ID',
      sortable: true,
      render: (receipt) => (
        <Link
          href={`/console/ingestion/evidence/${receipt.id}`}
          className="text-blue-600 hover:text-blue-800"
          onClick={(e) => e.stopPropagation()}
        >
          {receipt.receiptId}
        </Link>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      filterable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      render: (receipt) => <StatusBadge status={receipt.status} />,
    },
    {
      key: 'receivedAt',
      header: 'Received At',
      sortable: true,
      render: (receipt) => format(new Date(receipt.receivedAt), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (receipt) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/console/ingestion/evidence/${receipt.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
            onClick={(e) => e.stopPropagation()}
            title="View evidence trail"
          >
            View Evidence
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href={`/console/ingestion/receipt/${receipt.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
            onClick={(e) => e.stopPropagation()}
            title="View receipt details"
          >
            Receipt
          </Link>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const user = getCurrentUser()

  return (
    <Layout
      serviceName="Ingestion"
      breadcrumbs={['Evidence Explorer']}
      tenant={user?.tenant}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          title="Evidence Explorer"
          description="Browse audit trails and evidence for ingestion receipts"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Ingestion', href: '/console/ingestion' },
            { label: 'Evidence Explorer' },
          ]}
        />

        <DataTable
          data={receipts}
          columns={columns}
          getRowKey={(receipt) => receipt.id}
          onRowClick={(receipt) => {
            router.push(`/console/ingestion/evidence/${receipt.id}`)
          }}
          filterPlaceholder="Filter by receipt ID, source, or status..."
          emptyMessage="No evidence found. Evidence is created when receipts are processed."
        />
      </div>
    </Layout>
  )
}
