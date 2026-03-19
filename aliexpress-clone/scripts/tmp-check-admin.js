/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const columns = await pool.query(
      "select column_name from information_schema.columns where table_name = 'users' order by ordinal_position"
    );
    console.log('COLUMNS:', columns.rows.map((row) => row.column_name).join(', '));

    const admin = await pool.query(
      "select id, email, name, role from users where lower(email) = lower($1)",
      ['admin@nextsells.com']
    );
    console.log('ADMIN_ROWS:', JSON.stringify(admin.rows));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
