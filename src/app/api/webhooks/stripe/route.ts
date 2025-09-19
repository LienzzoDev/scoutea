import { clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { stripe } from '@/lib/stripe'

/**
 * Webhook de Stripe para manejar eventos de pago y suscripciones
 * Este endpoint recibe notificaciones de Stripe cuando ocurren eventos importantes
 * como pagos exitosos, cancelaciones, actualizaciones de suscripción, etc.
 */
export async function POST(__request: NextRequest) {
  console.log('🔔 Webhook de Stripe recibido - Iniciando procesamiento...')
  
  // ===== VALIDACIÓN INICIAL =====
  
  // Verificar que Stripe esté configurado correctamente
  if (!stripe) {
    console.error('❌ Stripe no está configurado')
    return NextResponse.json({ __error: 'Stripe not configured' }, { status: 500 })
  }

  // Obtener el cuerpo de la petición como texto plano
  const _body = await request.text()
  
  // Obtener la firma de Stripe para verificar la autenticidad del webhook
  const signature = request.headers.get('stripe-signature')

  // Verificar que la firma esté presente
  if (!signature) {
    return NextResponse.json({ __error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  // ===== VERIFICACIÓN DE FIRMA =====
  
  try {
    // Verificar que el webhook proviene realmente de Stripe usando la firma
    // Esto previene ataques de suplantación y asegura la integridad de los datos
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log('✅ Firma del webhook verificada correctamente')
  } catch (err) {
    console.error('❌ Error verificando firma del webhook:', err)
    return NextResponse.json({ __error: 'Invalid signature' }, { status: 400 })
  }

  // ===== PROCESAMIENTO DE EVENTOS =====
  
  console.log(`📨 Procesando evento de tipo: ${event.type}`)
  
  try {
    // Procesar el evento según su tipo
    switch (event.type) {
      
      // ===== PAGO EXITOSO =====
      case 'checkout.session.completed': {
        // Este evento se dispara cuando el usuario completa exitosamente el pago en Stripe Checkout
        const session = event.data.object as Stripe.Checkout.Session
        
        // Extraer metadatos que enviamos desde el frontend al crear la sesión de checkout
        const userId = session.metadata?.userId      // ID del usuario en Clerk
        const plan = session.metadata?.plan          // Plan seleccionado (basic/premium)
        const billing = session.metadata?.billing    // Ciclo de facturación (monthly/annual)

        console.log('💳 Webhook checkout.session.completed recibido:', {
          userId,
          plan,
          billing,
          customerId: session.customer,
          subscriptionId: session.subscription,
          metadata: session.metadata
        })

        // Si no tenemos metadatos en checkout.session.completed, 
        // esperamos a que llegue customer.subscription.created
        if (!userId || !plan || !billing) {
          console.log('⚠️ Metadatos no disponibles en checkout.session.completed, esperando customer.subscription.created')
          return NextResponse.json({ received: true })
        }

        // Verificar que tenemos todos los datos necesarios
        if (userId && plan && billing) {
          try {
            // ===== OBTENER METADATOS EXISTENTES =====
            // Obtener el cliente de Clerk y los metadatos actuales del usuario
            const clerk = await clerkClient()
            const user = await clerk.users.getUser(userId)
            const existingMetadata = user.publicMetadata || {}

            console.log('📋 Metadatos existentes:', existingMetadata)

            // ===== OBTENER ESTADO DE SUSCRIPCIÓN =====
            // Obtener el estado de la suscripción desde Stripe
            let subscriptionStatus = 'active' // Por defecto activa para checkout completado
            if (session.subscription && typeof session.subscription === 'string') {
              try {
                const _subscription = await stripe.subscriptions.retrieve(session.subscription)
                subscriptionStatus = subscription.status
                console.log('📋 Estado de suscripción desde Stripe:', subscriptionStatus)
              } catch (subscriptionError) {
                console.warn('⚠️ No se pudo obtener el estado de la suscripción:', subscriptionError)
              }
            }

            // ===== ACTUALIZAR METADATOS CON SUSCRIPCIÓN =====
            // Actualizar los metadatos preservando los existentes (role, profile, etc.)
            await clerk.users.updateUser(userId, {
              publicMetadata: {
                ...existingMetadata, // Preservar metadatos existentes (role, profile, etc.)
                subscription: {
                  plan: plan,                    // Plan de suscripción
                  billing: billing,              // Ciclo de facturación
                  status: subscriptionStatus,    // Estado de la suscripción desde Stripe
                  customerId: session.customer,  // ID del cliente en Stripe
                  subscriptionId: session.subscription, // ID de la suscripción en Stripe
                  startDate: new Date().toISOString(),  // Fecha de inicio
                  sessionId: session.id          // ID de la sesión de checkout
                }
              }
            })

            console.log(`✅ Usuario ${userId} suscrito al plan ${plan} (${billing}) con estado ${subscriptionStatus} - Metadatos actualizados`)
            
            // Verificar que la actualización se realizó correctamente
            const updatedUser = await clerk.users.getUser(userId)
            console.log('🔍 Verificación - Metadatos actualizados:', JSON.stringify(updatedUser.publicMetadata, null, 2))
          } catch (updateError) {
            console.error(`❌ Error actualizando metadatos para usuario ${userId}:`, updateError)
          }
        } else {
          console.error('❌ Faltan datos requeridos en el webhook:', { userId, plan, billing })
        }
        break
      }

      // ===== CREACIÓN DE SUSCRIPCIÓN =====
      case 'customer.subscription.created': {
        // Este evento se dispara cuando se crea una nueva suscripción
        const _subscription = event.data.object as Stripe.Subscription
        console.log('🆕 Nueva suscripción creada:', subscription.id)
        
        try {
          // ===== BUSCAR USUARIO POR CUSTOMER ID =====
          // Obtener el cliente de Clerk y buscar usuarios
          const clerk = await clerkClient()
          const users = await clerk.users.getUserList({
            limit: 100
          })
          
          // Buscar el usuario que tiene este customer ID en sus metadatos
          const user = users.data.find(u => 
            (u.publicMetadata as any)?.subscription?.customerId === subscription.customer
          )
          
          if (user) {
            // ===== OBTENER METADATOS EXISTENTES =====
            const existingMetadata = user.publicMetadata || {}
            
            // ===== OBTENER ESTADO DE SUSCRIPCIÓN =====
            const subscriptionStatus = subscription.status
            
            // ===== ACTUALIZAR METADATOS =====
            await clerk.users.updateUser(user.id, {
              publicMetadata: {
                ...existingMetadata, // Preservar otros metadatos
                subscription: {
                  plan: (existingMetadata as any)?.subscription?.plan || 'basic',
                  status: subscriptionStatus,
                  billing: (existingMetadata as any)?.subscription?.billing || 'monthly',
                  sessionId: (existingMetadata as any)?.subscription?.sessionId || '',
                  startDate: new Date(subscription.created * 1000).toISOString(),
                  customerId: subscription.customer as string,
                  subscriptionId: subscription.id,
                  updatedAt: new Date().toISOString()
                }
              }
            })
            
            console.log(`✅ Suscripción creada y metadatos actualizados para usuario ${user.id}`)
          } else {
            console.log(`⚠️ No se encontró usuario para customer ID: ${subscription.customer}`)
          }
        } catch (_error) {
          console.error('❌ Error procesando nueva suscripción:', error)
        }
        break
      }

      // ===== ACTUALIZACIÓN DE SUSCRIPCIÓN =====
      case 'customer.subscription.updated': {
        // Este evento se dispara cuando hay cambios en una suscripción existente
        // (upgrade, downgrade, cambio de plan, etc.)
        const _subscription = event.data.object as Stripe.Subscription
        console.log('🔄 Subscription updated:', subscription.id, 'Status:', subscription.status)
        
        try {
          // ===== BUSCAR USUARIO POR CUSTOMER ID =====
          // Obtener el cliente de Clerk y buscar usuarios
          const clerk = await clerkClient()
          const users = await clerk.users.getUserList({
            limit: 100
          })
          
          // Buscar el usuario que tiene este customer ID en sus metadatos
          const user = users.data.find(u => 
            (u.publicMetadata as any)?.subscription?.customerId === subscription.customer
          )
          
          if (user) {
            // ===== ACTUALIZAR ESTADO DE SUSCRIPCIÓN =====
            const existingMetadata = user.publicMetadata || {}
            
            await clerk.users.updateUser(user.id, {
              publicMetadata: {
                ...existingMetadata, // Preservar otros metadatos
                subscription: {
                  ...(existingMetadata as any)?.subscription, // Preservar datos de suscripción existentes
                  status: subscription.status,                // Actualizar estado
                  currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
                  updatedAt: new Date().toISOString()        // Marcar fecha de actualización
                }
              }
            })
            
            console.log(`✅ Suscripción actualizada para usuario ${user.id}: ${subscription.status}`)
          } else {
            console.log(`⚠️ No se encontró usuario para customer ID: ${subscription.customer}`)
          }
        } catch (_error) {
          console.error('❌ Error actualizando suscripción:', error)
        }
        break
      }

      // ===== CANCELACIÓN DE SUSCRIPCIÓN =====
      case 'customer.subscription.deleted': {
        // Este evento se dispara cuando una suscripción es cancelada
        const _subscription = event.data.object as Stripe.Subscription
        console.log('🗑️ Subscription canceled:', subscription.id)
        
        try {
          // ===== BUSCAR USUARIO POR CUSTOMER ID =====
          // Obtener el cliente de Clerk y buscar usuarios
          const clerk = await clerkClient()
          const users = await clerk.users.getUserList({
            limit: 100
          })
          
          // Buscar el usuario que tiene este customer ID en sus metadatos
          const user = users.data.find(u => 
            (u.publicMetadata as any)?.subscription?.customerId === subscription.customer
          )
          
          if (user) {
            // ===== MARCAR SUSCRIPCIÓN COMO CANCELADA =====
            const existingMetadata = user.publicMetadata || {}
            
            await clerk.users.updateUser(user.id, {
              publicMetadata: {
                ...existingMetadata, // Preservar otros metadatos
                subscription: {
                  ...(existingMetadata as any)?.subscription, // Preservar datos de suscripción existentes
                  status: 'canceled',                         // Marcar como cancelada
                  canceledAt: new Date().toISOString()       // Añadir fecha de cancelación
                }
              }
            })
            
            console.log(`✅ Suscripción cancelada para usuario ${user.id}`)
          } else {
            console.log(`⚠️ No se encontró usuario para customer ID: ${subscription.customer}`)
          }
        } catch (_error) {
          console.error('❌ Error cancelando suscripción:', error)
        }
        break
      }

      // ===== PAGO FALLIDO =====
      case 'invoice.payment_failed': {
        // Este evento se dispara cuando un pago de suscripción falla
        const invoice = event.data.object as Stripe.Invoice
        console.log('💸 Payment failed for invoice:', invoice.id, 'Customer:', invoice.customer)
        
        try {
          // ===== BUSCAR USUARIO POR CUSTOMER ID =====
          // Obtener el cliente de Clerk y buscar usuarios
          const clerk = await clerkClient()
          const users = await clerk.users.getUserList({
            limit: 100
          })
          
          // Buscar el usuario que tiene este customer ID en sus metadatos
          const user = users.data.find(u => 
            (u.publicMetadata as any)?.subscription?.customerId === invoice.customer
          )
          
          if (user) {
            // ===== MARCAR PAGO COMO FALLIDO =====
            const existingMetadata = user.publicMetadata || {}
            
            await clerk.users.updateUser(user.id, {
              publicMetadata: {
                ...existingMetadata, // Preservar otros metadatos
                subscription: {
                  ...(existingMetadata as any)?.subscription, // Preservar datos de suscripción existentes
                  status: 'past_due',                         // Marcar como pago vencido
                  lastPaymentFailed: new Date().toISOString(), // Fecha del último pago fallido
                  failedInvoiceId: invoice.id                 // ID de la factura fallida
                }
              }
            })
            
            console.log(`⚠️ Pago fallido para usuario ${user.id}`)
          } else {
            console.log(`⚠️ No se encontró usuario para customer ID: ${invoice.customer}`)
          }
        } catch (_error) {
          console.error('❌ Error manejando pago fallido:', error)
        }
        break
      }

      // ===== EVENTOS NO MANEJADOS =====
      default:
        // Log de eventos que no manejamos actualmente
        console.log(`Unhandled event type: ${event.type}`)
    }

    // ===== RESPUESTA EXITOSA =====
    // Devolver respuesta exitosa a Stripe para confirmar que procesamos el webhook
    return NextResponse.json({ received: true })
    
  } catch (_error) {
    // ===== MANEJO DE ERRORES =====
    // Log del error y respuesta de error a Stripe
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { __error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
