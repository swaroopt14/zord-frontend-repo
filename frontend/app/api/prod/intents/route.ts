import { NextRequest, NextResponse } from 'next/server'
import { IntentListResponse, Intent } from '@/types/intent'
import { getAllMockIntents } from './_mockData'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('page_size') || '50', 10)
    
    // Server-side filters
    const status = searchParams.get('status')
    const tenant = searchParams.get('tenant')
    const source = searchParams.get('source')
    const intentId = searchParams.get('intent_id')
    const envelopeId = searchParams.get('envelope_id')
    const fingerprint = searchParams.get('fingerprint')
    const createdFrom = searchParams.get('created_from')
    const createdTo = searchParams.get('created_to')
    const searchQuery = searchParams.get('search') || ''
    
    let allMockIntents = getAllMockIntents()
    
    // Apply server-side filtering
    let filteredIntents = allMockIntents.filter((intent: Intent) => {
      // Status filter
      if (status && intent.status !== status) {
        return false
      }
      
      // Source filter
      if (source && intent.source !== source) {
        return false
      }
      
      // Intent ID filter (exact match or partial)
      if (intentId && !intent.intent_id.toLowerCase().includes(intentId.toLowerCase())) {
        return false
      }
      
      // Envelope ID filter (would need to be added to Intent type or fetched separately)
      // For now, we'll skip this as it requires envelope data
      
      // Fingerprint filter (would need to be added to Intent type)
      // For now, we'll skip this as it requires fingerprint data
      
      // Date range filter
      if (createdFrom) {
        const fromDate = new Date(createdFrom)
        const intentDate = new Date(intent.created_at)
        if (intentDate < fromDate) {
          return false
        }
      }
      
      if (createdTo) {
        const toDate = new Date(createdTo)
        const intentDate = new Date(intent.created_at)
        // Add 1 day to include the entire day
        toDate.setDate(toDate.getDate() + 1)
        if (intentDate >= toDate) {
          return false
        }
      }
      
      // Global search (intent ID, envelope ID if available)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesIntentId = intent.intent_id.toLowerCase().includes(query)
        // Note: envelope_id would need to be in the Intent type for this to work
        if (!matchesIntentId) {
          return false
        }
      }
      
      return true
    })
    
    // Calculate pagination on filtered results
    const total = filteredIntents.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const items = filteredIntents.slice(startIndex, endIndex)
    
    const response: IntentListResponse = {
      items,
      pagination: {
        page,
        page_size: pageSize,
        total,
      },
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching intents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
