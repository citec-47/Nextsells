/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function updateJamesRole() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not configured in .env.local');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE LOWER(email) = LOWER($2) RETURNING email, role',
      ['SELLER', 'james@nextsells.com']
    );

    if (result.rows.length > 0) {
      console.log('✅ James role updated successfully!');
      console.log('Email:', result.rows[0].email);
      console.log('New Role:', result.rows[0].role);
    } else {
      console.log('❌ James account not found');
    }
  } catch (error) {
    console.error('❌ Error updating role:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

updateJamesRole();
