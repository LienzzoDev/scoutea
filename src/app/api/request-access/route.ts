import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logging/production-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, organization, phone, message, plan } = body

    // Validaciones
    if (!firstName || !lastName || !email || !organization) {
      return NextResponse.json(
        { error: 'Por favor completa todos los campos requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Por favor ingresa un email válido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una solicitud pendiente con este email
    const existingRequest = await prisma.accessRequest.findFirst({
      where: {
        email: email.toLowerCase(),
        status: 'pending'
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud pendiente con este email' },
        { status: 409 }
      )
    }

    // Crear solicitud en la base de datos
    const accessRequest = await prisma.accessRequest.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        organization,
        phone: phone || null,
        message: message || null,
        plan: plan || 'premium',
        status: 'pending'
      }
    })

    // Log para seguimiento
    logger.info('New access request created', {
      requestId: accessRequest.id,
      email: accessRequest.email,
      organization: accessRequest.organization,
      plan: accessRequest.plan
    })

    // TODO: Enviar email de notificación a los administradores
    // TODO: Enviar email de confirmación al solicitante

    return NextResponse.json({
      success: true,
      message: 'Solicitud enviada correctamente',
      requestId: accessRequest.id
    })

  } catch (error) {
    logger.error('Error processing access request', error as Error)

    console.error('Error processing access request:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud. Por favor intenta nuevamente.' },
      { status: 500 }
    )
  }
}

// GET endpoint para que los admins puedan listar solicitudes
export async function GET(request: NextRequest) {
  try {
    // TODO: Agregar autenticación y verificar que sea admin

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    const requests = await prisma.accessRequest.findMany({
      where: status !== 'all' ? { status } : undefined,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      requests
    })

  } catch (error) {
    logger.error('Error fetching access requests', error as Error)

    console.error('Error fetching access requests:', error)
    return NextResponse.json(
      { error: 'Error al obtener las solicitudes' },
      { status: 500 }
    )
  }
}
