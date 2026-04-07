'use client'

import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_PERSONA, PERSONA_CONFIG, ZordPersona } from '../_config/modules'

interface SessionState {
  tenantId: string
  tenantName: string
  persona: ZordPersona
  environment: 'LIVE' | 'SANDBOX'
}

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'
const DEFAULT_TENANT_NAME = 'Arealis Demo Tenant'

export function useZordSession() {
  const [session, setSession] = useState<SessionState>({
    tenantId: DEFAULT_TENANT_ID,
    tenantName: DEFAULT_TENANT_NAME,
    persona: DEFAULT_PERSONA,
    environment: 'LIVE',
  })

  useEffect(() => {
    const tenantId = localStorage.getItem('zord_tenant_id') || DEFAULT_TENANT_ID
    const tenantName = localStorage.getItem('cx_tenant_name') || localStorage.getItem('zord_tenant_name') || DEFAULT_TENANT_NAME
    const personaRaw = localStorage.getItem('zord_persona') as ZordPersona | null
    const persona = personaRaw && PERSONA_CONFIG[personaRaw] ? personaRaw : DEFAULT_PERSONA
    const envRaw = localStorage.getItem('cx_env')

    setSession({
      tenantId,
      tenantName,
      persona,
      environment: envRaw === 'sandbox' ? 'SANDBOX' : 'LIVE',
    })
  }, [])

  const personaConfig = useMemo(() => PERSONA_CONFIG[session.persona], [session.persona])

  const setPersona = (nextPersona: ZordPersona) => {
    localStorage.setItem('zord_persona', nextPersona)
    setSession((prev) => ({ ...prev, persona: nextPersona }))
  }

  const setTenant = (tenantId: string, tenantName: string) => {
    localStorage.setItem('zord_tenant_id', tenantId)
    localStorage.setItem('zord_tenant_name', tenantName)
    setSession((prev) => ({ ...prev, tenantId, tenantName }))
  }

  return {
    ...session,
    personaConfig,
    setPersona,
    setTenant,
  }
}
