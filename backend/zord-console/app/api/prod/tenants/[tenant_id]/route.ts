import { NextRequest, NextResponse } from 'next/server'
import { TenantPlatformResponse } from '@/types/tenant-platform'

// Mock tenant configurations
const tenantConfigs: Record<string, { name: string; tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'; risk: 'LOW' | 'MEDIUM' | 'HIGH'; healthy: boolean }> = {
  't_91af': { name: 'Acme_Fintech', tier: 'ENTERPRISE', risk: 'HIGH', healthy: false },
  't_77bd': { name: 'ZenPay', tier: 'PREMIUM', risk: 'MEDIUM', healthy: true },
  't_12ac': { name: 'NovaBank', tier: 'ENTERPRISE', risk: 'LOW', healthy: true },
  't_99dd': { name: 'AlphaRetail', tier: 'STANDARD', risk: 'LOW', healthy: true },
  't_34ef': { name: 'PayCore', tier: 'PREMIUM', risk: 'LOW', healthy: true },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> }
) {
  const { tenant_id } = await params
  
  await new Promise(resolve => setTimeout(resolve, 150))

  const config = tenantConfigs[tenant_id] || {
    name: `Tenant_${tenant_id}`,
    tier: 'STANDARD' as const,
    risk: 'LOW' as const,
    healthy: true,
  }

  const isImpacted = !config.healthy
  const isAtRisk = config.risk === 'MEDIUM'

  const mockData: TenantPlatformResponse = {
    identity: {
      tenant_id: tenant_id,
      tenant_name: config.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      display_name: config.name,
      environment: 'PRODUCTION',
      region: 'ap-south-1',
      onboarded_date: '2025-03-12',
      tier: config.tier,
      risk_level: config.risk,
    },

    status: {
      overall: isImpacted ? 'IMPACTED' : isAtRisk ? 'AT_RISK' : 'HEALTHY',
      primary_issue: isImpacted ? 'DLQ spike (Webhook failures)' : isAtRisk ? 'Elevated error rate' : null,
      last_incident_minutes_ago: isImpacted ? 14 : isAtRisk ? 180 : null,
    },

    usage: {
      api_calls_24h: 182400 + Math.floor(Math.random() * 10000),
      webhooks_24h: 31220 + Math.floor(Math.random() * 2000),
      streams_24h: 8120 + Math.floor(Math.random() * 500),
      batch_rows_24h: 12000 + Math.floor(Math.random() * 1000),
      api_quota_percent: isImpacted ? 82 : 45 + Math.floor(Math.random() * 30),
      webhook_quota_percent: isImpacted ? 68 : 30 + Math.floor(Math.random() * 25),
      stream_lag_percent: 15 + Math.floor(Math.random() * 20),
    },

    reliability: {
      success_rate_percent: isImpacted ? 82.1 : isAtRisk ? 95.4 : 99.2,
      failed_intents_24h: isImpacted ? 412 : isAtRisk ? 67 : 12,
      dlq_items_24h: isImpacted ? 47 : isAtRisk ? 8 : 2,
      replayable_24h: isImpacted ? 12 : isAtRisk ? 3 : 1,
      top_failures: isImpacted ? [
        { reason: 'INVALID_SCHEMA', count: 23 },
        { reason: 'WEBHOOK_TIMEOUT', count: 18 },
        { reason: 'RATE_LIMIT', count: 6 },
      ] : [
        { reason: 'SCHEMA_VALIDATION', count: 5 },
        { reason: 'NETWORK_TIMEOUT', count: 3 },
      ],
    },

    evidence: {
      coverage_percent: 100,
      hash_chain_status: 'VERIFIED',
      retention_years: 7,
      last_verification_minutes_ago: 2,
    },

    recent_activity: [
      { timestamp: new Date(Date.now() - 14 * 60000).toISOString(), message: isImpacted ? 'DLQ spike detected' : 'Health check passed', type: isImpacted ? 'error' : 'info' },
      { timestamp: new Date(Date.now() - 17 * 60000).toISOString(), message: isImpacted ? 'Schema v1.3 rejected' : 'Config reload completed', type: isImpacted ? 'warning' : 'info' },
      { timestamp: new Date(Date.now() - 23 * 60000).toISOString(), message: isImpacted ? 'Webhook retries increased' : 'Deployment v1.4.3 completed', type: isImpacted ? 'warning' : 'info' },
      { timestamp: new Date(Date.now() - 35 * 60000).toISOString(), message: isImpacted ? 'Ingestion volume spike' : 'Evidence verification completed', type: isImpacted ? 'warning' : 'info' },
      { timestamp: new Date(Date.now() - 60 * 60000).toISOString(), message: 'Scheduled maintenance window ended', type: 'info' },
    ],

    monitors: [
      { name: 'High number of failed refunds detected', status: isImpacted ? 'WARNING' : 'OK', description: 'Monitors failed refund transactions' },
      { name: 'Failed capture detected due to rejection', status: 'OK', description: 'Monitors card scheme rejections' },
      { name: 'Failed webhook delivery detected', status: isImpacted ? 'CRITICAL' : 'OK', description: 'Monitors webhook delivery failures' },
      { name: 'High number of failed captures detected', status: 'OK', description: 'Monitors capture failures' },
    ],

    transactions: {
      total: isImpacted ? 7 : 1247,
      successful: isImpacted ? 5 : 1189,
      failed: isImpacted ? 2 : 47,
      pending: 0,
      by_channel: [
        { channel: 'API', count: isImpacted ? 4 : 892, percent: 71, color: '#10B981' },
        { channel: 'Webhook', count: isImpacted ? 2 : 287, percent: 23, color: '#3B82F6' },
        { channel: 'Batch', count: isImpacted ? 1 : 68, percent: 6, color: '#F59E0B' },
      ],
      by_type: [
        { channel: 'Payment', count: isImpacted ? 5 : 847, percent: 68, color: '#8B5CF6' },
        { channel: 'Refund', count: isImpacted ? 1 : 312, percent: 25, color: '#EC4899' },
        { channel: 'Payout', count: isImpacted ? 1 : 88, percent: 7, color: '#06B6D4' },
      ],
    },
  }

  return NextResponse.json(mockData)
}
