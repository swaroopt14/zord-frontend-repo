// DLQ Service - Fetches Dead Letter Queue data from zord-intent-engine
import { BACKEND_SERVICES, buildUrl, DEFAULT_FETCH_OPTIONS, API_TIMEOUT } from '@/config/api.endpoints'

export interface BackendDLQItem {
  dlq_id: string
  tenant_id: string
  envelope_id: string
  stage: string
  reason_code: string
  error_detail?: string
  replayable: boolean
  created_at: string
}

export interface DLQListParams {
  tenant_id?: string
}

/**
 * Fetch DLQ items from zord-intent-engine
 * Endpoint: GET http://localhost:8083/v1/dlq
 */
export async function fetchDLQItems(params: DLQListParams = {}): Promise<BackendDLQItem[]> {
  const { tenant_id } = params

  const queryParams = new URLSearchParams()
  if (tenant_id) queryParams.set('tenant_id', tenant_id)

  const url = buildUrl('INTENT_ENGINE', BACKEND_SERVICES.INTENT_ENGINE.ENDPOINTS.DLQ)
  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(fullUrl, {
      ...DEFAULT_FETCH_OPTIONS,
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch DLQ items: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: Intent engine not responding')
    }
    throw error
  }
}

/**
 * Fetch single DLQ item by ID
 * Note: This may need a dedicated endpoint in the backend
 */
export async function fetchDLQItemById(dlqId: string): Promise<BackendDLQItem | null> {
  // Fetch all DLQ items and find by ID
  // TODO: Add dedicated endpoint in backend for single DLQ fetch
  const items = await fetchDLQItems()
  return items.find(item => item.dlq_id === dlqId) || null
}
