import { auth } from '@clerk/nextjs/server'
import { createClerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.error('No userId found in checkout')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { billing } = body
    const plan = 'member'

    console.log('Creating Stripe checkout session for userId:', userId, 'billing:', billing)

    const user = await clerkClient.users.getUser(userId)
    const userEmail = user.emailAddresses[0]?.emailAddress
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim()

    console.log('User info:', { userEmail, userName, plan })

    // Marcar el plan seleccionado en metadata
    const currentMetadata = user.publicMetadata || {}
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        selectedPlan: plan
      }
    })

    const priceData = {
      currency: 'eur',
      product_data: {
        name: 'Member Plan',
        description: 'Full access to Wonderkids, Tournaments and On Demand'
      },
      unit_amount: 990, // €9.90 in cents
      recurring: {
        interval: billing === 'yearly' ? 'year' : 'month',
        interval_count: 1
      }
    }

    const baseUrl = request.nextUrl.origin
    const successUrl = `${baseUrl}/member/payment-processing?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`
    const cancelUrl = `${baseUrl}/member/complete-profile?plan=${plan}&payment=cancelled`

    console.log('Creating Stripe session with:', {
      priceData,
      successUrl,
      cancelUrl,
      userEmail
    })

    // Crear sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        plan: plan,
        billing: billing || 'monthly'
      },
      subscription_data: {
        metadata: {
          userId: userId,
          plan: plan,
          billing: billing || 'monthly'
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    console.log('Stripe session created successfully:', session.id)
    
    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
      success: true 
    })
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}