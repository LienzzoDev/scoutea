import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { logger } from '@/lib/logging/production-logger'
import { RoleService } from '@/lib/services/role-service'
import { TransactionService } from '@/lib/services/transaction-service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    logger.info('Verifying payment', { userId, sessionId })

    // 1. Verificar el estado del pago en Stripe directamente
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    logger.info('Stripe session retrieved', {
      sessionId,
      paymentStatus: session.payment_status,
      status: session.status
    })

    // 2. Verificar si el pago fue completado
    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        status: session.payment_status,
        message: 'Payment not completed yet'
      })
    }

    // 3. Verificar si la sesión pertenece a este usuario
    const sessionUserId = session.client_reference_id || session.metadata?.userId
    if (sessionUserId !== userId) {
      logger.warn('Session userId mismatch', {
        sessionUserId,
        requestUserId: userId,
        sessionId
      })
      return NextResponse.json({
        success: false,
        error: 'Session does not belong to this user'
      }, { status: 403 })
    }

    // 4. Verificar si el webhook ya procesó este pago
    const user = await RoleService.getUserMetadata(userId)

    if (user?.subscription?.stripeSessionId === sessionId && user?.subscription?.status === 'active') {
      logger.info('Payment already processed by webhook', {
        userId,
        sessionId,
        role: user.role
      })

      // Ya fue procesado, retornar el estado actual
      return NextResponse.json({
        success: true,
        status: 'paid',
        webhookProcessed: true,
        hasActiveSubscription: true,
        role: user.role,
        plan: user.subscription.plan
      })
    }

    // 5. El pago está confirmado pero el webhook aún no procesó
    // FORZAR procesamiento manual como fallback
    let plan = session.metadata?.plan
    const billing = session.metadata?.billing

    // Si no hay plan en la sesión, intentar obtenerlo del rol del usuario
    // Esto ocurre cuando el usuario viene de una invitación
    if (!plan) {
      logger.info('No plan in session metadata, checking user role from invitation', { userId, sessionId })

      // Obtener el rol del usuario desde Clerk
      const userMetadata = await RoleService.getUserMetadata(userId)
      const userRole = userMetadata?.role

      if (userRole === 'scout') {
        plan = 'scout'
        logger.info('User has scout role from invitation, using scout plan', { userId })
      } else if (userRole === 'member') {
        plan = 'member'
        logger.info('User has member role from invitation, using member plan', { userId })
      } else {
        logger.warn('No plan found and no valid role in user metadata', { sessionId, userRole })
        return NextResponse.json({
          success: false,
          error: 'Invalid session: missing plan information and no role assigned'
        }, { status: 400 })
      }
    }

    logger.info('Payment confirmed, FORCING manual processing', {
      userId,
      sessionId,
      plan,
      billing,
      customer: session.customer,
      subscription: session.subscription
    })

    // FORZAR procesamiento manual - el pago está confirmado en Stripe
    // No debemos esperar el webhook si el usuario ya pagó
    let result
    try {
      result = await TransactionService.processPaymentCompletion(userId, plan, {
        customerId: session.customer as string,
        subscriptionId: session.subscription as string,
        sessionId: session.id,
        billing: billing as 'monthly' | 'yearly' || 'monthly'
      })

      logger.info('TransactionService result', {
        success: result.success,
        error: result.error,
        hasData: !!result.data
      })
    } catch (transactionError) {
      logger.error('TransactionService threw exception', transactionError as Error, {
        userId,
        sessionId,
        plan
      })

      return NextResponse.json({
        success: false,
        error: 'Payment processing exception',
        details: transactionError instanceof Error ? transactionError.message : 'Unknown error',
        sessionId
      }, { status: 500 })
    }

    if (result.success) {
      logger.info('Manual payment processing SUCCESSFUL', {
        userId,
        sessionId,
        role: result.data.roleResult.newRole,
        plan
      })

      return NextResponse.json({
        success: true,
        status: 'paid',
        webhookProcessed: false,
        manuallyProcessed: true,
        hasActiveSubscription: true,
        role: result.data.roleResult.newRole,
        plan
      })
    }

    // Si el procesamiento manual falla, es un error crítico
    // porque el pago YA está confirmado en Stripe
    logger.error('CRITICAL: Manual payment processing failed but payment is confirmed', {
      userId,
      sessionId,
      error: result.error,
      plan
    })

    return NextResponse.json({
      success: false,
      error: 'Payment confirmed but activation failed. Please contact support.',
      details: result.error,
      sessionId
    }, { status: 500 })

  } catch (error) {
    logger.error('Error verifying payment', error as Error)

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
