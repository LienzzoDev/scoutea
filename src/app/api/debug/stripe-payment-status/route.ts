import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const sessionId = url.searchParams.get('session_id')

    console.log('🔍 Checking Stripe payment status...')
    console.log('Session ID:', sessionId)
    console.log('User ID:', userId)

    let sessionData = null
    let subscriptionData = null
    let customerData = null

    // Si hay session_id, verificar la sesión específica
    if (sessionId) {
      try {
        sessionData = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription', 'customer']
        })
        console.log('✅ Session retrieved successfully')
      } catch (error) {
        console.error('❌ Error retrieving session:', error)
        return NextResponse.json({
          success: false,
          error: 'Session not found',
          sessionId
        }, { status: 404 })
      }
    }

    // Buscar sesiones recientes del usuario
    const recentSessions = await stripe.checkout.sessions.list({
      limit: 10,
      expand: ['data.subscription', 'data.customer']
    })

    // Filtrar sesiones del usuario actual
    const userSessions = recentSessions.data.filter(session => 
      session.client_reference_id === userId || 
      session.metadata?.userId === userId
    )

    // Buscar suscripciones del usuario
    const subscriptions = await stripe.subscriptions.list({
      limit: 10,
      expand: ['data.customer']
    })

    const userSubscriptions = subscriptions.data.filter(sub => 
      sub.metadata?.userId === userId
    )

    return NextResponse.json({
      success: true,
      userId,
      sessionId,
      stripeData: {
        specificSession: sessionData ? {
          id: sessionData.id,
          status: sessionData.status,
          payment_status: sessionData.payment_status,
          amount_total: sessionData.amount_total,
          currency: sessionData.currency,
          customer: sessionData.customer,
          subscription: sessionData.subscription,
          client_reference_id: sessionData.client_reference_id,
          metadata: sessionData.metadata,
          created: new Date(sessionData.created * 1000).toISOString(),
          success_url: sessionData.success_url,
          cancel_url: sessionData.cancel_url
        } : null,
        userSessions: userSessions.map(session => ({
          id: session.id,
          status: session.status,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
          currency: session.currency,
          customer: session.customer,
          subscription: session.subscription,
          client_reference_id: session.client_reference_id,
          metadata: session.metadata,
          created: new Date(session.created * 1000).toISOString()
        })),
        userSubscriptions: userSubscriptions.map(sub => ({
          id: sub.id,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          customer: sub.customer,
          metadata: sub.metadata,
          items: sub.items.data.map(item => ({
            price: item.price.id,
            quantity: item.quantity
          }))
        }))
      },
      analysis: {
        hasValidSession: !!sessionData && sessionData.payment_status === 'paid',
        hasActiveSubscription: userSubscriptions.some(sub => sub.status === 'active'),
        totalSessions: userSessions.length,
        totalSubscriptions: userSubscriptions.length,
        lastSessionStatus: userSessions[0]?.payment_status || 'none',
        lastSubscriptionStatus: userSubscriptions[0]?.status || 'none'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error checking Stripe payment status:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    console.log('🔍 Checking specific Stripe session:', sessionId)

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'line_items']
    })

    return NextResponse.json({
      success: true,
      userId,
      sessionId,
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer: session.customer,
        subscription: session.subscription,
        client_reference_id: session.client_reference_id,
        metadata: session.metadata,
        created: new Date(session.created * 1000).toISOString(),
        success_url: session.success_url,
        cancel_url: session.cancel_url,
        line_items: session.line_items
      },
      isValid: session.payment_status === 'paid',
      belongsToUser: session.client_reference_id === userId || session.metadata?.userId === userId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error checking specific session:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}