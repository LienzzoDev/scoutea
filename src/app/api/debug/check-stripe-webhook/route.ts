import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking Stripe webhook configuration...')
    
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const webhookUrl = process.env.WEBHOOK_URL
    const nodeEnv = process.env.NODE_ENV
    
    return NextResponse.json({
      success: true,
      environment: nodeEnv,
      webhookConfiguration: {
        hasWebhookSecret: !!webhookSecret,
        webhookSecretLength: webhookSecret?.length || 0,
        webhookUrl: webhookUrl || 'Not configured',
        isLocalDevelopment: nodeEnv === 'development',
        expectedWebhookEndpoint: '/api/webhooks/stripe'
      },
      recommendations: nodeEnv === 'development' ? [
        'In development, Stripe webhooks may not work because localhost is not accessible from the internet',
        'Consider using ngrok or localtunnel to expose your local server',
        'Alternatively, use the manual role assignment endpoints for testing'
      ] : [
        'Make sure your webhook endpoint is configured in Stripe Dashboard',
        'Verify the webhook secret matches your Stripe configuration'
      ],
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error checking webhook configuration:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}