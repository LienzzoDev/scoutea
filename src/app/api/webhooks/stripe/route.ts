import { NextRequest, NextResponse } from 'next/server'
import { createClerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Stripe webhook event received:', event.type)

    // Manejar eventos de Stripe
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Stripe webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id)
  
  const userId = session.client_reference_id || session.metadata?.userId
  const plan = session.metadata?.plan
  const billing = session.metadata?.billing

  if (!userId) {
    console.error('No userId found in checkout session')
    return
  }

  try {
    // Obtener metadatos actuales del usuario
    const user = await clerkClient.users.getUser(userId)
    const currentMetadata = user.publicMetadata || {}

    // Obtener el plan seleccionado de los metadatos actuales
    const selectedPlan = currentMetadata.selectedPlan as string || plan || 'member'
    
    // Actualizar metadatos del usuario con suscripción activa y rol asignado
    const updatedMetadata = {
      ...currentMetadata,
      role: selectedPlan, // Asignar el rol basándose en el plan seleccionado
      subscription: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        plan: selectedPlan,
        status: 'active',
        billing: billing || 'monthly',
        startDate: new Date().toISOString(),
        nextBilling: new Date(Date.now() + (billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
      },
      onboardingCompleted: true,
      onboardingStep: 'completed'
    }

    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata
    })

    console.log('User subscription activated successfully for userId:', userId)
  } catch (error) {
    console.error('Error updating user subscription:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id)
  
  const userId = subscription.metadata?.userId
  if (!userId) return

  try {
    const user = await clerkClient.users.getUser(userId)
    const currentMetadata = user.publicMetadata || {}

    const updatedMetadata = {
      ...currentMetadata,
      subscription: {
        ...currentMetadata.subscription,
        status: subscription.status === 'active' ? 'active' : 'inactive',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      }
    }

    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata
    })

    console.log('User subscription updated for userId:', userId)
  } catch (error) {
    console.error('Error updating user subscription:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id)
  
  const userId = subscription.metadata?.userId
  if (!userId) return

  try {
    const user = await clerkClient.users.getUser(userId)
    const currentMetadata = user.publicMetadata || {}

    const updatedMetadata = {
      ...currentMetadata,
      subscription: {
        ...currentMetadata.subscription,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      }
    }

    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata
    })

    console.log('User subscription cancelled for userId:', userId)
  } catch (error) {
    console.error('Error cancelling user subscription:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id)
}