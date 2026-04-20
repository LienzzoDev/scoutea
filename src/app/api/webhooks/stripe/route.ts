import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { logger } from '@/lib/logging/production-logger'
import { RoleService } from '@/lib/services/role-service'
import { TransactionService } from '@/lib/services/transaction-service'
import { WebhookRetryService } from '@/lib/services/webhook-retry-service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
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

      // Log usando logger directo
      logger.error('Webhook signature verification failed', err as Error, {
        hasSignature: !!signature,
        bodyLength: body.length
      })

      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('🔔 Stripe webhook event received:', event.type)
    console.log('Event ID:', event.id)
    console.log('Event created:', new Date(event.created * 1000).toISOString())

    let handlerResult = null

    // Manejar eventos de Stripe con reintentos
    // event is guaranteed non-null here after constructEvent succeeds
    const verifiedEvent = event!
    const retryResult = await WebhookRetryService.processStripeWebhookWithRetry(
      verifiedEvent.type,
      verifiedEvent.id,
      async () => {
        switch (verifiedEvent.type) {
          case 'checkout.session.completed':
            return await handleCheckoutSessionCompleted(verifiedEvent.data.object as Stripe.Checkout.Session)
          case 'customer.subscription.created':
            return await handleSubscriptionCreated(verifiedEvent.data.object as Stripe.Subscription)
          case 'customer.subscription.updated':
            return await handleSubscriptionUpdated(verifiedEvent.data.object as Stripe.Subscription)
          case 'customer.subscription.deleted':
            return await handleSubscriptionDeleted(verifiedEvent.data.object as Stripe.Subscription)
          case 'invoice.payment_succeeded':
            return await handleInvoicePaymentSucceeded(verifiedEvent.data.object as Stripe.Invoice)
          case 'invoice.payment_failed':
            return await handleInvoicePaymentFailed(verifiedEvent.data.object as Stripe.Invoice)
          default:
            console.log(`⚠️ Unhandled event type: ${verifiedEvent.type}`)
            return { handled: false, reason: 'Unhandled event type' }
        }
      }
    )

    handlerResult = retryResult.success ? retryResult.result : {
      success: false,
      error: retryResult.error,
      attempts: retryResult.attempts
    }

    // Log directo usando logger (más eficiente que HTTP)
    logger.info('Stripe webhook processed', {
      eventType: event.type,
      eventId: event.id,
      created: new Date(event.created * 1000).toISOString(),
      handlerResult,
      processingTime: Date.now() - startTime,
      success: true
    })

    console.log(`✅ Webhook processed successfully in ${Date.now() - startTime}ms`)
    return NextResponse.json({ received: true, eventType: event.type, eventId: event.id })

  } catch (error) {
    console.error('❌ Error processing Stripe webhook:', error)

    // Log directo usando logger
    logger.error('Stripe webhook processing failed', error as Error, {
      eventType: event?.type || 'unknown',
      eventId: event?.id,
      processingTime: Date.now() - startTime
    })

    return NextResponse.json({
      error: 'Webhook processing failed',
      eventType: event?.type || 'unknown'
    }, { status: 500 })
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
    const errorMsg = 'No userId found in checkout session'
    logger.error(errorMsg, new Error(errorMsg), { sessionId: session.id })
    return { success: false, error: errorMsg, sessionId: session.id }
  }

  if (session.payment_status !== 'paid') {
    const errorMsg = `Payment not completed. Status: ${session.payment_status}`
    logger.error(errorMsg, new Error(errorMsg), { sessionId: session.id, userId })
    return { success: false, error: errorMsg, sessionId: session.id, paymentStatus: session.payment_status }
  }

  if (!plan) {
    const errorMsg = 'No plan found in checkout session'
    logger.error(errorMsg, new Error(errorMsg), { sessionId: session.id, userId })
    return { success: false, error: errorMsg, sessionId: session.id }
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
      logger.error('Failed to process payment completion', new Error(result.error || 'Unknown error'), {
        userId,
        sessionId: session.id,
        plan
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

    // Cancelar suscripción usando el método específico
    await RoleService.cancelUserSubscription(userId)

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
    const status: 'active' | 'inactive' = subscription.status === 'active' ? 'active' : 'inactive'

    // Get existing metadata to preserve the plan
    const existingMetadata = await RoleService.getUserMetadata(userId)
    const existingPlan = existingMetadata?.subscription?.plan || 'unknown'

    const result = await RoleService.updateUserRole(userId, {
      subscription: {
        status,
        plan: existingPlan,
        stripeSubscriptionId: subscription.id
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