/**
 * API endpoint for triggering data population
 * 
 * This endpoint allows administrators to populate null values in player data
 * using the DataPopulationService with various options and filters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DataPopulationService } from '@/lib/services/DataPopulationService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and check admin role
    const user = await prisma.usuario.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, we'll allow any authenticated user. In production, add admin role check
    // if (user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    // Parse request body
    const body = await request.json();
    const {
      dryRun = true,
      batchSize = 50,
      positions,
      playerIds,
      onlyNullValues = true
    } = body;

    // Validate input
    if (positions && !Array.isArray(positions)) {
      return NextResponse.json({ error: 'positions must be an array' }, { status: 400 });
    }

    if (playerIds && !Array.isArray(playerIds)) {
      return NextResponse.json({ error: 'playerIds must be an array' }, { status: 400 });
    }

    if (batchSize < 1 || batchSize > 100) {
      return NextResponse.json({ error: 'batchSize must be between 1 and 100' }, { status: 400 });
    }

    // Initialize service
    const populationService = new DataPopulationService(prisma);

    // Validate generators first
    const validation = await populationService.validateGenerators();
    if (!validation.atributosValid || !validation.statsValid) {
      return NextResponse.json({
        error: 'Data generators validation failed',
        details: validation.errors
      }, { status: 500 });
    }

    // Run population
    const result = await populationService.populatePlayerData({
      dryRun,
      batchSize,
      positions,
      playerIds,
      onlyNullValues,
      logProgress: true
    });

    // Get updated statistics
    const stats = await populationService.getPopulationStats();

    return NextResponse.json({
      success: true,
      result,
      stats,
      message: dryRun 
        ? 'Dry run completed successfully. No data was modified.' 
        : 'Data population completed successfully.'
    });

  } catch (error) {
    console.error('Data population error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize service
    const populationService = new DataPopulationService(prisma);

    // Get current population statistics
    const stats = await populationService.getPopulationStats();

    // Validate generators
    const validation = await populationService.validateGenerators();

    return NextResponse.json({
      success: true,
      stats,
      validation,
      supportedPositions: {
        atributos: populationService['atributosGenerator'].getSupportedPositions(),
        stats: populationService['statsGenerator'].getSupportedPositions()
      }
    });

  } catch (error) {
    console.error('Get population stats error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}