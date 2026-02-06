// Tenant Service - Fetches tenant data from zord-edge
import { BACKEND_SERVICES, buildUrl, DEFAULT_FETCH_OPTIONS, API_TIMEOUT } from '@/config/api.endpoints'

export interface BackendTenant {
  tenant_id: string
  tenant_name: string
  api_key?: string // Masked in responses
  status: 'ACTIVE' | 'DISABLED'
  created_at: string
}

export interface TenantListResponse {
  items: BackendTenant[]
  pagination: {
    page: number
    page_size: number
    total: number
  }
}

/**
 * Fetch tenants from zord-edge
 * Note: This endpoint may need to be added to the backend
 * Endpoint: GET http://localhost:8080/v1/tenants
 */
export async function fetchTenants(): Promise<TenantListResponse> {
  // TODO: Add /v1/tenants endpoint in zord-edge
  // For now, return empty response
  return {
    items: [],
    pagination: {
      page: 1,
      page_size: 50,
      total: 0,
    },
  }
}

/**
 * Fetch single tenant by ID
 * Note: This endpoint may need to be added to the backend
 */
export async function fetchTenantById(tenantId: string): Promise<BackendTenant | null> {
  // TODO: Add /v1/tenants/:id endpoint in zord-edge
  return null
}

/**
 * Register a new tenant
 * Endpoint: POST http://localhost:8080/v1/tenantReg
 */
export async function registerTenant(merchantName: string): Promise<{
  tenant_id: string
  api_key: string
}> {
  const url = buildUrl('EDGE', BACKEND_SERVICES.EDGE.ENDPOINTS.TENANT_REGISTER)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...DEFAULT_FETCH_OPTIONS,
      method: 'POST',
      signal: controller.signal,
      body: JSON.stringify({ name: merchantName }),
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to register tenant: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      tenant_id: data.TenantId,
      api_key: data.APIKEY,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: Edge service not responding')
    }
    throw error
  }
}
