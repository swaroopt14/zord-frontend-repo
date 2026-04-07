'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_PERSONA, PERSONA_CONFIG, ZordPersona } from './_config/modules'

export default function ZordDashboardRootPage() {
  const router = useRouter()

  useEffect(() => {
    const personaRaw = localStorage.getItem('zord_persona') as ZordPersona | null
    const persona = personaRaw && PERSONA_CONFIG[personaRaw] ? personaRaw : DEFAULT_PERSONA
    router.replace(PERSONA_CONFIG[persona].defaultModule)
  }, [router])

  return null
}
