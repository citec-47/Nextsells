import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, testConnection } from '@/lib/db';

/**
 * POST /api/db/initialize
 * Initialize database tables - should be called once on first setup
 * 
 * SECURITY: This should be removed or protected in production!
 */
export async function POST(request: NextRequest) {
  try {
    // Security check: only allow from localhost in development
    const host = request.headers.get('host');
    const isLocalhost = host?.includes('localhost') || host?.includes('127.0.0.1');
    
    if (process.env.NODE_ENV === 'production' && !isLocalhost) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database initialization is not available in production',
        },
        { status: 403 }
      );
    }

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed. Check your DATABASE_URL and ensure the server is running.',
        },
        { status: 503 }
      );
    }

    console.log('Initializing database schema...');
    await initializeDatabase();

    return NextResponse.json(
      {
        success: true,
        message: 'Database initialized successfully',
        schema: [
          'users',
          'seller_profiles',
          'products',
          'orders',
          'seller_documents',
          'approval_requests',
          'cart_items',
          'wishlist_items'
        ],
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Database initialization error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        hint: 'Check the server logs for detailed error information',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/db/initialize
 * Get database initialization status
 */
export async function GET(request: NextRequest) {
  try {
    const isConnected = await testConnection();
    
    return NextResponse.json(
      {
        database: isConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      },
      { status: isConnected ? 200 : 503 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        database: 'error',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
