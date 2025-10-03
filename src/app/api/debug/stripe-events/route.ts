import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching recent Stripe events...')
    
    // Get recent events from Stripe
    const events = await stripe.events.list({
      limit: 10,
      types: ['checkout.session.completed', 'customer.subscription.created']
    })
    
    const eventSummary = events.data.map(event => ({
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString(),
      object: event.data.object.object,
      // For checkout sessions, get the client_reference_id (userId)
      userId: event.type === 'checkout.session.completed' 
        ? (event.data.object as any).client_reference_id 
        : (event.data.object as any).metadata?.userId,
      metadata: (event.data.object as any).metadata,
      status: (event.data.object as any).status || (event.data.object as any).payment_status
    }))
    
    return NextResponse.json({
      success: true,
      message: 'Recent Stripe events retrieved',
      events: eventSummary,
      totalEvents: events.data.length,
      webhookEndpoint: '/api/webhooks/stripe',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error fetching Stripe events:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}