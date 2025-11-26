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
    let { plan, billing } = body

    console.log('Creating Stripe checkout session for userId:', userId)
    console.log('Plan:', plan, 'Billing:', billing)

    // Obtener información del usuario
    const user = await clerkClient.users.getUser(userId)
    const userEmail = user.emailAddresses[0]?.emailAddress
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim()

    // Si no hay plan pero el usuario tiene rol asignado (por invitación), usar ese rol
    if (!plan) {
      const userRole = user.publicMetadata?.role as string | undefined
      if (userRole === 'scout' || userRole === 'member') {
        plan = userRole
        console.log('No plan provided, using role from invitation:', plan)
      }
    }

    if (!plan) {
      console.error('No plan provided and no role in user metadata')
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 })
    }

    // Validar que no sea plan premium (premium requiere aprobación manual)
    if (plan === 'premium') {
      console.error('Premium plan detected in checkout - should go through request access flow')
      return NextResponse.json(
        { error: 'El plan Premium requiere aprobación. Por favor, usa el formulario de solicitud.' },
        { status: 400 }
      )
    }

    console.log('User info:', { userEmail, userName, plan })

    // Actualizar metadatos del usuario para marcar el plan seleccionado
    const currentMetadata = user.publicMetadata || {}
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        selectedPlan: plan
      }
    })

    // Configurar precios según el plan y billing
    const priceData = {
      currency: 'usd',
      product_data: {
        name: plan === 'member' ? 'Plan Miembro' : 'Plan Scout',
        description: plan === 'member' 
          ? 'Acceso completo para analistas y profesionales del fútbol'
          : 'Herramientas avanzadas para scouts profesionales'
      },
      unit_amount: 2000, // $20.00 en centavos
      recurring: {
        interval: billing === 'yearly' ? 'year' : 'month',
        interval_count: 1
      }
    }

    // URLs de redirección - usar página de procesamiento para manejar la transición
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