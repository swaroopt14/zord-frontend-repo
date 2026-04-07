// Backend API Endpoints Configuration
// All backend service URLs centralized in one place

export const BACKEND_SERVICES = {
  // zord-edge: API Gateway (Port 8080)
  EDGE: {
    BASE_URL: process.env.ZORD_EDGE_URL || 'http://localhost:8080',
    ENDPOINTS: {
      HEALTH: '/v1/health',
      INGEST: '/v1/ingest',
      TENANT_REGISTER: '/v1/tenantReg',
      TENANTS: '/v1/tenants',
      TENANT_BY_ID: (id: string) => `/v1/tenants/${id}`,
      AUTH_LOGIN: '/v1/auth/login',
      AUTH_REFRESH: '/v1/auth/refresh',
      AUTH_LOGOUT: '/v1/auth/logout',
      AUTH_ME: '/v1/auth/me',
      AUTH_ADMIN_USERS: '/v1/auth/admin/users',
      AUTH_ADMIN_USER_STATUS: (id: string) => `/v1/auth/admin/users/${id}/status`,
    },
  },

  // zord-relay: Message Relay / Provider Contracts (Port 8082)
  // Used by Ops "Payout Contracts" UI.
  RELAY: {
    BASE_URL: process.env.ZORD_RELAY_URL || 'http://localhost:8082',
    ENDPOINTS: {
      HEALTH: '/health',
      CONTRACTS: '/v1/contracts',
      CONTRACT_BY_ID: (id: string) => `/v1/contracts/${id}`,
    },
  },

  // zord-intent-engine: Intent Processing (Port 8083)
  INTENT_ENGINE: {
    BASE_URL: process.env.ZORD_INTENT_ENGINE_URL || 'http://localhost:8083',
    ENDPOINTS: {
      HEALTH: '/health',
      INTENTS: '/v1/intents',
      INTENT_BY_ID: (id: string) => `/v1/intents/${id}`,
      DLQ: '/v1/dlq',
      DLQ_BY_ID: (id: string) => `/v1/dlq/${id}`,
    },
  },

  // zord-vault-journal: Raw Storage (Port 8081)
  VAULT_JOURNAL: {
    BASE_URL: process.env.ZORD_VAULT_URL || 'http://localhost:8081',
    ENDPOINTS: {
      HEALTH: '/health',
      ENVELOPES: '/v1/envelopes',
      ENVELOPE_BY_ID: (id: string) => `/v1/envelopes/${id}`,
    },
  },

  // zord-contracts: Contract Service (Port 8084)
  CONTRACTS: {
    BASE_URL: process.env.ZORD_CONTRACTS_URL || 'http://localhost:8082',
    ENDPOINTS: {
      HEALTH: '/health',
      CONTRACTS: '/v1/contracts',
      CONTRACT_BY_ID: (id: string) => `/v1/contracts/${id}`,
    },
  },

  

  // zord-pii-enclave: PII Protection (Port 8085)
  PII_ENCLAVE: {
    BASE_URL: process.env.ZORD_PII_ENCLAVE_URL || 'http://localhost:8085',
    ENDPOINTS: {
      HEALTH: '/health',
    },
  },

  // zord-analytics: Dashboard KPI and reconciliation intelligence (console-integrated API)
  ANALYTICS: {
    BASE_URL: process.env.ZORD_ANALYTICS_URL || 'http://localhost:3000',
    ENDPOINTS: {
      OVERVIEW: '/api/prod/zord/metrics/overview',
      PAYOUT_INTELLIGENCE: '/api/prod/zord/metrics/payout-intelligence',
      RECONCILIATION: '/api/prod/zord/metrics/reconciliation',
      PSP_HEALTH: '/api/prod/zord/metrics/psp-health',
      ERRORS: '/api/prod/zord/metrics/errors',
      INTENT_DETAIL: (id: string) => `/api/prod/zord/intent/${id}/detail`,
      SEARCH: '/api/prod/zord/search',
    },
  },
} as const

// Helper function to build full URL
export function buildUrl(
  service: keyof typeof BACKEND_SERVICES,
  endpoint: string
): string {
  const baseUrl = BACKEND_SERVICES[service].BASE_URL
  return `${baseUrl}${endpoint}`
}

// Common fetch options - disable Next.js fetch cache for real-time data
export const DEFAULT_FETCH_OPTIONS: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  cache: 'no-store',
}

// Timeout for API calls (ms)
export const API_TIMEOUT = 30000
