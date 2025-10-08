import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/db'

// Inicializar Resend solo si la API key está disponible
let resend: Resend | null = null
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { message, scoutId, scoutName } = await request.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      )
    }

    if (!scoutId) {
      return NextResponse.json(
        { error: 'ID del scout es requerido' },
        { status: 400 }
      )
    }

    // Obtener información del usuario desde la base de datos
    const user = await prisma.usuario.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener el email real del usuario desde Clerk usando fetch
    let realEmail = user.email // Fallback por defecto
    
    try {
      const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (clerkResponse.ok) {
        const clerkUser = await clerkResponse.json()
        const primaryEmail = clerkUser.email_addresses?.find((email: any) => 
          email.id === clerkUser.primary_email_address_id
        )?.email_address
        
        if (primaryEmail) {
          realEmail = primaryEmail
          console.log('Email real obtenido de Clerk:', realEmail)
        } else {
          console.log('No se encontró email primario, usando email de BD:', realEmail)
        }
      } else {
        console.warn('Error en respuesta de Clerk API, usando email de BD:', realEmail)
      }
    } catch (clerkError) {
      console.warn('Error obteniendo email de Clerk, usando email de BD:', clerkError)
    }

    // Guardar el mensaje en la base de datos
    const savedMessage = await prisma.scoutContactMessage.create({
      data: {
        userId: user.id,
        userEmail: realEmail,
        userName: `${user.firstName} ${user.lastName}`,
        scoutId: scoutId,
        scoutName: scoutName || 'Scout',
        message: message.trim(),
      },
    })

    // Enviar email al admin usando Resend (solo si está configurado)
    if (resend) {
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'tech@lienzzo.com'
        const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'
        
        await resend.emails.send({
          from: fromEmail,
          to: adminEmail,
          replyTo: realEmail,
          subject: `Mensaje de contacto para scout: ${scoutName || 'Scout'} - ${user.firstName} ${user.lastName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8c1a10;">Nuevo mensaje de contacto para scout</h2>
              
              <div style="background-color: #f8f7f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Información del usuario:</h3>
                <p><strong>Nombre:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>Email:</strong> ${realEmail}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
              </div>
              
              <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Scout de destino:</h3>
                <p><strong>Scout:</strong> ${scoutName || 'Scout'}</p>
                <p><strong>ID Scout:</strong> ${scoutId}</p>
              </div>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e7e7e7;">
                <h3>Mensaje:</h3>
                <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background-color: #f0f0f0; border-radius: 8px;">
                <p style="margin: 0; font-size: 12px; color: #666;">
                  ID del mensaje: ${savedMessage.id}<br>
                  Este mensaje ha sido guardado automáticamente en la base de datos.
                </p>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e7e7e7;">
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  <strong>Para responder:</strong> Puedes responder directamente a este email para contactar con ${user.firstName} en ${realEmail}
                </p>
              </div>
            </div>
          `,
        })
        console.log('Email de contacto scout enviado correctamente via Resend')
      } catch (emailError) {
        console.error('Error enviando email de contacto scout via Resend:', emailError)
        // No fallar la request si el email falla
      }
    } else {
      console.log('Resend no configurado, mensaje de contacto scout guardado solo en BD')
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado correctamente',
      messageId: savedMessage.id,
    })

  } catch (error) {
    console.error('Error al procesar mensaje de contacto scout:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}