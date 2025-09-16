import { clerkClient } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'

import { UserService } from '@/lib/services/user-service'

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.text()
  const body = JSON.parse(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('❌ Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, public_metadata } = evt.data

    // Check if user already has a role assigned
    if (public_metadata?.role) {
      return NextResponse.json({ message: 'User already has role' })
    }

    // Determine role based on email domain or other criteria
    let role = 'member' // Default role for new users

    // You can add logic here to assign 'admin' role based on specific criteria
    // For example, if the email is from a specific domain or matches a pattern
    const email = email_addresses[0]?.email_address
    if (email && email.includes('@scoutea.com')) {
      role = 'admin'
    }

    try {
      // Crear usuario en la base de datos
      const email = email_addresses[0]?.email_address
      if (email) {
        try {
          await UserService.createUser({
            clerkId: id,
            email: email,
            firstName: '', // Se completará cuando el usuario llene el formulario
            lastName: ''
          })
          console.log(`✅ User created in database: ${id}`)
        } catch (dbError) {
          console.error('❌ Error creating user in database:', dbError)
          // Continuar aunque falle la creación en DB
        }
      }

      // Solo actualizar metadatos si no existen (evitar sobrescribir)
      if (!public_metadata?.role) {
        try {
          // Usar funciones integradas de Clerk (más eficiente)
          const clerk = await clerkClient()
          await clerk.users.updateUser(id, {
            publicMetadata: {
              ...public_metadata,
              role: role,
              profile: 'incomplete'
            }
          })

          return NextResponse.json({ 
            message: `Role '${role}' assigned successfully`,
            userId: id,
            role: role
          })
        } catch (updateError) {
          console.error('❌ Failed to update user metadata:', updateError)
          return NextResponse.json(
            { error: 'Failed to update user metadata' },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json({ 
          message: `Role '${role}' already assigned`,
          userId: id,
          role: role
        })
      }
    } catch (error) {
      console.error('❌ Error updating user metadata:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ message: 'Webhook received' })
}
