import { NextRequest, NextResponse } from 'next/server'
import { RawEnvelope, RawEnvelopeListResponse, RawEnvelopeSource } from '@/types/rawEnvelope'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

// Generate SHA-256 hash (mock - returns truncated hash)
function generateSHA256(input: string): string {
  // Simple hash simulation - in production this would be actual SHA-256
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, '0') + '...'
}

// Generate mock raw envelopes
function generateMockEnvelopes(count: number): RawEnvelope[] {
  const sources: RawEnvelopeSource[] = ['API', 'BATCH', 'WEBHOOK']
  const contentTypes = ['application/json', 'application/xml', 'text/csv']
  const baseDate = new Date('2026-01-13T12:00:00Z')

  const envelopes: RawEnvelope[] = []

  for (let i = 0; i < count; i++) {
    const source = sources[Math.floor(Math.random() * sources.length)]
    const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)]
    const timestamp = new Date(baseDate.getTime() - i * 60000) // 1 minute apart
    const dateStr = timestamp.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const randomId = Math.random().toString(36).substr(2, 4)
    const envelopeId = `env_${dateStr}_${randomId}`

    // Generate size between 500 and 5000 bytes
    const sizeBytes = Math.floor(Math.random() * 4500) + 500

    // Generate hash from envelope data
    const hashInput = `${envelopeId}${source}${contentType}${sizeBytes}${timestamp.toISOString()}`
    const sha256 = generateSHA256(hashInput)

    envelopes.push({
      envelope_id: envelopeId,
      source,
      content_type: contentType,
      size_bytes: sizeBytes,
      sha256,
      received_at: timestamp.toISOString(),
    })
  }

  return envelopes.sort((a, b) =>
    new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
  )
}

// Pre-defined example envelope
const exampleEnvelope: RawEnvelope = {
  envelope_id: 'env_20260113T123101Z_9ab3',
  source: 'API',
  content_type: 'application/json',
  size_bytes: 1842,
  sha256: 'b44f2d9e91a7...',
  received_at: '2026-01-13T12:31:01Z',
}

// Generate mock data (you can adjust the count as needed)
const mockEnvelopes = [
  exampleEnvelope,
  ...generateMockEnvelopes(99), // Generate 99 more for a total of 100
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10)

    // Calculate pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const items = mockEnvelopes.slice(startIndex, endIndex)

    const response: RawEnvelopeListResponse = {
      items,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching raw envelopes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
