import { NextRequest, NextResponse } from 'next/server'
import { fetchEnvelopes } from '@/services/backend/envelopes'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10)
    const tenantId = searchParams.get('tenant_id') || undefined

    // Fetch from real backend (zord-vault-journal)
    const response = await fetchEnvelopes({
      page,
      page_size: pageSize,
      tenant_id: tenantId,
    })

    // Transform backend response to match frontend RawEnvelope type
    const items = response.items.map((envelope) => ({
      envelope_id: envelope.envelope_id,
      source: envelope.source,
      content_type: 'application/json', // Default content type
      size_bytes: 0, // Not available from backend yet
      sha256: envelope.payload_hash,
      received_at: envelope.received_at,
      tenant_id: envelope.tenant_id,
      parse_status: envelope.parse_status,
      signature_status: envelope.signature_status,
    }))

    return NextResponse.json({
      items,
      pagination: response.pagination,
    })
  } catch (error) {
    console.error('Error fetching raw envelopes from backend:', error)

    // Return empty response on error (no mock data)
    return NextResponse.json({
      items: [],
      pagination: {
        page: 1,
        page_size: 20,
        total: 0,
      },
      error: error instanceof Error ? error.message : 'Failed to fetch envelopes',
    })
  }
}
