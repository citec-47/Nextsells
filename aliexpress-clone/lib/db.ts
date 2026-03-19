import { Pool, PoolClient } from 'pg';

// Type definitions
interface UserData {
  id: string;
  auth0_id?: string;
  email: string;
  name?: string;
  role?: string;
}

interface SellerProfileData {
  id: string;
  user_id: string;
  company_name?: string;
  description?: string;
  phone?: string;
  country?: string;
  logo_url?: string;
}

interface ProductData {
  id: string;
  seller_id: string;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  category?: string;
  image_urls?: string[];
}

interface OrderData {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
}

// Create a connection pool for Neon database
const getDatabaseUrl = (): string => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Explicitly use verify-full so pg does not warn about alias SSL modes.
  if (!dbUrl.includes('sslmode=')) {
    return dbUrl.includes('?')
      ? `${dbUrl}&sslmode=verify-full`
      : `${dbUrl}?sslmode=verify-full`;
  }

  return dbUrl.replace(/sslmode=(prefer|require|verify-ca)/i, 'sslmode=verify-full');
};

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  // Neon-specific configuration for better reliability
  max: 20,                        // Maximum pool size
  min: 2,                         // Minimum pool size to maintain connections
  idleTimeoutMillis: 30000,       // Close idle connections after 30s
  connectionTimeoutMillis: 15000, // Wait up to 15s to acquire connection
  statement_timeout: 30000,       // Query timeout after 30s
  application_name: 'aliexpress-clone',
});

// Test the connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Do not terminate the web server on transient database pool errors.
  // Let request-level retry/error handling decide how to proceed.
});

pool.on('connect', () => {
  console.log('Database pool connection established');
});

export async function query(text: string, params?: unknown[], retries = 3) {
  const start = Date.now();
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { 
        text: text.substring(0, 100),
        duration, 
        rows: result.rowCount,
        attempt 
      });
      return result;
    } catch (error) {
      lastError = error as Error;
      const duration = Date.now() - start;
      
      // Log the error
      console.error('Database query error', { 
        text: text.substring(0, 100),
        attempt, 
        error: lastError.message,
        duration
      });
      
      // Retry on connection timeout errors
      if (attempt < retries && 
          (lastError.message.includes('timeout') || 
           lastError.message.includes('Connection') ||
           lastError.message.includes('ECONNREFUSED'))) {
        const waitMs = Math.min(1000 * attempt, 5000); // exponential backoff, max 5s
        console.log(`Retrying query (attempt ${attempt + 1}/${retries}) after ${waitMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      
      // Don't retry for other errors
      throw error;
    }
  }
  
  throw lastError || new Error('Query failed after all retries');
}

export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    console.log('✓ Database connection test successful');
    return true;
  } catch (error) {
    console.error('✗ Database connection test failed:', error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
}

export { pool };

// Database schema initialization - Run this once to set up tables
export async function initializeDatabase() {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        auth0_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'BUYER',
        avatar_url VARCHAR(500),
        is_blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seller profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS seller_profiles (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE,
        company_name VARCHAR(255),
        description TEXT,
        phone VARCHAR(20),
        country VARCHAR(100),
        logo_url VARCHAR(500),
        onboarding_status VARCHAR(50) DEFAULT 'NOT_STARTED',
        approval_date TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        seller_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER DEFAULT 0,
        category VARCHAR(100),
        image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
        rating DECIMAL(3, 2) DEFAULT 0,
        num_reviews INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        buyer_id VARCHAR(255) NOT NULL,
        product_id VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Seller documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS seller_documents (
        id VARCHAR(255) PRIMARY KEY,
        seller_id VARCHAR(255) NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        document_url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Approval requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS approval_requests (
        id VARCHAR(255) PRIMARY KEY,
        seller_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by VARCHAR(255),
        notes TEXT,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Cart items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id VARCHAR(255) PRIMARY KEY,
        buyer_id VARCHAR(255) NOT NULL,
        product_id VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Wishlist table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id VARCHAR(255) PRIMARY KEY,
        buyer_id VARCHAR(255) NOT NULL,
        product_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    await client.query('COMMIT');
    console.log('Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper functions for common queries
export const db = {
  // Users
  getUserById: async (id: string) => {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  getUserByEmail: async (email: string) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  createUser: async (userData: UserData) => {
    const { id, auth0_id, email, name, role } = userData;
    const result = await query(
      `INSERT INTO users (id, auth0_id, email, name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [id, auth0_id, email, name, role]
    );
    return result.rows[0];
  },

  // Seller Profiles
  getSellerProfile: async (userId: string) => {
    const result = await query(
      'SELECT * FROM seller_profiles WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  },

  createSellerProfile: async (profileData: SellerProfileData) => {
    const { id, user_id, company_name, description, phone, country, logo_url } = profileData;
    const result = await query(
      `INSERT INTO seller_profiles (id, user_id, company_name, description, phone, country, logo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, user_id, company_name, description, phone, country, logo_url]
    );
    return result.rows[0];
  },

  updateSellerProfile: async (userId: string, updates: Record<string, unknown>) => {
    const fields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const result = await query(
      `UPDATE seller_profiles SET ${fields}, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 RETURNING *`,
      [userId, ...Object.values(updates)]
    );
    return result.rows[0];
  },

  // Products
  getProduct: async (id: string) => {
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  getProductsBySeller: async (sellerId: string) => {
    const result = await query(
      'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
      [sellerId]
    );
    return result.rows;
  },

  createProduct: async (productData: ProductData) => {
    const { id, seller_id, name, description, price, quantity, category, image_urls } = productData;
    const result = await query(
      `INSERT INTO products (id, seller_id, name, description, price, quantity, category, image_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, seller_id, name, description, price, quantity, category, image_urls || []]
    );
    return result.rows[0];
  },

  // Orders
  getOrder: async (id: string) => {
    const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  getBuyerOrders: async (buyerId: string) => {
    const result = await query(
      `SELECT o.*, p.name as product_name, p.image_urls 
       FROM orders o 
       JOIN products p ON o.product_id = p.id 
       WHERE o.buyer_id = $1 
       ORDER BY o.created_at DESC`,
      [buyerId]
    );
    return result.rows;
  },

  createOrder: async (orderData: OrderData) => {
    const { id, buyer_id, product_id, quantity, total_price } = orderData;
    const result = await query(
      `INSERT INTO orders (id, buyer_id, product_id, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, buyer_id, product_id, quantity, total_price]
    );
    return result.rows[0];
  },
};
