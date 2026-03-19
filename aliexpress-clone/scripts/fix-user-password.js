/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Fix missing passwords for users registered before the password-save fix.
 * Usage:  node scripts/fix-user-password.js <email> <newPassword>
 * Example: node scripts/fix-user-password.js ndo520596@gmail.com Ndonyi@125
 */
const path = require('node:path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function fixPassword(email, plainPassword) {
  if (!email || !plainPassword) {
    console.error('Usage: node scripts/fix-user-password.js <email> <password>');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set in .env.local');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Check the user exists
    const { rows } = await pool.query(
      'SELECT id, email, name, role, password FROM users WHERE LOWER(email) = $1',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    const user = rows[0];
    console.log(`Found user: ${user.name} (${user.email}) — role: ${user.role}`);
    console.log(`Password currently stored: ${user.password ? 'YES' : 'NULL (missing — this is the bug)'}`);

    // Hash and save
    const hashed = await bcrypt.hash(plainPassword, 10);
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      hashed,
      user.id,
    ]);

    console.log('✅ Password updated successfully! You can now log in.');
  } finally {
    await pool.end();
  }
}

const [, , email, password] = process.argv;
fixPassword(email, password);
