/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path');
const dotenv = require('dotenv');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function ensureUserAuthColumns(pool) {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE`);
}

async function ensureSellerProfileColumns(pool) {
  await pool.query(`ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'NOT_STARTED'`);
  await pool.query(`ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)`);
}

async function createSeller() {
  const sellerEmail = 'mauricendonyi40@gmail.com';
  const sellerPassword = 'Ndonyi@12345';
  const sellerName = 'Jane';
  const sellerPhone = '+23679630287';
  const sellerCompanyName = 'myapor';
  const sellerRole = 'SELLER';

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not configured in .env.local');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await ensureUserAuthColumns(pool);
    await ensureSellerProfileColumns(pool);

    const existingUser = await pool.query(
      `SELECT id, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [sellerEmail]
    );

    const hashedPassword = await bcrypt.hash(sellerPassword, 10);

    let userId = randomUUID();

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      await pool.query(
        `UPDATE users
         SET password = $1,
             name = $2,
             phone = $3,
             role = $4,
             is_verified = TRUE,
             is_blocked = FALSE,
             updated_at = CURRENT_TIMESTAMP
         WHERE LOWER(email) = LOWER($5)`,
        [hashedPassword, sellerName, sellerPhone, sellerRole, sellerEmail]
      );
    } else {
      await pool.query(
        `INSERT INTO users (id, email, password, name, phone, role, is_verified, is_blocked, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [userId, sellerEmail, hashedPassword, sellerName, sellerPhone, sellerRole]
      );
    }

    const existingProfile = await pool.query(
      `SELECT id FROM seller_profiles WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      await pool.query(
        `UPDATE seller_profiles
         SET company_name = $1,
             onboarding_status = 'APPROVED',
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [sellerCompanyName, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO seller_profiles (id, user_id, company_name, onboarding_status, created_at, updated_at)
         VALUES ($1, $2, $3, 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [randomUUID(), userId, sellerCompanyName]
      );
    }

    console.log('✅ Seller account ready');
    console.log(`Email: ${sellerEmail}`);
    console.log(`Password: ${sellerPassword}`);
    console.log(`Role: ${sellerRole}`);
  } catch (error) {
    console.error('❌ Error creating seller account:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

createSeller();
