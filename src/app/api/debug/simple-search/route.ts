/**
 * Simple debug endpoint to test basic API functionality
 */

import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  try {
    console.log('🔍 Debug: Testing simple API call to /api/players');
    
    // Make a simple request to the players API
    const baseUrl = process.env.NEXTJS_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/players?page=1&limit=5`;
    
    console.log('📡 Making request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:', errorText);
      
      return NextResponse.json({
        error: 'API request failed',
        status: response.status,
        statusText: response.statusText,
        responseText: errorText
      }, { status: 500 });
    }
    
    const data = await response.json();
    console.log('✅ API response received:', {
      hasPlayers: !!data.players,
      playersCount: data.players?.length || 0,
      hasPagination: !!data.pagination
    });
    
    return NextResponse.json({
      success: true,
      apiResponse: {
        status: response.status,
        playersCount: data.players?.length || 0,
        samplePlayer: data.players?.[0] || null,
        pagination: data.pagination || null
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Simple debug test failed:', error);
    
    return NextResponse.json({
      error: 'Simple debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}