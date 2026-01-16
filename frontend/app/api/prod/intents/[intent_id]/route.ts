import { NextRequest, NextResponse } from 'next/server'
import {
  IntentDetail,
  IntentStatus,
  IntentSource,
  IntentInstrument,
  IntentType,
  LifecycleStep,
} from '@/types/intent'
import { getIntentById } from '../_mockData'

// Mock intent detail data
const mockIntentDetails: Map<string, IntentDetail> = new Map()

// Purpose codes for different scenarios
const purposeCodes = ['SALA', 'PENS', 'DIVI', 'INTE', 'RENT', 'BONU', 'COMM', 'GOVT']

// Generate a short hash
function generateHash(): string {
  return Math.random().toString(36).substr(2, 4) + '...'
}

// Generate lifecycle events based on status
function generateLifecycle(
  status: IntentStatus,
  createdAt: string
): Array<{ step: LifecycleStep; time: string; hash: string }> {
  const baseTime = new Date(createdAt)
  const lifecycle: Array<{ step: LifecycleStep; time: string; hash: string }> = []

  // RAW_STORED is always first
  const rawStoredTime = new Date(baseTime.getTime() - 1000) // 1 second before
  lifecycle.push({
    step: 'RAW_STORED',
    time: rawStoredTime.toISOString(),
    hash: generateHash(),
  })

  if (status === 'RECEIVED' || status === 'CANONICALIZED') {
    // Successful flow
    const canonicalizedTime = new Date(baseTime.getTime() - 800) // 0.8 seconds before
    lifecycle.push({
      step: 'CANONICALIZED',
      time: canonicalizedTime.toISOString(),
      hash: generateHash(),
    })

    const idempotencyTime = new Date(baseTime.getTime() - 600) // 0.6 seconds before
    lifecycle.push({
      step: 'IDEMPOTENCY_CHECKED',
      time: idempotencyTime.toISOString(),
      hash: generateHash(),
    })

    const preAccTime = new Date(baseTime.getTime() - 400) // 0.4 seconds before
    lifecycle.push({
      step: 'VALIDATED' as LifecycleStep, // Using VALIDATED as PRE_ACC_GUARDS_PASSED equivalent
      time: preAccTime.toISOString(),
      hash: generateHash(),
    })

    lifecycle.push({
      step: 'PUBLISHED',
      time: baseTime.toISOString(),
      hash: generateHash(),
    })
  } else if (status === 'REJECTED_PREACC') {
    // Rejected flow
    const canonicalizedTime = new Date(baseTime.getTime() - 800)
    lifecycle.push({
      step: 'CANONICALIZED',
      time: canonicalizedTime.toISOString(),
      hash: generateHash(),
    })

    const validatedTime = new Date(baseTime.getTime() - 500)
    lifecycle.push({
      step: 'VALIDATED',
      time: validatedTime.toISOString(),
      hash: generateHash(),
    })

    lifecycle.push({
      step: 'REJECTED',
      time: baseTime.toISOString(),
      hash: generateHash(),
    })
  } else if (status === 'QUEUED_ACC') {
    // Queued flow
    const canonicalizedTime = new Date(baseTime.getTime() - 800)
    lifecycle.push({
      step: 'CANONICALIZED',
      time: canonicalizedTime.toISOString(),
      hash: generateHash(),
    })

    const idempotencyTime = new Date(baseTime.getTime() - 600)
    lifecycle.push({
      step: 'IDEMPOTENCY_CHECKED',
      time: idempotencyTime.toISOString(),
      hash: generateHash(),
    })

    const preAccTime = new Date(baseTime.getTime() - 400)
    lifecycle.push({
      step: 'VALIDATED' as LifecycleStep,
      time: preAccTime.toISOString(),
      hash: generateHash(),
    })
  }

  return lifecycle
}

// Generate intent detail from basic intent data
function generateIntentDetail(
  intentId: string,
  status: IntentStatus,
  source: IntentSource,
  instrument: IntentInstrument,
  amount: string,
  currency: string,
  createdAt: string
): IntentDetail {
  const intentType: IntentType = 'PAYOUT' // Default, can be varied
  const purposeCode = purposeCodes[Math.floor(Math.random() * purposeCodes.length)]
  const accountToken = `tok_acct_${Math.random().toString(36).substr(2, 4)}`

  // Generate evidence IDs
  const timestamp = new Date(createdAt)
  const dateStr = timestamp.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const rawEnvelopeId = `env_${dateStr}_${Math.random().toString(36).substr(2, 4)}`
  const canonicalSnapshot = `worm://prod/intents/${intentId}`
  const outboxEventId = `outbox_${Math.random().toString(36).substr(2, 5)}`

  // Calculate must_post_by (4.5 hours after creation for PAYOUT)
  const mustPostBy = new Date(timestamp.getTime() + 4.5 * 60 * 60 * 1000)

  const lifecycle = generateLifecycle(status, createdAt)

  return {
    intent_id: intentId,
    status,
    source,
    canonical: {
      intent_type: intentType,
      amount: {
        value: amount,
        currency,
      },
      instrument: {
        kind: instrument,
        account_token: accountToken,
      },
      purpose_code: purposeCode,
      constraints: {
        must_post_by: mustPostBy.toISOString(),
      },
    },
    lifecycle,
    evidence: {
      raw_envelope_id: rawEnvelopeId,
      canonical_snapshot: canonicalSnapshot,
      outbox_event_id: outboxEventId,
    },
  }
}

// Initialize with the specific example provided
const exampleDetail: IntentDetail = {
  intent_id: 'pi_01HZX3G1AF7ZK2S8J2KZ',
  status: 'RECEIVED',
  source: 'API',
  canonical: {
    intent_type: 'PAYOUT',
    amount: {
      value: '125000.00',
      currency: 'INR',
    },
    instrument: {
      kind: 'BANK',
      account_token: 'tok_acct_f3a2',
    },
    purpose_code: 'SALA',
    constraints: {
      must_post_by: '2026-01-13T17:00:00Z',
    },
  },
  lifecycle: [
    { step: 'RAW_STORED', time: '2026-01-13T12:31:01Z', hash: 'a91f...' },
    { step: 'CANONICALIZED', time: '2026-01-13T12:31:01Z', hash: 'b82c...' },
    { step: 'IDEMPOTENCY_CHECKED', time: '2026-01-13T12:31:02Z', hash: 'c13e...' },
    { step: 'PUBLISHED', time: '2026-01-13T12:31:02Z', hash: 'd72b...' },
  ],
  evidence: {
    raw_envelope_id: 'env_20260113T123101Z_9ab3',
    canonical_snapshot: 'worm://prod/intents/pi_01HZX3...',
    outbox_event_id: 'outbox_77f91',
  },
}

mockIntentDetails.set('pi_01HZX3G1AF7ZK2S8J2KZ', exampleDetail)

// Helper to get or generate intent detail - always returns data
function getIntentDetail(intentId: string): IntentDetail {
  // Check if we have a cached detail
  if (mockIntentDetails.has(intentId)) {
    return mockIntentDetails.get(intentId)!
  }

  // Try to find the intent in the list
  const intent = getIntentById(intentId)
  if (intent) {
    // Generate detail from the intent data
    const detail = generateIntentDetail(
      intent.intent_id,
      intent.status,
      intent.source,
      intent.instrument,
      intent.amount,
      intent.currency,
      intent.created_at
    )
    mockIntentDetails.set(intentId, detail)
    return detail
  }

  // If not found, generate a detail dynamically from the intent ID
  // This handles cases where the intent ID comes from the frontend-generated dummy data
  // Extract timestamp from intent ID if possible (format: pi_YYYYMMDDTHHMMSS_XXXXX or pi_YYYYMMDDHHMMSS_XXXXX)
  let createdAt = new Date().toISOString()
  // Try to match formats: pi_20260115T112638_XXXXX or pi_20260115112638_XXXXX
  const timestampMatch = intentId.match(/pi_(\d{4})(\d{2})(\d{2})(?:T?)(\d{2})(\d{2})(\d{2})/)
  if (timestampMatch) {
    try {
      const [, year, month, day, hour, minute, second] = timestampMatch
      const dateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
      createdAt = new Date(dateStr).toISOString()
    } catch (e) {
      // Use current time if parsing fails
    }
  }

  // Generate random but consistent values based on intent ID
  const hash = intentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const sources: IntentSource[] = ['API', 'BATCH', 'WEBHOOK']
  const instruments: IntentInstrument[] = ['BANK', 'UPI', 'CARD', 'NEFT', 'IMPS', 'RTGS']
  const statuses: IntentStatus[] = ['RECEIVED', 'REJECTED_PREACC', 'QUEUED_ACC']

  const source = sources[hash % sources.length]
  const instrument = instruments[hash % instruments.length]
  // Map CANONICALIZED to RECEIVED, RAW_STORED to RECEIVED for API compatibility
  const status = statuses[hash % statuses.length]
  const amount = ((hash % 100000) + 1000).toFixed(2)
  const currency = 'INR'

  const detail = generateIntentDetail(
    intentId,
    status,
    source,
    instrument,
    amount,
    currency,
    createdAt
  )

  mockIntentDetails.set(intentId, detail)
  return detail
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ intent_id: string }> }
) {
  try {
    const { intent_id } = await params

    if (!intent_id) {
      return NextResponse.json({ error: 'Intent ID is required' }, { status: 400 })
    }

    // Get or generate the intent detail (always returns data)
    const intentDetail = getIntentDetail(intent_id)

    return NextResponse.json(intentDetail)
  } catch (error) {
    console.error('Error fetching intent detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
