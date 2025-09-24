import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  
  return NextResponse.json({
    message: 'API is working correctly',
    timestamp: new Date().toISOString(),
    method: 'GET',
    url: url.toString(),
    origin: url.origin,
    port: url.port || (url.protocol === 'https:' ? '443' : '80'),
    host: url.host,
    pathname: url.pathname
  })
}