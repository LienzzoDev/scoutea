/**
 * Simple health check endpoint
 */

import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT || 'default'
    });
  } catch (_error) {
    return NextResponse.json({
      status: 'error',
      __error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}