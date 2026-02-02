import { Intent, IntentDetail, IntentStatus, IntentSource, IntentInstrument } from '@/types/intent'

// Shared mock data storage
export const mockIntentsList: Intent[] = [
  {
    intent_id: 'pi_01HZX3G1AF7ZK2S8J2KZ',
    source: 'API',
    amount: '125000.00',
    currency: 'INR',
    instrument: 'BANK',
    status: 'RECEIVED',
    created_at: '2026-01-13T12:31:02Z',
  },
  {
    intent_id: 'pi_01HZX3F91Q8KX9L2M4',
    source: 'BATCH',
    amount: '8500.00',
    currency: 'INR',
    instrument: 'UPI',
    status: 'REJECTED_PREACC',
    created_at: '2026-01-13T12:29:11Z',
    error_code: 'INSTRUMENT_FORMAT_INVALID',
  },
  {
    intent_id: 'pi_01HZX3E7R2MN5P4Q6',
    source: 'API',
    amount: '50000.00',
    currency: 'INR',
    instrument: 'NEFT',
    status: 'RECEIVED',
    created_at: '2026-01-13T12:25:45Z',
  },
  {
    intent_id: 'pi_01HZX3D3K9LM8N2O5',
    source: 'BATCH',
    amount: '25000.00',
    currency: 'INR',
    instrument: 'IMPS',
    status: 'QUEUED_ACC',
    created_at: '2026-01-13T12:20:30Z',
  },
  {
    intent_id: 'pi_01HZX3C1J7KL6M3N4',
    source: 'API',
    amount: '75000.00',
    currency: 'INR',
    instrument: 'RTGS',
    status: 'RECEIVED',
    created_at: '2026-01-13T12:15:20Z',
  },
  {
    intent_id: 'pi_01HZX3B9H5IJ4K2L3',
    source: 'BATCH',
    amount: '15000.00',
    currency: 'INR',
    instrument: 'UPI',
    status: 'REJECTED_PREACC',
    created_at: '2026-01-13T12:10:15Z',
    error_code: 'SCHEMA_INVALID',
  },
  {
    intent_id: 'pi_01HZX3A7G3HI2J1K2',
    source: 'API',
    amount: '100000.00',
    currency: 'INR',
    instrument: 'BANK',
    status: 'QUEUED_ACC',
    created_at: '2026-01-13T12:05:10Z',
  },
  {
    intent_id: 'pi_01HZX399F1GH0I9J1',
    source: 'WEBHOOK',
    amount: '30000.00',
    currency: 'INR',
    instrument: 'NEFT',
    status: 'RECEIVED',
    created_at: '2026-01-13T12:00:05Z',
  },
  {
    intent_id: 'pi_01HZX388E9FG8H7I8',
    source: 'BATCH',
    amount: '45000.00',
    currency: 'INR',
    instrument: 'IMPS',
    status: 'REJECTED_PREACC',
    created_at: '2026-01-13T11:55:00Z',
    error_code: 'INSTRUMENT_FORMAT_INVALID',
  },
  {
    intent_id: 'pi_01HZX377D8EF7G6H7',
    source: 'API',
    amount: '60000.00',
    currency: 'INR',
    instrument: 'RTGS',
    status: 'RECEIVED',
    created_at: '2026-01-13T11:50:55Z',
  },
  {
    intent_id: 'pi_01HZX366C7DE6F5G6',
    source: 'BATCH',
    amount: '20000.00',
    currency: 'INR',
    instrument: 'UPI',
    status: 'QUEUED_ACC',
    created_at: '2026-01-13T11:45:50Z',
  },
  {
    intent_id: 'pi_01HZX355B6CD5E4F5',
    source: 'API',
    amount: '90000.00',
    currency: 'INR',
    instrument: 'BANK',
    status: 'RECEIVED',
    created_at: '2026-01-13T11:40:45Z',
  },
  {
    intent_id: 'pi_01HZX344A5BC4D3E4',
    source: 'WEBHOOK',
    amount: '35000.00',
    currency: 'INR',
    instrument: 'NEFT',
    status: 'REJECTED_PREACC',
    created_at: '2026-01-13T11:35:40Z',
    error_code: 'IDEMPOTENCY_CONFLICT',
  },
  {
    intent_id: 'pi_01HZX33394AB3C2D3',
    source: 'BATCH',
    amount: '55000.00',
    currency: 'INR',
    instrument: 'IMPS',
    status: 'RECEIVED',
    created_at: '2026-01-13T11:30:35Z',
  },
  {
    intent_id: 'pi_01HZX32283A2B1C2',
    source: 'API',
    amount: '80000.00',
    currency: 'INR',
    instrument: 'RTGS',
    status: 'QUEUED_ACC',
    created_at: '2026-01-13T11:25:30Z',
  },
  {
    intent_id: 'pi_01HZX31172A1B0C1',
    source: 'BATCH',
    amount: '40000.00',
    currency: 'INR',
    instrument: 'UPI',
    status: 'RECEIVED',
    created_at: '2026-01-13T11:20:25Z',
  },
  {
    intent_id: 'pi_01HZX30061A0B9C0',
    source: 'API',
    amount: '110000.00',
    currency: 'INR',
    instrument: 'BANK',
    status: 'REJECTED_PREACC',
    created_at: '2026-01-13T11:15:20Z',
    error_code: 'SCHEMA_INVALID',
  },
  {
    intent_id: 'pi_01HZX29950A9B8C9',
    source: 'WEBHOOK',
    amount: '65000.00',
    currency: 'INR',
    instrument: 'NEFT',
    status: 'RECEIVED',
    created_at: '2026-01-13T11:10:15Z',
  },
  {
    intent_id: 'pi_01HZX28840A8B7C8',
    source: 'BATCH',
    amount: '70000.00',
    currency: 'INR',
    instrument: 'IMPS',
    status: 'QUEUED_ACC',
    created_at: '2026-01-13T11:05:10Z',
  },
  {
    intent_id: 'pi_01HZX27730A7B6C7',
    source: 'API',
    amount: '95000.00',
    currency: 'INR',
    instrument: 'RTGS',
    status: 'RECEIVED',
    created_at: '2026-01-13T11:00:05Z',
  },
  {
    intent_id: 'pi_01HZX26620A6B5C6',
    source: 'BATCH',
    amount: '120000.00',
    currency: 'INR',
    instrument: 'UPI',
    status: 'REJECTED_PREACC',
    created_at: '2026-01-13T10:55:00Z',
    error_code: 'INSTRUMENT_FORMAT_INVALID',
  },
]

// Generate additional mock data to reach 12482 total
export function generateMockIntents(count: number): Intent[] {
  const sources: IntentSource[] = ['API', 'BATCH', 'WEBHOOK']
  const instruments: IntentInstrument[] = ['BANK', 'UPI', 'NEFT', 'IMPS', 'RTGS']
  const statuses: IntentStatus[] = ['RECEIVED', 'REJECTED_PREACC', 'QUEUED_ACC']
  const errorCodes = ['INSTRUMENT_FORMAT_INVALID', 'SCHEMA_INVALID', 'IDEMPOTENCY_CONFLICT', 'REJECTED_PREACC']
  
  const intents: Intent[] = []
  const baseDate = new Date('2026-01-13T10:00:00Z')
  
  for (let i = 0; i < count; i++) {
    const source = sources[Math.floor(Math.random() * sources.length)]
    const instrument = instruments[Math.floor(Math.random() * instruments.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const amount = (Math.random() * 200000 + 1000).toFixed(2)
    const timestamp = new Date(baseDate.getTime() - i * 60000) // 1 minute apart
    
    const intent: Intent = {
      intent_id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source,
      amount,
      currency: 'INR',
      instrument,
      status,
      created_at: timestamp.toISOString(),
    }
    
    if (status === 'REJECTED_PREACC') {
      intent.error_code = errorCodes[Math.floor(Math.random() * errorCodes.length)]
    }
    
    intents.push(intent)
  }
  
  return intents
}

// Get all mock intents (including generated ones)
export function getAllMockIntents(): Intent[] {
  return [
    ...mockIntentsList,
    ...generateMockIntents(12482 - mockIntentsList.length),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Get a specific intent from the list
export function getIntentById(intentId: string): Intent | undefined {
  const allIntents = getAllMockIntents()
  return allIntents.find(intent => intent.intent_id === intentId)
}
