import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

/**
 * GET /api/health
 * Health check endpoint for database connectivity
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      return NextResponse.json(
        {
          status: 'healthy',
          database: 'connected',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        status: 'error',
        database: 'error',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
