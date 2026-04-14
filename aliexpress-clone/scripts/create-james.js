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

async function createJames() {
  const jamesEmail = 'james@nextsells.com';
  const jamesPassword = 'James123!';
  const jamesName = 'James Test';
  const jamesRole = 'BUYER'; // Can be BUYER, SELLER, or ADMIN

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not configured in .env.local');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await ensureUserAuthColumns(pool);

    const existingUser = await pool.query(
      `SELECT id, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [jamesEmail]
    );

    const hashedPassword = await bcrypt.hash(jamesPassword, 10);

    if (existingUser.rows.length > 0) {
      await pool.query(
        `UPDATE users
         SET password = $1,
             name = $2,
             role = $3,
             is_verified = TRUE,
             is_blocked = FALSE,
             updated_at = CURRENT_TIMESTAMP
         WHERE LOWER(email) = LOWER($4)`,
        [hashedPassword, jamesName, jamesRole, jamesEmail]
      );

      console.log('✅ James account already existed and was updated');
      console.log(`Email: ${jamesEmail}`);
      console.log(`Password: ${jamesPassword}`);
      console.log(`Role: ${jamesRole}`);
      return;
    }

    await pool.query(
      `INSERT INTO users (id, email, password, name, role, is_verified, is_blocked, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [randomUUID(), jamesEmail, hashedPassword, jamesName, jamesRole]
    );

    console.log('✅ James test account created successfully!');
    console.log('');
    console.log('📧 James Login Details:');
    console.log(`   Email: ${jamesEmail}`);
    console.log(`   Password: ${jamesPassword}`);
    console.log(`   Role: ${jamesRole}`);
    console.log('');
  } catch (error) {
    console.error('❌ Error creating james account:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

createJames();
