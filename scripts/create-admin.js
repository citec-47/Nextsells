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

async function createAdmin() {
  const adminEmail = 'admin@nextsells.com';
  const adminPassword = 'AdminPass123!';
  const adminName = 'Admin User';

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not configured in .env.local');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await ensureUserAuthColumns(pool);

    const existingAdmin = await pool.query(
      `SELECT id, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [adminEmail]
    );

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (existingAdmin.rows.length > 0) {
      await pool.query(
        `UPDATE users
         SET password = $1,
             name = $2,
             role = 'ADMIN',
             is_verified = TRUE,
             is_blocked = FALSE,
             updated_at = CURRENT_TIMESTAMP
         WHERE LOWER(email) = LOWER($3)`,
        [hashedPassword, adminName, adminEmail]
      );

      console.log('✅ Admin already existed and was updated');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log('Role: ADMIN');
      return;
    }

    await pool.query(
      `INSERT INTO users (id, email, password, name, role, is_verified, is_blocked, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'ADMIN', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [randomUUID(), adminEmail, hashedPassword, adminName]
    );

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Admin Login Details:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   Role: ADMIN');
    console.log('');
    console.log('⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

createAdmin();
