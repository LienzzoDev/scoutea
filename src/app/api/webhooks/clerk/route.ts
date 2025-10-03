import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'

import { TransactionService } from '@/lib/services/transaction-service'
import { UserService } from '@/lib/services/user-service'
import { logger } from '@/lib/logging/production-logger'

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
  const _body = JSON.parse(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: unknown

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

  switch (eventType) {
    case 'user.created':
      return await handleUserCreated(evt.data)
    
    case 'user.updated':
      return await handleUserUpdated(evt.data)
    
    case 'user.deleted':
      return await handleUserDeleted(evt.data)
    
    case 'session.created':
      return await handleSessionCreated(evt.data)
    
    default:
      logger.info('Unhandled Clerk webhook event', { eventType })
      return NextResponse.json({ 
        message: 'Webhook received but not handled',
        eventType 
      })
  }
}

async function handleUserCreated(data: any) {
  logger.info('Clerk webhook: user.created event received')
  const { id, email_addresses, public_metadata } = data
  
  const email = email_addresses?.[0]?.email_address
  
  logger.info('Processing new user creation', {
    userId: id,
    email,
    existingMetadata: public_metadata
  })

  // Check if user already has a role assigned
  if (public_metadata?.role) {
    logger.info('User already has role assigned', { userId: id, role: public_metadata.role })
    return NextResponse.json({ 
      message: 'User already has role',
      userId: id,
      role: public_metadata.role
    })
  }

  if (!email) {
    logger.error('No email found for new user', { userId: id })
    return NextResponse.json(
      { error: 'No email found for user' },
      { status: 400 }
    )
  }

  try {
    // Usar el servicio de transacciones para crear usuario de forma atómica
    const result = await TransactionService.createUserWithRole({
      clerkId: id,
      email,
      firstName: '', // Se completará cuando el usuario llene el formulario
      lastName: ''
    })

    if (!result.success) {
      logger.error('Failed to create user with role', { 
        userId: id, 
        email, 
        error: result.error,
        rollbackPerformed: result.rollbackPerformed
      })
      
      return NextResponse.json(
        { error: result.error || 'Failed to create user' },
        { status: 500 }
      )
    }

    logger.info('User created successfully with role', {
      userId: id,
      email,
      role: result.data.metadata.role,
      created: result.data.created
    })

    return NextResponse.json({
      message: `User created successfully with role '${result.data.metadata.role}'`,
      userId: id,
      role: result.data.metadata.role,
      created: result.data.created
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Unexpected error in user creation webhook', error as Error, {
      userId: id,
      email
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUserUpdated(data: any) {
  logger.info('Clerk webhook: user.updated event received')
  const { id, email_addresses } = data
  
  const email = email_addresses?.[0]?.email_address
  
  logger.info('Processing user update', { userId: id, email })

  try {
    // Sincronizar cambios con la base de datos si es necesario
    const dbUser = await UserService.getUserByClerkId(id)
    if (dbUser && email && dbUser.email !== email) {
      await UserService.updateUser(id, { email })
      logger.info('User email updated in database', { userId: id, newEmail: email })
    }

    return NextResponse.json({
      message: 'User updated successfully',
      userId: id
    })

  } catch (error) {
    logger.error('Error processing user update', error as Error, { userId: id })
    return NextResponse.json(
      { error: 'Failed to process user update' },
      { status: 500 }
    )
  }
}

async function handleUserDeleted(data: any) {
  logger.info('Clerk webhook: user.deleted event received')
  const { id } = data
  
  try {
    // Marcar usuario como eliminado en la base de datos
    await UserService.deleteUser(id)
    logger.info('User marked as deleted in database', { userId: id })

    return NextResponse.json({
      message: 'User deletion processed successfully',
      userId: id
    })

  } catch (error) {
    logger.error('Error processing user deletion', error as Error, { userId: id })
    return NextResponse.json(
      { error: 'Failed to process user deletion' },
      { status: 500 }
    )
  }
}

async function handleSessionCreated(data: any) {
  logger.info('Clerk webhook: session.created event received')
  const { user_id } = data
  
  // Aquí podrías implementar lógica adicional como:
  // - Tracking de sesiones
  // - Análisis de uso
  // - Notificaciones de seguridad
  
  return NextResponse.json({
    message: 'Session creation logged',
    userId: user_id
  })
}
