import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { TransactionService } from '@/lib/services/transaction-service'
import { RoleService } from '@/lib/services/role-service'
import { WebhookRetryService } from '@/lib/services/webhook-retry-service'
import { logger } from '@/lib/logging/production-logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})



const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let event: Stripe.Event | null = null
  
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    console.log('🔔 Stripe webhook received')
    console.log('Body length:', body.length)
    console.log('Has signature:', !!signature)

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified')
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      
      // Log del error
      await logWebhookEvent('signature_verification_failed', {
        error: err instanceof Error ? err.message : 'Unknown error',
        hasSignature: !!signature,
        bodyLength: body.length
      }, false, err instanceof Error ? err.message : 'Unknown error')
      
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('🔔 Stripe webhook event received:', event.type)
    console.log('Event ID:', event.id)
    console.log('Event created:', new Date(event.created * 1000).toISOString())

    let handlerResult = null

    // Manejar eventos de Stripe con reintentos
    const retryResult = await WebhookRetryService.processStripeWebhookWithRetry(
      event.type,
      event.id,
      async () => {
        switch (event.type) {
          case 'checkout.session.completed':
            return await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
          case 'customer.subscription.created':
            return await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
          case 'customer.subscription.updated':
            return await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          case 'customer.subscription.deleted':
            return await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          case 'invoice.payment_succeeded':
            return await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
          case 'invoice.payment_failed':
            return await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
          default:
            console.log(`⚠️ Unhandled event type: ${event.type}`)
            return { handled: false, reason: 'Unhandled event type' }
        }
      }
    )

    handlerResult = retryResult.success ? retryResult.result : {
      success: false,
      error: retryResult.error,
      attempts: retryResult.attempts
    }

    // Log del evento exitoso
    await logWebhookEvent(event.type, {
      eventId: event.id,
      created: new Date(event.created * 1000).toISOString(),
      data: event.data.object,
      handlerResult,
      processingTime: Date.now() - startTime
    }, true)

    console.log(`✅ Webhook processed successfully in ${Date.now() - startTime}ms`)
    return NextResponse.json({ received: true, eventType: event.type, eventId: event.id })
    
  } catch (error) {
    console.error('❌ Error processing Stripe webhook:', error)
    
    // Log del error
    await logWebhookEvent(event?.type || 'unknown', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime
    }, false, error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      eventType: event?.type || 'unknown'
    }, { status: 500 })
  }
}

// Función helper para registrar eventos del webhook
async function logWebhookEvent(event: string, data: any, success: boolean, error?: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/debug/webhook-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, success, error })
    })
  } catch (logError) {
    console.error('Failed to log webhook event:', logError)
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  logger.info('Processing Stripe checkout session completed', { sessionId: session.id })
  
  const userId = session.client_reference_id || session.metadata?.userId
  const plan = session.metadata?.plan
  const billing = session.metadata?.billing

  logger.info('Checkout session details', {
    sessionId: session.id,
    userId,
    plan,
    billing,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total,
    currency: session.currency
  })

  // Validaciones críticas
  if (!userId) {
    const error = 'No userId found in checkout session'
    logger.error(error, { sessionId: session.id })
    return { success: false, error, sessionId: session.id }
  }

  if (session.payment_status !== 'paid') {
    const error = `Payment not completed. Status: ${session.payment_status}`
    logger.error(error, { sessionId: session.id, userId })
    return { success: false, error, sessionId: session.id, paymentStatus: session.payment_status }
  }

  if (!plan) {
    const error = 'No plan found in checkout session'
    logger.error(error, { sessionId: session.id, userId })
    return { success: false, error, sessionId: session.id }
  }

  try {
    // Verificar si el pago ya fue procesado (idempotencia)
    const existingMetadata = await RoleService.getUserMetadata(userId)
    if (existingMetadata?.subscription?.stripeSessionId === session.id) {
      logger.info('Payment already processed, skipping', { 
        userId, 
        sessionId: session.id,
        existingRole: existingMetadata.role
      })
      return { 
        success: true, 
        userId, 
        assignedRole: existingMetadata.role,
        plan,
        sessionId: session.id,
        alreadyProcessed: true
      }
    }

    // Procesar el pago de forma atómica
    const result = await TransactionService.processPaymentCompletion(userId, plan, {
      customerId: session.customer as string,
      subscriptionId: session.subscription as string,
      sessionId: session.id,
      billing: billing as 'monthly' | 'yearly' || 'monthly'
    })

    if (!result.success) {
      logger.error('Failed to process payment completion', {
        userId,
        sessionId: session.id,
        plan,
        error: result.error
      })
      
      // Intentar rollback si es posible
      await attemptPaymentRollback(userId, session.id)
      
      return {
        success: false,
        error: result.error || 'Failed to process payment',
        userId,
        sessionId: session.id
      }
    }

    const assignedRole = result.data.roleResult.newRole

    logger.info('Payment processed successfully', {
      userId,
      sessionId: session.id,
      plan,
      assignedRole,
      previousRole: result.data.roleResult.previousRole
    })
    
    return { 
      success: true, 
      userId, 
      assignedRole, 
      plan,
      sessionId: session.id,
      roleResult: result.data.roleResult
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Unexpected error processing payment completion', error as Error, {
      userId,
      sessionId: session.id,
      plan
    })
    
    // Intentar rollback
    await attemptPaymentRollback(userId, session.id)
    
    return { 
      success: false, 
      error: errorMessage, 
      userId, 
      sessionId: session.id 
    }
  }
}

/**
 * Intenta hacer rollback de un pago fallido
 */
async function attemptPaymentRollback(userId: string, sessionId: string) {
  try {
    logger.info('Attempting payment rollback', { userId, sessionId })
    
    // Revertir metadata de suscripción
    await RoleService.updateUserRole(userId, {
      subscription: {
        status: 'cancelled' as any,
        cancelledAt: new Date().toISOString()
      }
    }, 'payment_rollback')
    
    logger.info('Payment rollback completed', { userId, sessionId })
  } catch (rollbackError) {
    logger.error('Failed to rollback payment', rollbackError as Error, { 
      userId, 
      sessionId 
    })
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info('Processing subscription update', { subscriptionId: subscription.id })
  
  const userId = subscription.metadata?.userId
  if (!userId) {
    logger.warn('No userId found in subscription metadata', { subscriptionId: subscription.id })
    return { success: false, error: 'No userId found' }
  }

  try {
    const status = subscription.status === 'active' ? 'active' : 'inactive'
    
    const result = await RoleService.updateUserRole(userId, {
      subscription: {
        status: status as any,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      }
    }, 'subscription_updated')

    if (!result.success) {
      throw new Error(result.error || 'Failed to update subscription')
    }

    logger.info('Subscription updated successfully', {
      userId,
      subscriptionId: subscription.id,
      status
    })

    return { success: true, userId, subscriptionId: subscription.id, status }
  } catch (error) {
    logger.error('Error updating subscription', error as Error, {
      userId,
      subscriptionId: subscription.id
    })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info('Processing subscription cancellation', { subscriptionId: subscription.id })
  
  const userId = subscription.metadata?.userId
  if (!userId) {
    logger.warn('No userId found in subscription metadata', { subscriptionId: subscription.id })
    return { success: false, error: 'No userId found' }
  }

  try {
    const result = await RoleService.cancelUserSubscription(userId)

    if (!result.success) {
      throw new Error(result.error || 'Failed to cancel subscription')
    }

    logger.info('Subscription cancelled successfully', {
      userId,
      subscriptionId: subscription.id
    })

    return { success: true, userId, subscriptionId: subscription.id }
  } catch (error) {
    logger.error('Error cancelling subscription', error as Error, {
      userId,
      subscriptionId: subscription.id
    })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id)
}