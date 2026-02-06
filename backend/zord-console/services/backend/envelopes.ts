// Envelope Service - Fetches raw envelope data from zord-vault-journal
import { BACKEND_SERVICES, buildUrl, DEFAULT_FETCH_OPTIONS, API_TIMEOUT } from '@/config/api.endpoints'

export interface BackendEnvelope {
  envelope_id: string
  tenant_id: string
  source: string
  source_system?: string
  idempotency_key?: string
  payload_hash: string
  object_ref: string
  parse_status: string
  signature_status?: string
  received_at: string
}

export interface EnvelopeListParams {
  tenant_id?: string
  page?: number
  page_size?: number
}

export interface EnvelopeListResponse {
  items: BackendEnvelope[]
  pagination: {
    page: number
    page_size: number
    total: number
  }
}

/**
 * Fetch raw envelopes from zord-vault-journal
 * Endpoint: GET http://localhost:8081/v1/envelopes
 * Note: This endpoint may need to be added to the backend
 */
export async function fetchEnvelopes(params: EnvelopeListParams = {}): Promise<EnvelopeListResponse> {
  const { page = 1, page_size = 50, tenant_id } = params

  const queryParams = new URLSearchParams()
  queryParams.set('page', String(page))
  queryParams.set('page_size', String(page_size))
  if (tenant_id) queryParams.set('tenant_id', tenant_id)

  const url = buildUrl('VAULT_JOURNAL', BACKEND_SERVICES.VAULT_JOURNAL.ENDPOINTS.ENVELOPES)
  const fullUrl = `${url}?${queryParams.toString()}`

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
      throw new Error(`Failed to fetch envelopes: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: Vault journal not responding')
    }
    throw error
  }
}

/**
 * Fetch single envelope by ID from zord-vault-journal
 * Endpoint: GET http://localhost:8081/v1/envelopes/:id
 * Note: This endpoint may need to be added to the backend
 */
export async function fetchEnvelopeById(envelopeId: string): Promise<BackendEnvelope | null> {
  const url = buildUrl(
    'VAULT_JOURNAL',
    BACKEND_SERVICES.VAULT_JOURNAL.ENDPOINTS.ENVELOPE_BY_ID(envelopeId)
  )

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...DEFAULT_FETCH_OPTIONS,
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch envelope: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: Vault journal not responding')
    }
    throw error
  }
}
