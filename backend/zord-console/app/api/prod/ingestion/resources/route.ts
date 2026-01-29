import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Mock resource counts - in production, these would come from the database
    const resources = {
      intents: {
        total: 12482,
        running: 12301, // canonicalized
        pending: 181, // rejected
      },
      raw_envelopes: 12482,
      batches: 47,
      batch_pipelines: 12,
      stream_consumers: 8,
      consumer_groups: 3,
      evidence_receipts: 12482,
      schema_versions: 15,
      idempotency_keys: 2044,
      security_groups: 0, // Not applicable for ingestion
      api_gateways: 3,
      webhook_receivers: 5,
    }

    return NextResponse.json(resources)
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
