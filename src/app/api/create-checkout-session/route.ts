import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const { plan, billing } = await request.json()

    if (!plan || !billing) {
      return NextResponse.json({ error: 'Plan and billing are required' }, { status: 400 })
    }

    // Definir precios según el plan y billing
    const prices = {
      basic: {
        monthly: 1000, // $10.00 en centavos
        annual: 9600,  // $96.00 en centavos (8 * 12)
      },
      premium: {
        monthly: 2000, // $20.00 en centavos
        annual: 20400, // $204.00 en centavos (17 * 12)
      }
    }

    const amount = prices[plan as keyof typeof prices][billing as keyof typeof prices.basic]
    const interval = billing === 'monthly' ? 'month' : 'year'

    // ===== OBTENER EMAIL DEL USUARIO =====
    // Obtener el email del usuario desde Clerk para pre-llenar el checkout
    let customerEmail: string | undefined
    try {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)
      const rawEmail = user.emailAddresses[0]?.emailAddress
      
      // Validar que el email sea válido
      if (rawEmail && rawEmail.includes('@') && rawEmail.length > 5) {
        customerEmail = rawEmail
        console.log('📧 Email del usuario obtenido y validado:', customerEmail)
      } else {
        console.warn('⚠️ Email del usuario no es válido:', rawEmail)
      }
    } catch (emailError) {
      console.warn('⚠️ No se pudo obtener el email del usuario:', emailError)
      // Continuar sin email pre-llenado
    }

    // Crear checkout session
    console.log('🔄 Creando sesión de checkout con email:', customerEmail)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `Scoutea ${plan} subscription - ${billing} billing`,
            },
            unit_amount: amount,
            recurring: {
              interval: interval as 'month' | 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/member/welcome-plan?plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/member/subscription-plans?canceled=true`,
      metadata: {
        userId: userId,
        plan: plan,
        billing: billing,
      },
      customer_email: customerEmail, // Pre-llenar con el email del usuario
    })

    console.log('✅ Sesión de checkout creada exitosamente:', {
      sessionId: session.id,
      customerEmail: customerEmail,
      plan: plan,
      billing: billing
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
