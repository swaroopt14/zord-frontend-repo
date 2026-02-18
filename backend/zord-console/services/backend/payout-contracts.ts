// Payout Contracts Service - Fetches data from zord-relay (port 8082)
import { BACKEND_SERVICES, buildUrl, DEFAULT_FETCH_OPTIONS, API_TIMEOUT } from '@/config/api.endpoints'

export interface BackendPayoutContract {
  contract_id: string
  tenant_id: string
  intent_id: string
  envelope_id: string
  contract_payload: string // base64-encoded payload (as currently returned by backend)
  contract_hash: string
  status: string
  created_at: string
  trace_id?: string
}

export interface PayoutContractListResponse {
  items: BackendPayoutContract[]
  // Pagination is optional because the backend response shape may vary.
  pagination?: {
    page: number
    page_size: number
    total: number
  }
}

function normalizeContractsResponse(data: unknown): PayoutContractListResponse {
  if (Array.isArray(data)) {
    return { items: data as BackendPayoutContract[] }
  }

  if (data && typeof data === 'object') {
    const obj = data as any
    if (Array.isArray(obj.items)) {
      return { items: obj.items as BackendPayoutContract[], pagination: obj.pagination }
    }
    // Some backends return a single contract object from list endpoints.
    if (typeof obj.contract_id === 'string') {
      return { items: [obj as BackendPayoutContract] }
    }
  }

  return { items: [] }
}

/**
 * Fetch payout contracts from zord-relay
 * Endpoint: GET http://localhost:8082/v1/contracts
 */
export async function fetchPayoutContracts(): Promise<PayoutContractListResponse> {
  const url = buildUrl('RELAY', BACKEND_SERVICES.RELAY.ENDPOINTS.CONTRACTS)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...DEFAULT_FETCH_OPTIONS,
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch payout contracts: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return normalizeContractsResponse(data)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: relay not responding')
    }
    throw error
  }
}

/**
 * Fetch payout contract by id from zord-relay (best-effort).
 * Endpoint: GET http://localhost:8082/v1/contracts/:id
 */
export async function fetchPayoutContractById(contractId: string): Promise<BackendPayoutContract | null> {
  const url = buildUrl('RELAY', BACKEND_SERVICES.RELAY.ENDPOINTS.CONTRACT_BY_ID(contractId))

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...DEFAULT_FETCH_OPTIONS,
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Failed to fetch payout contract: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    if (data && typeof data === 'object' && typeof (data as any).contract_id === 'string') {
      return data as BackendPayoutContract
    }
    return null
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: relay not responding')
    }
    throw error
  }
}

