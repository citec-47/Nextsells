#!/usr/bin/env node

/**
 * Database Initialization Script
 * Run this once to set up the database schema
 * 
 * Usage:
 *   npm run db:init
 *   or
 *   node scripts/init-db.js
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function initializeDatabase(client) {
  console.log('📊 Creating database schema...\n');

  // Create users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      auth0_id VARCHAR(255) UNIQUE,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'BUYER',
      avatar_url VARCHAR(500),
      is_verified BOOLEAN DEFAULT FALSE,
      is_blocked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('  ✓ users table created');

  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);`);
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;`);
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;`);
  console.log('  ✓ users auth columns ensured');

  // Create seller_profiles table
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
    );
  `);
  console.log('  ✓ seller_profiles table created');

  // Create products table
  await client.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(255) PRIMARY KEY,
      seller_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      quantity INTEGER DEFAULT 0,
      category VARCHAR(100),
      image_urls TEXT[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE
    );
  `);
  console.log('  ✓ products table created');

  // Create orders table
  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(255) PRIMARY KEY,
      buyer_id VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      total_amount DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log('  ✓ orders table created');

  // Create seller_documents table
  await client.query(`
    CREATE TABLE IF NOT EXISTS seller_documents (
      id VARCHAR(255) PRIMARY KEY,
      seller_id VARCHAR(255) NOT NULL,
      document_type VARCHAR(50),
      document_url VARCHAR(500),
      status VARCHAR(50) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE
    );
  `);
  console.log('  ✓ seller_documents table created');

  // Create approval_requests table
  await client.query(`
    CREATE TABLE IF NOT EXISTS approval_requests (
      id VARCHAR(255) PRIMARY KEY,
      seller_id VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE
    );
  `);
  console.log('  ✓ approval_requests table created');

  // Create cart_items table
  await client.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      product_id VARCHAR(255) NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);
  console.log('  ✓ cart_items table created');

  // Create wishlist_items table
  await client.query(`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      product_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);
  console.log('  ✓ wishlist_items table created');
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable is not set in .env.local');
    process.exit(1);
  }

  console.log('🔄 Initializing database...');
  console.log(`📍 Using database: ${dbUrl.split('@')[1]?.split('/')[0] || 'unknown'}`);

  const pool = new Pool({ connectionString: dbUrl });

  try {
    // Test connection
    console.log('\n📡 Testing connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Connection successful\n');

    // Initialize schema
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await initializeDatabase(client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    console.log('\n✅ Database initialized successfully!');
    console.log('\n📊 Tables created:');
    console.log('  ✓ users');
    console.log('  ✓ seller_profiles');
    console.log('  ✓ products');
    console.log('  ✓ orders');
    console.log('  ✓ seller_documents');
    console.log('  ✓ approval_requests');
    console.log('  ✓ cart_items');
    console.log('  ✓ wishlist_items');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database initialization failed!');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    await pool.end();
    process.exit(1);
  }
}

main();
