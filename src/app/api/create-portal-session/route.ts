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
      return NextResponse.json({ __error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { return_url } = body

    const user = await clerkClient.users.getUser(userId)
    const subscription = user.publicMetadata?.subscription as {
      stripeCustomerId?: string
    } | undefined

    const stripeCustomerId = subscription?.stripeCustomerId

    if (!stripeCustomerId) {
      return NextResponse.json(
        { __error: 'No se encontró un ID de cliente de Stripe' },
        { status: 400 }
      )
    }

    // Validar return_url para prevenir open redirect
    const origin = request.nextUrl.origin
    const safeReturnUrl =
      return_url && typeof return_url === 'string' && return_url.startsWith(origin)
        ? return_url
        : `${origin}/member/profile`

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: safeReturnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { __error: 'Error al crear la sesión del portal' },
      { status: 500 }
    )
  }
}
