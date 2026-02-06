import { NextRequest, NextResponse } from 'next/server'
import { DLQItemDetail, GuardStage, GuardReasonCode } from '@/types/validation'

export const dynamic = 'force-dynamic'

// Error details by reason code
const errorDetails: Record<GuardReasonCode, string[]> = {
  INVALID_FIELD: [
    'beneficiary.ifsc missing',
    'amount.value is not a valid decimal',
    'currency must be a 3-letter ISO code',
    'beneficiary.account_number format invalid',
  ],
  MISSING_FIELD: [
    'Required field "amount" is missing',
    'Required field "beneficiary" is missing',
    'Required field "intent_type" is missing',
  ],
  SCHEMA_MISMATCH: [
    'Payload does not match registered schema payout.intent v1.3',
    'Unknown intent type: UNKNOWN_TRANSFER',
  ],
  DUPLICATE_REQUEST: [
    'Idempotency key already processed',
    'Duplicate request within TTL window',
  ],
  TOKENIZATION_FAIL: [
    'Failed to tokenize PII field: beneficiary.name',
    'PII enclave connection timeout',
    'Invalid PII field format for tokenization',
  ],
  INVALID_BENEFICIARY: [
    'IFSC code ABCD0123456 not found in registry',
    'Bank account number fails checksum validation',
    'Beneficiary bank is not supported for this instrument',
  ],
  INVALID_AMOUNT: [
    'Amount must be greater than 0',
    'Amount exceeds maximum limit for instrument',
    'Amount precision exceeds 2 decimal places',
  ],
  INVALID_CURRENCY: [
    'Currency XYZ is not supported',
    'Currency mismatch with source account',
  ],
  DEADLINE_EXCEEDED: [
    'Scheduled time is in the past',
    'Deadline exceeds maximum future date (30 days)',
  ],
  UNKNOWN_ERROR: [
    'An unexpected error occurred during processing',
  ],
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dlq_id: string }> }
) {
  const { dlq_id } = await params

  // Parse dlq_id to extract date for generating consistent mock data
  const dateMatch = dlq_id.match(/dlq_(\d{8})_/)
  const dateStr = dateMatch ? dateMatch[1] : '20260115'
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  const createdAt = new Date(`${year}-${month}-${day}T${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00Z`)

  // Randomly select stage and reason
  const stages: GuardStage[] = [
    'SCHEMA_VALIDATION',
    'PII_TOKENIZATION',
    'BENEFICIARY_VALIDATION',
    'AMOUNT_CURRENCY_SANITY',
  ]
  const stage = stages[Math.floor(Math.random() * stages.length)]
  
  const reasonCodes: Record<GuardStage, GuardReasonCode[]> = {
    SCHEMA_VALIDATION: ['INVALID_FIELD', 'MISSING_FIELD', 'SCHEMA_MISMATCH'],
    IDEMPOTENCY_CHECK: ['DUPLICATE_REQUEST'],
    PII_TOKENIZATION: ['TOKENIZATION_FAIL'],
    BENEFICIARY_VALIDATION: ['INVALID_BENEFICIARY', 'MISSING_FIELD'],
    AMOUNT_CURRENCY_SANITY: ['INVALID_AMOUNT', 'INVALID_CURRENCY'],
    DEADLINE_CONSTRAINTS: ['DEADLINE_EXCEEDED'],
  }
  
  const possibleReasons = reasonCodes[stage]
  const reasonCode = possibleReasons[Math.floor(Math.random() * possibleReasons.length)]
  
  const possibleDetails = errorDetails[reasonCode]
  const errorDetail = possibleDetails[Math.floor(Math.random() * possibleDetails.length)]
  
  const replayable = stage !== 'IDEMPOTENCY_CHECK' && Math.random() > 0.3
  const envelopeId = `env_${dateStr}_${Math.random().toString(36).substring(2, 10)}`

  const detail: DLQItemDetail = {
    dlq_id,
    envelope_id: envelopeId,
    stage,
    reason_code: reasonCode,
    created_at: createdAt.toISOString(),
    replayable,
    error_detail: errorDetail,
    raw_payload_hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    linked_envelope: {
      envelope_id: envelopeId,
      source: ['API', 'BATCH', 'WEBHOOK'][Math.floor(Math.random() * 3)],
      received_at: new Date(createdAt.getTime() - 1000).toISOString(), // 1 second before failure
    },
    linked_intent_id: undefined, // No intent created for failed validation
    replay_attempts: replayable ? Math.floor(Math.random() * 3) : 0,
    last_replay_at: replayable && Math.random() > 0.5 
      ? new Date(Date.now() - Math.random() * 86400000).toISOString()
      : undefined,
    metadata: {
      tenant: 'default',
      trace_id: `trace_${Math.random().toString(36).substring(2, 10)}`,
      correlation_id: `corr_${Math.random().toString(36).substring(2, 10)}`,
      ingestion_channel: ['REST_API', 'BATCH_UPLOAD', 'WEBHOOK'][Math.floor(Math.random() * 3)],
    },
  }

  return NextResponse.json(detail)
}
