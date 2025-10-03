import { NextRequest, NextResponse } from 'next/server'

// Variable global para almacenar logs de webhook (solo para desarrollo)
let webhookLogs: Array<{
  timestamp: string
  event: string
  data: any
  success: boolean
  error?: string
}> = []

export async function GET() {
  return NextResponse.json({
    success: true,
    logs: webhookLogs.slice(-20), // Últimos 20 logs
    totalLogs: webhookLogs.length,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const { event, data, success, error } = await request.json()
    
    // Agregar log
    webhookLogs.push({
      timestamp: new Date().toISOString(),
      event,
      data,
      success,
      error
    })

    // Mantener solo los últimos 100 logs
    if (webhookLogs.length > 100) {
      webhookLogs = webhookLogs.slice(-100)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function DELETE() {
  webhookLogs = []
  return NextResponse.json({ 
    success: true, 
    message: 'Webhook logs cleared' 
  })
}