import { NextRequest, NextResponse } from 'next/server'
import { OverviewData } from '@/services/api/receiptService'

export async function GET(request: NextRequest) {
  try {
    // Return mock overview data matching the existing structure
    const overviewData: OverviewData = {
      environment: 'PRODUCTION',
      kpis: {
        intents_received_24h: 12482,
        canonicalized_24h: 12301,
        rejected_24h: 181,
        idempotency_hits_24h: 2044,
        p95_ingest_latency_ms: 42,
        slo: {
          latency_ms: 60,
          success_rate_pct: 99.9
        }
      },
      health: [
        { component: 'API_GATEWAY', status: 'HEALTHY', meta: 'p95 38ms' },
        { component: 'BATCH_INGEST', status: 'DEGRADED', meta: 'last failure 14m ago' },
        { component: 'WEBHOOK_INGEST', status: 'HEALTHY', meta: 'signature OK' },
        { component: 'PII_ENCLAVE', status: 'HEALTHY', meta: 'access logged' },
        { component: 'OUTBOX_KAFKA', status: 'HEALTHY', meta: 'lag 0' }
      ],
      errors_last_24h: {
        SCHEMA_INVALID: 92,
        INSTRUMENT_FORMAT_INVALID: 47,
        IDEMPOTENCY_CONFLICT: 31,
        REJECTED_PREACC: 11,
        SYSTEM_FAILURE: 0
      },
      recent_activity: [
        {
          time: '2026-01-13T12:31:02Z',
          object: 'INTENT',
          id: 'pi_01HZX3G1AF7ZK2S8J2KZ',
          source: 'API',
          status: 'RECEIVED'
        },
        {
          time: '2026-01-13T12:30:58Z',
          object: 'RAW_ENVELOPE',
          id: 'env_20260113T123058Z_91fa',
          source: 'WEBHOOK',
          status: 'STORED_RAW'
        },
        {
          time: '2026-01-13T12:29:11Z',
          object: 'INTENT',
          id: 'pi_01HZX3F91Q8KX9L2M4',
          source: 'BATCH',
          status: 'REJECTED_PREACC'
        },
        {
          time: '2026-01-13T12:28:45Z',
          object: 'RAW_ENVELOPE',
          id: 'env_20260113T122845Z_a3f2',
          source: 'API',
          status: 'STORED_RAW'
        },
        {
          time: '2026-01-13T12:27:30Z',
          object: 'INTENT',
          id: 'pi_01HZX3E7R2MN5P4Q6',
          source: 'API',
          status: 'RECEIVED'
        }
      ],
      evidence: {
        worm_active: true,
        last_write: '2026-01-13T12:31:02Z',
        hash_chain: 'OK'
      }
    }
    
    return NextResponse.json(overviewData)
  } catch (error) {
    console.error('Error fetching overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
